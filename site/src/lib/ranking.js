import { trackKey } from "./track.js";
import { getSongAlbum, allUnits as domainAllUnits, getUnitTypeLabel } from "./domain.js";

/**
 * Assigns ranks to a sorted list of items.
 * Items with identical counts receive the same rank.
 */
function assignRanks(items) {
  let currentRank = 1;
  return items.map((item, index) => {
    if (index > 0 && item.count < items[index - 1].count) {
      currentRank = index + 1;
    }
    return {
      ...item,
      rank: currentRank,
    };
  });
}

/**
 * Computes all-time and sub-board concert rankings.
 *
 * @param {object} params
 * @param {Array} params.allUsedSongs
 * @param {Array} params.allVenues
 * @param {Map} params.trackShows
 * @param {Map} params.showById
 * @returns {object} { allTimeSongs, oneManSongs, festivalSongs, topVenues }
 */
export function computeRankings({
  allUnits = domainAllUnits,
  allUsedSongs = [],
  allVenues = [],
  trackShows = new Map(),
  showById = new Map(),
}) {
  // Compute total shows per category for Play Rate calculations
  let totalAllTimeShows = 0;
  let totalOneManShows = 0;
  let totalFestivalShows = 0;

  for (const u of (allUnits || [])) {
    const showCount = (u.shows || []).length;
    totalAllTimeShows += showCount;
    const uType = getUnitTypeLabel(u);
    if (uType === "巡演專場") {
      totalOneManShows += showCount;
    } else if (uType === "音樂祭" || uType === "音樂節") {
      totalFestivalShows += showCount;
    }
  }

  if (totalAllTimeShows === 0) totalAllTimeShows = showById.size || 1;
  if (totalOneManShows === 0) totalOneManShows = 1;
  if (totalFestivalShows === 0) totalFestivalShows = 1;

  // 1. Process all songs with their show appearances
  const songStats = [];
  const oneManStats = [];
  const festivalStats = [];

  for (const song of allUsedSongs) {
    const key = trackKey("song", song.id);
    const appearances = trackShows.get(key) || [];
    if (appearances.length === 0) continue;

    let oneManCount = 0;
    let festivalCount = 0;
    const years = [];

    for (const app of appearances) {
      if (app.unitType === "巡演專場") {
        oneManCount += 1;
      } else if (app.unitType === "音樂祭" || app.unitType === "音樂節") {
        festivalCount += 1;
      }

      const show = showById.get(app.showId);
      const dateStr = show?.date || app.item?.date;
      if (dateStr && typeof dateStr === "string") {
        const yr = dateStr.slice(0, 4);
        if (yr && yr !== "9999" && !isNaN(Number(yr))) {
          years.push(yr);
        }
      }
    }

    years.sort();
    const firstYear = years.length > 0 ? years[0] : null;
    const latestYear = years.length > 0 ? years[years.length - 1] : null;
    const album = getSongAlbum(song);

    const baseItem = {
      id: song.id,
      title: song.title,
      album,
      firstYear,
      latestYear,
    };

    songStats.push({
      ...baseItem,
      count: appearances.length,
    });

    if (oneManCount > 0) {
      oneManStats.push({
        ...baseItem,
        count: oneManCount,
      });
    }

    if (festivalCount > 0) {
      festivalStats.push({
        ...baseItem,
        count: festivalCount,
      });
    }
  }

  // Sort descending by count, then by title ascending
  const songSortFn = (a, b) =>
    b.count - a.count || String(a.title || a.id || "").localeCompare(String(b.title || b.id || ""));

  songStats.sort(songSortFn);
  oneManStats.sort(songSortFn);
  festivalStats.sort(songSortFn);

  const maxAllTime = songStats[0]?.count || 1;
  const maxOneMan = oneManStats[0]?.count || 1;
  const maxFestival = festivalStats[0]?.count || 1;

  const allTimeSongs = assignRanks(songStats).map((s) => ({
    ...s,
    playRate: totalAllTimeShows > 0 ? (s.count / totalAllTimeShows) * 100 : 0,
    percent: maxAllTime > 0 ? (s.count / maxAllTime) * 100 : 0,
  }));

  const oneManSongs = assignRanks(oneManStats).map((s) => ({
    ...s,
    playRate: totalOneManShows > 0 ? (s.count / totalOneManShows) * 100 : 0,
    percent: maxOneMan > 0 ? (s.count / maxOneMan) * 100 : 0,
  }));

  const festivalSongs = assignRanks(festivalStats).map((s) => ({
    ...s,
    playRate: totalFestivalShows > 0 ? (s.count / totalFestivalShows) * 100 : 0,
    percent: maxFestival > 0 ? (s.count / maxFestival) * 100 : 0,
  }));

  // 2. Process top venues
  const venueStats = [];
  for (const v of allVenues) {
    const showCount = v.shows?.length || 0;
    if (showCount === 0) continue;
    venueStats.push({
      name: v.name,
      country: v.country || "日本",
      prefecture: v.prefecture || null,
      city: v.city || null,
      count: showCount,
    });
  }

  const venueSortFn = (a, b) =>
    b.count - a.count || String(a.name || "").localeCompare(String(b.name || ""));

  venueStats.sort(venueSortFn);
  const maxVenue = venueStats[0]?.count || 1;
  const topVenues = assignRanks(venueStats).map((v) => ({
    ...v,
    playRate: totalAllTimeShows > 0 ? (v.count / totalAllTimeShows) * 100 : 0,
    percent: maxVenue > 0 ? (v.count / maxVenue) * 100 : 0,
  }));

  return {
    allTimeSongs,
    oneManSongs,
    festivalSongs,
    topVenues,
    totals: {
      allTime: totalAllTimeShows,
      oneMan: totalOneManShows,
      festival: totalFestivalShows,
    },
  };
}
