/**
 * Application URL Hash Routes & State Contracts
 *
 * Hash route scheme (static hosting safe, zero router dependency):
 * - #/song/:songId      -> Single song slip & history statistics
 * - #/show/:showId      -> Specific show setlist slip
 * - #/venue/:venueName  -> Venue analysis slip
 * - #/tour/:unitId      -> Consensus tour summary slip (Ticket 4, ADR-0102)
 *
 * Robust against variations:
 * - /#/..., #/..., #..., /..., trailing slashes, and URI encoding.
 */

export function parseRoute(hash) {
  if (!hash) return null;
  const cleaned = (hash ?? "")
    .replace(/^(?:\/|#)+/, "/")
    .replace(/\/+$/, "");
  const m = cleaned.match(/^\/(song|show|venue|tour)\/(.+)$/);
  if (!m) return null;
  try {
    return { kind: m[1], value: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

export const routeHash = {
  song: (id) => `#/song/${id}`,
  show: (id) => `#/show/${id}`,
  venue: (name) => `#/venue/${encodeURIComponent(name)}`,
  tour: (id) => `#/tour/${id}`,
};
