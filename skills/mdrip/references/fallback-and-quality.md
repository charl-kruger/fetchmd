# Fallback and Quality

## Fallback policy

- Default behavior: fallback from markdown negotiation to HTML-to-markdown conversion.
- Strict behavior: disable fallback with `--no-html-fallback`.

## Quality checks

- Keep heading hierarchy and code blocks intact.
- Preserve links in markdown form.
- Preserve list and table structure when possible.
- Avoid including obvious navigation/chrome noise where possible.
- Preserve code language hints when detectable from `<pre>`/`<code>` classes and data attributes.

## Failure handling

- Timeout: suggest retry with `--timeout <ms>`.
- Non-2xx response: include status and URL in output.
- Empty markdown output: flag as partial failure and suggest strict retry or alternate source URL.

## Security filtering in HTML fallback

The fallback converter should exclude non-visible or risky content from markdown output:
- hidden elements (`hidden`, `aria-hidden="true"`)
- inline hidden styles (`display:none`, `visibility:hidden`, `font-size:0`)
- non-content elements (`template`, `select`, `option`, `textarea`, `object`, `embed`, `dialog`, `nav`)
- JavaScript links (`javascript:` href values)
- embedded `data:` image payloads
- HTML comments and script/style content

This reduces prompt-injection exposure from hidden page markup and non-rendered text.

## Agent behavior guidance

- Prefer narrower section URLs over massive index pages.
- Batch related pages together for consistent local context.
- After fetches, use `mdrip list --json` before additional ingestion to avoid duplicate work.
