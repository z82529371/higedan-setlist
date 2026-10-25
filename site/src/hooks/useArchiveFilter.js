import { useState, useMemo } from "react";
import {
  ALBUM_ORDER,
  PERFORMANCE_CATEGORIES,
} from "../lib/constants.js";
import {
  allUnits,
  getSongAlbum,
  unitEarliest,
  getUnitTypeLabel,
} from "../lib/domain.js";
import { trackKey } from "../lib/track.js";
import { PAGE_SIZE } from "../components/navigators/PaginationPills.jsx";

export { PERFORMANCE_CATEGORIES };


export function useArchiveFilter({
  unitData,
  trackShows,
  globalVenueShows,
  allUsedSongs,
  allVenues,
  initialUnitId,
  initialSongId,
  _initialVenueName,
  currentUnit,
}) {
  const initialUnit = unitData.get(initialUnitId)?.unit;

  const [selCategory, setSelCategory] = useState(() => {
    if (initialUnit) return getUnitTypeLabel(initialUnit);
    return "巡演專場";
  });

  const [selYear, setSelYear] = useState(() => {
    if (initialUnit) {
      const y = unitEarliest(initialUnit).split("-")[0];
      if (y && y !== "9999") return y;
    }
    return "2024";
  });

  const [songSortMode, setSongSortMode] = useState("album"); // "album" | "count"
  const [selAlbum, setSelAlbum] = useState(() => {
    const sObj = allUsedSongs.find((s) => s.id === initialSongId);
    return sObj ? getSongAlbum(sObj) : ALBUM_ORDER[0];
  });

  const [venueSortMode, setVenueSortMode] = useState("map"); // "map" | "count"
  const [selRegion, setSelRegion] = useState("");

  // 10-item pagination states
  const [unitPage, setUnitPage] = useState(0);
  const [showPage, setShowPage] = useState(0);
  const [songPage, setSongPage] = useState(0);
  const [venuePage, setVenuePage] = useState(0);

  const totalAllShows = useMemo(() => {
    return allUnits.reduce((acc, u) => acc + (u.shows?.length || 0), 0);
  }, []);

  // Units indexed by performance category
  const unitsByCategory = useMemo(() => {
    const map = {};
    for (const cat of PERFORMANCE_CATEGORIES) {
      map[cat] = [];
    }
    for (const u of allUnits) {
      const t = getUnitTypeLabel(u);
      if (!map[t]) map[t] = [];
      map[t].push(u);
    }
    return map;
  }, []);

  // Category counts and statistics
  const categoryStats = useMemo(() => {
    const stats = {};
    for (const cat of PERFORMANCE_CATEGORIES) {
      const list = unitsByCategory[cat] || [];
      stats[cat] = {
        units: list.length,
        shows: list.reduce((acc, u) => acc + (u.shows?.length || 0), 0),
      };
    }
    return stats;
  }, [unitsByCategory]);

  // Available years and show counts for current category
  const yearStats = useMemo(() => {
    const map = new Map();
    for (const u of allUnits) {
      if (getUnitTypeLabel(u) === selCategory) {
        const y = unitEarliest(u).split("-")[0];
        if (y && y !== "9999") {
          const prev = map.get(y) || { shows: 0, units: 0 };
          prev.shows += u.shows?.length || 0;
          prev.units += 1;
          map.set(y, prev);
        }
      }
    }
    return map;
  }, [selCategory]);

  const availableYears = useMemo(() => {
    return Array.from(yearStats.keys()).sort((a, b) => b.localeCompare(a));
  }, [yearStats]);

  const handleCategoryClick = (cat) => {
    setSelCategory(cat);
    const catUnits = unitsByCategory[cat] || [];
    const catYears = Array.from(
      new Set(
        catUnits
          .map((u) => unitEarliest(u).split("-")[0])
          .filter((y) => y && y !== "9999")
      )
    ).sort((a, b) => b.localeCompare(a));

    if (catYears.length > 0 && !catYears.includes(selYear)) {
      setSelYear(catYears[0]);
    }
    setUnitPage(0);
  };

  const filteredUnits = useMemo(() => {
    const list = unitsByCategory[selCategory] || [];
    return list.filter((u) => {
      const y = unitEarliest(u).split("-")[0];
      return y === selYear;
    });
  }, [unitsByCategory, selCategory, selYear]);

  // Memoized sorted songs by performance count (High to Low)
  const songsSortedByCount = useMemo(() => {
    return [...allUsedSongs].sort((a, b) => {
      const cntA = trackShows.get(trackKey("song", a.id))?.length || 0;
      const cntB = trackShows.get(trackKey("song", b.id))?.length || 0;
      return cntB - cntA;
    });
  }, [allUsedSongs, trackShows]);

  const filteredSongs = useMemo(() => {
    if (songSortMode === "count") {
      return songsSortedByCount;
    }
    return allUsedSongs.filter((s) => getSongAlbum(s) === selAlbum);
  }, [songSortMode, selAlbum, allUsedSongs, songsSortedByCount]);

  // Memoized sorted venues by show count (High to Low)
  const venuesSortedByCount = useMemo(() => {
    return [...allVenues].sort((a, b) => {
      const cntA = globalVenueShows.get(a.name)?.length || 0;
      const cntB = globalVenueShows.get(b.name)?.length || 0;
      return cntB - cntA;
    });
  }, [allVenues, globalVenueShows]);

  const filteredVenues = useMemo(() => {
    return venuesSortedByCount;
  }, [venuesSortedByCount]);

  const pagedUnits = useMemo(() => {
    const pageCount = Math.ceil(filteredUnits.length / PAGE_SIZE);
    const safePage = Math.min(unitPage, Math.max(0, pageCount - 1));
    return filteredUnits.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  }, [filteredUnits, unitPage]);

  const pagedShows = useMemo(() => {
    const currentShows = currentUnit?.shows || [];
    const pageCount = Math.ceil(currentShows.length / PAGE_SIZE);
    const safePage = Math.min(showPage, Math.max(0, pageCount - 1));
    return currentShows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  }, [currentUnit, showPage]);

  const pagedSongs = useMemo(() => {
    const pageCount = Math.ceil(filteredSongs.length / PAGE_SIZE);
    const safePage = Math.min(songPage, Math.max(0, pageCount - 1));
    return filteredSongs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  }, [filteredSongs, songPage]);

  const pagedVenues = useMemo(() => {
    const pageCount = Math.ceil(filteredVenues.length / PAGE_SIZE);
    const safePage = Math.min(venuePage, Math.max(0, pageCount - 1));
    return filteredVenues.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  }, [filteredVenues, venuePage]);

  return {
    selCategory,
    setSelCategory,
    selYear,
    setSelYear,
    songSortMode,
    setSongSortMode,
    selAlbum,
    setSelAlbum,
    venueSortMode,
    setVenueSortMode,
    selRegion,
    setSelRegion,
    unitPage,
    setUnitPage,
    showPage,
    setShowPage,
    songPage,
    setSongPage,
    venuePage,
    setVenuePage,
    totalAllShows,
    unitsByCategory,
    categoryStats,
    yearStats,
    availableYears,
    handleCategoryClick,
    filteredUnits,
    songsSortedByCount,
    filteredSongs,
    venuesSortedByCount,
    filteredVenues,
    pagedUnits,
    pagedShows,
    pagedSongs,
    pagedVenues,
  };
}
