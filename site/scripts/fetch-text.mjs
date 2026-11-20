#!/usr/bin/env node
/**
 * Lightweight web page & Wikipedia text extractor for agent research.
 * Usage: node site/scripts/fetch-text.mjs <url> [maxChars=12000]
 */
const urlArg = process.argv[2];
const maxChars = Number(process.argv[3] || 12000);

if (!urlArg) {
  console.error("Usage: node site/scripts/fetch-text.mjs <url> [maxChars=12000]");
  process.exit(1);
}

const headers = {
  "User-Agent": "higedan-setlist-research/1.0 (+https://github.com)",
  Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
};

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|dt|dd)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  const parsed = new URL(urlArg);
  const wikiMatch = parsed.hostname.match(/^([a-z-]+)\.wikipedia\.org$/);

  if (wikiMatch && parsed.pathname.startsWith("/wiki/")) {
    const lang = wikiMatch[1];
    const title = decodeURIComponent(parsed.pathname.slice("/wiki/".length));
    const apiUrl = `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&redirects=1`;
    const res = await fetch(apiUrl, { headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${apiUrl}`);
    }
    const json = await res.json();
    if (json.error) {
      throw new Error(`Wikipedia API error: ${json.error.info}`);
    }
    const pageTitle = json.parse?.title || title;
    const html = json.parse?.text?.["*"] || "";
    const text = stripHtml(html).slice(0, maxChars);
    console.log(`TITLE: ${pageTitle}\nURL: ${urlArg}\n\n${text}`);
    return;
  }

  const res = await fetch(urlArg, { headers, redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${urlArg}`);
  }
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : "(no title)";
  const text = stripHtml(html).slice(0, maxChars);
  console.log(`TITLE: ${title}\nURL: ${res.url}\n\n${text}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
