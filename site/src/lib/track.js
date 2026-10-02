import { SETLIST_SONG } from "./constants.js";

// Internal key namespace: song slugs share one map.
export function trackKey(kind, value) {
  return `${kind}:${value}`;
}

// songId track > null (interludes and cover titles carry neither).
export function trackKeyOf(item) {
  if (!item) return null;
  if (item.songId) return trackKey("song", item.songId);
  return null;
}

// Rendering branch for songs (render as anchors; non-songs are plain text).
export function trackRoute(item, weightCls) {
  if (item.songId) {
    return {
      key: trackKey("song", item.songId),
      hash: `#/song/${item.songId}`,
      cls: `${SETLIST_SONG} ${weightCls}`,
      isSong: true,
    };
  }
  return null;
}

// Hash routes (no router dep; static hosting safe):
// #/song/<songId> #/show/<showId> #/venue/<name>
export function parseRoute(hash) {
  const m = (hash ?? "")
    .replace(/^#/, "")
    .match(/^\/(song|show|venue)\/(.+)$/);
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
};
