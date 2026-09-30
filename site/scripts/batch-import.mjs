import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function unescapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const cleanTitleKey = (t) =>
  t
    ? unescapeHtml(t)
        .normalize("NFC")
        .replace(/[\u200B-\u200D\u200E\u200F\u202A-\u202E\uFEFF]/g, "")
        .trim()
        .toLowerCase()
    : "";

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

// MC/OPENING/SE markers, tolerant of decorative wrappers like ～MC1～.
function isIgnoredCmtText(t) {
  if (!t) return true;
  const up = t.toUpperCase().trim();
  if (up === "OPENING" || up === "SE:") return true;
  const core = up
    .replace(/^[～〜~\-_・\s「『【〈《〔［\[\(]+/g, "")
    .replace(/[～〜~\-_・\s」』】〉》〕］\]\)]+$/g, "");
  return /^MC[\s\-_]*\d*$/.test(core);
}

function extractSongsFromHtml(html, opts = {}) {
  const { higedanOnly = false } = opts;
  const tdRegex =
    /<td[^>]*class="([^"]*(?:pc)?sl(?:\d+|medley)[^"]*)"[^>]*>([\s\S]*?)<\/td>/g;
  const items = [];

  for (const match of html.matchAll(tdRegex)) {
    const tdClass = match[1];
    const cellHtml = match[2];
    const songMatch = cellHtml.match(
      /<div class="ttl"><a[^>]*href="(?:https:\/\/www\.livefans\.jp)?\/songs\/(\d+)"[^>]*>([\s\S]*?)<\/a>/
    );
    // TV拼盤/音樂祭拼盤：只收髭男段落。他團歌曲格與無藝人節目過場全丟。
    if (higedanOnly) {
      if (!songMatch) continue;
      const artistSpan = cellHtml.match(/<span>([\s\S]*?)<\/span>/);
      const artist = artistSpan
        ? artistSpan[1].replace(/<[^>]+>/g, "").trim()
        : "";
      if (!artist.includes("髭男")) continue;
    }
    const songTitleClean = unescapeHtml(
      songMatch ? songMatch[2].replace(/<[^>]+>/g, "").trim() : ""
    );

    const medleyMatch = cellHtml.match(
      /<p class="medley"><b>([\s\S]*?)<\/b><\/p>/
    );
    const medleyText = unescapeHtml(
      medleyMatch ? medleyMatch[1].replace(/<[^>]+>/g, "").trim() : ""
    );

    const subtitleMatch = cellHtml.match(
      /<p class="(?:subtitle|memo)">([\s\S]*?)<\/p>/
    );
    const rawSubtitle = unescapeHtml(
      subtitleMatch ? subtitleMatch[1].replace(/<[^>]+>/g, "").trim() : ""
    );
    const subtitleText = medleyText
      ? rawSubtitle
        ? `[${medleyText}] ${rawSubtitle}`
        : `[${medleyText}]`
      : rawSubtitle;

    const playBtnMatch =
      cellHtml.match(/id="idx-(\d+)"/) ||
      cellHtml.match(/showBottomMusicPlayer\((\d+)/);
    const playIndex = playBtnMatch ? parseInt(playBtnMatch[1], 10) : null;

    const isEncore =
      cellHtml.includes("sec-encore") ||
      cellHtml.includes("アンコール") ||
      /class="[^"]*en\d+[^"]*"/i.test(cellHtml);

    // Structural encore divider: only these propagate to all later items in
    // play order. A passing mention of アンコール in a memo flags just that song.
    const encoreDivider =
      /<strong>\s*アンコール/.test(cellHtml) ||
      cellHtml.includes("sec-encore") ||
      /en\d+/i.test(tdClass);

    const kind = [];
    const isOtherMemberSolo =
      subtitleText.includes("楢崎") ||
      subtitleText.includes("小笹") ||
      subtitleText.includes("松浦");
    if (
      (subtitleText.includes("弾き語り") || subtitleText.includes("ソロ")) &&
      !isOtherMemberSolo
    ) {
      kind.push("satoshi-solo");
    }
    if (subtitleText.includes("新曲")) {
      kind.push("premiere");
    }
    if (
      subtitleText.includes("リクエスト") ||
      subtitleText.toLowerCase().includes("request")
    ) {
      kind.push("request");
    }

    const isRehearsal =
      subtitleText.includes("リハ") ||
      subtitleText.includes("Soundcheck") ||
      subtitleText.includes("彩排");

    const ttlIndex = songMatch ? cellHtml.indexOf('<div class="ttl') : -1;
    // One cell can hold multiple cmt divs (e.g. 3x リハ before one song): collect all.
    const cmtList = [
      ...cellHtml.matchAll(/<div class="cmt[^"]*">([\s\S]*?)<\/div>/g),
    ]
      .map((m) => ({
        text: unescapeHtml(m[1].replace(/<[^>]+>/g, "").trim()),
        before: ttlIndex !== -1 && m.index < ttlIndex,
      }))
      .filter((c) => !isIgnoredCmtText(c.text));

    for (const c of cmtList.filter((c) => c.before)) {
      items.push({
        domIndex: items.length,
        playIndex: null,
        title: c.text,
        subtitle: c.text,
        type: "interlude",
        isCmt: true,
        cmtBefore: true,
        isEncore,
        encoreDivider,
      });
    }

    if (songMatch) {
      items.push({
        domIndex: items.length,
        playIndex,
        livefansId: songMatch[1],
        title: songTitleClean,
        subtitle: subtitleText,
        kind: kind.length ? kind : undefined,
        isEncore,
        encoreDivider,
      });
    }

    for (const c of cmtList.filter((c) => !c.before)) {
      items.push({
        domIndex: items.length,
        playIndex: null,
        title: c.text,
        subtitle: c.text,
        type: "interlude",
        isCmt: true,
        cmtBefore: false,
        isEncore,
        encoreDivider,
      });
    }
    if (!songMatch && cmtList.length === 0 && subtitleText) {
      // Memo-only cell: still skip MC markers (e.g. a lone ～MC～ memo).
      if (!medleyText && isIgnoredCmtText(rawSubtitle)) continue;
      items.push({
        domIndex: items.length,
        playIndex,
        title: subtitleText,
        subtitle: subtitleText,
        type: isRehearsal ? "interlude" : "interlude",
        isEncore,
        encoreDivider,
      });
    }
  }

  // Calculate precise sequence position using playIndex (id="idx-X") with DOM relative offset
  items.forEach((it) => {
    if (it.playIndex !== null) {
      it.sortKey = (it.playIndex + 1) * 100;
    } else {
      let prevSong = null;
      let nextSong = null;
      for (let i = it.domIndex - 1; i >= 0; i--) {
        if (items[i].playIndex !== null) {
          prevSong = items[i];
          break;
        }
      }
      for (let i = it.domIndex + 1; i < items.length; i++) {
        if (items[i].playIndex !== null) {
          nextSong = items[i];
          break;
        }
      }

      if (it.cmtBefore && nextSong) {
        it.sortKey = (nextSong.playIndex + 1) * 100 - 1;
      } else if (prevSong) {
        it.sortKey = (prevSong.playIndex + 1) * 100 + 1;
      } else if (nextSong) {
        it.sortKey = (nextSong.playIndex + 1) * 100 - 1;
      } else {
        it.sortKey = (it.domIndex + 1) * 100;
      }
    }
  });

  items.sort((a, b) => a.sortKey - b.sortKey || a.domIndex - b.domIndex);

  // Encore divider semantics: once a structural divider appears, everything
  // after it in play order is encore (covers songs whose own cell has no marker).
  let inEncore = false;
  for (const it of items) {
    if (it.encoreDivider) inEncore = true;
    if (inEncore) it.isEncore = true;
    delete it.encoreDivider;
  }

  return items;
}

function extractShowMetadataFromHtml(html) {
  // Extract address tag: <address><a href="/venues/1021" >＠リンクステーションホール青森 (青森県)</a></address>
  const addressMatch = html.match(
    /<address>\s*<a[^>]*>\s*＠\s*([^\(]+)\s*\(([^\)]+)\)/i
  );
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

  // Extract event title from h4.liveName2, h1.eventTitle, or meta title (e.g. TOOY#1)
  let eventTitle = "";
  const liveNameMatch =
    html.match(
      /<h4[^>]*class="liveName2"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/h4>/i
    ) ||
    html.match(/<h1[^>]*class="[^"]*eventTitle[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  if (liveNameMatch) {
    eventTitle = liveNameMatch[1].replace(/<[^>]+>/g, "").trim();
  }

  if (!eventTitle) {
    const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (pageTitleMatch) {
      let t = pageTitleMatch[1].split("|")[0].split("-")[0].trim();
      if (t.includes("Official髭男dism")) {
        t = pageTitleMatch[1]
          .split("|")[0]
          .replace(/^Official髭男dism\s*[-–—]?\s*/i, "")
          .trim();
      }
      if (!t.startsWith("＠")) {
        eventTitle = t;
      }
    }
  }

  return { rawVenue, rawPref, livefansDate, opensAt, eventTitle };
}

// 47-prefecture table: [city, region, prefecture] (Traditional Chinese).
const PREF_TABLE = {
  北海道: ["札幌", "北海道", "北海道"],
  青森: ["青森", "東北", "青森縣"],
  岩手: ["盛岡", "東北", "岩手縣"],
  宮城: ["仙台", "東北", "宮城縣"],
  秋田: ["秋田", "東北", "秋田縣"],
  山形: ["山形", "東北", "山形縣"],
  福島: ["福島", "東北", "福島縣"],
  茨城: ["水戶", "關東", "茨城縣"],
  栃木: ["宇都宮", "關東", "栃木縣"],
  群馬: ["前橋", "關東", "群馬縣"],
  埼玉: ["埼玉", "關東", "埼玉縣"],
  千葉: ["千葉", "關東", "千葉縣"],
  東京: ["東京", "關東", "東京都"],
  神奈川: ["橫濱", "關東", "神奈川縣"],
  新潟: ["新潟", "中部", "新潟縣"],
  富山: ["富山", "中部", "富山縣"],
  石川: ["金澤", "中部", "石川縣"],
  福井: ["福井", "中部", "福井縣"],
  山梨: ["甲府", "中部", "山梨縣"],
  長野: ["長野", "中部", "長野縣"],
  岐阜: ["岐阜", "中部", "岐阜縣"],
  靜岡: ["靜岡", "中部", "靜岡縣"],
  愛知: ["名古屋", "中部", "愛知縣"],
  三重: ["津", "中部", "三重縣"],
  滋賀: ["大津", "關西", "滋賀縣"],
  京都: ["京都", "關西", "京都府"],
  大阪: ["大阪", "關西", "大阪府"],
  兵庫: ["神戶", "關西", "兵庫縣"],
  奈良: ["奈良", "關西", "奈良縣"],
  和歌山: ["和歌山", "關西", "和歌山縣"],
  鳥取: ["鳥取", "中國", "鳥取縣"],
  島根: ["松江", "中國", "島根縣"],
  岡山: ["岡山", "中國", "岡山縣"],
  廣島: ["廣島", "中國", "廣島縣"],
  山口: ["山口", "中國", "山口縣"],
  德島: ["德島", "四國", "德島縣"],
  香川: ["高松", "四國", "香川縣"],
  愛媛: ["松山", "四國", "愛媛縣"],
  高知: ["高知", "四國", "高知縣"],
  福岡: ["福岡", "九州", "福岡縣"],
  佐賀: ["佐賀", "九州", "佐賀縣"],
  長崎: ["長崎", "九州", "長崎縣"],
  熊本: ["熊本", "九州", "熊本縣"],
  大分: ["大分", "九州", "大分縣"],
  宮崎: ["宮崎", "九州", "宮崎縣"],
  鹿兒島: ["鹿兒島", "九州", "鹿兒島縣"],
  沖繩: ["那霸", "九州", "沖繩縣"],
};

// Shinjitai (JP) -> Traditional (TW) for prefecture lookup.
const SHINJITAI_FIX = {
  徳: "德",
  広: "廣",
  縄: "繩",
  浜: "濱",
  斉: "齊",
  竜: "龍",
  栄: "榮",
  渋: "澀",
};
function prefToCityAndRegion(pref) {
  if (!pref) return { city: "東京", region: "關東", prefecture: "" };
  const raw = pref.startsWith("北海道") ? "北海道" : pref.replace(/[都府県縣]$/, "");
  const key = [...raw].map((ch) => SHINJITAI_FIX[ch] ?? ch).join("");
  const hit = PREF_TABLE[key];
  if (hit) return { city: hit[0], region: hit[1], prefecture: hit[2] };
  return { city: pref.replace(/(府|縣|県)$/, ""), region: "日本", prefecture: pref };
}

// Prefer a city embedded in the raw venue name (e.g. 松江市総合体育館 -> 松江).
function cityFromVenueName(rawVenue, fallback) {
  const m = (rawVenue || "").match(/^\s*(.+?[市區])/);
  if (m) return m[1].replace(/[市區]$/, "");
  return fallback;
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
    [/総合/g, "綜合"],
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

function computeDiff(pageSongs, templateSetlist) {
  const templateSongs = templateSetlist
    .filter((i) => i.songId || i.title)
    .map((i) => ({
      order: i.order,
      songId: i.songId ?? i.title,
      encore: !!i.encore,
      kind: i.kind ?? [],
      note: i.note ?? "",
    }));

  // Residual note: strip kind-source keywords; only remainder counts as version difference.
  const residualNote = (note) =>
    (note ?? "")
      .replace(/弾き語り|ソロ|新曲|リクエスト|request|リハ|Soundcheck|彩排/gi, "")
      .replace(/[\s\u3000。、，・:：;；『』「」\(\)\[\]—–\-~〜～!！?？]+/g, "")
      .trim();
  const normKind = (k) => [...(k ?? [])].sort().join(",");

  const templateSongIds = templateSongs.map((i) => i.songId);
  const encoreStartOrder = templateSongs.find((t) => t.encore)?.order ?? 18;

  const pageSongIds = pageSongs.map(
    (item) =>
      livefansIdToId[item.livefansId] ??
      titleToId[cleanTitleKey(item.title)] ??
      item.title
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
      const t = templateSongs[tIdx];
      const kindSame = normKind(t.kind) === normKind(pMeta?.kind ?? []);
      const noteSame =
        residualNote(t.note) === residualNote(pMeta?.subtitle ?? "");
      if (kindSame && noteSame) {
        tIdx++;
      } else {
        // Same song but version difference (e.g. アレンジ): skip + re-insert with note.
        const anchorOrder = tIdx > 0 ? templateSongs[tIdx - 1].order : 0;
        if (!skip.includes(t.order)) skip.push(t.order);
        const itemObj = {
          encore: pMeta?.isEncore || anchorOrder >= encoreStartOrder - 1,
          songId: pSong,
        };
        if (pMeta?.subtitle) itemObj.note = unescapeHtml(pMeta.subtitle);
        if (pMeta?.kind) itemObj.kind = pMeta.kind;
        if (pMeta?.type) itemObj.type = pMeta.type;
        insert.push({ after: anchorOrder, item: itemObj });
        tIdx++;
      }
    } else {
      const nextTMatch = templateSongs.findIndex(
        (t, idx) => idx >= tIdx && t.songId === pSong
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
        const isKnownSong = validSongIds.has(pSong);
        const itemObj = {
          encore: pMeta?.isEncore || anchorOrder >= encoreStartOrder - 1,
        };
        if (pMeta?.isCmt || pMeta?.type === "interlude") {
          itemObj.type = "interlude";
          itemObj.note = unescapeHtml(pMeta?.subtitle || pSong);
        } else if (!isKnownSong) {
          // Cover/special song with a song link but no songs.json entry:
          // formal track with title (unlinked), never enters the template.
          itemObj.title = pMeta?.title || pSong;
          if (pMeta?.subtitle) itemObj.note = unescapeHtml(pMeta.subtitle);
        } else {
          itemObj.songId = pSong;
          if (pMeta?.subtitle) {
            itemObj.note = unescapeHtml(pMeta.subtitle);
          }
        }
        if (pMeta?.kind) itemObj.kind = pMeta.kind;
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

function buildConsensusTemplate(allShowSongs) {
  const validShows = allShowSongs.filter((s) => s && s.length > 0);
  if (validShows.length === 0) return [];

  const threshold = Math.ceil(validShows.length * 0.5);
  const songCounts = {};
  const songEncoreCounts = {};
  const songKindCounts = {};
  const songPositions = {};

  for (const show of validShows) {
    show.forEach((item, pos) => {
      if (item.type === "interlude" || item.isCmt) return;

      const mappedId = item.livefansId
        ? livefansIdToId[item.livefansId]
        : titleToId[cleanTitleKey(item.title)];

      if (!mappedId) return;

      const key = `id:${mappedId}`;

      songCounts[key] = (songCounts[key] || 0) + 1;
      if (item.isEncore) {
        songEncoreCounts[key] = (songEncoreCounts[key] || 0) + 1;
      }
      if (item.kind) {
        if (!songKindCounts[key]) songKindCounts[key] = {};
        for (const k of item.kind) {
          songKindCounts[key][k] = (songKindCounts[key][k] || 0) + 1;
        }
      }
      if (!songPositions[key]) songPositions[key] = [];
      songPositions[key].push(pos);

      if (!songPositions[key].sampleItem) {
        songPositions[key].sampleItem = { ...item, mappedId };
      }
    });
  }

  // Filter songs that appear in >= 50% of valid shows
  const consensusKeys = Object.keys(songCounts).filter(
    (key) => songCounts[key] >= threshold
  );

  // Compute average relative position for ordering
  const scored = consensusKeys.map((key) => {
    const positions = songPositions[key];
    const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length;
    const isEncore =
      (songEncoreCounts[key] || 0) >= Math.ceil(positions.length * 0.5);
    const sample = songPositions[key].sampleItem;

    const consensusKind = [];
    if (songKindCounts[key]) {
      for (const [k, count] of Object.entries(songKindCounts[key])) {
        if (count >= threshold) consensusKind.push(k);
      }
    }

    return {
      key,
      avgPos,
      isEncore,
      mappedId: sample.mappedId,
      title: sample.title,
      kind: consensusKind.length ? consensusKind : undefined,
    };
  });

  // Primary sort by isEncore, secondary sort by avgPos
  scored.sort((a, b) => {
    if (a.isEncore !== b.isEncore) return a.isEncore ? 1 : -1;
    return a.avgPos - b.avgPos;
  });

  // Construct templateSetlist array
  return scored.map((item, idx) => {
    const res = {
      order: idx + 1,
      encore: item.isEncore,
      songId: item.mappedId,
    };
    if (item.kind) res.kind = item.kind;
    return res;
  });
}

function formatEventNote(subtitle) {
  if (subtitle.includes("リハ") || subtitle.includes("Soundcheck")) {
    return `リハ：${subtitle.replace(/^リハ[：:]?\s*/, "")}`;
  }
  return subtitle;
}

function mapPageSongsToEventSetlist(pageSongs) {
  const isMapped = pageSongs.map(
    (sp) => !!(livefansIdToId[sp.livefansId] ?? titleToId[cleanTitleKey(sp.title)])
  );
  const isGap = pageSongs.map((sp) => !!(sp.isCmt || sp.type === "interlude"));
  // Song-link items without a songs.json entry (covers) are formal tracks:
  // always keep them, never drop.
  const isCover = pageSongs.map((sp, i) => !!sp.livefansId && !sp.isCmt && !isMapped[i]);
  // Keep mapped songs and covers, plus any contiguous interlude run touching
  // a kept song (single-cmt adjacency check drops the head of multi-cmt runs).
  const keep = isMapped.map((m, i) => m || isCover[i]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < pageSongs.length; i++) {
      if (
        !keep[i] &&
        isGap[i] &&
        ((i > 0 && keep[i - 1]) || (i < pageSongs.length - 1 && keep[i + 1]))
      ) {
        keep[i] = true;
        changed = true;
      }
    }
  }

  const filteredSongs = pageSongs.filter((_, idx) => keep[idx]);

  return filteredSongs.map((sp, idx) => {
    const mappedId =
      livefansIdToId[sp.livefansId] ?? titleToId[cleanTitleKey(sp.title)];
    const item = {
      order: idx + 1,
      encore: !!sp.isEncore,
    };
    if (mappedId) {
      item.songId = mappedId;
    } else if (sp.livefansId && !sp.isCmt) {
      item.title = sp.title;
    } else {
      item.type = "interlude";
      item.note = sp.subtitle ? formatEventNote(sp.subtitle) : sp.title;
    }
    if (sp.subtitle && (mappedId || item.title)) {
      item.note = formatEventNote(sp.subtitle);
    }
    if (sp.kind) item.kind = sp.kind;
    if (sp.type && mappedId) item.type = sp.type;
    return item;
  });
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
          if (venueTranslationMap[meta.rawVenue]) {
            const trans = venueTranslationMap[meta.rawVenue];
            s.venue = trans.venue;
            s.city = trans.city || s.city;
            s.region = trans.region || s.region;
            s.prefecture = trans.prefecture || s.prefecture;
          } else {
            const autoTranslated = await autoTranslateVenue(meta.rawVenue);
            const prefMap = prefToCityAndRegion(meta.rawPref);
            venueTranslationMap[meta.rawVenue] = {
              venue: autoTranslated,
              city:
                cityFromVenueName(meta.rawVenue, prefMap.city) || s.city || "",
              region: prefMap.region || s.region || "",
              prefecture: prefMap.prefecture || s.prefecture || "",
            };
            fs.writeFileSync(
              venuesPath,
              JSON.stringify(venueTranslationMap, null, 2) + "\n",
              "utf-8"
            );
            console.log(
              `[AUTO TRANSLATED VENUE] Registered "${meta.rawVenue}" -> "${autoTranslated}" in data/venues.json`
            );
            s.venue = autoTranslated;
            const fresh = venueTranslationMap[meta.rawVenue];
            s.city = fresh.city || s.city;
            s.region = fresh.region || s.region;
            s.prefecture = fresh.prefecture || s.prefecture;
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
      const consensusTpl = buildConsensusTemplate(allPageSongs);
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

      if (unit.templateSetlist) {
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
          s.setlist = mapPageSongsToEventSetlist(pageSongs);
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
        if (venueTranslationMap[meta.rawVenue]) {
          const trans = venueTranslationMap[meta.rawVenue];
          venueName = trans.venue;
          cityName = trans.city || cityName;
          regionName = trans.region || regionName;
          prefName = trans.prefecture || prefName;
        } else {
          const autoTrans = await autoTranslateVenue(meta.rawVenue);
          venueTranslationMap[meta.rawVenue] = {
            venue: autoTrans,
            city: cityName,
            region: regionName,
            prefecture: prefName,
          };
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

verifyAndRecomputeShows();
