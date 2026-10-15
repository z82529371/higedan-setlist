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

// URL Hash routes re-exported from dedicated routes module for backwards compatibility
export {
  parseRoute,
  routeHash,
  buildRouteHash,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  normalizeLocale,
} from "./routes.js";

