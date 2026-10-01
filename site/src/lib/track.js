import { SETLIST_SONG, TITLE_LINK } from "./constants.js";

// Internal key namespace: song slugs and free-text titles share one map.
export function trackKey(kind, value) {
  return `${kind}:${value}`;
}

// songId track > title track > null (interludes carry neither).
export function trackKeyOf(item) {
  if (!item) return null;
  if (item.songId) return trackKey("song", item.songId);
  if (item.title) return trackKey("title", item.title);
  return null;
}

// Single rendering branch for both tracks (both render as anchors;
// only the hash kind and the weight class differ).
export function trackRoute(item, weightCls) {
  if (item.songId) {
    return {
      key: trackKey("song", item.songId),
      hash: `#/song/${item.songId}`,
      cls: `${SETLIST_SONG} ${weightCls}`,
      isSong: true,
    };
  }
  return {
    key: trackKey("title", item.title),
    hash: `#/title/${encodeURIComponent(item.title)}`,
    cls: TITLE_LINK,
    isSong: false,
  };
}

// Hash routes (no router dep; static hosting safe):
// #/song/<songId> #/show/<showId> #/venue/<name> #/title/<title>
export function parseRoute(hash) {
  const m = (hash ?? "")
    .replace(/^#/, "")
    .match(/^\/(song|show|venue|title)\/(.+)$/);
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
  title: (title) => `#/title/${encodeURIComponent(title)}`,
};
