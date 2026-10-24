/**
 * venues.js — Multi-lingual Official Venue Localization & Native Fallback (ADR-0110, ADR-0111).
 *
 * Provides official registered / promoter-announced venue names across supported locales (zh-TW, ja, en, ko).
 * Single Source of Truth (SSOT) is maintained in data/venue-profiles.json.
 *
 * When an official translation does not exist for a given locale:
 * - ja, en, ko: gracefully falls back to the native first-hand name (ADR-0111).
 * - zh-TW: falls back to the canonical venue name.
 * Strictly avoids showing Traditional Chinese translations in non-Chinese locales.
 */

import venueProfilesData from "../../data/venue-profiles.json";

const profiles = venueProfilesData?.venues ?? [];

export const venueProfiles = profiles;
export const venueProfilesByCanonical = new Map(
  profiles.map((v) => [v.canonical, v])
);

export const venueNative = Object.fromEntries(
  profiles.map((v) => [v.canonical, v.native])
);

export const venueZhTw = Object.fromEntries(
  profiles.map((v) => [v.canonical, v.names?.["zh-TW"] || v.canonical])
);

export const venueJa = Object.fromEntries(
  profiles
    .filter((v) => v.names?.ja)
    .map((v) => [v.canonical, v.names.ja])
);

export const venueEn = Object.fromEntries(
  profiles
    .filter((v) => v.names?.en)
    .map((v) => [v.canonical, v.names.en])
);

export const venueKo = Object.fromEntries(
  profiles
    .filter((v) => v.names?.ko)
    .map((v) => [v.canonical, v.names.ko])
);

// Cross-lingual lookup index for deep link resolution (ADR-0111)
const aliasToCanonical = new Map();
for (const v of profiles) {
  if (v.canonical) aliasToCanonical.set(v.canonical.toLowerCase(), v.canonical);
  if (v.native) aliasToCanonical.set(v.native.toLowerCase(), v.canonical);
  if (v.names?.["zh-TW"]) aliasToCanonical.set(v.names["zh-TW"].toLowerCase(), v.canonical);
  if (v.names?.ja) aliasToCanonical.set(v.names.ja.toLowerCase(), v.canonical);
  if (v.names?.en) aliasToCanonical.set(v.names.en.toLowerCase(), v.canonical);
  if (v.names?.ko) aliasToCanonical.set(v.names.ko.toLowerCase(), v.canonical);
}

/**
 * Returns authentic first-hand native name of a venue (ADR-0111).
 *
 * @param {string} rawVenue - Canonical venue name
 * @returns {string} Native venue name
 */
export function getNativeVenue(rawVenue) {
  if (!rawVenue || typeof rawVenue !== "string") return rawVenue ?? "";
  return venueNative[rawVenue] || venueJa[rawVenue] || rawVenue;
}

/**
 * Localizes a venue name according to current locale (ADR-0110, ADR-0111).
 * Gracefully falls back to authentic native name if no official localization exists.
 *
 * @param {string} rawVenue - Canonical venue name from data/venues.json
 * @param {string} locale - Target locale ('zh-TW' | 'ja' | 'en' | 'ko')
 * @returns {string} Localized official name or native fallback
 */
export function localizeVenue(rawVenue, locale = "zh-TW") {
  if (!rawVenue || typeof rawVenue !== "string") return rawVenue ?? "";
  if (locale === "ja") return venueJa[rawVenue] || getNativeVenue(rawVenue);
  if (locale === "en") return venueEn[rawVenue] || getNativeVenue(rawVenue);
  if (locale === "ko") return venueKo[rawVenue] || getNativeVenue(rawVenue);
  return venueZhTw[rawVenue] || rawVenue;
}

/**
 * Matches a query needle against all localized variations of a venue (ADR-0110, ADR-0111).
 * Supports zero-friction cross-lingual venue lookup in SearchBox.
 *
 * @param {string} needle - Lowercased search keyword
 * @param {string} rawVenue - Canonical venue name
 * @returns {boolean} True if query matches any localized or native name
 */
export function matchVenue(needle, rawVenue = "") {
  if (!needle || !rawVenue) return false;
  const n = needle.toLowerCase();
  const vCanon = rawVenue.toLowerCase();
  const vNative = (venueNative[rawVenue] || "").toLowerCase();
  const vJa = (venueJa[rawVenue] || "").toLowerCase();
  const vEn = (venueEn[rawVenue] || "").toLowerCase();
  const vKo = (venueKo[rawVenue] || "").toLowerCase();
  const vZh = (venueZhTw[rawVenue] || "").toLowerCase();

  return (
    vCanon.includes(n) ||
    vNative.includes(n) ||
    vJa.includes(n) ||
    vEn.includes(n) ||
    vKo.includes(n) ||
    vZh.includes(n)
  );
}

/**
 * Resolves an inbound venue route string (canonical, native, or localized in any language)
 * to its canonical identifier (ADR-0111).
 *
 * @param {string} routeValue - Input string from URL hash
 * @returns {string|null} Canonical venue identifier or null
 */
export function resolveVenueCanonical(routeValue) {
  if (!routeValue || typeof routeValue !== "string") return null;
  const normalized = routeValue.trim().toLowerCase();
  return aliasToCanonical.get(normalized) ?? null;
}
