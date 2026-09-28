import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const toursDir = path.resolve(root, "data", "tours");
const songsPath = path.resolve(root, "data", "songs.json");

const songsData = JSON.parse(fs.readFileSync(songsPath, "utf-8"));

const unitFiles = fs
  .readdirSync(toursDir)
  .filter((f) => f.endsWith(".json"));
const units = unitFiles.map((f) => ({
  file: f,
  unit: JSON.parse(fs.readFileSync(path.resolve(toursDir, f), "utf-8")),
}));

// Map song livefansId or title to song ID
const livefansIdToId = Object.fromEntries(
  songsData.songs.filter((s) => s.livefansId).map((s) => [s.livefansId, s.id]),
);
const titleToId = Object.fromEntries(
  songsData.songs.map((s) => [s.title.trim(), s.id]),
);

function extractSongsFromHtml(html) {
  const tdRegex = /<td[^>]*class="[^"]*pcsl\d+[^"]*"[^>]*>([\s\S]*?)<\/td>/g;
  const items = [];

  for (const match of html.matchAll(tdRegex)) {
    const cellHtml = match[1];
    const songMatch = cellHtml.match(
      /<div class="ttl"><a href="\/songs\/(\d+)"[^>]*>([^<]+)<\/a><\/div>/,
    );

    const subtitleMatch = cellHtml.match(/<p class="subtitle">([^<]+)<\/p>/);
    const subtitleText = subtitleMatch ? subtitleMatch[1].trim() : "";

    const playBtnMatch = cellHtml.match(/showBottomMusicPlayer\((\d+)/);
    const playIndex = playBtnMatch ? parseInt(playBtnMatch[1], 10) : items.length;

    const isEncore = cellHtml.includes("sec-connect") || cellHtml.includes("アンコール") || /en\d+/i.test(cellHtml);

    const kind = [];
    if (subtitleText.includes("弾き語り") || subtitleText.includes("ソロ")) {
      kind.push("satoshi-solo");
    }
    if (subtitleText.includes("新曲")) {
      kind.push("premiere");
    }

    if (songMatch) {
      items.push({
        playIndex,
        livefansId: songMatch[1],
        title: songMatch[2].trim(),
        subtitle: subtitleText,
        kind: kind.length ? kind : undefined,
        isEncore,
      });
    } else if (subtitleText) {
      items.push({
        playIndex,
        title: subtitleText,
        subtitle: subtitleText,
        type: "interlude",
        isEncore,
      });
    }
  }

  // Sort strictly by true play order index from LiveFans player button
  items.sort((a, b) => a.playIndex - b.playIndex);

  return items;
}

function extractShowMetadataFromHtml(html) {
  // Extract address tag: <address><a href="/venues/1021" >＠リンクステーションホール青森 (青森県)</a></address>
  const addressMatch = html.match(/<address>\s*<a[^>]*>\s*＠\s*([^\(]+)\s*\(([^\)]+)\)/i);
  let rawVenue = "";
  let rawPref = "";

  if (addressMatch) {
    rawVenue = addressMatch[1].trim();
    rawPref = addressMatch[2].trim();
  }

  // Fallback to meta title
  if (!rawVenue) {
    const metaTitleMatch = html.match(/<meta name="title" content="([^"]+)"/);
    if (metaTitleMatch) {
      const m = metaTitleMatch[1].match(/＠\s*([^\(]+)\s*\(([^\)]+)\)/);
      if (m) {
        rawVenue = m[1].trim();
        rawPref = m[2].trim();
      }
    }
  }

  // Extract date: e.g., 2022/12/06
  const dateMatch = html.match(/(\d{4}\/\d{2}\/\d{2})/);
  const livefansDate = dateMatch ? dateMatch[1].replace(/\//g, "-") : "";

  // Extract start time (e.g., 18:00 開演)
  const timeMatch = html.match(/(\d{1,2}:\d{2})\s*開演/);
  const opensAt = timeMatch ? timeMatch[1] : "";

  return { rawVenue, rawPref, livefansDate, opensAt };
}

const venuesPath = path.resolve(root, "data", "venues.json");
const venueTranslationMap = JSON.parse(fs.readFileSync(venuesPath, "utf-8"));

async function autoTranslateVenue(rawVenue) {
  let translated = rawVenue;

  // 1. Rule-based replacements for common Japanese venue keywords
  const termMap = [
    [/大ホール/g, "大會堂"],
    [/ホール/g, "會館"],
    [/会館/g, "會館"],
    [/芸術/g, "藝術"],
    [/県立/g, "縣立"],
    [/県民/g, "縣民"],
    [/市民/g, "市民"],
    [/体育館/g, "體育館"],
    [/劇場/g, "劇場"],
    [/ドーム/g, "巨蛋"],
    [/アリーナ/g, "Arena"],
  ];

  let ruleResult = rawVenue;
  for (const [regex, replacement] of termMap) {
    ruleResult = ruleResult.replace(regex, replacement);
  }

  // 2. If片假名 remains, fetch translation from MyMemory API
  if (/[\u30A0-\u30FF]/.test(ruleResult)) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(rawVenue)}&langpair=ja|zh-TW`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const apiTrans = json?.responseData?.translatedText;
        if (apiTrans && apiTrans !== rawVenue) {
          translated = apiTrans;
        } else {
          translated = ruleResult;
        }
      } else {
        translated = ruleResult;
      }
    } catch (err) {
      translated = ruleResult;
    }
  } else {
    translated = ruleResult;
  }

  return translated.trim();
}

function computeDiff(pageSongs, templateSetlist) {
  const templateSongs = templateSetlist
    .filter((i) => i.songId)
    .map((i) => ({
      order: i.order,
      songId: i.songId,
      encore: !!i.encore,
    }));

  const templateSongIds = templateSongs.map((i) => i.songId);
  const encoreStartOrder = templateSongs.find((t) => t.encore)?.order ?? 18;

  const pageSongIds = pageSongs.map(
    (item) =>
      livefansIdToId[item.livefansId] ?? titleToId[item.title] ?? item.title,
  );

  if (pageSongIds.length === 0) {
    return { diff: {}, status: "NO_SETLIST_ON_PAGE" };
  }

  if (JSON.stringify(pageSongIds) === JSON.stringify(templateSongIds)) {
    return { diff: {}, status: "EXACT_TEMPLATE_MATCH" };
  }

  const diff = {};
  const skip = [];
  const insert = [];

  let tIdx = 0;
  for (let pIdx = 0; pIdx < pageSongIds.length; pIdx++) {
    const pSong = pageSongIds[pIdx];
    const pMeta = pageSongs[pIdx];
    if (tIdx < templateSongs.length && templateSongs[tIdx].songId === pSong) {
      tIdx++;
    } else {
      const nextTMatch = templateSongs.findIndex(
        (t, idx) => idx >= tIdx && t.songId === pSong,
      );
      if (nextTMatch !== -1) {
        for (let k = tIdx; k < nextTMatch; k++) {
          skip.push(templateSongs[k].order);
        }
        tIdx = nextTMatch + 1;
      } else {
        const anchorOrder = tIdx > 0 ? templateSongs[tIdx - 1].order : 0;
        const currentTOrder = templateSongs[tIdx]?.order;
        const isSubstitution =
          currentTOrder !== undefined &&
          (!pageSongIds.includes(templateSongs[tIdx].songId) ||
            skip.includes(currentTOrder));
        if (
          isSubstitution &&
          currentTOrder !== undefined &&
          !skip.includes(currentTOrder)
        ) {
          skip.push(currentTOrder);
          tIdx++;
        }
        const itemObj = {
          encore: pMeta?.isEncore || anchorOrder >= encoreStartOrder - 1,
          songId: pSong,
        };
        if (pMeta?.kind) itemObj.kind = pMeta.kind;
        if (pMeta?.subtitle) itemObj.note = pMeta.subtitle;
        if (pMeta?.type) itemObj.type = pMeta.type;
        insert.push({
          after: anchorOrder,
          item: itemObj,
        });
      }
    }
  }
  for (let k = tIdx; k < templateSongs.length; k++) {
    skip.push(templateSongs[k].order);
  }

  if (skip.length) diff.skip = skip;
  if (insert.length) diff.insert = insert;

  return { diff, status: "DIFF_CALCULATED" };
}

async function verifyAndRecomputeShows() {
  let checkedCount = 0;
  let exactCount = 0;
  let diffCount = 0;
  let noSetlistCount = 0;

  const targetIds = process.argv.slice(2).filter((arg) => /^\d+$/.test(arg));

  for (const { file, unit } of units) {
    for (const s of unit.shows) {
      if (targetIds.length > 0 && !targetIds.includes(s.id)) continue;
      if (!s.sourceUrls || !s.sourceUrls[0]) continue;

      const url = s.sourceUrls[0];

      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        if (!res.ok) continue;
        const html = await res.text();

        const meta = extractShowMetadataFromHtml(html);
        if (meta.livefansDate && s.date !== meta.livefansDate) {
          console.warn(`[DATE MISMATCH FIXED] ID ${s.id}: Local (${s.date}) -> LiveFans (${meta.livefansDate})`);
          s.date = meta.livefansDate;
        }
        if (meta.opensAt) {
          s.opensAt = meta.opensAt;
        }

        if (meta.rawVenue) {
          if (venueTranslationMap[meta.rawVenue]) {
            const trans = venueTranslationMap[meta.rawVenue];
            s.venue = trans.venue;
            s.city = trans.city || s.city;
            s.region = trans.region || s.region;
            s.prefecture = trans.prefecture || s.prefecture;
          } else {
            // 自動翻譯並寫入字典 data/venues.json
            const autoTranslated = await autoTranslateVenue(meta.rawVenue);
            venueTranslationMap[meta.rawVenue] = {
              venue: autoTranslated,
              city: s.city || "",
              region: s.region || "",
              prefecture: meta.rawPref || s.prefecture || ""
            };
            fs.writeFileSync(venuesPath, JSON.stringify(venueTranslationMap, null, 2) + "\n", "utf-8");
            console.log(`[AUTO TRANSLATED VENUE] Registered "${meta.rawVenue}" -> "${autoTranslated}" in data/venues.json`);
            s.venue = autoTranslated;
          }
        }

        const pageSongs = extractSongsFromHtml(html);
        const { diff, status } = computeDiff(pageSongs, unit.templateSetlist);

        checkedCount++;
        if (status === "EXACT_TEMPLATE_MATCH") {
          exactCount++;
          s.diff = {};
        } else if (status === "DIFF_CALCULATED") {
          diffCount++;
          s.diff = diff;
          console.log(
            `[DIFF MATCH] ${s.id} (${s.date} ${s.city} @ ${s.venue}):`,
            JSON.stringify(diff),
          );
        } else {
          noSetlistCount++;
        }
      } catch (err) {
        console.error(`Error verifying ${url}:`, err);
      }
    }

    fs.writeFileSync(
      path.resolve(toursDir, file),
      JSON.stringify(unit, null, 2) + "\n",
      "utf-8",
    );
  }

  console.log(`
Setlist Alignment Summary:
- Total checked: ${checkedCount}
- Exact template match: ${exactCount}
- Diffs calculated & applied: ${diffCount}
- No setlist posted yet on LiveFans: ${noSetlistCount}
  `);
}

verifyAndRecomputeShows();