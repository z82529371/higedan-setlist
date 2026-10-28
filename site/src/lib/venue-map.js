/**
 * venue-map.js — Pure Domain Engine for Interactive Venue Map, Two-Tier Coordinate
 * Clustering, Deterministic Spiderfy, and Tour Journey Route Sequence (ADR-0124).
 */

import { geoZhTw, geoJa, geoEn, geoKo } from "./locales/geography.js";

export const MAP_VIEWBOX = {
  width: 800,
  height: 560,
  str: "0 0 800 560",
};

export const PORTRAIT_MAP_VIEWBOX = {
  width: 540,
  height: 930,
  str: "0 0 540 930",
};

export const OVERSEAS_INSET_BOUNDS = {
  x: 16,
  y: 16,
  width: 250,
  height: 195,
};

export const OKINAWA_INSET_BOUNDS = {
  x: 610,
  y: 440,
  width: 174,
  height: 104,
};

export const PORTRAIT_OVERSEAS_INSET_BOUNDS = {
  x: 20,
  y: 20,
  width: 500,
  height: 205,
};

export const PORTRAIT_OKINAWA_INSET_BOUNDS = {
  x: 150,
  y: 848,
  width: 240,
  height: 68,
};

export const MAIN_PORTRAIT_OFFSET = { x: -212, y: 260 };
export const OVERSEAS_PORTRAIT_OFFSET = { x: 137, y: 0 };
export const OKINAWA_PORTRAIT_OFFSET = { x: -423, y: 390 };

/**
 * Maps an SVG coordinate point between landscape (800x560) and portrait (800x990)
 * triptych layout spaces (ADR-0126).
 *
 * @param {{ x: number, y: number, zone?: "main" | "overseas" | "okinawa", anchorX?: number, anchorY?: number } | null} point
 * @param {"landscape" | "portrait"} [layout]
 * @returns {{ x: number, y: number, zone?: "main" | "overseas" | "okinawa", anchorX?: number, anchorY?: number } | null}
 */
export function projectPointToLayout(point, layout = "landscape") {
  if (!point || layout !== "portrait") return point;
  const zone = point.zone || "main";
  const offset =
    zone === "overseas"
      ? OVERSEAS_PORTRAIT_OFFSET
      : zone === "okinawa"
      ? OKINAWA_PORTRAIT_OFFSET
      : MAIN_PORTRAIT_OFFSET;

  return {
    ...point,
    x: Number((point.x + offset.x).toFixed(2)),
    y: Number((point.y + offset.y).toFixed(2)),
    anchorX: point.anchorX != null ? Number((point.anchorX + offset.x).toFixed(2)) : point.anchorX,
    anchorY: point.anchorY != null ? Number((point.anchorY + offset.y).toFixed(2)) : point.anchorY,
  };
}

const COS_36_DEG = Math.cos((36 * Math.PI) / 180); // ~0.80901699

// Main Japan 4-island projection calibration for 800x560 canvas
const MAIN_LON_MIN = 129.3;
const MAIN_LAT_MIN = 30.8;
const MAIN_SCALE = 36.0;
const MAIN_ORIGIN_X = 240;
const MAIN_ORIGIN_Y = 528;

// Anchor centers within the Top-Left Overseas Asia Inset (x: 16..266, y: 16..211)
const OVERSEAS_COUNTRY_ANCHORS = {
  韓國: { baseLat: 37.55, baseLng: 126.98, cx: 82, cy: 86, scale: 28 },
  台灣: { baseLat: 25.05, baseLng: 121.55, cx: 198, cy: 96, scale: 28 },
  泰國: { baseLat: 13.73, baseLng: 100.57, cx: 82, cy: 162, scale: 28 },
  新加坡: { baseLat: 1.31, baseLng: 103.79, cx: 198, cy: 162, scale: 28 },
};

/**
 * Projects a WGS84 [lat, lng] coordinate into the 800x560 SVG coordinate space,
 * automatically routing Overseas Asia venues to the top-left inset and Okinawa
 * venues to the bottom-right inset (ADR-0124).
 *
 * @param {number|null} lat
 * @param {number|null} lng
 * @param {object} [options]
 * @param {string} [options.prefecture]
 * @param {string} [options.city]
 * @param {string} [options.region]
 * @returns {{ x: number, y: number, zone: "main" | "overseas" | "okinawa" } | null}
 */
export function projectLatLngToSvg(lat, lng, options = {}) {
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const pref = options.prefecture || "";
  const region = options.region || "";

  // 1. Overseas Asia Inset (Top-Left: x in [16, 266], y in [16, 211])
  const isOverseas =
    region === "海外" ||
    Boolean(OVERSEAS_COUNTRY_ANCHORS[pref]) ||
    lat < 25.5 ||
    lng < 126.9;

  if (isOverseas && pref !== "沖繩縣") {
    let anchor = OVERSEAS_COUNTRY_ANCHORS[pref];
    if (!anchor) {
      if (lat > 33) anchor = OVERSEAS_COUNTRY_ANCHORS["韓國"];
      else if (lat > 20) anchor = OVERSEAS_COUNTRY_ANCHORS["台灣"];
      else if (lat > 7) anchor = OVERSEAS_COUNTRY_ANCHORS["泰國"];
      else anchor = OVERSEAS_COUNTRY_ANCHORS["新加坡"];
    }
    const dx = (lng - anchor.baseLng) * COS_36_DEG * anchor.scale;
    const dy = -(lat - anchor.baseLat) * anchor.scale;
    const x = Math.min(
      OVERSEAS_INSET_BOUNDS.x + OVERSEAS_INSET_BOUNDS.width - 12,
      Math.max(OVERSEAS_INSET_BOUNDS.x + 12, anchor.cx + dx)
    );
    const y = Math.min(
      OVERSEAS_INSET_BOUNDS.y + OVERSEAS_INSET_BOUNDS.height - 12,
      Math.max(OVERSEAS_INSET_BOUNDS.y + 28, anchor.cy + dy)
    );
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      zone: "overseas",
    };
  }

  // 2. Okinawa Inset (Bottom-Right: x in [610, 784], y in [440, 544])
  const isOkinawa = pref === "沖繩縣" || (lat >= 24.0 && lat <= 28.5 && lng >= 122.5 && lng <= 130.0);
  if (isOkinawa) {
    const baseLat = 26.2789;
    const baseLng = 127.7336;
    const cx = 697;
    const cy = 492;
    const scale = 32;
    const x = Math.min(
      OKINAWA_INSET_BOUNDS.x + OKINAWA_INSET_BOUNDS.width - 12,
      Math.max(OKINAWA_INSET_BOUNDS.x + 12, cx + (lng - baseLng) * COS_36_DEG * scale)
    );
    const y = Math.min(
      OKINAWA_INSET_BOUNDS.y + OKINAWA_INSET_BOUNDS.height - 12,
      Math.max(OKINAWA_INSET_BOUNDS.y + 24, cy - (lat - baseLat) * scale)
    );
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      zone: "okinawa",
    };
  }

  // 3. Main Canvas: Japan 4 Main Islands (center latitude 36°N orthogonal correction)
  const rawX = MAIN_ORIGIN_X + (lng - MAIN_LON_MIN) * COS_36_DEG * MAIN_SCALE;
  const rawY = MAIN_ORIGIN_Y - (lat - MAIN_LAT_MIN) * MAIN_SCALE;

  return {
    x: Number(rawX.toFixed(2)),
    y: Number(rawY.toFixed(2)),
    zone: "main",
  };
}

export const JAPAN_47_PREFECTURES = [
  "北海道",
  "青森縣",
  "岩手縣",
  "宮城縣",
  "秋田縣",
  "山形縣",
  "福島縣",
  "茨城縣",
  "栃木縣",
  "群馬縣",
  "埼玉縣",
  "千葉縣",
  "東京都",
  "神奈川縣",
  "新潟縣",
  "富山縣",
  "石川縣",
  "福井縣",
  "山梨縣",
  "長野縣",
  "岐阜縣",
  "靜岡縣",
  "愛知縣",
  "三重縣",
  "滋賀縣",
  "京都府",
  "大阪府",
  "兵庫縣",
  "奈良縣",
  "和歌山縣",
  "鳥取縣",
  "島根縣",
  "岡山縣",
  "廣島縣",
  "山口縣",
  "德島縣",
  "香川縣",
  "愛媛縣",
  "高知縣",
  "福岡縣",
  "佐賀縣",
  "長崎縣",
  "熊本縣",
  "大分縣",
  "宮崎縣",
  "鹿兒島縣",
  "沖繩縣",
];

export const OVERSEAS_COUNTRIES = ["韓國", "台灣", "新加坡", "泰國"];
export const OVERSEAS_TARGET_KEY = "海外";

export const SANIN_SANCTUARY_PREFECTURES = new Set(["島根縣", "鳥取縣"]);

const PREF_ALIAS_LOOKUP = new Map();
for (const pref of [...JAPAN_47_PREFECTURES, ...OVERSEAS_COUNTRIES]) {
  PREF_ALIAS_LOOKUP.set(pref.toLowerCase(), pref);
  const shortZh = pref.replace(/[都道府県縣]$/, "");
  if (shortZh) PREF_ALIAS_LOOKUP.set(shortZh.toLowerCase(), pref);

  for (const dict of [geoZhTw, geoJa, geoEn, geoKo]) {
    const locName = dict?.prefectures?.[pref];
    if (locName) {
      PREF_ALIAS_LOOKUP.set(locName.toLowerCase(), pref);
      const shortLoc = locName.replace(/[都道府県縣]$|(?:\s+prefecture|\s+metropolis)$/i, "").trim();
      if (shortLoc) PREF_ALIAS_LOOKUP.set(shortLoc.toLowerCase(), pref);
    }
  }
}

/**
 * Resolves a route parameter from `#/map/:prefOrCountry` into a canonical map target
 * (`journey`, a canonical prefecture / overseas country, or `"海外"`).
 * Returns `null` for unknown/malformed targets so the router safely falls back to `#/map`.
 *
 * @param {string|null} rawTarget
 * @returns {{ mode: "root" | "journey" | "prefecture", target: string | null } | null}
 */
export function resolveMapTarget(rawTarget) {
  if (rawTarget === null || rawTarget === undefined || rawTarget === "") {
    return { mode: "root", target: null };
  }
  if (typeof rawTarget !== "string") return null;
  const clean = rawTarget.trim();
  if (!clean) return { mode: "root", target: null };

  const lower = clean.toLowerCase();
  if (lower === "journey" || lower === "career") {
    return { mode: "journey", target: "journey" };
  }
  if (clean === "海外" || lower === "overseas" || lower === "asia") {
    return { mode: "prefecture", target: "海外" };
  }
  if (PREF_ALIAS_LOOKUP.has(lower)) {
    return { mode: "prefecture", target: PREF_ALIAS_LOOKUP.get(lower) };
  }
  return null;
}

/**
 * Formats a compact map badge label for a localized prefecture/country name
 * without awkward mid-syllable truncation in English or Korean.
 *
 * @param {string} locPref
 * @param {boolean} [isSanin=false]
 * @returns {string}
 */
export function formatMapBadgeLabel(locPref = "", isSanin = false) {
  const clean = String(locPref)
    .replace(/[都道府県縣]$|(?:\s+prefecture|\s+metropolis)$/i, "")
    .replace(/(?:특별시|광역시|특별자치도|도|현)$/, "")
    .trim();
  const isAscii = /^[ -~]+$/.test(clean);
  const shortText = isAscii
    ? clean.length <= 4
      ? clean
      : clean.slice(0, 3).toUpperCase()
    : clean.slice(0, 3);
  return isSanin ? `🌱${shortText}` : shortText;
}

function getShowsCountForVenue(venueName, venueObj, globalVenueShows) {
  if (globalVenueShows instanceof Map && globalVenueShows.has(venueName)) {
    const list = globalVenueShows.get(venueName);
    return Array.isArray(list) ? list.length : 0;
  }
  if (globalVenueShows && typeof globalVenueShows === "object" && !(globalVenueShows instanceof Map)) {
    const list = globalVenueShows[venueName];
    if (Array.isArray(list)) return list.length;
  }
  if (Array.isArray(venueObj?.shows)) return venueObj.shows.length;
  if (typeof venueObj?.showCount === "number") return venueObj.showCount;
  return 0;
}

function classifyPrefectureTier(showCount, isSaninSanctuary) {
  if (showCount <= 0) return "unvisited";
  if (showCount >= 16 || isSaninSanctuary) return "sanctuary_or_hub";
  return "visited";
}

function createPrefectureBucket(prefecture, isOverseas) {
  return {
    prefecture,
    isOverseas,
    isSaninSanctuary: !isOverseas && SANIN_SANCTUARY_PREFECTURES.has(prefecture),
    venueCount: 0,
    activeVenueCount: 0,
    showCount: 0,
    tier: "unvisited",
    citiesMap: new Map(),
    cities: [],
    venues: [],
  };
}

function isVirtualEntity(entity, profile = null) {
  const venueName = entity?.venue || entity?.canonical || entity?.name || "";
  const category = entity?.unitType || entity?.category || entity?.type || "";
  return (
    entity?.isVirtual === true ||
    profile?.isVirtual === true ||
    venueName === "線上直播" ||
    venueName.startsWith("線上直播") ||
    entity?.city === "線上直播" ||
    entity?.region === "線上" ||
    category === "線上直播"
  );
}

/**
 * Computes prefecture and overseas country statistics, 3-tier heat classification,
 * and 43/47 Japan prefecture completion metrics (ADR-0124).
 *
 * @param {Array<object>} allVenues - Venue profiles or domain allVenues array
 * @param {Map<string, Array>|object} [globalVenueShows] - Optional show lookup by canonical venue name
 * @returns {object}
 */
export function buildPrefectureMapStats(allVenues = [], globalVenueShows = null) {
  const byPrefecture = {};

  for (const pref of JAPAN_47_PREFECTURES) {
    byPrefecture[pref] = createPrefectureBucket(pref, false);
  }

  for (const country of OVERSEAS_COUNTRIES) {
    byPrefecture[country] = createPrefectureBucket(country, true);
  }

  let virtualShowCount = 0;

  for (const v of allVenues ?? []) {
    const venueName = v.canonical || v.name || "";
    if (!venueName) continue;

    const showCount = getShowsCountForVenue(venueName, v, globalVenueShows);

    if (isVirtualEntity(v)) {
      virtualShowCount += showCount;
      continue;
    }

    const pref = v.prefecture || "";
    const city = v.city || "";
    if (!pref || !byPrefecture[pref]) continue;

    const entry = byPrefecture[pref];
    entry.venueCount += 1;
    if (showCount > 0) entry.activeVenueCount += 1;
    entry.showCount += showCount;

    const venueRecord = {
      ...v,
      name: venueName,
      canonical: venueName,
      city,
      prefecture: pref,
      hubId: v.hubId || `${pref}::${city}`,
      showCount,
    };
    entry.venues.push(venueRecord);

    if (city) {
      if (!entry.citiesMap.has(city)) {
        entry.citiesMap.set(city, {
          city,
          prefecture: pref,
          hubId: `${pref}::${city}`,
          venueCount: 0,
          activeVenueCount: 0,
          showCount: 0,
          venues: [],
        });
      }
      const cEntry = entry.citiesMap.get(city);
      cEntry.venueCount += 1;
      if (showCount > 0) cEntry.activeVenueCount += 1;
      cEntry.showCount += showCount;
      cEntry.venues.push(venueRecord);
    }
  }

  for (const entry of Object.values(byPrefecture)) {
    entry.tier = classifyPrefectureTier(entry.showCount, entry.isSaninSanctuary);
    entry.venues.sort((a, b) => b.showCount - a.showCount || a.canonical.localeCompare(b.canonical));
    entry.cities = [...entry.citiesMap.values()].sort(
      (a, b) => b.showCount - a.showCount || b.venueCount - a.venueCount || a.city.localeCompare(b.city)
    );
    delete entry.citiesMap;
  }

  const japanPrefectures = JAPAN_47_PREFECTURES.map((p) => byPrefecture[p]);
  const overseasCountries = OVERSEAS_COUNTRIES.map((c) => byPrefecture[c]);

  const visitedJapanPrefectures = JAPAN_47_PREFECTURES.filter((p) => byPrefecture[p].showCount > 0);
  const unvisitedJapanPrefectures = JAPAN_47_PREFECTURES.filter((p) => byPrefecture[p].showCount === 0);
  const visitedOverseasCountries = OVERSEAS_COUNTRIES.filter((c) => byPrefecture[c].showCount > 0);

  return {
    totalJapanPrefectures: JAPAN_47_PREFECTURES.length,
    visitedJapanPrefectureCount: visitedJapanPrefectures.length,
    unvisitedJapanPrefectureCount: unvisitedJapanPrefectures.length,
    visitedJapanPrefectures,
    unvisitedJapanPrefectures,
    completionRatio: visitedJapanPrefectures.length / JAPAN_47_PREFECTURES.length,
    completionPercent: Number(((visitedJapanPrefectures.length / JAPAN_47_PREFECTURES.length) * 100).toFixed(1)),
    overseasCountryCount: visitedOverseasCountries.length,
    virtualShowCount,
    japanPrefectures,
    overseasCountries,
    byPrefecture,
  };
}

function getVenueKey(v, idx) {
  return String(v?.id || v?.canonical || v?.name || idx);
}

function createUnspiderfiedRecord(v, svgPoint = null) {
  return {
    ...v,
    isSpiderfied: false,
    clusterSize: 1,
    clusterIndex: 0,
    angleRad: 0,
    dx: 0,
    dy: 0,
    offsetLat: 0,
    offsetLng: 0,
    displayLat: v?.lat ?? null,
    displayLng: v?.lng ?? null,
    svgPoint,
  };
}

/**
 * Computes deterministic radial offsets (Spiderfy) for same-complex or close-proximity
 * multi-hall/multi-stage venues (< 200m / < 0.002°) while strictly preserving original
 * WGS84 lat/lng values (ADR-0124).
 *
 * @param {Array<object>} venues
 * @param {object} [options]
 * @param {number} [options.thresholdDeg=0.002] - Proximity threshold in degrees (~200m)
 * @param {number} [options.radiusPx=14] - Radial offset in SVG pixels
 * @param {number} [options.radiusDeg=0.0025] - Radial offset in degrees for displayLat/displayLng
 * @returns {Array<object>}
 */
export function computeSpiderfyOffsets(venues = [], options = {}) {
  const thresholdDeg = options.thresholdDeg ?? 0.002;
  const radiusPx = options.radiusPx ?? 14;
  const radiusDeg = options.radiusDeg ?? 0.0025;

  const indexed = (venues ?? []).map((v, idx) => ({
    v,
    origIdx: idx,
    key: getVenueKey(v, idx),
    hasCoords: typeof v?.lat === "number" && typeof v?.lng === "number" && Number.isFinite(v.lat) && Number.isFinite(v.lng),
  }));

  // Sort deterministically by key so clustering and radial angle assignment are order-independent
  const sortedPhysical = indexed
    .filter((item) => item.hasCoords)
    .sort((a, b) => a.key.localeCompare(b.key));

  // Connected-component clustering within thresholdDeg
  const visited = new Set();
  const clusters = [];

  for (let i = 0; i < sortedPhysical.length; i++) {
    if (visited.has(i)) continue;
    const cluster = [sortedPhysical[i]];
    visited.add(i);
    let queueIdx = 0;

    while (queueIdx < cluster.length) {
      const curr = cluster[queueIdx++];
      for (let j = 0; j < sortedPhysical.length; j++) {
        if (visited.has(j)) continue;
        const cand = sortedPhysical[j];
        const dLat = curr.v.lat - cand.v.lat;
        const dLng = curr.v.lng - cand.v.lng;
        const distDeg = Math.hypot(dLat, dLng);
        if (distDeg < thresholdDeg) {
          visited.add(j);
          cluster.push(cand);
        }
      }
    }
    clusters.push(cluster);
  }

  const results = Array.from({ length: indexed.length });

  for (const item of indexed) {
    if (!item.hasCoords) {
      results[item.origIdx] = createUnspiderfiedRecord(item.v, null);
    }
  }

  for (const cluster of clusters) {
    const n = cluster.length;
    if (n === 1) {
      const item = cluster[0];
      const baseSvg = projectLatLngToSvg(item.v.lat, item.v.lng, item.v);
      results[item.origIdx] = createUnspiderfiedRecord(item.v, baseSvg);
      continue;
    }

    const centerLat = cluster.reduce((sum, x) => sum + x.v.lat, 0) / n;
    const centerLng = cluster.reduce((sum, x) => sum + x.v.lng, 0) / n;

    cluster.forEach((item, k) => {
      const angleRad = (2 * Math.PI * k) / n - Math.PI / 2;
      const dx = Number((Math.cos(angleRad) * radiusPx).toFixed(2));
      const dy = Number((Math.sin(angleRad) * radiusPx).toFixed(2));
      const offsetLat = Number((-Math.sin(angleRad) * radiusDeg).toFixed(6));
      const offsetLng = Number(((Math.cos(angleRad) * radiusDeg) / COS_36_DEG).toFixed(6));
      const displayLat = Number((centerLat + offsetLat).toFixed(6));
      const displayLng = Number((centerLng + offsetLng).toFixed(6));
      const baseSvg = projectLatLngToSvg(item.v.lat, item.v.lng, item.v);
      const svgPoint = baseSvg
        ? {
            x: Number((baseSvg.x + dx).toFixed(2)),
            y: Number((baseSvg.y + dy).toFixed(2)),
            anchorX: baseSvg.x,
            anchorY: baseSvg.y,
            zone: baseSvg.zone,
          }
        : null;

      results[item.origIdx] = {
        ...item.v,
        isSpiderfied: true,
        clusterSize: n,
        clusterIndex: k,
        angleRad: Number(angleRad.toFixed(4)),
        dx,
        dy,
        offsetLat,
        offsetLng,
        displayLat,
        displayLng,
        svgPoint,
      };
    });
  }

  return results;
}

const EARTH_RADIUS_KM = 6371;
export const FLIGHT_DISTANCE_THRESHOLD_KM = 700;

/**
 * Computes the great-circle Haversine distance in kilometers between two WGS84 points.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number}
 */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  if (
    typeof lat1 !== "number" ||
    typeof lng1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lng2 !== "number"
  ) {
    return 0;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

export function lookupVenueProfile(venueName, venueProfilesMap) {
  if (!venueName || !venueProfilesMap) return null;
  if (venueProfilesMap instanceof Map) return venueProfilesMap.get(venueName) ?? null;
  if (Array.isArray(venueProfilesMap)) {
    return venueProfilesMap.find((v) => v.canonical === venueName || v.id === venueName) ?? null;
  }
  if (typeof venueProfilesMap === "object") return venueProfilesMap[venueName] ?? null;
  return null;
}

function isStubShowRecord(show) {
  if (!show) return false;
  if (typeof show.isStub === "boolean") return show.isStub;
  if (Array.isArray(show.setlist)) {
    const hasTracks = show.setlist.some((i) => i.songId || i.title);
    return !hasTracks;
  }
  if (show.diff && Array.isArray(show.diff.skip) && show.diff.skip.length >= 10 && (!show.diff.insert || show.diff.insert.length === 0)) {
    return true;
  }
  return false;
}

function classifyTransitMode(fromStop, toStop) {
  // 1. Same venue consecutive days -> stay
  if (fromStop.venue && toStop.venue && fromStop.venue === toStop.venue) {
    return "stay";
  }

  const fromOverseas =
    fromStop.region === "海外" || OVERSEAS_COUNTRIES.includes(fromStop.prefecture);
  const toOverseas =
    toStop.region === "海外" || OVERSEAS_COUNTRIES.includes(toStop.prefecture);

  // 2a. Any endpoint is Overseas -> flight
  if (fromOverseas || toOverseas) {
    return "flight";
  }

  // 2b. Crossing sea to/from Okinawa -> flight
  const fromOkinawa = fromStop.prefecture === "沖繩縣";
  const toOkinawa = toStop.prefecture === "沖繩縣";
  if (fromOkinawa !== toOkinawa) {
    return "flight";
  }

  // 2c. Crossing Tsugaru Strait to/from Hokkaido -> flight (intra-Hokkaido remains overland van)
  const fromHokkaido = fromStop.prefecture === "北海道";
  const toHokkaido = toStop.prefecture === "北海道";
  if (fromHokkaido !== toHokkaido) {
    return "flight";
  }

  // 3. Domestic Japan interconnected highway road network (Honshu, Shikoku via Seto Bridges,
  //    Kyushu via Kanmon Bridge/Tunnel, and intra-Hokkaido routes):
  //    Bands and production crews drive their tour vans across mainland expressways regardless of distance.
  return "van";
}

/**
 * Builds a deterministic chronological Tour / Career Journey Sequence from a list of shows,
 * automatically isolating virtual livestreams, optionally filtering TV broadcasts,
 * retaining 100% of stub shows, and classifying each leg into `stay`, `van`, or `flight` (ADR-0124).
 *
 * @param {Array<object>} shows
 * @param {Map<string, object>|Array<object>|object} [venueProfilesMap]
 * @param {object} [options]
 * @param {boolean} [options.includeTvBroadcasts=false]
 * @param {number} [options.flightDistanceThresholdKm=700]
 * @returns {{
 *   stops: Array<object>,
 *   transitions: Array<object>,
 *   virtualShows: Array<object>,
 *   excludedTvCount: number,
 *   summary: {
 *     totalStops: number,
 *     virtualCount: number,
 *     excludedTvCount: number,
 *     stayCount: number,
 *     vanCount: number,
 *     flightCount: number,
 *     totalDistanceKm: number
 *   }
 * }}
 */
export function buildJourneySequence(shows = [], venueProfilesMap = null, options = {}) {
  const includeTvBroadcasts = options.includeTvBroadcasts === true;

  const virtualShows = [];
  const physicalCandidates = [];
  let excludedTvCount = 0;

  for (const rawEntry of shows ?? []) {
    const s = rawEntry?.show ? { ...rawEntry.show, unitType: rawEntry.unitType ?? rawEntry.show.unitType, unitId: rawEntry.unitId ?? rawEntry.show.unitId, unitTitle: rawEntry.unitTitle ?? rawEntry.show.unitTitle } : rawEntry;
    if (!s) continue;

    const venueName = s.venue || "";
    const profile = lookupVenueProfile(venueName, venueProfilesMap);
    const category = s.unitType || s.category || s.type || "";

    if (isVirtualEntity(s, profile)) {
      virtualShows.push({
        showId: s.id,
        date: s.date,
        venue: venueName,
        city: s.city || profile?.city || "線上直播",
        title: s.title || s.unitTitle || "",
        unitId: s.unitId || null,
        isVirtual: true,
      });
      continue;
    }

    const isTv = category === "電視演出" || category === "TV拼盤";
    if (isTv && !includeTvBroadcasts) {
      excludedTvCount += 1;
      continue;
    }

    const lat = typeof s.lat === "number" ? s.lat : (profile?.lat ?? null);
    const lng = typeof s.lng === "number" ? s.lng : (profile?.lng ?? null);
    const prefecture = s.prefecture || profile?.prefecture || "";
    const city = s.city || profile?.city || "";
    const region = s.region || profile?.region || "";
    const hubId = profile?.hubId || (prefecture && city ? `${prefecture}::${city}` : null);

    physicalCandidates.push({
      showId: s.id,
      date: s.date || "",
      venue: venueName,
      city,
      prefecture,
      region,
      hubId,
      lat,
      lng,
      unitId: s.unitId || null,
      unitTitle: s.unitTitle || s.title || "",
      unitType: category,
      isStub: isStubShowRecord(s),
    });
  }

  virtualShows.sort((a, b) => (a.date || "").localeCompare(b.date || "") || String(a.showId || "").localeCompare(String(b.showId || "")));
  physicalCandidates.sort((a, b) => (a.date || "").localeCompare(b.date || "") || String(a.showId || "").localeCompare(String(b.showId || "")));

  const stops = physicalCandidates.map((stop, idx) => {
    const svgPoint = projectLatLngToSvg(stop.lat, stop.lng, stop);
    return {
      ...stop,
      index: idx,
      stopNumber: idx + 1,
      isFirst: idx === 0,
      isFinal: idx === physicalCandidates.length - 1,
      svgPoint,
    };
  });

  const transitions = [];
  let stayCount = 0;
  let vanCount = 0;
  let flightCount = 0;
  let totalDistanceKm = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const rawDistanceKm =
      from.venue === to.venue
        ? 0
        : haversineDistanceKm(from.lat, from.lng, to.lat, to.lng);

    const transitMode = classifyTransitMode(from, to);
    const distanceKm = transitMode === "stay" ? 0 : rawDistanceKm;

    if (transitMode === "stay") stayCount += 1;
    else if (transitMode === "flight") flightCount += 1;
    else vanCount += 1;

    totalDistanceKm += distanceKm;

    transitions.push({
      index: i,
      fromShowId: from.showId,
      toShowId: to.showId,
      fromDate: from.date,
      toDate: to.date,
      fromVenue: from.venue,
      toVenue: to.venue,
      fromCity: from.city,
      toCity: to.city,
      fromPrefecture: from.prefecture,
      toPrefecture: to.prefecture,
      fromCoords: [from.lat, from.lng],
      toCoords: [to.lat, to.lng],
      fromSvg: from.svgPoint,
      toSvg: to.svgPoint,
      transitMode,
      distanceKm,
    });
  }

  return {
    stops,
    transitions,
    virtualShows,
    excludedTvCount,
    summary: {
      totalStops: stops.length,
      virtualCount: virtualShows.length,
      excludedTvCount,
      stayCount,
      vanCount,
      flightCount,
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    },
  };
}
