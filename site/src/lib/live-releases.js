/**
 * Live Releases & Video Archive Mapping Domain Module (ADR-0142)
 * Pure domain functions for official concert releases indexing and localization.
 */

export const RELEASE_TYPE_LABELS = {
  standalone: {
    "zh-TW": "獨立影音發行",
    ja: "単独映像作品",
    en: "Standalone Video",
    ko: "단독 영상 발매",
  },
  bonus_video: {
    "zh-TW": "影音限定盤 / 特典映像",
    ja: "映像付き盤 / 特典映像",
    en: "Video Edition / Bonus Disc",
    ko: "영상 수록반 / 특전 영상",
  },
  digital_only: {
    "zh-TW": "串流現場專輯",
    ja: "配信限定ライブ音源",
    en: "Digital Streaming Album",
    ko: "스트리밍 라이브 앨범",
  },
};

export const FORMAT_LABELS = {
  bluray: "Blu-ray",
  dvd: "DVD",
  streaming_audio: "Spotify / Apple Music",
  streaming_video: "Streaming Video",
};

export const COVERAGE_LABELS = {
  full: {
    "zh-TW": "全場收錄",
    ja: "完全収録",
    en: "Full Concert",
    ko: "전곡 수록",
  },
  selected: {
    "zh-TW": "精選節錄",
    ja: "厳選収録",
    en: "Selected Highlights",
    ko: "선별 수록",
  },
};

/**
 * Localizes release type across 4 supported locales
 */
export function formatReleaseTypeLabel(type, locale = "zh-TW") {
  return RELEASE_TYPE_LABELS[type]?.[locale] || RELEASE_TYPE_LABELS[type]?.["zh-TW"] || type;
}

/**
 * Localizes recording coverage across 4 supported locales
 */
export function formatCoverageLabel(coverage, locale = "zh-TW") {
  return COVERAGE_LABELS[coverage]?.[locale] || COVERAGE_LABELS[coverage]?.["zh-TW"] || coverage;
}

/**
 * Formats format token to standardized display badge
 */
export function formatReleaseFormatLabel(format) {
  return FORMAT_LABELS[format] || format;
}

/**
 * Builds indexed lookup structures for live releases
 * @param {object} releasesData - { releases: [...] }
 * @param {object} showsIndex - Optional map of showId -> { id, tourId, ... }
 */
export function buildLiveReleaseIndex(releasesData, showsIndex = {}) {
  const releases = Array.isArray(releasesData?.releases) ? releasesData.releases : [];
  const releaseById = new Map();
  const releasesByShowId = new Map();
  const releasesByTourId = new Map();

  for (const rel of releases) {
    releaseById.set(rel.id, rel);

    for (const rec of rel.recordings || []) {
      if (!rec?.showId) continue;
      const showId = String(rec.showId);
      if (!releasesByShowId.has(showId)) {
        releasesByShowId.set(showId, []);
      }
      releasesByShowId.get(showId).push(rel);

      const show = showsIndex[showId];
      if (show?.tourId) {
        if (!releasesByTourId.has(show.tourId)) {
          releasesByTourId.set(show.tourId, []);
        }
        const tourList = releasesByTourId.get(show.tourId);
        if (!tourList.some((r) => r.id === rel.id)) {
          tourList.push(rel);
        }
      }
    }
  }

  return {
    getAllReleases: () => [...releases].sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || "")),
    getReleaseById: (id) => releaseById.get(id) || null,
    getReleasesForShow: (showId) => releasesByShowId.get(String(showId)) || [],
    getReleasesForTour: (tourId) => releasesByTourId.get(tourId) || [],
    getReleasesByType: (type) => releases.filter((r) => r.releaseType === type).sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || "")),
  };
}
