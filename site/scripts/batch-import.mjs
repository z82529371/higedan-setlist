import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanTitleKey,
  domScrambleInfo,
  extractSongsFromHtml,
  extractShowMetadataFromHtml,
} from "./lib/parse.js";
import {
  computeDiff,
  buildConsensusTemplate,
  mapPageSongsToEventSetlist,
} from "./lib/consensus.js";
import {
  prefToCityAndRegion,
  cityFromVenueName,
  applyVenueTermRules,
  lookupVenue,
  applyVenueRecord,
  assembleVenueRecord,
} from "./lib/venue.js";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const toursDir = path.resolve(root, "data", "tours");
const songsPath = path.resolve(root, "data", "songs.json");

const songsData = JSON.parse(fs.readFileSync(songsPath, "utf-8"));

const eventsDir = path.resolve(root, "data", "events");

const tourFiles = fs
  .readdirSync(toursDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const full = path.resolve(toursDir, f);
    return {
      file: path.join("tours", f),
      dir: toursDir,
      unit: JSON.parse(fs.readFileSync(full, "utf-8")),
      raw: fs.readFileSync(full, "utf-8").replace(/\r\n/g, "\n"),
    };
  });

const eventFiles = fs.existsSync(eventsDir)
  ? fs
      .readdirSync(eventsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const full = path.resolve(eventsDir, f);
        return {
          file: path.join("events", f),
          dir: eventsDir,
          unit: JSON.parse(fs.readFileSync(full, "utf-8")),
          raw: fs.readFileSync(full, "utf-8").replace(/\r\n/g, "\n"),
        };
      })
  : [];

const units = [...tourFiles, ...eventFiles];

const validSongIds = new Set(songsData.songs.map((s) => s.id));



const livefansIdToId = Object.fromEntries(
  songsData.songs
    .filter((s) => s.livefansId)
    .map((s) => [String(s.livefansId), s.id])
);
const titleToId = {};
for (const s of songsData.songs) {
  titleToId[cleanTitleKey(s.title)] = s.id;
  if (s.titleJa) titleToId[cleanTitleKey(s.titleJa)] = s.id;
  if (s.titleEn) titleToId[cleanTitleKey(s.titleEn)] = s.id;
}
titleToId["b-side blues"] = "b-side-blues";
titleToId["soul soup"] = "soulsoup";
titleToId["soulsoup"] = "soulsoup";
titleToId["sameblue"] = "same-blue";
titleToId["same blue"] = "same-blue";
titleToId["trailer"] = "trailer";
titleToId["traiier"] = "trailer";
titleToId["夏模様の貓"] = "natsu-moyou-no-neko";


const venuesPath = path.resolve(root, "data", "venues.json");
const venueTranslationMap = JSON.parse(fs.readFileSync(venuesPath, "utf-8"));

async function autoTranslateVenue(rawVenue) {
  let translated = rawVenue;

  // 1. Rule-based replacements live in lib/venue.js (pure).
  const ruleResult = applyVenueTermRules(rawVenue);

  // 2. If片假名 remains, fetch translation from MyMemory API
  if (/[\u30A0-\u30FF]/.test(ruleResult)) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        rawVenue
      )}&langpair=ja|zh-TW`;
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

async function verifyAndRecomputeShows() {
  let checkedCount = 0;
  let exactCount = 0;
  let diffCount = 0;
  let noSetlistCount = 0;
  let updatedFilesCount = 0;
  let unchangedFilesCount = 0;
  const scrambledShows = [];

  const targetIds = process.argv
    .slice(2)
    .map((arg) => {
      const m = arg.match(/\/events\/(\d+)/);
      if (m) return m[1];
      if (/^\d+$/.test(arg)) return arg;
      return null;
    })
    .filter(Boolean);
  const processedIds = new Set();

  for (const { file, unit, raw } of units) {
    const isTour = unit.shows && unit.shows.length > 1;
    const fetchedPageSongsMap = new Map();

    for (const s of unit.shows) {
      const matchesTarget =
        targetIds.length === 0 ||
        targetIds.includes(s.id) ||
        targetIds.some((tid) =>
          (s.sourceUrls ?? []).some((u) => u.includes(tid))
        );
      if (!matchesTarget) continue;
      processedIds.add(s.id);
      for (const tid of targetIds) {
        if ((s.sourceUrls ?? []).some((u) => u.includes(tid))) {
          processedIds.add(tid);
        }
      }
      if (!s.sourceUrls || !s.sourceUrls[0]) continue;

      const url = s.sourceUrls[0];
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
        });
        if (!res.ok) continue;
        const html = await res.text();

        const meta = extractShowMetadataFromHtml(html);
        if (meta.livefansDate && s.date !== meta.livefansDate) {
          console.warn(
            `[DATE MISMATCH FIXED] ID ${s.id}: Local (${s.date}) -> LiveFans (${meta.livefansDate})`
          );
          s.date = meta.livefansDate;
        }
        if (meta.opensAt) {
          s.opensAt = meta.opensAt;
        }

        if (meta.eventTitle) {
          unit.title = meta.eventTitle;
          if (s.title) {
            s.title = meta.eventTitle;
          }
        }

        if (meta.rawVenue) {
          const venueHit = lookupVenue(meta.rawVenue, venueTranslationMap);
          if (venueHit) {
            applyVenueRecord(s, venueHit);
          } else {
            const autoTranslated = await autoTranslateVenue(meta.rawVenue);
            const prefMap = prefToCityAndRegion(meta.rawPref);
            venueTranslationMap[meta.rawVenue] = assembleVenueRecord({
              venue: autoTranslated,
              city:
                cityFromVenueName(meta.rawVenue, prefMap.city) || s.city || "",
              region: prefMap.region || s.region || "",
              prefecture: prefMap.prefecture || s.prefecture || "",
            });
            fs.writeFileSync(
              venuesPath,
              JSON.stringify(venueTranslationMap, null, 2) + "\n",
              "utf-8"
            );
            console.log(
              `[AUTO TRANSLATED VENUE] Registered "${meta.rawVenue}" -> "${autoTranslated}" in data/venues.json`
            );
            applyVenueRecord(s, venueTranslationMap[meta.rawVenue]);
          }
        }

        // TV拼盤頁含全出演者曲目：只收髭男段落
        const higedanOnly =
          unit.type === "電視演出" || unit.type === "TV拼盤";
        const pageSongs = extractSongsFromHtml(html, { higedanOnly });
        fetchedPageSongsMap.set(s.id, pageSongs);
        // Import-time tripwire: DOM order disagreeing with player-index
        // order or missing player-index on songs means null-idx positions
        // are guesses, not facts.
        const scramble = domScrambleInfo(pageSongs);
        if (scramble.isScrambled) {
          scrambledShows.push({
            id: s.id,
            url,
            isLocked: !!s.locked,
            desc: scramble.description,
          });
          const tag = s.locked ? "[SCRAMBLED DOM (LOCKED)]" : "[SCRAMBLED DOM]";
          console.warn(
            `${tag} ${s.id} ${url}: ${scramble.description}; null-idx positions are guesses — consider hand-verify + locked`
          );
        }
      } catch (err) {
        console.error(`Error verifying ${url}:`, err);
      }
    }

    // Auto-generate consensus templateSetlist if this is a Tour unit
    // and all shows were fetched (never overwrite consensus on targeted single-show runs)
    if (
      isTour &&
      (targetIds.length === 0 ||
        !unit.templateSetlist ||
        unit.templateSetlist.length === 0) &&
      fetchedPageSongsMap.size > 0
    ) {
      const allPageSongs = Array.from(fetchedPageSongsMap.values());
      const consensusTpl = buildConsensusTemplate(allPageSongs, {
        livefansIdToId,
        titleToId,
      });
      if (consensusTpl.length > 0) {
        unit.templateSetlist = consensusTpl;
        unit.templateBasis = `全自動提煉：基於 ${fetchedPageSongsMap.size} 場演出提取 $\\ge 50\\%$ 多數共識歌單`;
        console.log(
          `[CONSENSUS TEMPLATE GENERATED] ${unit.title} -> ${consensusTpl.length} songs`
        );
      }
    }

    // Apply computeDiff or setlist direct update
    for (const s of unit.shows) {
      const pageSongs = fetchedPageSongsMap.get(s.id);
      if (!pageSongs) continue;

      // Hand-verified positions: fetch still contributes to the consensus
      // template, but the stored diff/setlist is never rewritten.
      if (s.locked) {
        console.log(`[LOCKED] ${s.id}: hand-verified, diff/setlist preserved`);
        continue;
      }

      if (unit.templateSetlist) {
        const { diff, status } = computeDiff(pageSongs, unit.templateSetlist, {
          livefansIdToId,
          titleToId,
          validSongIds,
        });
        checkedCount++;
        if (status === "EXACT_TEMPLATE_MATCH") {
          exactCount++;
          s.diff = {};
        } else if (status === "DIFF_CALCULATED") {
          diffCount++;
          s.diff = diff;
          console.log(
            `[DIFF MATCH] ${s.id} (${s.date} ${s.city} @ ${s.venue}):`,
            JSON.stringify(diff)
          );
        } else {
          noSetlistCount++;
        }
      } else {
        if (pageSongs.length === 0) {
          noSetlistCount++;
          console.log(`[NO SETLIST] ${s.id} (${s.date} ${s.city}): page yielded 0 songs, setlist preserved`);
        } else {
          s.setlist = mapPageSongsToEventSetlist(pageSongs, {
            livefansIdToId,
            titleToId,
          });
          console.log(
            `[EVENT SHOW UPDATED] Updated show ${s.id} setlist in ${file}`
          );
        }
      }
    }

    const out = JSON.stringify(unit, null, 2) + "\n";
    if (out !== raw) {
      fs.writeFileSync(path.resolve(root, "data", file), out, "utf-8");
      updatedFilesCount++;
      console.log(`[UPDATED] ${file}`);
    } else {
      unchangedFilesCount++;
      console.log(`[UNCHANGED] ${file}: content identical, write skipped`);
    }
  }

  // Handle unregistered unknown show IDs
  const eventsDir = path.resolve(root, "data", "events");
  const missingTargetIds = targetIds.filter((id) => !processedIds.has(id));

  for (const eventId of missingTargetIds) {
    const url = `https://www.livefans.jp/events/${eventId}`;
    console.log(
      `[UNKNOWN EVENT AUTO-IMPORT] Fetching unknown event ID ${eventId} from ${url}...`
    );

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      if (!res.ok) {
        console.error(
          `[AUTO-IMPORT ERROR] Failed to fetch ${url}: ${res.status}`
        );
        continue;
      }
      const html = await res.text();
      const meta = extractShowMetadataFromHtml(html);

      if (!meta.livefansDate) {
        console.error(
          `[AUTO-IMPORT ERROR] Could not parse date for event ${eventId}`
        );
        continue;
      }

      // Type first: TV拼盤/音樂祭拼盤頁只收髭男段落
      const year = meta.livefansDate.slice(0, 4);
      const actualTitle = meta.eventTitle || `one-man live ${year}`;
      let detectedType = "專場";
      const isTvTitle =
        /紅白|歌合戦|CDTV|Mステ|ミュージックステーション|FNS歌謡祭|音楽の日|テレ東音楽祭|テレ東音樂祭|うたコン|MUSIC\s*DAY|ベストアーティスト|ベストヒット|Buzz\s*Rhythm|バズリズム|Venue101|SONGS/i.test(
          actualTitle
        );
      const isTvVenue =
        /テレビ|TV|日本テレビ|TBS|フジテレビ|テレビ朝日|テレビ東京|NHKスタジオ/i.test(
          meta.rawVenue || ""
        );

      if (isTvTitle || isTvVenue) {
        detectedType = "電視演出";
      } else if (/fes|festival|フェス/i.test(actualTitle)) {
        detectedType = "音樂祭";
      } else if (/vs|對バン|対バン/i.test(actualTitle)) {
        detectedType = "對バン";
      } else if (
        /online|オンライン|配信|live@/i.test(actualTitle) ||
        meta.rawVenue === "オンラインライブ"
      ) {
        detectedType = "線上直播";
      }
      const pageSongs = extractSongsFromHtml(html, {
        higedanOnly: detectedType === "電視演出" || detectedType === "TV拼盤",
      });

      // event title & type & dynamic slug (detected above for higedanOnly)
      const prefMap = prefToCityAndRegion(meta.rawPref);
      let venueName = meta.rawVenue || "未知場館";
      let cityName = cityFromVenueName(meta.rawVenue, prefMap.city);
      let regionName = prefMap.region;
      let prefName = prefMap.prefecture || meta.rawPref || "";

      if (meta.rawVenue) {
        const venueHit = lookupVenue(meta.rawVenue, venueTranslationMap);
        if (venueHit) {
          const names = {
            venue: venueName,
            city: cityName,
            region: regionName,
            prefecture: prefName,
          };
          applyVenueRecord(names, venueHit);
          venueName = names.venue;
          cityName = names.city;
          regionName = names.region;
          prefName = names.prefecture;
        } else {
          const autoTrans = await autoTranslateVenue(meta.rawVenue);
          venueTranslationMap[meta.rawVenue] = assembleVenueRecord({
            venue: autoTrans,
            city: cityName,
            region: regionName,
            prefecture: prefName,
          });
          fs.writeFileSync(
            venuesPath,
            JSON.stringify(venueTranslationMap, null, 2) + "\n",
            "utf-8"
          );
          venueName = autoTrans;
        }
      }

      // (actualTitle/detectedType computed above for higedanOnly)

      let slug = meta.eventTitle
        ? meta.eventTitle
            .replace(/^Official髭男dism[：:\s]*/i, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        : "";

      if (!slug || slug.length < 2) {
        slug = `unofficial-${year}`;
      } else if (!slug.includes(year)) {
        slug = `${slug}-${year}`;
      }

      let finalSlug = slug;
      let eventFile = path.resolve(eventsDir, `${finalSlug}.json`);
      let eventUnit;

      if (fs.existsSync(eventFile)) {
        const existing = JSON.parse(fs.readFileSync(eventFile, "utf-8"));
        const isTourTitle =
          /\btour\b/i.test(meta.eventTitle || "") ||
          /ツアー|巡演/i.test(meta.eventTitle || "");
        if (!isTourTitle && !isSameShow && existing.shows.length > 0) {
          const dateDiffs = existing.shows
            .filter((s) => s.date)
            .map((s) =>
              Math.abs(
                (new Date(s.date) - new Date(meta.livefansDate)) /
                  (1000 * 60 * 60 * 24)
              )
            );
          const minDiff = dateDiffs.length > 0 ? Math.min(...dateDiffs) : 0;
          if (minDiff > 7) {
            const mmdd = meta.livefansDate.slice(5).replace("-", "");
            finalSlug = `${slug}-${mmdd}`;
            eventFile = path.resolve(eventsDir, `${finalSlug}.json`);
          }
        }
      }

      if (fs.existsSync(eventFile)) {
        eventUnit = JSON.parse(fs.readFileSync(eventFile, "utf-8"));
        if (!eventUnit.title) eventUnit.title = actualTitle;
      } else {
        eventUnit = {
          id: finalSlug,
          title: actualTitle,
          type: detectedType,
          shows: [],
        };
      }

      const setlist = mapPageSongsToEventSetlist(pageSongs, {
        livefansIdToId,
        titleToId,
      });

      const showTitle = meta.eventTitle || eventUnit.title;

      const newShow = {
        id: String(eventId),
        date: meta.livefansDate,
        city: cityName,
        venue: venueName,
        region: regionName,
        prefecture: prefName,
        title: showTitle,
        sourceUrls: [url],
        setlist,
      };
      if (meta.opensAt) newShow.opensAt = meta.opensAt;

      const existingIdx = eventUnit.shows.findIndex(
        (s) => s.id === String(eventId)
      );
      if (existingIdx !== -1) {
        eventUnit.shows[existingIdx] = newShow;
      } else {
        eventUnit.shows.push(newShow);
      }

      eventUnit.shows.sort((a, b) => (a.date < b.date ? -1 : 1));

      fs.writeFileSync(
        eventFile,
        JSON.stringify(eventUnit, null, 2) + "\n",
        "utf-8"
      );
      console.log(
        `[UNKNOWN EVENT AUTO-IMPORTED] Saved event ${eventId} (${
          meta.livefansDate
        } @ ${venueName}) into ${path.basename(eventFile)}`
      );
    } catch (err) {
      console.error(
        `[AUTO-IMPORT ERROR] Failed to process event ${eventId}:`,
        err
      );
    }
  }

  console.log(`
Setlist Alignment Summary:
- Total checked: ${checkedCount}
- Exact template match: ${exactCount}
- Diffs calculated & applied: ${diffCount}
- No setlist posted yet on LiveFans: ${noSetlistCount}
- Files: ${updatedFilesCount} updated, ${unchangedFilesCount} unchanged
  `);

  if (scrambledShows.length > 0) {
    console.log(`=== SCRAMBLED DOM SUMMARY (${scrambledShows.length} shows) ===`);
    for (const item of scrambledShows) {
      const status = item.isLocked ? "LOCKED (OK)" : "ACTION NEEDED";
      console.log(`- [${status}] ${item.id}: ${item.desc} (${item.url})`);
    }
    console.log();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  verifyAndRecomputeShows();
