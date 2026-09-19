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
    const playIdxMatch = cellHtml.match(/showBottomMusicPlayer\((\d+),/);
    const songMatch = cellHtml.match(
      /<div class="ttl"><a href="\/songs\/(\d+)"[^>]*>([^<]+)<\/a><\/div>/,
    );

    if (playIdxMatch && songMatch) {
      items.push({
        playIndex: parseInt(playIdxMatch[1], 10),
        livefansId: songMatch[1],
        title: songMatch[2].trim(),
      });
    }
  }

  items.sort((a, b) => a.playIndex - b.playIndex);
  return items;
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
          encore: false,
          songId: pSong,
        };
        if (!isSubstitution) {
          itemObj.kind = "request";
        }
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

  for (const { file, unit } of units) {
    // 保護已經手動調整好的巡演，絕不動 one-man-tour-2026 及 asia-tour-2026
    if (["one-man-tour-2026", "asia-tour-2026"].includes(unit.id)) continue;

    for (const s of unit.shows) {
      if (!s.sourceUrls || !s.sourceUrls[0]) continue;

      const url = s.sourceUrls[0];

      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        if (!res.ok) continue;
        const html = await res.text();

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
            `[DIFF MATCH] ${s.id} (${s.date} ${s.city}):`,
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