# mdrip

Fetch markdown snapshots of web pages using Cloudflare's Markdown for Agents feature, so coding agents can consume clean structured content instead of HTML.

## Benchmark Snapshot

Measured on February 13, 2026 across a few popular pages (values vary slightly as pages change):

| Page | Mode | HTML chars | Markdown chars | Chars saved | HTML tokens* | Markdown tokens* | Tokens saved |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| blog.cloudflare.com/markdown-for-agents | cloudflare-markdown | 289,820 | 14,807 | 94.9% | 72,455 | 3,702 | 94.9% |
| developers.cloudflare.com/fundamentals/reference/markdown-for-agents | cloudflare-markdown | 220,089 | 9,534 | 95.7% | 55,022 | 2,384 | 95.7% |
| en.wikipedia.org/wiki/Markdown | html-fallback | 192,322 | 52,448 | 72.7% | 48,081 | 13,112 | 72.7% |
| github.com/cloudflare/skills | html-fallback | 291,274 | 10,915 | 96.3% | 72,817 | 2,729 | 96.3% |
| **Average** | - | - | - | **89.9%** | - | - | **89.9%** |

*Tokens estimated with mdrip `estimateTokenCount` (chars/4). Markdown tokens use `x-markdown-tokens` when provided by Cloudflare.*

Re-run benchmark:

```bash
pnpm build
pnpm benchmark
```

## AI Skills

This repo also includes an AI-consumable skills catalog in `skills/`, following the [agentskills](https://agentskills.io) format.

- Skill index: `skills/README.md`
- mdrip skill: `skills/mdrip/SKILL.md`

### Install skills from this repo

If you use a Skills-compatible agent setup, you can add these skills directly:

```bash
# install skills from this repo
npx skills add charl-kruger/mdrip
```

## Why

For agent workflows, markdown is often better than HTML:
- cleaner structure
- lower token overhead
- easier chunking and context management

`mdrip` requests pages with `Accept: text/markdown`, stores the markdown locally, and tracks fetched pages in an index.

If a site does not return `text/markdown`, `mdrip` can automatically fall back to converting `text/html` into markdown.
The fallback uses an in-project converter optimized for common documentation/blog content (headings, links, lists, code blocks, tables, blockquotes).

## Why Cloudflare Markdown for Agents matters

Cloudflare's blog and docs describe Markdown for Agents as content negotiation at the edge:
- clients request `Accept: text/markdown`
- Cloudflare converts HTML to markdown in real time (for enabled zones)
- response includes `x-markdown-tokens` for token-size awareness

For AI workflows this is high-value:
- better structure for LLM parsing than raw HTML
- less token waste in context windows
- predictable markdown snapshots you can store and reuse in your repo

References:
- [Cloudflare blog: Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/)
- [Cloudflare docs: Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)

## Installation

```bash
npm install -g mdrip
```

Or use with `npx`:

```bash
npx mdrip <url>
```

## Usage

### Fetch pages

```bash
# Fetch one page
mdrip https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/

# Fetch multiple pages
mdrip https://blog.cloudflare.com/markdown-for-agents/ https://developers.cloudflare.com/

# Optional timeout override (ms)
mdrip https://example.com --timeout 45000

# Disable HTML fallback (strict Cloudflare markdown only)
mdrip https://example.com --no-html-fallback

# Print raw page markdown to stdout (no files/settings changes, no prompts)
mdrip https://blog.cloudflare.com/markdown-for-agents/ --raw
```

### Raw mode for agents (OpenClaw, etc.)

`--raw` is designed for agent runtimes that only need in-memory content.
It prints markdown to stdout and skips settings prompts and all file writes.

This is useful for flows with OpenClaw and similar AI tools where you want to pipe page content directly into your agent loop.

```bash
# stream markdown directly to another process
mdrip https://blog.cloudflare.com/markdown-for-agents/ --raw
```

### List fetched pages

```bash
mdrip list
mdrip list --json
```

### Remove pages

```bash
mdrip remove https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
```

### Clean snapshots

```bash
# Remove all
mdrip clean

# Remove only one domain
mdrip clean --domain developers.cloudflare.com
```

## File modifications

On first run, mdrip can optionally update:
- `.gitignore` (adds `mdrip/`)
- `tsconfig.json` (excludes `mdrip`)
- `AGENTS.md` (adds a section pointing agents to snapshots)

Choice is stored in `mdrip/settings.json`.

Use flags to skip prompt:

```bash
# allow updates
mdrip https://example.com --modify

# deny updates
mdrip https://example.com --modify=false
```

`--raw` mode bypasses this entire flow and never writes settings or snapshots.

## Output

```text
mdrip/
├── settings.json
├── sources.json
└── pages/
    └── developers.cloudflare.com/
        └── fundamentals/
            └── reference/
                └── markdown-for-agents/
                    └── index.md
```

## Requirements and notes

- Node.js 18+
- The target site must return markdown for `Accept: text/markdown` (Cloudflare Markdown for Agents enabled).
- If a page does not return `text/markdown`, mdrip can convert `text/html` into markdown fallback unless `--no-html-fallback` is used.

## Programmatic API

For programmatic usage in Node.js or Workers:

```bash
npm install mdrip
```

### Node.js (fetch and store)

```ts
import { fetchToStore, listStoredPages } from "mdrip/node";

const result = await fetchToStore("https://developers.cloudflare.com/", {
  cwd: process.cwd(),
});

if (!result.success) {
  throw new Error(result.error || "Failed to fetch page");
}

const pages = await listStoredPages(process.cwd());
console.log(pages.map((p) => p.path));
```

### Cloudflare Workers / Agent runtimes (raw in-memory markdown)

```ts
import { fetchMarkdown } from "mdrip";

const page = await fetchMarkdown(
  "https://blog.cloudflare.com/markdown-for-agents/",
);

console.log(page.markdownTokens);
console.log(page.markdown);
```

Available programmatic methods:
- `mdrip` (Workers-safe): `fetchMarkdown(url, options)`, `fetchRawMarkdown(url, options)`
- `mdrip/node` (filesystem features): `fetchToStore(url, options)`, `fetchManyToStore(urls, options)`, `listStoredPages(cwd?)`

## Publishing to npm

```bash
# optional package check
pnpm publish:dry-run

# publish to npm
pnpm publish:npm
```

`prepublishOnly` runs automatically before publish and executes:
- `pnpm type-check`
- `pnpm test`
- `pnpm build`

## Author

Charl Kruger

## License

Apache-2.0
