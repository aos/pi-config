---
name: grafana-dashboards
description: "Create, edit, and query Grafana dashboards and panels via the Grafana API. Use when the user wants to build dashboards, add or modify panels, run PromQL/LogQL queries, inspect existing dashboards, visualize metrics, set up monitoring, work with Mimir/Prometheus/Loki datasources, or troubleshoot observability."
---

# Grafana Dashboards

Create and manage Grafana dashboards programmatically via the Grafana HTTP API, using the browser as an authenticated session proxy.

## Prerequisites

This skill depends on the **chrome-cdp** skill. Chrome must be running with remote debugging enabled (`chrome://inspect/#remote-debugging`).

## Setup

1. Ask the user to open their Grafana instance in Chrome and confirm they are logged in.

2. Find the Grafana tab target:

```bash
scripts/cdp.mjs list
```

3. Take a screenshot to verify (use the target ID prefix from `list`):

```bash
scripts/cdp.mjs shot <target>
```

## How Authentication Works

All API calls go through `scripts/cdp.mjs eval` using the browser's `fetch()` — this automatically inherits the user's session cookies and auth headers (e.g., Cloudflare Access JWT). **Never extract or store auth tokens directly.**

The `scripts/grafana.py` tool handles this automatically. All commands go through the browser's authenticated session.

**Important:** All requests require the `X-Grafana-Org-Id` header. The tool auto-discovers this via `GET /api/org` if you don't pass `--org-id`.

## Tool Usage

All operations go through `scripts/grafana.py`. **Always pass `--target`:**

```bash
python3 skills/grafana-dashboards/scripts/grafana.py --target <target> --help
```

### Discover datasources

```bash
python3 skills/grafana-dashboards/scripts/grafana.py --target <target> list-datasources
```

### Run queries

Instant query (point-in-time):

```bash
python3 skills/grafana-dashboards/scripts/grafana.py --target <target> query \
  --datasource-uid <uid> --expr "up{job='myapp'}"
```

Range query with summary stats:

```bash
python3 skills/grafana-dashboards/scripts/grafana.py --target <target> query \
  --datasource-uid <uid> --expr "rate(http_requests_total[5m])" \
  --range 30d --step 1h
```

### Inspect a dashboard

Full JSON:

```bash
python3 skills/grafana-dashboards/scripts/grafana.py --target <target> get-dashboard --uid <dashboard-uid>
```

Panel summary (id, title, type, grid position):

```bash
python3 skills/grafana-dashboards/scripts/grafana.py --target <target> inspect-panels --uid <dashboard-uid>
```

### Save a dashboard

Write dashboard JSON to a file, then save:

```bash
python3 skills/grafana-dashboards/scripts/grafana.py --target <target> save-dashboard --file /tmp/dashboard.json
```

The file can be either a full `{"dashboard": {...}, "overwrite": true}` payload, or just the dashboard object (will be wrapped automatically with `overwrite: true`).

**Typical flow:** Fetch an existing dashboard with `get-dashboard`, modify the JSON, write it to a file, then save it back.

## Building Panels

For panel JSON templates (stat, timeseries, bargauge, table, row), see [references/panel-types.md](references/panel-types.md).

**Shortcut:** Fetch an existing dashboard that has the panel type you need and use it as a starting point.

## Verifying Changes

After saving a dashboard, always reload and screenshot to confirm:

```bash
scripts/cdp.mjs nav <target> '<dashboard-url>' && sleep 4 && scripts/cdp.mjs shot <target>
```

Scroll down if the dashboard has content below the fold:

```bash
scripts/cdp.mjs eval <target> 'window.scrollBy(0, 600)' && sleep 2 && scripts/cdp.mjs shot <target>
```

## Workflow Summary

1. **Confirm login** → ask user to open Grafana in Chrome
2. **Find target** → `scripts/cdp.mjs list` to get the Grafana tab's target ID
3. **Discover context** → `list-datasources` to find datasource UIDs
4. **Explore data** → `query` to understand available metrics
5. **Build panels** → construct panel JSON (see [references/panel-types.md](references/panel-types.md))
6. **Save dashboard** → `get-dashboard` → modify → write to file → `save-dashboard`
7. **Verify** → reload and screenshot

## Tips

- **Panel IDs must be unique** within a dashboard. Use integers that don't conflict with existing panels.
- **Use `instant: true, range: false`** for stat/bargauge/table panels. Use `instant: false, range: true` for timeseries. Exception: stat panels with sparklines need `range: true`.
- **Finding a dashboard UID**: it's in the URL path — `/d/<uid>/dashboard-name`.
- **Auth expiry**: if the tool returns HTML instead of JSON, the session has expired. Ask the user to re-authenticate in the browser.
- **Debugging failed queries**: the tool surfaces HTTP status codes and error bodies. Common issues: wrong datasource UID, org ID, or PromQL syntax.
