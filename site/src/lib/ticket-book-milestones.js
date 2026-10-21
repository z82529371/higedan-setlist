import songsData from "../data/songs.json";
import { songUnreleased, shortUnitTitle, getSongAlbum } from "./domain.js";
import { ALBUM_ORDER } from "./constants.js";

/**
 * ticket-book-milestones.js — Dynamic Concert Ticket Book Milestones & Repertoire Engine
 *
 * Implements statistical metrics calculation for the concert ticket book (Issue #37, #46, ADR-0114, ADR-0116):
 * 1. 總場次 (totalShows)
 * 2. 跨越巡演數 (totalTours)
 * 3. 踩點場館數 (totalVenues)
 * 4. 足跡城市數 (totalCities)
 * 5. 現場歌曲解鎖覆蓋率 (unlockedSongCount, totalCatalogSongs, coveragePercentage) - 排除未發行曲目
 * 6. 個人現場神曲排行榜 Top 3 (topSongs: rank, songId, title, count)
 * 7. 最初與最近參戰紀錄 (earliestShow, latestShow)
 * 8. 參戰足跡全紀錄 (attendedShowsList)
 * 9. 現場曲庫解鎖成就圖鑑專輯分組 (albumGroups / songChecklist)
 */

const EXCLUDED_CHECKLIST_BUCKETS = new Set(["未發行曲目", "合作單曲"]);

function createAlbumGroup(album, songs) {
  const totalSongs = songs.length;
  const unlockedCount = songs.filter((s) => s.unlocked).length;
  const completionPercentage =
    totalSongs > 0 ? Math.round((unlockedCount / totalSongs) * 1000) / 10 : 0;

  return {
    album,
    songs,
    totalSongs,
    unlockedCount,
    completionPercentage,
  };
}

export function buildAlbumGroups(releasedCatalog, songPlayCounts = {}) {
  const songsByAlbum = new Map();
  for (const s of releasedCatalog) {
    if (!s || !s.id) continue;
    const album = getSongAlbum(s);
    if (EXCLUDED_CHECKLIST_BUCKETS.has(album)) continue;
    if (!songsByAlbum.has(album)) {
      songsByAlbum.set(album, []);
    }
    const count = songPlayCounts[s.id] || 0;
    songsByAlbum.get(album).push({
      id: s.id,
      title: s.title || s.name || s.id,
      album,
      unlocked: count > 0,
      count,
    });
  }

  const groups = [];
  const processedAlbums = new Set();

  for (const alb of ALBUM_ORDER) {
    if (EXCLUDED_CHECKLIST_BUCKETS.has(alb)) continue;
    if (songsByAlbum.has(alb)) {
      groups.push(createAlbumGroup(alb, songsByAlbum.get(alb)));
      processedAlbums.add(alb);
    }
  }

  for (const [alb, songs] of songsByAlbum.entries()) {
    if (!processedAlbums.has(alb) && !EXCLUDED_CHECKLIST_BUCKETS.has(alb)) {
      groups.push(createAlbumGroup(alb, songs));
    }
  }

  return groups;
}

export function computeTicketBookMilestones({
  attendedShows = [],
  unitData = null,
  showById = null,
  unitIdByShowId = null,
  allUsedSongs = null,
  songsCatalog = null,
} = {}) {
  const totalShows = Array.isArray(attendedShows) ? attendedShows.length : 0;
  const catalog = allUsedSongs || songsCatalog || songsData.songs || [];

  // Build a set of unreleased song IDs to exclude from coverage metrics
  const unreleasedIdSet = new Set(songUnreleased);
  for (const s of catalog) {
    if (s && s.unreleased && s.id) {
      unreleasedIdSet.add(s.id);
    }
  }

  // Released songs catalog (denominator for coverage percentage)
  // Excludes unreleased songs and collaboration singles from coverage metrics and checklist drawer
  const releasedCatalog = catalog.filter((s) => {
    if (!s || !s.id) return false;
    if (unreleasedIdSet.has(s.id) || s.unreleased) return false;
    if (getSongAlbum(s) === "合作單曲") return false;
    return true;
  });
  const totalCatalogSongs = releasedCatalog.length;
  const releasedSongIdSet = new Set(releasedCatalog.map((s) => s.id));

  if (totalShows === 0) {
    const albumGroups = buildAlbumGroups(releasedCatalog, {});
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
      attendedShowsList: [],
      albumGroups,
      songChecklist: albumGroups,
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
        shortTitle: unit ? shortUnitTitle(unit) : show?.title || key,
      });
    }

    // 5. Track songs from show setlist
    const items =
      unitEntry?.full?.get ? unitEntry.full.get(key) : Array.isArray(show?.setlist) ? show.setlist : null;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item && item.songId) {
          songPlayCounts[item.songId] = (songPlayCounts[item.songId] || 0) + 1;
          // Only add to unlocked set if part of released catalog (excludes unreleased and collaboration tracks)
          if (releasedSongIdSet.has(item.songId)) {
            unlockedSongIds.add(item.songId);
          }
        }
      }
    }
  }

  // Calculate coverage
  const unlockedSongCount = unlockedSongIds.size;
  const coveragePercentage =
    totalCatalogSongs > 0
      ? Math.round((unlockedSongCount / totalCatalogSongs) * 1000) / 10
      : 0;

  // Build catalog song title lookup
  const songTitleMap = new Map();
  for (const s of catalog) {
    if (s?.id) {
      songTitleMap.set(s.id, s.title || s.name || s.id);
    }
  }

  // Calculate top songs
  const sortedSongIds = Object.keys(songPlayCounts).sort((a, b) => {
    const diff = songPlayCounts[b] - songPlayCounts[a];
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  const topSongs = sortedSongIds.slice(0, 3).map((songId, index) => ({
    rank: index + 1,
    songId,
    title: songTitleMap.get(songId) || songId,
    count: songPlayCounts[songId],
  }));

  // Sort chronological for earliest/latest
  validShows.sort((a, b) => {
    const c = a.date.localeCompare(b.date);
    if (c !== 0) return c;
    return a.showKey.localeCompare(b.showKey);
  });

  const earliestShow = validShows.length > 0 ? validShows[0] : null;
  const latestShow = validShows.length > 0 ? validShows[validShows.length - 1] : null;

  const albumGroups = buildAlbumGroups(releasedCatalog, songPlayCounts);

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
    attendedShowsList: validShows,
    albumGroups,
    songChecklist: albumGroups,
  };
}
