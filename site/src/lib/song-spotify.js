import songsData from "../data/songs.json";

/**
 * Validates a Spotify Base62 Track ID (22 alphanumeric characters).
 */
export function isValidSpotifyTrackId(id) {
  return typeof id === "string" && /^[a-zA-Z0-9]{22}$/.test(id.trim());
}

/**
 * Builds standard Spotify iframe embed URL.
 * Standard compact player size is 152px height (or 80px min).
 */
export function buildSpotifyEmbedUrl(trackId) {
  if (!trackId || typeof trackId !== "string") return "";
  const trimmed = trackId.trim();
  if (!trimmed) return "";
  return `https://open.spotify.com/embed/track/${encodeURIComponent(trimmed)}?utm_source=generator`;
}

/**
 * Builds standard Spotify watch/listen URL targeting official track.
 */
export function buildSpotifyTrackUrl(trackId) {
  if (!trackId || typeof trackId !== "string") return "";
  const trimmed = trackId.trim();
  if (!trimmed) return "";
  return `https://open.spotify.com/track/${encodeURIComponent(trimmed)}`;
}

/**
 * Derives a high-resolution 640x640 Retina album jacket URL from Spotify CDN thumbnail URL (ADR-0143).
 * Spotify CDN naming maps `ab67616d00001e02` (300x300) to `ab67616d0000b273` (640x640).
 */
export function getHighResCoverUrl(coverUrl) {
  if (!coverUrl || typeof coverUrl !== "string") return "";
  return coverUrl.replace(/ab67616d00001e02/, "ab67616d0000b273");
}

/**
 * Resolves a raw song object or spotify container into a normalized spotify record.
 * Following ADR-0138 and ADR-0143 specifications.
 */
export function resolveSongSpotify(s) {
  if (!s || !s.spotify) {
    return {
      songId: s?.id || "",
      hasSpotify: false,
      hasStudio: false,
      hasLive: false,
      hasMultipleLives: false,
      trackId: null,
      coverUrl: null,
      highResCoverUrl: null,
      lives: [],
      live: null,
      defaultTrack: null,
    };
  }

  const raw = s.spotify;
  const studioTrackId = typeof raw.trackId === "string" && raw.trackId.trim() ? raw.trackId.trim() : null;
  const coverUrl = typeof raw.coverUrl === "string" && raw.coverUrl.trim() ? raw.coverUrl.trim() : null;
  const highResCoverUrl = coverUrl ? getHighResCoverUrl(coverUrl) : null;

  let rawLives = [];
  if (Array.isArray(raw.live)) {
    rawLives = raw.live;
  } else if (raw.live && typeof raw.live === "object") {
    rawLives = [raw.live];
  }

  const normalizedLives = rawLives
    .filter((l) => l && typeof l.trackId === "string" && l.trackId.trim())
    .map((l) => ({
      trackId: l.trackId.trim(),
      title: l.title || l.shortTitle || "",
      shortTitle: l.shortTitle || l.title || "",
      showId: l.showId ? String(l.showId) : null,
    }));

  const hasStudio = !!studioTrackId;
  const hasLive = normalizedLives.length > 0;
  const hasSpotify = hasStudio || hasLive;

  return {
    songId: s.id || "",
    hasSpotify,
    hasStudio,
    hasLive,
    hasMultipleLives: normalizedLives.length > 1,
    trackId: studioTrackId,
    coverUrl,
    highResCoverUrl,
    lives: normalizedLives,
    live: normalizedLives[0] || null,
    defaultTrack: hasStudio ? "studio" : hasLive ? "live" : null,
  };
}

// Pre-indexed map by songId for sub-millisecond retrieval
const spotifyBySongId = new Map(
  (songsData.songs || []).map((s) => [s.id, resolveSongSpotify(s)])
);

/**
 * Retrieves the normalized Spotify record for a song by songId.
 */
export function getSongSpotify(songId) {
  if (!songId) return resolveSongSpotify(null);
  return (
    spotifyBySongId.get(songId) ||
    resolveSongSpotify(songsData.songs?.find((s) => s.id === songId))
  );
}

/**
 * Retrieves the official album jacket cover for a song by songId (ADR-0143).
 * Returns `{ coverUrl, highResCoverUrl }` or null if unreleased / no cover.
 */
export function getSongCover(songId) {
  const spotify = getSongSpotify(songId);
  if (!spotify || !spotify.coverUrl) return null;
  return {
    coverUrl: spotify.coverUrl,
    highResCoverUrl: spotify.highResCoverUrl || spotify.coverUrl,
  };
}
