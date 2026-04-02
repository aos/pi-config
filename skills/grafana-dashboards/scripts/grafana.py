#!/usr/bin/env python3
"""Grafana API operations via chrome-cdp.

All API calls run through the browser's authenticated session — no tokens needed.
"""

import argparse
import json
import subprocess
import sys
import urllib.parse
from pathlib import Path

# Resolve cdp.mjs relative to this script: scripts/ -> grafana-dashboards/ -> skills/ -> chrome-cdp/scripts/cdp.mjs
CDP_SCRIPT = Path(__file__).resolve().parent.parent.parent / "chrome-cdp" / "scripts" / "cdp.mjs"

_target: str = ""


def browser_eval(js: str) -> str:
    """Execute JavaScript in the browser via chrome-cdp and return stdout."""
    result = subprocess.run(
        [str(CDP_SCRIPT), "eval", _target, js],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"cdp.mjs eval failed: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()


def _fetch_js(path: str, org_id: str, method: str = "GET", body: dict | None = None) -> str:
    """Build a JS async fetch snippet with error handling."""
    headers = json.dumps({"Content-Type": "application/json", "X-Grafana-Org-Id": org_id})
    body_part = ""
    if body is not None:
        body_part = f", body: JSON.stringify({json.dumps(body)})"
    return (
        "(async () => {"
        f'  const r = await fetch("{path}", {{ method: "{method}", headers: {headers}{body_part} }});'
        "  const text = await r.text();"
        "  if (!r.ok) return JSON.stringify({ _error: true, status: r.status, body: text });"
        "  try { return JSON.stringify(JSON.parse(text)); }"
        "  catch(e) { return JSON.stringify({ _error: true, status: r.status, body: text }); }"
        "})()"
    )


def _parse_response(raw: str) -> dict | list:
    """Parse cdp eval output, exit on API errors."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        print(f"Unexpected response (not JSON):\n{raw[:500]}", file=sys.stderr)
        sys.exit(1)
    if isinstance(data, dict) and data.get("_error"):
        print(f"HTTP {data['status']}: {data['body'][:500]}", file=sys.stderr)
        sys.exit(1)
    return data


def discover_org_id() -> str:
    """Auto-discover org ID from GET /api/org."""
    js = "(async () => { const r = await fetch('/api/org'); return await r.text(); })()"
    raw = browser_eval(js)
    try:
        return str(json.loads(raw)["id"])
    except (json.JSONDecodeError, KeyError):
        print("Could not auto-discover org ID, defaulting to 1", file=sys.stderr)
        return "1"


def get_org_id(args) -> str:
    if args.org_id:
        return args.org_id
    org = discover_org_id()
    print(f"Auto-discovered org ID: {org}", file=sys.stderr)
    return org


def _parse_duration(s: str) -> int:
    """Parse duration string (e.g. '30d', '24h', '5m', '30s') to seconds."""
    units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    if s and s[-1] in units:
        return int(s[:-1]) * units[s[-1]]
    return int(s)


# --- Commands ---


def cmd_list_datasources(args):
    org_id = get_org_id(args)
    js = _fetch_js("/api/datasources", org_id)
    data = _parse_response(browser_eval(js))
    for ds in data:
        print(f"{ds['uid']}  {ds['type']:30s}  {ds['name']}")


def cmd_query(args):
    org_id = get_org_id(args)
    encoded = urllib.parse.quote(args.expr, safe="")
    ds_uid = args.datasource_uid

    if args.range:
        seconds = _parse_duration(args.range)
        step = _parse_duration(args.step) if args.step else max(seconds // 300, 60)
        js = (
            "(async () => {"
            "  const end = Math.floor(Date.now() / 1000);"
            f"  const start = end - {seconds};"
            f'  const r = await fetch("/api/datasources/proxy/uid/{ds_uid}/api/v1/query_range'
            f'?query={encoded}&start=" + start + "&end=" + end + "&step={step}", {{'
            f'    headers: {{ "X-Grafana-Org-Id": "{org_id}" }}'
            "  });"
            "  const text = await r.text();"
            "  if (!r.ok) return JSON.stringify({ _error: true, status: r.status, body: text });"
            "  const j = JSON.parse(text);"
            '  if (j.status !== "success") return JSON.stringify({ _error: true, status: r.status, body: text });'
            "  const summary = j.data.result.map(s => {"
            "    const vals = s.values.map(v => parseFloat(v[1])).filter(v => !isNaN(v));"
            "    const avg = vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length) : null;"
            "    const max = vals.length ? Math.max(...vals) : null;"
            "    const min = vals.length ? Math.min(...vals) : null;"
            "    return { metric: s.metric, samples: vals.length, avg, min, max };"
            "  });"
            "  return JSON.stringify(summary, null, 2);"
            "})()"
        )
    else:
        js = (
            "(async () => {"
            f'  const r = await fetch("/api/datasources/proxy/uid/{ds_uid}/api/v1/query'
            f'?query={encoded}", {{'
            f'    headers: {{ "X-Grafana-Org-Id": "{org_id}" }}'
            "  });"
            "  const text = await r.text();"
            "  if (!r.ok) return JSON.stringify({ _error: true, status: r.status, body: text });"
            "  const j = JSON.parse(text);"
            '  if (j.status !== "success") return JSON.stringify({ _error: true, status: r.status, body: text });'
            "  return JSON.stringify(j.data.result.map(s => ({ metric: s.metric, value: s.value[1] })), null, 2);"
            "})()"
        )

    raw = browser_eval(js)
    data = _parse_response(raw)
    print(json.dumps(data, indent=2))


def cmd_get_dashboard(args):
    org_id = get_org_id(args)
    js = _fetch_js(f"/api/dashboards/uid/{args.uid}", org_id)
    data = _parse_response(browser_eval(js))
    print(json.dumps(data, indent=2))


def cmd_inspect_panels(args):
    org_id = get_org_id(args)
    js = _fetch_js(f"/api/dashboards/uid/{args.uid}", org_id)
    data = _parse_response(browser_eval(js))
    panels = data.get("dashboard", {}).get("panels", [])
    summary = [
        {"id": p.get("id"), "title": p.get("title"), "type": p.get("type"), "gridPos": p.get("gridPos")}
        for p in panels
    ]
    print(json.dumps(summary, indent=2))


def cmd_save_dashboard(args):
    org_id = get_org_id(args)
    with open(args.file) as f:
        payload = json.load(f)

    # Accept either a full payload or just the dashboard object
    if "dashboard" not in payload:
        payload = {"dashboard": payload, "overwrite": True}
    if "overwrite" not in payload:
        payload["overwrite"] = True

    js = _fetch_js("/api/dashboards/db", org_id, method="POST", body=payload)
    data = _parse_response(browser_eval(js))
    print(json.dumps(data, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Grafana API operations via chrome-cdp")
    parser.add_argument("--target", required=True, help="Chrome CDP target ID prefix (from cdp.mjs list)")
    parser.add_argument("--org-id", help="Grafana org ID (auto-discovered if omitted)")

    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list-datasources", help="List available datasources")

    p_query = sub.add_parser("query", help="Run a PromQL/LogQL query")
    p_query.add_argument("--datasource-uid", required=True, help="Datasource UID")
    p_query.add_argument("--expr", required=True, help="PromQL/LogQL expression")
    p_query.add_argument("--range", help="Time range (e.g. 30d, 24h, 5m). Omit for instant query")
    p_query.add_argument("--step", help="Step interval for range queries (e.g. 1h, 5m). Auto-calculated if omitted")

    p_get = sub.add_parser("get-dashboard", help="Fetch full dashboard JSON")
    p_get.add_argument("--uid", required=True, help="Dashboard UID")

    p_inspect = sub.add_parser("inspect-panels", help="Show panel summary (id, title, type, position)")
    p_inspect.add_argument("--uid", required=True, help="Dashboard UID")

    p_save = sub.add_parser("save-dashboard", help="Save a dashboard from a JSON file")
    p_save.add_argument("--file", required=True, help="Path to dashboard JSON file")

    args = parser.parse_args()

    global _target
    _target = args.target

    commands = {
        "list-datasources": cmd_list_datasources,
        "query": cmd_query,
        "get-dashboard": cmd_get_dashboard,
        "inspect-panels": cmd_inspect_panels,
        "save-dashboard": cmd_save_dashboard,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
