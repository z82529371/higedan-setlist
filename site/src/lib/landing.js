import { resolveShowItems } from "./resolve.js";

function isTourUnit(unit) {
  if (!unit) return false;
  if (unit.type === "巡演專場") return true;
  return unit.type === "專場" && Boolean(unit.isTour || unit.templateSetlist);
}

/**
 * Find the latest concert tour unit (巡演專場) by its most recent show date.
 * Falls back to any unit with shows when no 巡演專場 exists.
 */
export function findLatestTourUnit(allUnits) {
  if (!Array.isArray(allUnits) || allUnits.length === 0) return null;

  const tourCandidates = allUnits.filter(isTourUnit);
  const pool = tourCandidates.length > 0 ? tourCandidates : allUnits;

  let bestUnit = null;
  let bestDate = "";

  for (const unit of pool) {
    if (!unit) continue;
    let unitLatest = "";
    for (const show of unit.shows ?? []) {
      const d = show?.date ?? "";
      if (d > unitLatest) unitLatest = d;
    }
    if (!bestUnit || unitLatest > bestDate) {
      bestUnit = unit;
      bestDate = unitLatest;
    }
  }

  return bestUnit;
}

/**
 * Format a compact display label for the latest tour quick-jump chip,
 * stripping the redundant band name prefix while preserving official tour titles.
 */
export function formatLatestTourPromptLabel(unit) {
  if (!unit) return "";
  if (unit.shortTitle) return unit.shortTitle.trim();
  const raw = (unit.title ?? "").trim();
  return raw
    .replace(/^OFFICIAL\s+HIGE\s+DANDISM\s+/i, "")
    .replace(/^Official\s*髭男\s*dism\s+/i, "")
    .trim();
}

/**
 * Return all playable shows (strictly excluding 存根場次 / stub shows with no public setlist).
 */
export function findPlayableShowPool(allUnits) {
  if (!Array.isArray(allUnits) || allUnits.length === 0) return [];
  const pool = [];

  for (const unit of allUnits) {
    if (!unit || !Array.isArray(unit.shows)) continue;
    for (const show of unit.shows) {
      if (!show?.id) continue;
      if (Array.isArray(show.setlist) && show.setlist.length === 0) continue;
      const items = resolveShowItems(unit, show);
      const hasTracks = items.some(
        (item) => item?.type !== "interlude" && Boolean(item?.songId || item?.title)
      );
      if (!hasTracks) continue;
      pool.push({
        unitId: unit.id,
        showId: show.id,
        date: show.date ?? "",
      });
    }
  }

  return pool;
}

/**
 * Pick a random playable show from the archive (excluding stub shows).
 */
export function pickRandomPlayableShow(allUnits, randomFn = Math.random) {
  const pool = findPlayableShowPool(allUnits);
  if (pool.length === 0) return null;
  const r = Number(randomFn());
  const clamped = Number.isFinite(r) ? Math.min(Math.max(r, 0), 0.9999999999) : 0;
  const index = Math.floor(clamped * pool.length);
  return pool[index] ?? pool[0];
}

/**
 * Build a curated deck of real playable tour/event shows for the homepage
 * 3D Foil-Sheen Collectible Live Ticket (one flagship show per tour era,
 * prioritizing themed tours sorted newest-first so each flip shifts era color).
 */
export function buildFeaturedTicketDeck(allUnits, songTitleMap = {}) {
  if (!Array.isArray(allUnits) || allUnits.length === 0) return [];

  const candidates = [];

  for (const unit of allUnits) {
    if (!unit || !Array.isArray(unit.shows)) continue;
    const playableShows = [];

    for (const show of unit.shows) {
      if (!show?.id) continue;
      if (Array.isArray(show.setlist) && show.setlist.length === 0) continue;
      const items = resolveShowItems(unit, show).filter(
        (item) => item?.type !== "interlude" && Boolean(item?.songId || item?.title)
      );
      if (items.length === 0) continue;
      playableShows.push({ show, items });
    }

    if (playableShows.length === 0) continue;

    // Pick the flagship show for this tour/unit:
    // For ASIA TOUR 2026, spotlight the Taipei Arena show first; otherwise newest playable show.
    playableShows.sort((a, b) => ((b.show.date ?? "") > (a.show.date ?? "") ? 1 : -1));
    const isAsia2026 = unit.id === "asia-tour-2026";
    const taipeiPick = isAsia2026
      ? playableShows.find(({ show }) => {
          const v = typeof show.venue === "string" ? show.venue : show.venue?.name || show.place || "";
          return v.includes("台北小巨蛋") || v.includes("臺北小巨蛋") || show.id?.includes("taipei");
        })
      : null;
    const chosen = taipeiPick ?? playableShows[0];
    const { show, items } = chosen;

    const previewTracks = items.slice(0, 3).map((item, idx) => ({
      cue: `M0${idx + 1}`,
      songId: item.songId ?? null,
      title: (item.songId && songTitleMap[item.songId]) || item.title || item.songId || "",
    }));

    const featuredSongId = items.find((item) => item.songId)?.songId ?? null;
    const venueName =
      typeof show.venue === "string"
        ? show.venue
        : show.venue?.name || show.place || "";

    candidates.push({
      unitId: unit.id,
      unitTitle: unit.title ?? "",
      tourLabel: formatLatestTourPromptLabel(unit) || unit.title || "",
      showId: show.id,
      date: show.date ?? "",
      venueName,
      city: show.city ?? "",
      theme: unit.theme ?? null,
      isTour: isTourUnit(unit),
      hasTheme: Boolean(unit.theme?.light && unit.theme?.dark),
      isPinnedLead: isAsia2026 && Boolean(taipeiPick),
      previewTracks,
      featuredSongId,
      totalTracks: items.length,
    });
  }

  // Pin ASIA TOUR 2026 Taipei Arena first, then themed tours, then other tours, newest-first
  candidates.sort((a, b) => {
    if (a.isPinnedLead !== b.isPinnedLead) return a.isPinnedLead ? -1 : 1;
    if (a.hasTheme !== b.hasTheme) return a.hasTheme ? -1 : 1;
    if (a.isTour !== b.isTour) return a.isTour ? -1 : 1;
    return b.date > a.date ? 1 : b.date < a.date ? -1 : 0;
  });

  return candidates.slice(0, 12);
}
