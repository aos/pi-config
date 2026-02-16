---
name: matryoshka
description: "Process files too large to read into context. Use when a file is too big to fit in the context window, when you need to search/grep/filter/count/sum across a large file, when analyzing logs or CSVs with thousands of lines, when exploring a large source code file (list functions, get function bodies, find references), or when you need to extract or aggregate data from a large document without reading the whole thing."
---

# Matryoshka

Load a large file into a server, then search, filter, and aggregate it with queries — without pulling the full content into context.

## Workflow

1. **Start server** — `scripts/start-server.sh`
2. **Load document** — `scripts/load.sh <file>` (auto-starts server if needed)
3. **Query progressively** — `scripts/query.sh '(grep "pattern")'` → refine with filter/map/count/sum
4. **Expand results** — `scripts/expand.sh RESULTS` (queries return compact handle stubs, not full data)
5. **Close session** — `scripts/close.sh`

Sessions auto-expire after 10 minutes of inactivity. Re-run `load.sh` to restart.

## Quick Start

```bash
scripts/start-server.sh
scripts/load.sh ./large-file.txt
scripts/query.sh '(grep "ERROR")'
scripts/query.sh '(count RESULTS)'
scripts/expand.sh RESULTS 10          # First 10 matches
scripts/close.sh
```

## Nucleus Query Reference

Queries use S-expressions. Always wrap in single quotes to avoid shell expansion.

### Search

```scheme
(grep "regex-pattern")            ; Regex search → binds RESULTS
(fuzzy_search "query" 10)         ; Fuzzy search, top N results
(lines 1 100)                     ; Get line range (1-indexed)
(text_stats)                      ; Document metadata
```

### Symbol Operations (code files only)

Requires tree-sitter. Built-in support for: TypeScript, JavaScript, Python, Go.

```scheme
(list_symbols)                    ; List all symbols (functions, classes, methods, etc.)
(list_symbols "function")         ; Filter by kind: "function", "class", "method", "interface", "type", "struct"
(get_symbol_body "myFunc")        ; Get source code body for a symbol by name
(get_symbol_body RESULTS)         ; Get body for symbol from previous query result
(find_references "myFunc")        ; Find all references to an identifier
```

### Collections

```scheme
(filter RESULTS (lambda x (match x "pattern" 0)))
(map RESULTS (lambda x (match x "(\\d+)" 1)))
(count RESULTS)
(sum RESULTS)
(reduce RESULTS 0 (lambda acc x (add acc 1)))
```

### Strings

```scheme
(match str "pattern" 0)           ; Regex match, return group N
(replace str "from" "to")
(split str "," 0)                 ; Split and get index
(parseInt str)
(parseFloat str)
```

### Type Coercion

```scheme
(parseDate "Jan 15, 2024")       ; → "2024-01-15"
(parseCurrency "$1,234.56")      ; → 1234.56
(parseNumber "1,234,567")        ; → 1234567
```

### Synthesis

```scheme
(synthesize ("$100" 100) ("$1,234" 1234) ("$50,000" 50000))
; → Synthesizes an extraction function from input/output examples
```

## Variables

- `RESULTS` — latest array result (auto-bound by grep, filter, etc.)
- `_1`, `_2`, `_3`, ... — results from each turn in sequence (1-indexed)
- `context` — raw document content

## Core Scripts

All scripts use `LATTICE_PORT` env var (default: 3456).

| Script | Purpose |
|---|---|
| `scripts/start-server.sh [port]` | Start `lattice-http` in background |
| `scripts/load.sh <file>` | Load a document (also accepts stdin: `load.sh - < file`) |
| `scripts/query.sh '<expr>'` | Execute a Nucleus query |
| `scripts/expand.sh <var> [limit] [offset]` | Expand a handle to see full data |
| `scripts/reset.sh` | Reset bindings but keep document loaded |
| `scripts/close.sh` | Close session, free memory |

Diagnostic scripts also available: `health.sh`, `status.sh`, `bindings.sh`, `stats.sh`.

## Fixes

### Session expired mid-analysis

Re-load the document: `scripts/load.sh <file>`. Variable bindings are lost — re-run queries.

### Server not running

```bash
scripts/health.sh              # Check
scripts/start-server.sh        # (Re)start
```
