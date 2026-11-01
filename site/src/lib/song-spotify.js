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
 * Resolves a raw song object or spotify container into a normalized spotify record.
 * Following ADR-0138 specifications.
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
      lives: [],
      live: null,
      defaultTrack: null,
    };
  }

  const raw = s.spotify;
  const studioTrackId = typeof raw.trackId === "string" && raw.trackId.trim() ? raw.trackId.trim() : null;

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
