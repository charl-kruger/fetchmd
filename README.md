# mdrip

Fetch clean markdown snapshots of any web page — optimized for AI agents, RAG pipelines, and context-aware workflows.

Reduces token overhead by ~90% compared to raw HTML while preserving the content structure LLMs need.

## Why

AI agents and LLMs work better with markdown than HTML. Feeding raw HTML into a context window wastes tokens on tags, scripts, styles, and boilerplate. mdrip solves this by fetching any URL and returning clean, structured markdown.

- **~90% fewer tokens** than raw HTML
- **Automatic HTML-to-markdown fallback** when native markdown isn't available
- **Works everywhere** — CLI, Node.js, Cloudflare Workers, or via remote MCP
- **Token-aware** — reports estimated token counts so you can manage context budgets

Sites that support [Cloudflare's Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) return markdown natively at the edge. For all other sites, mdrip's built-in converter handles headings, links, lists, code blocks, tables, blockquotes, and more, while filtering hidden/non-visible content (including hidden attributes, `aria-hidden`, inline hidden styles, templates/forms, and HTML comments).

## Installation

```bash
npm install -g mdrip
```

Or use directly with `npx`:

```bash
npx mdrip <url>
```

## CLI Usage

### Fetch pages

```bash
# Fetch one page
mdrip https://example.com/docs/getting-started

# Fetch multiple pages
mdrip https://example.com/docs https://example.com/api

# Custom timeout (ms)
mdrip https://example.com --timeout 45000

# Strict mode — only accept native markdown, no HTML fallback
mdrip https://example.com --no-html-fallback

# Raw mode — print markdown to stdout, no file writes
mdrip https://example.com --raw
```

### List fetched pages

```bash
mdrip list
mdrip list --json
```

### Remove pages

```bash
mdrip remove https://example.com/docs/getting-started
```

### Clean snapshots

```bash
# Remove all
mdrip clean

# Remove only one domain
mdrip clean --domain example.com
```

### Raw mode for agent runtimes

`--raw` prints markdown to stdout and skips all file writes and prompts. Useful for piping content directly into agent loops.

```bash
mdrip https://example.com --raw | your-agent-cli
```

## Programmatic API

```bash
npm install mdrip
```

### Method reference

| Import path | Method | Returns | Purpose |
|---|---|---|---|
| `mdrip` | `fetchMarkdown(url, options?)` | `Promise<MarkdownResponse>` | Fetch one URL to markdown with metadata |
| `mdrip` | `fetchRawMarkdown(url, options?)` | `Promise<string>` | Fetch one URL to markdown string only |
| `mdrip/node` | `fetchMarkdown(url, options?)` | `Promise<MarkdownResponse>` | Node entrypoint alias for in-memory fetch |
| `mdrip/node` | `fetchRawMarkdown(url, options?)` | `Promise<string>` | Node entrypoint alias for markdown-only fetch |
| `mdrip/node` | `fetchToStore(url, options?)` | `Promise<FetchResult>` | Fetch one URL and persist to `mdrip/pages/...` |
| `mdrip/node` | `fetchManyToStore(urls, options?)` | `Promise<FetchResult[]>` | Fetch many URLs and persist successful results |
| `mdrip/node` | `listStoredPages(cwd?)` | `Promise<PageEntry[]>` | List tracked snapshots from `mdrip/sources.json` |

`FetchMarkdownOptions` supports: `timeoutMs`, `userAgent`, `htmlFallback`, `fetchImpl`, `tokenModel`, `tokenEncoding`.
Default token encoding is `o200k_base` (recommended for GPT-4o/4.1/5-family style counting).
`StoreFetchOptions` extends that with `cwd`.

### Workers / Edge / In-memory

```ts
import { fetchMarkdown } from "mdrip";

const page = await fetchMarkdown("https://example.com/docs");

console.log(page.markdown);       // clean markdown content
console.log(page.markdownTokens); // estimated token count
console.log(page.source);         // "cloudflare-markdown" or "html-fallback"
```

### Node.js (fetch and store to disk)

```ts
import { fetchToStore, listStoredPages } from "mdrip/node";

const result = await fetchToStore("https://example.com/docs", {
  cwd: process.cwd(),
});

if (result.success) {
  console.log(`Saved to ${result.path}`);
}

const pages = await listStoredPages(process.cwd());
```

## Remote MCP + HTTP API

mdrip is available as a remote service at **`mdrip.createmcp.dev`** with MCP transports and a direct JSON API.

| Endpoint | Transport | Use case |
|---|---|---|
| `/mcp` | Streamable HTTP MCP | Recommended for MCP clients |
| `/sse` | SSE MCP | Legacy MCP client compatibility |
| `/api` | JSON over HTTP | Direct non-MCP integration |

### MCP tools

`fetch_markdown`:
- Inputs: `url` (required), `timeout_ms` (optional), `html_fallback` (optional)
- Output: markdown + metadata (`resolvedUrl`, `status`, `contentType`, `source`, `markdownTokens`, `contentSignal`)

`batch_fetch_markdown`:
- Inputs: `urls` (required array, 1-10), `timeout_ms` (optional), `html_fallback` (optional)
- Output: one result per URL, with success/error details

### HTTP API (`/api`)

`GET /api` expects query params:
- `url` (required)
- `timeout` (optional ms)
- `html_fallback` (optional `true`/`false`)

```bash
curl "https://mdrip.createmcp.dev/api?url=https://example.com&timeout=30000&html_fallback=true"
```

`POST /api` supports both single and batch bodies:

```json
{ "url": "https://example.com", "timeout_ms": 30000, "html_fallback": true }
```

```json
{
  "urls": ["https://example.com", "https://example.com/docs"],
  "timeout_ms": 30000,
  "html_fallback": true
}
```

Single responses return one fetch result object.
Batch responses return `{ "results": [...] }` with `success: true|false` per URL.

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mdrip": {
      "command": "npx",
      "args": ["mcp-remote", "https://mdrip.createmcp.dev/mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add mdrip-remote --transport sse https://mdrip.createmcp.dev/sse
```

### Cloudflare AI Playground

Enter `mdrip.createmcp.dev/sse` at [playground.ai.cloudflare.com](https://playground.ai.cloudflare.com/).

## OpenClaw Integration

### Option 1: Dedicated OpenClaw skill (recommended)

Install skills from this repo in your OpenClaw workspace:

```bash
cd ~/.openclaw/workspace
npx skills add charl-kruger/mdrip
```

Enable the OpenClaw-focused skill in `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "mdrip-openclaw": {
        "enabled": true
      }
    }
  }
}
```

If you want OpenClaw to load skills directly from this local repository:

```json
{
  "skills": {
    "load": {
      "extraDirs": ["<absolute-path-to-fetchmd>/skills"]
    }
  }
}
```

### Option 2: Direct CLI usage in OpenClaw workflows

```bash
# In-memory markdown only (best for tool pipelines)
mdrip https://example.com/docs --raw

# Persist reusable snapshots in workspace
mdrip https://example.com/docs https://example.com/api
mdrip list --json
```

## File modifications

On first run, mdrip can optionally update:
- `.gitignore` — adds `mdrip/`
- `tsconfig.json` — excludes `mdrip/`
- `AGENTS.md` — adds a section pointing agents to your snapshots

Choice is stored in `mdrip/settings.json`. Use `--modify` or `--modify=false` to skip the prompt.

`--raw` mode bypasses this entirely.

## Output structure

```
mdrip/
├── settings.json
├── sources.json
└── pages/
    └── example.com/
        └── docs/
            └── getting-started/
                └── index.md
```

## Benchmark

Measured on **February 13, 2026** (values vary as pages change):

| Page | Mode | Chars saved | Tokens saved |
|------|------|------------:|-------------:|
| blog.cloudflare.com/markdown-for-agents | cloudflare-markdown | 94.3% | 96.2% |
| developers.cloudflare.com/.../markdown-for-agents | cloudflare-markdown | 95.5% | 97.3% |
| en.wikipedia.org/wiki/Markdown | html-fallback | 73.8% | 76.4% |
| github.com/cloudflare/skills | html-fallback | 96.7% | 98.0% |
| **Average** | | **90.1%** | **92.0%** |

```bash
pnpm build && pnpm benchmark
```

Token counts use mdrip's tokenizer-based estimator (default encoding: `o200k_base`).

## AI Skills

This repo includes an AI-consumable skills catalog in `skills/`, following the [agentskills](https://agentskills.io) format.

- `mdrip`: general-purpose mdrip skill (CLI, package APIs, remote MCP/API)
- `mdrip-openclaw`: OpenClaw-focused skill and config/workflow reference

```bash
npx skills add charl-kruger/mdrip
```

## Requirements

- Node.js 18+

## Author

Charl Kruger

## License

Apache-2.0
