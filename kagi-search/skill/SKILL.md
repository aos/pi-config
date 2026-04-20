---
name: kagi-search
description: "Search the web via Kagi to discover sources, documentation, official pages, recent news, or other current information when the user has not already provided a specific URL to inspect. Use for open-ended research, finding the right page to read, and verifying facts across multiple sources. If the user gives a direct link, read that link first with curl or chrome-cdp, and use Kagi only when you need additional sources, independent verification, or a replacement because the link is insufficient."
---

# Kagi Search

Search the web using Kagi. Run `kagi-search --help` for the full flag list.

## When to use this

- Use this for open-ended web research when you need to find sources or the user did not provide a specific page.
- If the user pasted a URL, do **not** search for it first. Read that URL directly with `curl` or the `chrome-cdp` skill.
- Use Kagi after a direct-link read only when you need more sources, independent verification, official documentation, or a fallback because the provided page is insufficient.

## Usage

**Always use `--json` flag** — without it, output contains terminal color codes and hyperlinks that are unreadable in this context.

```bash
kagi-search --json "query"
kagi-search --json -n 5 "query"    # Limit to 5 results (default: 10)
```

## JSON Output Structure

```json
{
  "results": [{ "title": "...", "url": "...", "snippet": "..." }],
  "quick_answer": {
    "markdown": "Formatted answer with citations...",
    "raw_text": "Plain text answer...",
    "references": [{ "title": "Source", "url": "https://..." }]
  }
}
```

`quick_answer` is present only when Kagi has a direct answer — not every query produces one.

## Workflow

1. Run `kagi-search --json "query"`
2. Check `quick_answer.markdown` first — often has the direct answer with inline citations
3. Fall back to `results` array for individual sources and snippets
4. Use the `chrome-cdp` skill to visit specific result URLs when you need full page content

## Important Behaviors

- **Quick Answer is always attempted** — the tool fetches both search results and Quick Answer in parallel. No extra flag needed.
- **Retries automatically** — up to 5 times with 1s delay on transient failures (network errors, empty results)
- **Auth is cookie-based** — authenticates once per invocation using a session token, then uses cookies for search + Quick Answer requests

## Authentication

Config lives at `~/.config/kagi/config.json`:

```json
{
  "password_command": "rbw get kagi-session-link",
  "timeout": 30,
  "max_retries": 5
}
```

`password_command` is a shell command that outputs a Kagi session link (or raw token). The token is extracted from the `token=` query parameter if present. If auth fails, the tool exits with an error mentioning redirect to `/signin`.

## Fixes
