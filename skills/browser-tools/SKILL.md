---
name: browser-tools
description: "Browse the web interactively via Chrome DevTools Protocol. Start Chrome, navigate pages, take screenshots, run JavaScript, pick/inspect elements, and dismiss cookie dialogs. Use when you need to view a web page, verify UI, test interactions, capture what a page looks like, extract page content, or debug frontend behavior."
---

# Browser Tools

Remote-control Chrome/Chromium via CDP. All commands use `browser-tools` CLI. Run `browser-tools --help` for the full command list.

## Commands

### start

```bash
browser-tools start              # Fresh profile
browser-tools start --profile    # Copy your default Chrome profile (cookies, logins)
```

Starts Chrome on `:9222`. **Kills any existing Chrome debugging instance first.** Caches the working browser binary for faster subsequent starts.

### nav

```bash
browser-tools nav <url>          # Navigate current tab
browser-tools nav <url> --new    # Open in new tab
```

**Does not wait for full page load** — only fires the navigation. Add `sleep 2` after if you need the page to settle before screenshotting or evaluating.

### eval

```bash
browser-tools eval '<code>'
```

Executes JavaScript in the active tab. Code is wrapped in `async () => { return (<code>); }`, so `await` works. Use single quotes to avoid shell escaping issues.

**Output formatting:** Arrays of objects print key-value pairs separated by blank lines. Single objects print key-value pairs. Primitives print as-is.

### screenshot

```bash
browser-tools screenshot
```

Captures the current viewport as PNG. **Outputs the temp file path to stdout** (e.g., `/tmp/screenshot-2025-02-16T...png`). Use the `read` tool on this path to view the image.

### pick

```bash
browser-tools pick "Click the submit button"
```

Interactive element picker (5-minute timeout). Returns tag, id, class, text content, outer HTML (truncated), and parent chain for selected elements.

- **Click** — select single element and finish
- **Cmd/Ctrl+Click** — add to multi-selection
- **Enter** — finish multi-selection
- **ESC** — cancel

### dismiss-cookies

```bash
browser-tools dismiss-cookies          # Accept cookies
browser-tools dismiss-cookies --reject # Reject cookies (where possible)
```

Dismisses common EU cookie consent dialogs (OneTrust, Cookiebot, Sourcepoint, and many others).

## Important Behaviors

- **All commands operate on the most recent tab** (last in the tab list)
- **Chrome must be started first** — other commands fail with a connection timeout if Chrome isn't running on `:9222`
- **`eval` timeout is 45s**, `nav` timeout is 45s, `pick` timeout is 5 minutes

## Common Workflows

### Navigate and screenshot

```bash
browser-tools nav https://example.com && sleep 2 && browser-tools screenshot
```

### Extract structured data from a page

```bash
browser-tools eval 'JSON.stringify(Array.from(document.querySelectorAll("a")).map(a => ({ text: a.textContent.trim(), href: a.href })))'
```

### Navigate, dismiss cookies, then screenshot

```bash
browser-tools nav https://example.com && sleep 2 && browser-tools dismiss-cookies && sleep 1 && browser-tools screenshot
```

## Fixes
