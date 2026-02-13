# Workflow Reference

## Intent

Create stable markdown context from URLs with the right access method for the task:
- local snapshots for repository reuse
- in-memory markdown for runtime flows
- remote access via MCP or HTTP API

## Inputs

- One or more absolute URLs.
- Optional timeout override.
- Optional fallback toggle.
- Optional local working directory when writing snapshots.

## Method matrix

| Need | Method |
|---|---|
| Local files + source index | CLI (`mdrip`) or `mdrip/node` store methods |
| In-memory markdown only | `mdrip.fetchMarkdown` / `mdrip.fetchRawMarkdown` |
| MCP tool-calling client | Remote `/mcp` or `/sse` |
| Non-MCP HTTP integration | Remote `/api` |

## Core fetch logic

1. Request page with `Accept: text/markdown`.
2. If response is markdown, persist directly.
3. If response is HTML and fallback is enabled, convert HTML to markdown.
4. Return metadata with markdown (`source`, token estimate, status, resolved URL).

## Local storage contract (when writing files)

- Base directory: `mdrip/`
- Page snapshots: `mdrip/pages/<host>/<path>/index.md`
- Source index: `mdrip/sources.json`
- Settings: `mdrip/settings.json`

## Result reporting

For each URL, report:
- local output path
- mode: `cloudflare-markdown` or `html-fallback`
- `markdownTokens` (from `x-markdown-tokens` or fallback estimate)
- `status`, `contentType`, `resolvedUrl`
- failure details when request fails
