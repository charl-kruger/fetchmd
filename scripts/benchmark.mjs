import { fetchMarkdown } from "../dist/web.js";
import { estimateTokenCount } from "../dist/lib/html-to-markdown.js";

const DEFAULT_PAGES = [
  "https://blog.cloudflare.com/markdown-for-agents/",
  "https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/",
  "https://en.wikipedia.org/wiki/Markdown",
  "https://github.com/cloudflare/skills",
];

function pct(before, after) {
  if (before === 0) {
    return 0;
  }
  return ((before - after) / before) * 100;
}

function fmtInt(value) {
  return value.toLocaleString("en-US");
}

function fmtPct(value) {
  return `${value.toFixed(1)}%`;
}

function shortLabel(url) {
  const u = new URL(url);
  const path = u.pathname === "/" ? "" : u.pathname;
  return `${u.host}${path}`;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      "Accept-Encoding": "identity",
      "User-Agent": "mdrip-benchmark",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTML request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function run() {
  const pages = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_PAGES;

  const rows = [];
  for (const page of pages) {
    try {
      const html = await fetchHtml(page);
      const markdownResponse = await fetchMarkdown(page, {
        timeoutMs: 60_000,
        htmlFallback: true,
      });

      const htmlChars = html.length;
      const markdownChars = markdownResponse.markdown.length;
      const htmlTokens = estimateTokenCount(html);
      const markdownTokens =
        markdownResponse.markdownTokens ?? estimateTokenCount(markdownResponse.markdown);

      rows.push({
        page,
        label: shortLabel(page),
        source: markdownResponse.source,
        htmlChars,
        markdownChars,
        charsSavedPct: pct(htmlChars, markdownChars),
        htmlTokens,
        markdownTokens,
        tokensSavedPct: pct(htmlTokens, markdownTokens),
      });
    } catch (error) {
      rows.push({
        page,
        label: shortLabel(page),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const okRows = rows.filter((row) => !row.error);
  const avgCharsSaved =
    okRows.reduce((sum, row) => sum + row.charsSavedPct, 0) / (okRows.length || 1);
  const avgTokensSaved =
    okRows.reduce((sum, row) => sum + row.tokensSavedPct, 0) / (okRows.length || 1);

  console.log(
    `# mdrip benchmark (${new Date().toISOString().slice(0, 10)})`,
  );
  console.log(
    "| Page | Mode | HTML chars | Markdown chars | Chars saved | HTML tokens* | Markdown tokens* | Tokens saved |",
  );
  console.log(
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  );

  for (const row of rows) {
    if (row.error) {
      console.log(`| ${row.label} | error | - | - | - | - | - | - |`);
      console.log(`Error for ${row.page}: ${row.error}`);
      continue;
    }

    console.log(
      `| ${row.label} | ${row.source} | ${fmtInt(row.htmlChars)} | ${fmtInt(row.markdownChars)} | ${fmtPct(row.charsSavedPct)} | ${fmtInt(row.htmlTokens)} | ${fmtInt(row.markdownTokens)} | ${fmtPct(row.tokensSavedPct)} |`,
    );
  }

  if (okRows.length > 0) {
    console.log(
      `| **Average** | - | - | - | **${fmtPct(avgCharsSaved)}** | - | - | **${fmtPct(avgTokensSaved)}** |`,
    );
  }

  console.log(
    "\n*Tokens estimated with mdrip `estimateTokenCount` (chars/4). Markdown tokens use `x-markdown-tokens` when provided by Cloudflare.*",
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
