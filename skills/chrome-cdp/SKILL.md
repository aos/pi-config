---
name: chrome-cdp
description: "Use Chrome DevTools Protocol to open, inspect, and interact with web pages in a local Chrome browser. Use when the user shares or pastes a URL and you need information from the rendered page, especially when curl, raw HTTP, or static HTML is not enough: JavaScript-rendered content, authenticated pages using browser session cookies, scrolling, clicking, form input, screenshots, accessibility snapshots, or extracting data from dynamic UIs. A user-provided URL counts as approval to open that page; ask before inspecting unrelated existing tabs."
---

# Chrome CDP

Lightweight Chrome DevTools Protocol CLI. Connects directly via WebSocket — no Puppeteer, works with 100+ tabs, instant connection.

## When to use this

- User pasted a URL and wants you to read, summarize, inspect, or extract information from the rendered page.
- Prefer `curl` for simple static pages. Switch to Chrome when content is JavaScript-rendered, gated behind the browser session, or requires scrolling, clicking, or typing to reveal.
- A user-provided URL is approval to open that URL in Chrome. Ask before inspecting unrelated existing tabs or navigating elsewhere on the user's behalf.

## Prerequisites

- Chrome (or Chromium, Brave, Edge, Vivaldi) with remote debugging enabled: open `chrome://inspect/#remote-debugging` and toggle the switch
- If your browser's `DevToolsActivePort` is in a non-standard location, set `CDP_PORT_FILE` to its full path

## Commands

All commands use the `cdp` CLI (installed on PATH). The `<target>` is a **unique** targetId prefix from `list`; copy the full prefix shown in the `list` output (for example `6BE827FA`). The CLI rejects ambiguous prefixes.

### List open pages

```bash
cdp list
```

### Take a screenshot

```bash
cdp shot <target> [file]    # default: screenshot-<target>.png in runtime dir
```

Captures the **viewport only**. Scroll first with `eval` if you need content below the fold. Output includes the page's DPR and coordinate conversion hint (see **Coordinates** below).

### Accessibility tree snapshot

```bash
cdp snap <target>
```

### Evaluate JavaScript

```bash
cdp eval <target> <expr>
```

> **Watch out:** avoid index-based selection (`querySelectorAll(...)[i]`) across multiple `eval` calls when the DOM can change between them (e.g. after clicking Ignore, card indices shift). Collect all data in one `eval` or use stable selectors.

### Other commands

```bash
cdp html    <target> [selector]   # full page or element HTML
cdp nav     <target> <url>         # navigate and wait for load
cdp net     <target>               # resource timing entries
cdp click   <target> <selector>    # click element by CSS selector
cdp clickxy <target> <x> <y>       # click at CSS pixel coords
cdp type    <target> <text>         # Input.insertText at current focus; works in cross-origin iframes unlike eval
cdp loadall <target> <selector> [ms]  # click "load more" until gone (default 1500ms between clicks)
cdp evalraw <target> <method> [json]  # raw CDP command passthrough
cdp open    [url]                  # open new tab (each triggers Allow prompt)
cdp stop    [target]               # stop daemon(s)
```

## Coordinates

`shot` saves an image at native resolution: image pixels = CSS pixels × DPR. CDP Input events (`clickxy` etc.) take **CSS pixels**.

```
CSS px = screenshot image px / DPR
```

`shot` prints the DPR for the current page. Typical Retina (DPR=2): divide screenshot coords by 2.

## Tips

- Prefer `snap --compact` over `html` for page structure.
- Use `type` (not eval) to enter text in cross-origin iframes — `click`/`clickxy` to focus first, then `type`.
- Chrome shows an "Allow debugging" modal once per tab on first access. A background daemon keeps the session alive so subsequent commands need no further approval. Daemons auto-exit after 20 minutes of inactivity.
