/**
 * check-i18n.mjs — Bare-CJK regression guard for the UI layer (ADR-0107).
 *
 * Scans `src/components/`, `src/hooks/` and `src/App.jsx` for hardcoded
 * Chinese/Japanese/Korean text rendered to users, enforcing the rule:
 * every user-facing string must go through `t()` with a dictionary key.
 *
 * Intentionally allowed (ADR-0107 taxonomy boundary):
 * - `t("key", "中文後備")` — zh-TW fallback defaults are stripped before scan
 * - Canonical taxonomy keys: 8 categories, 其他, album buckets, region names
 *   when used as data (`===`, `||`, `??`, `.includes()`, bracket keys)
 * - Multilingual search indexes: TAXONOMY_KEYWORDS / BADGE_KEYWORDS objects
 * - Entity data matching: `.includes("台北")`, `songTitle[x]`, brand lockups
 * - Locale-ternary copy builders (`locale === "en" ? ... : ...` chains):
 *   lines within ±3 lines of a `locale` token are copy branches, not UI
 * - Comments of any form (`//`, block comments, `{/* *\/}`)
 *
 * Out of scope: `src/lib/` (domain data + dictionaries live there;
 * dictionary completeness across 4 locales is covered by smoke-test suite 14).
 *
 * Exit 0 when clean, exit 1 listing file:line violations otherwise.
 * Includes `--self-test` fixtures proving the rule set catches real
 * violations without flagging the allowed patterns above.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_TARGETS = ["src/components", "src/hooks", "src/App.jsx", "src/main.jsx"];

// CJK Unified + radicals + kana + hangul + fullwidth forms.
const CJK = /[⺀-䶿一-鿿豈-﫿぀-ヿ가-힣＀-￯]/;
// Canonical taxonomy keys: data, never UI copy (ADR-0107).
const CANONICAL = new Set([
  "巡演專場",
  "特別專場",
  "聯合專場",
  "店家活動",
  "音樂祭",
  "學園祭",
  "電視演出",
  "線上直播",
  "其他",
  "EP / 單曲",
  "合作單曲",
  "未發行曲目",
  "海外（台灣 / 韓國 / 東南亞）",
  "日本 - 關東",
  "日本 - 關西",
  "日本 - 東北 / 北海道",
  "日本 - 中部 / 九州 / 其他",
]);
const CJK_RUN = /[⺀-䶿一-鿿豈-﫿぀-ヿ가-힣＀-￯]+/g;

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^\S:])\/\/.*$/gm, "$1");
}

// Replace t(...) calls with a marker (iteratively, so nested t(t(...)) also goes).
function markTCalls(src) {
  let prev = null;
  let cur = src;
  const re = /\bt\((?:[^()"'`]|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\([^()]*\))*\)/g;
  while (prev !== cur) {
    prev = cur;
    cur = cur.replace(re, "__T__");
  }
  return cur;
}

// Language autonyms are shown in their own language everywhere by convention.
const AUTONYMS = new Set(["繁中", "日本語", "한국어"]);
// CJK punctuation framing translated content / variables is not copy.
const PUNCT = /[（）《》「」『』〈〉：；・、，。！？～…—·⋯※〰]+/g;

function checkLines(relPath, text) {
  const violations = [];
  const lines = markTCalls(stripComments(text)).split("\n");
  let indexDepth = 0; // inside TAXONOMY_KEYWORDS / BADGE_KEYWORDS object
  const hasLocaleNear = (i) => {
    for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
      if (/\blocale\b/.test(lines[j])) return true;
    }
    return false;
  };
  lines.forEach((raw, i) => {
    const line = raw;
    if (/(TAXONOMY_KEYWORDS|BADGE_KEYWORDS)\s*=\s*\{/.test(line)) {
      indexDepth = 1;
      return;
    }
    if (indexDepth > 0) {
      indexDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      return;
    }
    if (!CJK.test(line)) return;
    if (/^\s*console\.(error|warn|log|info|debug)\b/.test(line)) return; // dev logs
    if (hasLocaleNear(i)) return; // locale-ternary copy branch
    if (/\.includes\(/.test(line)) return; // entity/taxonomy data matching
    if (/\b(TAXONOMY_KEYWORDS|BADGE_KEYWORDS|WEEKDAYS|CATEGORY_ORDER)\b/.test(line)) return;
    if (/\b(songTitle|songAlias|unitType|getUnitTypeLabel|routeHash|encodeURIComponent|trackKey|getSongAlbum|getVenueRegion)\b/.test(line)) return;
    if (/\b(categories|albumGroups|tiers|badges|regions)\./.test(line)) return;
    if (/https?:\/\//.test(line)) return; // URLs
    if (/未詳|不明/.test(line) && /\.includes\(|title\?/.test(line)) return; // placeholder-track data checks
    if (line.includes("藤原聡")) return; // band member credits are entity data

    let probe = line
      // graceful-degradation idiom: t ? <translated> : "<zh fallback>"
      .replace(/\bt\s*\?\s*[^:;]+:\s*(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '""')
      // t("k", "fb") || "fb2" fallbacks attached to a real t() call
      .replace(/__T__\s*(\|\||\?\?)\s*(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '""')
      .replace(/__T__/g, '""')
      .replace(/\?\.\["(?:[^"\\]|\\.)*"\]|\["(?:[^"\\]|\\.)*"\]/g, '[""]') // dict bracket keys
      .replace(/[=!]==?\s*(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, "===''") // === / !== operands
      .replace(/\bcase\s+(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, "case''"); // switch labels

    // Hashtag-only entity tags carry no UI copy.
    if (!CJK.test(probe.replace(/#\S+/g, ""))) return;
    // Punctuation framing translated content / variables carries no UI copy.
    if (!CJK.test(probe.replace(PUNCT, ""))) return;
    // Bare brand lockup with no other CJK on the line is allowed.
    if (!CJK.test(probe.replace(/Official\s*髭男\s*dism|Official\s*Hige\s*Dandism/gi, ""))) {
      if (/Official/i.test(probe)) return;
    }

    // Remaining CJK must be exclusively canonical taxonomy keys in data
    // position, or language autonyms keyed by locale code (e.g.
    // `"zh-TW": "繁中"`). Bare canonical words or bare autonyms as JSX
    // copy (e.g. <span>巡演專場</span>) still fail: they must go through
    // t("categories.*") / t("actions.*") for ja/en/ko.
    const runs = probe.match(CJK_RUN) || [];
    if (runs.length === 0) return;
    if (
      [...runs].every((r) => AUTONYMS.has(r)) &&
      /(zh-TW|\bja\b|\bko\b|\ben\b|\blocale\b)/.test(probe)
    )
      return;
    if ([...runs].every((r) => CANONICAL.has(r)) && /(\|\||\?\?|return|=>)/.test(probe)) return;

    violations.push({ line: i + 1, text: raw.trim().slice(0, 120) });
  });
  return violations;
}

function collectFiles() {
  const out = [];
  for (const target of SCAN_TARGETS) {
    const full = path.join(root, target);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isFile()) {
      out.push(full);
      continue;
    }
    for (const entry of fs.readdirSync(full, { recursive: true })) {
      if (/\.(jsx|js)$/.test(entry)) out.push(path.join(full, entry));
    }
  }
  return out;
}

function selfTest() {
  const cases = [
    // [source, expectViolation]
    [`<span>篩選場次</span>`, true],
    [`title="開啟篩選抽屜"`, true],
    [`aria-label="演出類型篩選"`, true],
    [`return "確認套用場次";`, true],
    [`{count > 1 ? \`\${count}場\` : "●"}`, true],
    [`<span>{t("navigators.drawer.cancel", "取消")}</span>`, false],
    [`title={t("search.clearTitle", "清空搜尋")}`, false],
    [`if (unit.type === "特別專場") return "特別專場";`, false],
    [`const t = app.unitType || "其他";`, false],
    [`return "巡演專場";`, false],
    [`note.includes("弾き語り") ||`, false],
    [`city.includes("台北") ||`, false],
    [`{t(\`categories.\${cat}\`, cat)}`, false],
    [`export const TAXONOMY_KEYWORDS = {\n  "巡演專場": [\n    "巡演專場", "巡演", "ツアー", "tour",\n  ],\n};`, false],
    [`alt="Official髭男dism"`, false],
    [`if (!i.songId && (i.title?.includes("未詳") || i.title?.includes("不明"))) {`, false],
    [
      `      locale === "en"\n        ? "Show"\n        : \`第 \${n} 場\`,`,
      false,
    ],
    [`<span>{t("a", t("b", "選擇場地"))}</span>`, false],
    [`// 僅點選標示之有場次日期`, false],
    [`{/* 篩選抽屜 */}`, false],
    [`const weekdays = WEEKDAYS[locale] || WEEKDAYS["zh-TW"];`, false],
    [`<span>共 {n} 場</span>`, true],
    [`<span>巡演專場</span>`, true],
    [`{(t("memorial.songsRecorded") || "全 {count} 首收錄").replace("{count}", n)}`, false],
    [`if (!url) return t ? t("a", "來源紀錄") : "來源紀錄";`, false],
    [`<span>（{s.city}）</span>`, false],
    [`.join("、")`, false],
    [`"zh-TW": "繁中",`, false],
    [`console.error("生成紀念小卡圖片失敗:", err);`, false],
    [`lines.push("", "#Official髭男dism #ヒゲダン #LiveArchive");`, false],
    [`venueRegion === "海外" ||`, false],
    [`<span>藤原聡 · 小笹大輔 · 楢﨑誠 · 松浦匡希</span>`, false],
    [`      locale === "ja"\n        ? \`第 \${n} 公演\`\n        : \`第 \${n} 場\`,`, false],
    [`return title || "演出場次";`, true],
  ];
  let failed = 0;
  cases.forEach(([src, expectViolation], idx) => {
    const got = checkLines("fixture.jsx", src).length > 0;
    if (got !== expectViolation) {
      failed++;
      console.error(`self-test case ${idx} FAILED (expected violation=${expectViolation}): ${src.split("\n")[0]}`);
    }
  });
  if (failed > 0) {
    console.error(`${failed} self-test case(s) failed`);
    process.exit(1);
  }
  console.log(`self-test: ${cases.length} cases passed`);
}

if (process.argv.includes("--self-test")) {
  selfTest();
  process.exit(0);
}

const files = collectFiles();
let total = 0;
for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const violations = checkLines(rel, fs.readFileSync(file, "utf8"));
  for (const v of violations) {
    total++;
    console.error(`${rel}:${v.line}: bare CJK UI string without t(): ${v.text}`);
  }
}
if (total > 0) {
  console.error(`\ncheck-i18n: ${total} violation(s). Route UI strings through t() (ADR-0107).`);
  process.exit(1);
}
console.log(`check-i18n: clean (${files.length} files)`);
