# mdrip Skills

This repository includes portable AI skills in the [agentskills](https://agentskills.io) format.

Each skill lives in its own folder and contains:
- `SKILL.md` (required)
- optional `references/`, `scripts/`, and `assets/`

## Install

```bash
# install skills from this GitHub repo
npx skills add charl-kruger/mdrip
```

## Available skills

- `skills/mdrip`: Pull website pages into local markdown snapshots using Cloudflare Markdown for Agents, with HTML-to-markdown fallback and remote MCP/API support.
- Method coverage in the skill:
  - CLI commands: `mdrip <urls...>`, `mdrip list`, `mdrip remove|rm`, `mdrip clean`
  - Package `mdrip`: `fetchMarkdown`, `fetchRawMarkdown`
  - Package `mdrip/node`: `fetchMarkdown`, `fetchRawMarkdown`, `fetchToStore`, `fetchManyToStore`, `listStoredPages`
  - Remote MCP tools: `fetch_markdown`, `batch_fetch_markdown`
  - Remote HTTP endpoint: `/api` (`GET` and `POST`, including batch mode)
- `skills/mdrip-openclaw`: OpenClaw-focused workflow for using `mdrip` in `--raw` mode, workspace snapshot mode, and skill-based execution.

## Validation

You can validate any skill with `skills-ref`:

```bash
skills-ref validate /absolute/path/to/skills/mdrip
```
