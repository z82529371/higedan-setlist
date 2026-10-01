import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanTitleKey,
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
  .map((f) => ({
    file: path.join("tours", f),
    dir: toursDir,
    unit: JSON.parse(fs.readFileSync(path.resolve(toursDir, f), "utf-8")),
  }));

const eventFiles = fs.existsSync(eventsDir)
  ? fs
      .readdirSync(eventsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({
        file: path.join("events", f),
        dir: eventsDir,
        unit: JSON.parse(fs.readFileSync(path.resolve(eventsDir, f), "utf-8")),
      }))
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

  const targetIds = process.argv.slice(2).filter((arg) => /^\d+$/.test(arg));
  const processedIds = new Set();

  for (const { file, unit } of units) {
    const isTour = unit.shows && unit.shows.length > 1;
    const fetchedPageSongsMap = new Map();

    for (const s of unit.shows) {
      if (targetIds.length > 0 && !targetIds.includes(s.id)) continue;
      processedIds.add(s.id);
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

        // TV拼盤/音樂祭拼盤頁含全出演者曲目：只收髭男段落
        const higedanOnly =
          unit.type === "TV拼盤" || unit.type === "音樂祭";
        const pageSongs = extractSongsFromHtml(html, { higedanOnly });
        fetchedPageSongsMap.set(s.id, pageSongs);
      } catch (err) {
        console.error(`Error verifying ${url}:`, err);
      }
    }

    // Auto-generate consensus templateSetlist if this is a Tour unit
    if (isTour && fetchedPageSongsMap.size > 0) {
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

    fs.writeFileSync(
      path.resolve(root, "data", file),
      JSON.stringify(unit, null, 2) + "\n",
      "utf-8"
    );
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
      if (
        /紅白|歌合戦|CDTV|Mステ|ミュージックステーション|FNS歌謡祭|音楽の日|テレ東音楽祭|うたコン/i.test(
          actualTitle
        )
      ) {
        detectedType = "TV拼盤";
      } else if (/fes|festival|フェス/i.test(actualTitle)) {
        detectedType = "音樂祭";
      } else if (/vs|對バン|対バン/i.test(actualTitle)) {
        detectedType = "對バン";
      }
      const pageSongs = extractSongsFromHtml(html, {
        higedanOnly: detectedType === "TV拼盤" || detectedType === "音樂祭",
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
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        : "";

      if (!slug || slug.length < 2) {
        slug = `unofficial-${year}`;
      } else if (!slug.includes(year)) {
        slug = `${slug}-${year}`;
      }

      const eventFile = path.resolve(eventsDir, `${slug}.json`);
      let eventUnit;
      if (fs.existsSync(eventFile)) {
        eventUnit = JSON.parse(fs.readFileSync(eventFile, "utf-8"));
        eventUnit.title = actualTitle;
      } else {
        eventUnit = {
          id: slug,
          title: actualTitle,
          type: detectedType,
          shows: [],
        };
      }

      const setlist = pageSongs.map((s, idx) => {
        const mappedId = livefansIdToId[s.livefansId] ?? titleToId[s.title];
        const item = {
          order: idx + 1,
          encore: !!s.isEncore,
        };

        if (mappedId) {
          item.songId = mappedId;
        } else {
          item.title = s.title;
        }

        if (s.subtitle) {
          if (
            s.subtitle.includes("リハ") ||
            s.subtitle.includes("Soundcheck")
          ) {
            item.note = `リハ：${s.subtitle.replace(/^リハ[：:]?\s*/, "")}`;
          } else {
            item.note = s.subtitle;
          }
        }
        if (s.kind) item.kind = s.kind;
        if (s.type) item.type = s.type;
        return item;
      });

      const showTitle = meta.eventTitle
        ? `${meta.eventTitle} ${cityName}`
        : `${eventUnit.title} ${cityName}`;

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
  `);
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  verifyAndRecomputeShows();
