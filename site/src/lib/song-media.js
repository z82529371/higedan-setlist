import songsData from "../data/songs.json";

/**
 * Parses timestamp representation into non-negative integer seconds.
 * Supports:
 * - integer or float seconds: 135 -> 135
 * - numeric strings: "135" -> 135
 * - "MM:SS" strings: "02:15" -> 135
 * - "HH:MM:SS" strings: "01:02:15" -> 3735
 * Returns 0 for invalid or empty inputs.
 */
export function parseTimestamp(start) {
  if (start == null) return 0;
  if (typeof start === "number") {
    return Number.isFinite(start) && start > 0 ? Math.floor(start) : 0;
  }
  if (typeof start !== "string") return 0;

  const trimmed = start.trim();
  if (!trimmed) return 0;

  // Pure integer / numeric check
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // MM:SS or HH:MM:SS
  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    if (!Number.isNaN(min) && !Number.isNaN(sec) && min >= 0 && sec >= 0) {
      return min * 60 + sec;
    }
  } else if (parts.length === 3) {
    const hr = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10);
    const sec = parseInt(parts[2], 10);
    if (
      !Number.isNaN(hr) &&
      !Number.isNaN(min) &&
      !Number.isNaN(sec) &&
      hr >= 0 &&
      min >= 0 &&
      sec >= 0
    ) {
      return hr * 3600 + min * 60 + sec;
    }
  }

  return 0;
}

/**
 * Formats non-negative integer seconds into "MM:SS" or "HH:MM:SS" representation.
 */
export function formatTimestamp(seconds) {
  const s = parseTimestamp(seconds);
  const hr = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (hr > 0) {
    return `${hr.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Builds standard YouTube embed URL with origin, JS API support, and optional start/end interval
 */
export function buildYouTubeEmbedUrl(youtubeId, startSeconds = 0, autoplay = true, endSeconds = 0) {
  if (!youtubeId) return "";
  const sec = parseTimestamp(startSeconds);
  const end = parseTimestamp(endSeconds);
  const originParam =
    typeof window !== "undefined" && window.location?.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : "";
  const ap = autoplay ? 1 : 0;
  let base = `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}?autoplay=${ap}&rel=0&enablejsapi=1${originParam}`;
  if (sec > 0) {
    base += `&start=${sec}`;
  }
  if (end > 0 && end > sec) {
    base += `&end=${end}`;
  }
  return base;
}

/**
 * Builds standard YouTube watch URL with optional timestamp query
 */
export function buildYouTubeWatchUrl(youtubeId, startSeconds = 0) {
  if (!youtubeId) return "";
  const sec = parseTimestamp(startSeconds);
  const base = `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`;
  return sec > 0 ? `${base}&t=${sec}s` : base;
}

/**
 * Resolves raw song object or media payload into a normalized media record.
 */
export function resolveSongMedia(s) {
  if (!s) {
    return {
      songId: "",
      hasMedia: false,
      hasLive: false,
      hasMultipleLives: false,
      hasMv: false,
      hasMultipleMvs: false,
      lives: [],
      live: null,
      mvs: [],
      mv: null,
      defaultTrack: null,
    };
  }

  const normalizeSingleLive = (raw) => {
    if (!raw) return null;
    if (typeof raw === "string") {
      return {
        youtubeId: raw,
        title: "",
        shortTitle: "",
        showId: null,
        start: 0,
        end: 0,
        isExcerpt: false,
        durationSeconds: 0,
        timeRangeText: "",
      };
    }
    if (typeof raw === "object" && raw.youtubeId) {
      const start = parseTimestamp(raw.start);
      const end = parseTimestamp(raw.end);
      const isExcerpt = end > 0 && end > start;
      const durationSeconds = isExcerpt ? end - start : 0;
      return {
        youtubeId: raw.youtubeId,
        title: raw.title || "",
        shortTitle: raw.shortTitle || raw.title || "",
        showId: raw.showId || null,
        start,
        end: isExcerpt ? end : 0,
        isExcerpt,
        durationSeconds,
        timeRangeText: isExcerpt ? `${formatTimestamp(start)} ~ ${formatTimestamp(end)}` : "",
      };
    }
    return null;
  };

  // If s.media container is explicitly present, it is the single source of truth (ADR-0135).
  // Otherwise fallback to legacy root-level s.live / s.mv.
  let rawLives = [];
  if (s.media && s.media.live !== undefined) {
    rawLives = Array.isArray(s.media.live)
      ? s.media.live
      : s.media.live
        ? [s.media.live]
        : [];
  } else if (Array.isArray(s.live)) {
    rawLives = s.live;
  } else if (s.live) {
    rawLives = [s.live];
  } else if (Array.isArray(s.lives)) {
    rawLives = s.lives;
  }

  const lives = rawLives.map(normalizeSingleLive).filter(Boolean);
  const live = lives[0] || null;
  const hasLive = lives.length > 0;
  const hasMultipleLives = lives.length > 1;

  let rawMvs = [];
  if (s.media && s.media.mv !== undefined) {
    rawMvs = Array.isArray(s.media.mv)
      ? s.media.mv
      : s.media.mv
        ? [s.media.mv]
        : [];
  } else if (Array.isArray(s.mv)) {
    rawMvs = s.mv;
  } else if (s.mv) {
    rawMvs = [s.mv];
  } else if (Array.isArray(s.mvs)) {
    rawMvs = s.mvs;
  }

  const normalizeSingleMv = (raw) => {
    if (!raw) return null;
    if (typeof raw === "string") {
      return {
        youtubeId: raw,
        title: s.title || "",
        shortTitle: "",
        start: 0,
        end: 0,
        isExcerpt: false,
        durationSeconds: 0,
        timeRangeText: "",
        subType: "mv",
      };
    }
    if (typeof raw === "object" && raw.youtubeId) {
      const start = parseTimestamp(raw.start);
      const end = parseTimestamp(raw.end);
      const isExcerpt = end > 0 && end > start;
      const durationSeconds = isExcerpt ? end - start : 0;
      let subType = raw.subType || "mv";
      const titleLower = (raw.title || "").toLowerCase();
      const shortLower = (raw.shortTitle || "").toLowerCase();
      const textToScan = `${titleLower} ${shortLower}`;
      if (!raw.subType) {
        if (textToScan.includes("lyric") || textToScan.includes("歌詞")) {
          subType = "lyric";
        } else if (textToScan.includes("short") || textToScan.includes("短版")) {
          subType = "short";
        } else if (textToScan.includes("film") || textToScan.includes("微電影")) {
          subType = "film";
        } else if (textToScan.includes("anime") || textToScan.includes("動畫") || textToScan.includes("アニメ")) {
          subType = "anime";
        } else if (isExcerpt) {
          subType = "crossfade";
        }
      }
      return {
        youtubeId: raw.youtubeId,
        title: raw.title || s.title || "",
        shortTitle: raw.shortTitle || "",
        start,
        end: isExcerpt ? end : 0,
        isExcerpt,
        durationSeconds,
        timeRangeText: isExcerpt ? `${formatTimestamp(start)} ~ ${formatTimestamp(end)}` : "",
        subType,
      };
    }
    return null;
  };

  const mvs = rawMvs.map(normalizeSingleMv).filter(Boolean);
  const mv = mvs[0] || null;
  const hasMv = mvs.length > 0;
  const hasMultipleMvs = mvs.length > 1;

  const hasMedia = hasLive || hasMv;
  const defaultTrack = hasLive ? "live" : hasMv ? "mv" : null;

  return {
    songId: s.id,
    hasMedia,
    hasLive,
    hasMultipleLives,
    hasMv,
    hasMultipleMvs,
    lives,
    live,
    mvs,
    mv,
    defaultTrack,
  };
}

const songMediaMap = new Map();
for (const s of songsData.songs) {
  songMediaMap.set(s.id, resolveSongMedia(s));
}

/**
 * Retrieves normalized media information for a given songId.
 */
export function getSongMedia(songId) {
  if (!songId) {
    return {
      songId: "",
      hasMedia: false,
      hasLive: false,
      hasMultipleLives: false,
      hasMv: false,
      hasMultipleMvs: false,
      lives: [],
      live: null,
      mvs: [],
      mv: null,
      defaultTrack: null,
    };
  }
  return (
    songMediaMap.get(songId) || {
      songId,
      hasMedia: false,
      hasLive: false,
      hasMultipleLives: false,
      hasMv: false,
      hasMultipleMvs: false,
      lives: [],
      live: null,
      mvs: [],
      mv: null,
      defaultTrack: null,
    }
  );
}
