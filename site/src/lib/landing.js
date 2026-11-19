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
