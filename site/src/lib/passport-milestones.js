import songsData from "../data/songs.json";

/**
 * passport-milestones.js — Dynamic Concert Passport Milestones & Repertoire Engine
 *
 * Implements statistical metrics calculation for the concert passport (Issue #37):
 * 1. 總場次 (totalShows)
 * 2. 跨越巡演數 (totalTours)
 * 3. 踩點場館數 (totalVenues)
 * 4. 足跡城市數 (totalCities)
 * 5. 現場歌曲解鎖覆蓋率 (unlockedSongCount, totalCatalogSongs, coveragePercentage)
 * 6. 個人現場神曲排行榜 Top 3 (topSongs: rank, songId, title, count)
 * 7. 最初與最近參戰紀錄 (earliestShow, latestShow)
 */

export function computePassportMilestones({
  attendedShows = [],
  unitData = null,
  showById = null,
  unitIdByShowId = null,
  allUsedSongs = null,
  songsCatalog = null,
} = {}) {
  const totalShows = Array.isArray(attendedShows) ? attendedShows.length : 0;
  const catalog = allUsedSongs || songsCatalog || songsData.songs || [];
  const totalCatalogSongs = catalog.length;

  if (totalShows === 0) {
    return {
      totalShows: 0,
      totalTours: 0,
      totalVenues: 0,
      totalCities: 0,
      unlockedSongCount: 0,
      totalCatalogSongs,
      coveragePercentage: 0,
      topSongs: [],
      earliestShow: null,
      latestShow: null,
    };
  }

  const tourIds = new Set();
  const venueNames = new Set();
  const cities = new Set();
  const unlockedSongIds = new Set();
  const songPlayCounts = {};
  const validShows = [];

  for (const entry of attendedShows) {
    const key = entry?.showKey;
    if (!key) continue;

    const show = showById?.get ? showById.get(key) : showById?.[key];
    const unitId = unitIdByShowId?.get ? unitIdByShowId.get(key) : unitIdByShowId?.[key];
    const unitEntry = unitId && unitData?.get ? unitData.get(unitId) : unitId ? unitData?.[unitId] : null;
    const unit = unitEntry?.unit || null;

    // 1. Tour determination: strictly rely on canonical isTour domain flag
    if (unitId && (unitEntry?.isTour || unit?.isTour)) {
      tourIds.add(unitId);
    }

    // 2. Venue determination
    const venueName = show?.venue;
    if (venueName && typeof venueName === "string") {
      venueNames.add(venueName);
    }

    // 3. City determination
    const city = show?.city;
    if (city && typeof city === "string") {
      cities.add(city);
    }

    // 4. Effective date tracking
    const effectiveDate = show?.date || entry.attendedAt;
    if (effectiveDate && effectiveDate !== "9999-99-99") {
      validShows.push({
        showKey: key,
        date: effectiveDate,
        show,
        unit,
        venue: venueName || "",
        city: city || "",
        title: unit?.title || show?.title || key,
      });
    }

    // 5. Track songs from show setlist
    const items =
      unitEntry?.full?.get ? unitEntry.full.get(key) : Array.isArray(show?.setlist) ? show.setlist : null;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item && item.songId) {
          unlockedSongIds.add(item.songId);
          songPlayCounts[item.songId] = (songPlayCounts[item.songId] || 0) + 1;
        }
      }
    }
  }

  // 6. Song catalog & coverage computation
  const unlockedSongCount = unlockedSongIds.size;
  const coveragePercentage =
    totalCatalogSongs > 0 ? Math.round((unlockedSongCount / totalCatalogSongs) * 1000) / 10 : 0;

  // Build title lookup
  const songTitleMap = new Map();
  if (Array.isArray(catalog)) {
    for (const s of catalog) {
      if (s?.id && s?.title) {
        songTitleMap.set(s.id, s.title);
      }
    }
  }

  // 7. Top 3 Live Songs
  const topSongs = Object.entries(songPlayCounts)
    .map(([songId, count]) => {
      const title = songTitleMap.get(songId) || songId;
      return { songId, count, title };
    })
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .slice(0, 3)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // 8. Earliest & Latest Shows
  validShows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const earliestShow = validShows.length > 0 ? validShows[0] : null;
  const latestShow = validShows.length > 0 ? validShows[validShows.length - 1] : null;

  return {
    totalShows,
    totalTours: tourIds.size,
    totalVenues: venueNames.size,
    totalCities: cities.size,
    unlockedSongCount,
    totalCatalogSongs,
    coveragePercentage,
    topSongs,
    earliestShow,
    latestShow,
  };
}
