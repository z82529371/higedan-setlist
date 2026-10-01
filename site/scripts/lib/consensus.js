import { unescapeHtml, cleanTitleKey, isMemberSoloText } from "./parse.js";
import { encoreStartOrderOf, isEncorePosition } from "../../src/lib/resolve.js";

const isGapItem = (item) => !!(item.isCmt || item.type === "interlude");

const mappedSongIdOf = (item, maps) =>
  maps.livefansIdToId[item.livefansId] ??
  maps.titleToId[cleanTitleKey(item.title)] ??
  item.title;

// Template-anchored reordering for pages whose DOM order is scrambled.
// Song cells normally carry a player index (id="idx-N"); when a cell has
// none (e.g. Pretender on 1981872, link-only player button), the DOM-neighbour
// interpolation in parse.js misplaces it. Items WITH an index keep play order;
// items WITHOUT one anchor to the template by song identity, and gaps
// (cmt/過場) follow their DOM-adjacent song (ADR-0026 intent, identity-based
// so the gap moves together with its song).
function reorderPageSongsByTemplate(pageSongs, templateSongs, maps) {
  if (!pageSongs.some((s) => s.playIndex == null)) return pageSongs;

  const tplPos = new Map();
  templateSongs.forEach((t, idx) => {
    if (!tplPos.has(t.songId)) tplPos.set(t.songId, idx);
  });

  const byDom = [...pageSongs].sort((a, b) => a.domIndex - b.domIndex);
  const domSongAt = (item, dir) => {
    const i = byDom.indexOf(item);
    for (let k = i + dir; k >= 0 && k < byDom.length; k += dir) {
      if (!isGapItem(byDom[k])) return byDom[k];
    }
    return null;
  };

  // 1. Items with a player index keep exact play order.
  const placed = pageSongs
    .filter((s) => s.playIndex != null)
    .sort((a, b) => a.playIndex - b.playIndex || a.domIndex - b.domIndex);
  const inPlaced = new Set(placed);

  // 2. Index-less songs anchor to the template; extras fall back to neighbours.
  for (const s of byDom.filter((x) => x.playIndex == null && !isGapItem(x))) {
    const t = tplPos.get(mappedSongIdOf(s, maps));
    let at = -1;
    if (t !== undefined) {
      at = placed.findIndex((p) => {
        if (isGapItem(p)) return false;
        const pt = tplPos.get(mappedSongIdOf(p, maps));
        return pt !== undefined && pt > t;
      });
      if (at === -1) {
        for (let i = placed.length - 1; i >= 0; i--) {
          if (isGapItem(placed[i])) continue;
          const pt = tplPos.get(mappedSongIdOf(placed[i], maps));
          if (pt !== undefined && pt <= t) {
            at = i + 1;
            break;
          }
        }
      }
    } else {
      const prev = domSongAt(s, -1);
      if (prev && inPlaced.has(prev)) at = placed.indexOf(prev) + 1;
      else {
        const next = domSongAt(s, 1);
        if (next && inPlaced.has(next)) at = placed.indexOf(next);
      }
    }
    placed.splice(at === -1 ? placed.length : at, 0, s);
    inPlaced.add(s);
  }

  // 3. Index-less gaps follow their DOM-adjacent song.
  for (const g of byDom.filter((x) => x.playIndex == null && isGapItem(x))) {
    let at = -1;
    if (g.cmtBefore !== true) {
      const prev = domSongAt(g, -1);
      if (prev && inPlaced.has(prev)) at = placed.indexOf(prev) + 1;
    }
    if (at === -1) {
      const next = domSongAt(g, 1);
      if (next && inPlaced.has(next)) at = placed.indexOf(next);
    }
    placed.splice(at === -1 ? placed.length : at, 0, g);
    inPlaced.add(g);
  }

  return placed;
}

export function computeDiff(pageSongs, templateSetlist, maps) {
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
  const encoreStartOrder = encoreStartOrderOf(templateSongs);

  // DOM order on LiveFans pages is not always play order; re-anchor
  // index-less items to the template before aligning.
  const orderedPageSongs = reorderPageSongsByTemplate(pageSongs, templateSongs, maps);
  const pageSongIds = orderedPageSongs.map(
    (item) =>
      maps.livefansIdToId[item.livefansId] ??
      maps.titleToId[cleanTitleKey(item.title)] ??
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
  for (let pIdx = 0; pIdx < orderedPageSongs.length; pIdx++) {
    const pSong = pageSongIds[pIdx];
    const pMeta = orderedPageSongs[pIdx];
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
          encore: pMeta?.isEncore || isEncorePosition(anchorOrder, encoreStartOrder),
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
        const isKnownSong = maps.validSongIds.has(pSong);
        const itemObj = {
          encore: pMeta?.isEncore || isEncorePosition(anchorOrder, encoreStartOrder),
        };
        if (pMeta?.isCmt || pMeta?.type === "interlude") {
          itemObj.type = "interlude";
          itemObj.note = unescapeHtml(pMeta?.subtitle || pSong);
        } else if (!isKnownSong) {
          // Cover/special song with a song link but no songs.json entry:
          // formal track with title (unlinked), never enters the template —
          // EXCEPT member-solo corners, which are interludes by content
          // regardless of linkage (Q1: 看內容不看連結).
          if (isMemberSoloText(pMeta?.subtitle ?? "")) {
            itemObj.type = "interlude";
            const titleText = unescapeHtml(pMeta?.title || pSong);
            const subText = unescapeHtml(pMeta?.subtitle ?? "");
            itemObj.note = subText ? `${titleText} ${subText}` : titleText;
          } else {
            itemObj.title = pMeta?.title || pSong;
            if (pMeta?.subtitle) itemObj.note = unescapeHtml(pMeta.subtitle);
          }
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

export function buildConsensusTemplate(allShowSongs, maps) {
  const validShows = allShowSongs.filter((s) => s && s.length > 0);
  if (validShows.length === 0) return [];

  const threshold = Math.ceil(validShows.length * 0.5);
  const songCounts = {};
  const songEncoreCounts = {};
  const songKindCounts = {};
  const songPositions = {};
  const songFallbackPositions = {};
  const songSamples = {};

  for (const show of validShows) {
    show.forEach((item, pos) => {
      if (item.type === "interlude" || item.isCmt) return;

      const mappedId = item.livefansId
        ? maps.livefansIdToId[item.livefansId]
        : maps.titleToId[cleanTitleKey(item.title)];

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
      // Index-less items have no trustworthy position (scrambled DOM);
      // count them but keep them out of the ordering average.
      if (item.playIndex != null) songPositions[key].push(pos);
      else (songFallbackPositions[key] ??= []).push(pos);

      if (!songSamples[key]) {
        songSamples[key] = { ...item, mappedId };
      }
    });
  }

  // Filter songs that appear in >= 50% of valid shows
  const consensusKeys = Object.keys(songCounts).filter(
    (key) => songCounts[key] >= threshold
  );

  // Compute average relative position for ordering
  const scored = consensusKeys
    .map((key) => {
      const positions = songPositions[key].length
        ? songPositions[key]
        : (songFallbackPositions[key] ?? []);
      if (positions.length === 0) return null;
      const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length;
      const isEncore =
        (songEncoreCounts[key] || 0) >= Math.ceil(positions.length * 0.5);
      const sample = songSamples[key];

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
    })
    .filter((x) => x !== null);

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

export function formatEventNote(subtitle) {
  if (subtitle.includes("リハ") || subtitle.includes("Soundcheck")) {
    return `リハ：${subtitle.replace(/^リハ[：:]?\s*/, "")}`;
  }
  return subtitle;
}

export function mapPageSongsToEventSetlist(pageSongs, maps) {
  const isMapped = pageSongs.map(
    (sp) => !!(maps.livefansIdToId[sp.livefansId] ?? maps.titleToId[cleanTitleKey(sp.title)])
  );
  const isGap = pageSongs.map((sp) => !!(sp.isCmt || sp.type === "interlude"));
  // Song-link items without a songs.json entry (covers) are formal tracks:
  // always keep them, never drop — EXCEPT member-solo corners, which are
  // interludes by content regardless of linkage (Q1: 看內容不看連結).
  const isCover = pageSongs.map((sp, i) => !!sp.livefansId && !sp.isCmt && !isMapped[i]);
  const isMemberCover = pageSongs.map(
    (sp, i) => isCover[i] && isMemberSoloText(sp.subtitle ?? "")
  );
  // Keep mapped songs, covers and member-solo corners, plus any contiguous
  // interlude run touching a kept song (single-cmt adjacency check drops the
  // head of multi-cmt runs).
  const keep = isMapped.map((m, i) => m || isCover[i] || isMemberCover[i]);
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

  const kept = pageSongs
    .map((sp, origIdx) => ({ sp, isMember: isMemberCover[origIdx] }))
    .filter((_, origIdx) => keep[origIdx]);

  return kept.map(({ sp, isMember }, idx) => {
    const mappedId =
      maps.livefansIdToId[sp.livefansId] ?? maps.titleToId[cleanTitleKey(sp.title)];
    const item = {
      order: idx + 1,
      encore: !!sp.isEncore,
    };
    if (mappedId) {
      item.songId = mappedId;
    } else if (isMember) {
      item.type = "interlude";
      item.note = sp.subtitle ? `${sp.title} ${sp.subtitle}` : sp.title;
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
