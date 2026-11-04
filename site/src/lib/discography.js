/**
 * Studio Discography Domain Module (ADR-0144)
 * Pure domain indexing, filtering, and localization for official band discography.
 */

import { getSongCover, getHighResCoverUrl } from "./song-spotify.js";

export const DISCOGRAPHY_CATEGORY_LABELS = {
  physical_single: {
    "zh-TW": "實體單曲",
    ja: "CDシングル",
    en: "CD Single",
    ko: "CD 싱글",
  },
  digital_single: {
    "zh-TW": "數位單曲",
    ja: "配信限定シングル",
    en: "Digital Single",
    ko: "디지털 싱글",
  },
  collaboration_single: {
    "zh-TW": "合作單曲",
    ja: "コラボシングル",
    en: "Collab Single",
    ko: "콜라보 싱글",
  },
  ep: {
    "zh-TW": "EP / 迷你專輯",
    ja: "EP / ミニアルバム",
    en: "EP / Mini Album",
    ko: "EP / 미니 앨범",
  },
  album: {
    "zh-TW": "正規專輯",
    ja: "フルアルバム",
    en: "Studio Album",
    ko: "정규 앨범",
  },
};

/**
 * Localizes discography category across 4 supported locales
 */
export function formatDiscographyTypeLabel(category, locale = "zh-TW") {
  if (category === "album" && locale === "ko") return "정규/미니 앨범";
  return (
    DISCOGRAPHY_CATEGORY_LABELS[category]?.[locale] ||
    DISCOGRAPHY_CATEGORY_LABELS[category]?.["zh-TW"] ||
    category
  );
}

/**
 * Builds indexed lookup structures for studio discography
 * @param {object} discographyData - Discography SSOT object
 */
export function buildDiscographyIndex(discographyData = {}) {
  const allList = [];
  const byId = new Map();
  const byCategory = new Map();
  const bySongId = new Map();

  const ALBUM_LEAD_SONGS = {
    "album-traveler": "yesterday",
    "album-editorial": "editorial",
    "album-rejoice": "sharon",
    "album-escaparade": "115man-kiro-no-film",
    "album-love-and-peace": "sweet-tweet",
    "album-man-in-the-mirror": "coffee-to-syrup",
    "album-report": "itan-na-star",
    "album-traveler-instrumentals": "yesterday",
    "album-editorial-instrumentals": "editorial",
  };

  const addRelease = (raw, category) => {
    if (!raw) return;
    const tracks = Array.isArray(raw.tracks) ? raw.tracks : [];

    // Directly use official Spotify release cover (ADR-0143, ADR-0144)
    const leadSongId = ALBUM_LEAD_SONGS[raw.id] || tracks.find((tr) => tr?.songId)?.songId;
    const spCover = leadSongId ? getSongCover(leadSongId) : null;
    const coverUrl = raw.coverUrl || spCover?.coverUrl || null;
    const highResCoverUrl = coverUrl ? getHighResCoverUrl(coverUrl) : null;

    const item = {
      ...raw,
      category,
      coverUrl,
      highResCoverUrl,
      tracks,
    };
    allList.push(item);
    if (item.id) {
      byId.set(item.id, item);
    }
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category).push(item);

    for (const tr of item.tracks) {
      if (tr?.songId) {
        if (!bySongId.has(tr.songId)) {
          bySongId.set(tr.songId, item);
        }
      }
    }
  };

  // 1. Physical Singles
  for (const s of discographyData.physicalSingles || []) {
    addRelease(s, "physical_single");
  }

  // 2. Digital Singles
  for (const s of discographyData.digitalSingles || []) {
    addRelease(s, "digital_single");
  }

  // 3. Collaboration Singles
  for (const s of discographyData.collaborationSingles || []) {
    addRelease(s, "collaboration_single");
  }

  // 4. EPs
  for (const ep of discographyData.eps || []) {
    addRelease(ep, "ep");
  }

  // 4. Albums
  const albums = discographyData.albums || {};
  for (const a of albums.fullAlbums || []) {
    addRelease(a, "album");
  }
  for (const m of albums.miniAlbums || []) {
    addRelease(m, "album");
  }
  for (const d of albums.digitalAlbums || []) {
    // Only include studio instrumental or special albums, not live duplicates
    if (d.index !== "live-1") {
      addRelease(d, "album");
    }
  }

  // Sort reverse chronologically (newest release first)
  allList.sort((a, b) => {
    const dateA = a.releaseDate || "";
    const dateB = b.releaseDate || "";
    return dateB.localeCompare(dateA);
  });

  return {
    getAllReleases: () => allList,
    getReleaseById: (id) => byId.get(id) || null,
    getReleasesByCategory: (category) => {
      if (!category || category === "all") return allList;
      return byCategory.get(category) || [];
    },
    findReleaseForSong: (songId) => bySongId.get(songId) || null,
  };
}
