export function unescapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export const cleanTitleKey = (t) =>
  t
    ? unescapeHtml(t)
        .normalize("NFC")
        .replace(/[\u200B-\u200D\u200E\u200F\u202A-\u202E\uFEFF]/g, "")
        .trim()
        .toLowerCase()
    : "";

// Member-solo signal (non-satoshi performers): content-based, independent of
// whether the cell carries a song link. Covers 﨑 (U+FA11) variant spelling.
export function isMemberSoloText(t) {
  if (!t) return false;
  return /楢[崎﨑]|小笹|松浦|大輔/.test(t);
}

// DOM order vs player-index order agreement check. Indexed items should
// appear in DOM in playIndex order; inversions mean the page was edited
// out of order. Formal songs with null playIndex (e.g. Pretender on 1981872)
// mean player-button absence and DOM-interpolated positions are guesses.
// Import-time tripwire only, never reorders anything.
export function domScrambleInfo(items) {
  const byDom = [...items].sort((a, b) => a.domIndex - b.domIndex);

  // 1. Inversions among indexed items
  const indexed = byDom.filter((s) => s.playIndex != null);
  let inversions = 0;
  let sample = "";
  for (let i = 0; i < indexed.length; i++) {
    for (let j = i + 1; j < indexed.length; j++) {
      if (indexed[i].playIndex > indexed[j].playIndex) {
        inversions++;
        if (!sample) {
          sample = `${indexed[i].title}(idx:${indexed[i].playIndex}) before ${indexed[j].title}(idx:${indexed[j].playIndex})`;
        }
      }
    }
  }

  // 2. Formal songs missing player index (null-idx)
  const missingIdxSongs = byDom.filter(
    (s) => s.playIndex == null && !s.isCmt && s.type !== "interlude"
  );
  const missingCount = missingIdxSongs.length;
  let missingSample = "";
  if (missingCount > 0) {
    missingSample = missingIdxSongs.map((s) => s.title).slice(0, 3).join(", ");
    if (missingCount > 3) missingSample += ` +${missingCount - 3} more`;
  }

  const isScrambled = inversions > 0 || missingCount > 0;
  let description = "";
  if (inversions > 0 && missingCount > 0) {
    description = `${inversions} inversions (${sample}) & ${missingCount} songs missing idx (${missingSample})`;
  } else if (inversions > 0) {
    description = `${inversions} inversions (${sample})`;
  } else if (missingCount > 0) {
    description = `${missingCount} songs missing idx (${missingSample})`;
  }

  return {
    isScrambled,
    inversions,
    missingCount,
    description,
    sample: sample || missingSample,
  };
}

// MC/OPENING/SE markers, tolerant of decorative wrappers like ～MC1～.
// Bare markers and numbered variants (MC/MC1/MC 2/MC-3) are dropped;
// MCs with content (birthday calls, trouble notes, 弾き語りMC, 楽器分工)
// are kept as interludes. Hand-verified exceptions use `locked`.
export function isIgnoredCmtText(t) {
  if (!t) return true;
  const up = t.toUpperCase().trim();
  if (up === "OPENING" || up === "SE:") return true;
  const core = up
    .replace(/^[～〜~\-_・\s「『【〈《〔［\[\(]+/g, "")
    .replace(/[～〜~\-_・\s」』】〉》〕］\]\)]+$/g, "");
  return /^MC[\s\-_]*\d*$/.test(core);
}

export function extractSongsFromHtml(html, opts = {}) {
  const { higedanOnly = false } = opts;
  // TV多出演者拼盤判定：只有在頁面確實列出多位藝人時才執行過濾；
  // 若為髭男專屬電視特輯（如 CDTV 4小時SP 髭男フェス 1263650），整場均為髭男曲目，不予濾除。
  const pageArtists = [...html.matchAll(/\/artists\/(\d+)[^>]*>([^<]+)/g)].map((m) =>
    m[2].trim()
  );
  const isMultiArtistPage = new Set(pageArtists).size > 1;
  const shouldFilterHigedan = higedanOnly && isMultiArtistPage;

  const tdRegex =
    /<td[^>]*class="([^"]*(?:pc)?sl(?:\d+|medley)[^"]*)"[^>]*>([\s\S]*?)<\/td>/g;
  const items = [];
  let currentMedleyText = "";

  for (const match of html.matchAll(tdRegex)) {
    const tdClass = match[1];
    const cellHtml = match[2];
    const songMatch = cellHtml.match(
      /<div class="ttl"><a[^>]*href="(?:https:\/\/www\.livefans\.jp)?\/songs\/(\d+)"[^>]*>([\s\S]*?)<\/a>/
    );
    // TV多出演者拼盤：只收髭男段落。他團歌曲格與無藝人節目過場全丟。
    if (shouldFilterHigedan) {
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
    if (medleyMatch) {
      currentMedleyText = unescapeHtml(
        medleyMatch[1].replace(/<[^>]+>/g, "").trim()
      );
    } else if (!/medley/i.test(tdClass)) {
      currentMedleyText = "";
    }

    const subtitleMatch = cellHtml.match(
      /<p class="(?:subtitle|memo)">([\s\S]*?)<\/p>/
    );
    const rawSubtitle = unescapeHtml(
      subtitleMatch ? subtitleMatch[1].replace(/<[^>]+>/g, "").trim() : ""
    );
    const subtitleText = currentMedleyText
      ? rawSubtitle
        ? `[${currentMedleyText}] ${rawSubtitle}`
        : `[${currentMedleyText}]`
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
    const isOtherMemberSolo = isMemberSoloText(subtitleText);
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

export function extractShowMetadataFromHtml(html) {
  // Extract address tag: <address><a href="/venues/1021" >＠リンクステーションホール青森 (青森県)</a></address>
  // Or without link: <address>＠B.9 at ... (熊本県)</address>
  const addressMatch = html.match(
    /<address>\s*(?:<a[^>]*>)?\s*＠\s*([^(\n\r<]+)\s*\(([^)\n\r<]+)\)/i
  );
  let rawVenue = "";
  let rawPref = "";

  if (addressMatch) {
    rawVenue = addressMatch[1].trim();
    rawPref = addressMatch[2].trim();
  }

  // Fallback to meta title (guarding against (YYYY.MM.DD) date)
  if (!rawVenue) {
    const metaTitleMatch = html.match(/<meta name="title" content="([^"]+)"/);
    if (metaTitleMatch) {
      const m = metaTitleMatch[1].match(/＠\s*([^\(]+)\s*\(([^\)]+)\)/);
      if (m && !/^\d{4}\.\d{2}\.\d{2}$/.test(m[2].trim())) {
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
    eventTitle = unescapeHtml(
      liveNameMatch[1]
        .replace(/<[^>]+>/g, "")
        .split("＠")[0]
        .trim()
    );
  }

  if (!eventTitle) {
    const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (pageTitleMatch) {
      let t = pageTitleMatch[1].split("|")[0].split("＠")[0].trim();
      if (t) {
        eventTitle = unescapeHtml(t);
      }
    }
  }

  return { rawVenue, rawPref, livefansDate, opensAt, eventTitle };
}
