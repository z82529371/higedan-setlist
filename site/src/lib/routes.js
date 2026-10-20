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

export const SUPPORTED_LOCALES = ["zh-TW", "ja", "en", "ko"];
export const DEFAULT_LOCALE = "zh-TW";

export function normalizeLocale(raw) {
  if (!raw || typeof raw !== "string") return null;
  const clean = raw.trim().toLowerCase();
  if (
    clean === "zh" ||
    clean === "zh-tw" ||
    clean === "zh-hant" ||
    clean.startsWith("zh-tw") ||
    clean.startsWith("zh-hk") ||
    clean.startsWith("zh-mo")
  ) {
    return "zh-TW";
  }
  if (clean.startsWith("ja")) return "ja";
  if (clean.startsWith("en")) return "en";
  if (clean.startsWith("ko")) return "ko";
  return null;
}

export function parseRoute(hash) {
  if (!hash) return null;
  const raw = hash ?? "";
  const cleaned = raw.replace(/^(?:\/|#)+/, "/");

  // Separate pathname and query string
  const [pathPart, queryPart] = cleaned.split("?");
  const normalizedPath = (pathPart || "").replace(/\/+$/, "");

  // Parse query params safely
  const params = new URLSearchParams(queryPart || "");
  const langParam = params.get("lang");
  const lang = normalizeLocale(langParam);

  const m = normalizedPath.match(/^\/(song|show|venue|tour)\/(.+)$/);
  if (!m) {
    if (normalizedPath === "/archive") {
      const res = { kind: "archive", value: null };
      if (lang) res.lang = lang;
      return res;
    }
    if (normalizedPath === "/tickets") {
      const res = { kind: "tickets", value: null };
      if (lang) res.lang = lang;
      return res;
    }
    return null;
  }

  try {
    const res = { kind: m[1], value: decodeURIComponent(m[2]) };
    if (lang) res.lang = lang;
    return res;
  } catch {
    return null;
  }
}

export function buildRouteHash(kind, value, options = {}) {
  const opts = typeof options === "string" ? { lang: options } : (options || {});
  const base =
    kind === "song"
      ? `#/song/${value}`
      : kind === "show"
      ? `#/show/${value}`
      : kind === "venue"
      ? `#/venue/${encodeURIComponent(value)}`
      : kind === "tour"
      ? `#/tour/${value}`
      : kind === "tickets"
      ? `#/tickets`
      : kind === "archive"
      ? `#/archive`
      : "#/";

  const lang = opts.lang && opts.lang !== DEFAULT_LOCALE && SUPPORTED_LOCALES.includes(opts.lang)
    ? opts.lang
    : null;
  return lang ? `${base}?lang=${lang}` : base;
}

export const routeHash = {
  song: (id, opts) => buildRouteHash("song", id, opts),
  show: (id, opts) => buildRouteHash("show", id, opts),
  venue: (name, opts) => buildRouteHash("venue", name, opts),
  tour: (id, opts) => buildRouteHash("tour", id, opts),
  tickets: (opts) => buildRouteHash("tickets", null, opts),
  archive: (opts) => buildRouteHash("archive", null, opts),
};
