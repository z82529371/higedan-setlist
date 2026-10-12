import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  queryTabClass,
  ALBUM_ORDER,
  REGION_ORDER,
} from "./lib/constants.js";
import {
  allUnits,
  getSongAlbum,
  getVenueRegion,
  showDate,
  shortUnitTitle,
  unitEarliest,
  defaultShowId,
  getUnitTypeLabel,
  buildIndex,
  songTitle,
} from "./lib/domain.js";
import { trackKey, parseRoute, routeHash } from "./lib/track.js";
import { ShowSlip, SongSlip, VenueSlip } from "./components/slips.jsx";
import SearchBox from "./components/SearchBox.jsx";
import LandingHero from "./components/LandingHero.jsx";
import CalendarModal from "./components/CalendarModal.jsx";
import "./style.css";

const PERFORMANCE_CATEGORIES = [
  "巡演專場",
  "特別專場",
  "聯合專場",
  "店家活動",
  "音樂祭",
  "學園祭",
  "電視演出",
  "線上直播",
];

const PAGE_SIZE = 10;
const CHUNK_SIZE = 50;

// Reusable adaptive pagination: single-tier when <= 50, two-tier (chunked by 50) when > 50
function PaginationPills({
  total,
  pageSize = PAGE_SIZE,
  chunkSize = CHUNK_SIZE,
  page,
  onPageChange,
  label = "分段",
}) {
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;

  const safePage = Math.min(Math.max(0, page), Math.max(0, pageCount - 1));
  const needsChunks = total > chunkSize;
  const chunkCount = Math.ceil(total / chunkSize);
  const pagesPerChunk = Math.round(chunkSize / pageSize); // 5 pages per chunk
  const currentChunk = Math.floor(safePage / pagesPerChunk);

  const startPageIndex = needsChunks ? currentChunk * pagesPerChunk : 0;
  const endPageIndex = needsChunks
    ? Math.min(startPageIndex + pagesPerChunk, pageCount)
    : pageCount;

  return (
    <div className="mb-2.5 flex flex-col gap-1.5 rounded bg-tape-tint/25 p-2 border border-line-soft font-mono text-[11px]">
      {/* Tier 1: Large Chunks (only displayed if total > 50) */}
      {needsChunks && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted font-sans text-xs font-bold w-[52px] shrink-0 text-right">
            大區間：
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: chunkCount }, (_, c) => {
              const cStart = c * chunkSize + 1;
              const cEnd = Math.min((c + 1) * chunkSize, total);
              const isCurChunk = currentChunk === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    if (!isCurChunk) {
                      onPageChange(c * pagesPerChunk);
                    }
                  }}
                  className={`rounded px-2.5 py-0.5 font-bold transition-colors motion-reduce:transition-none cursor-pointer border ${
                    isCurChunk
                      ? "bg-band text-band-ink border-ink/40 shadow-xs"
                      : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                  }`}
                >
                  {cStart}-{cEnd}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier 2: 10-item sub-pages (always at most 5 buttons when chunked, or at most 5 buttons when total <= 50) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted font-sans text-xs font-bold w-[52px] shrink-0 text-right">
          {needsChunks ? "細分頁：" : `${label}：`}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: endPageIndex - startPageIndex }, (_, offset) => {
            const i = startPageIndex + offset;
            const start = i * pageSize + 1;
            const end = Math.min((i + 1) * pageSize, total);
            const isCur = safePage === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onPageChange(i)}
                className={`rounded px-2 py-0.5 font-bold transition-colors motion-reduce:transition-none cursor-pointer border ${
                  isCur
                    ? "bg-band text-band-ink border-ink/40 shadow-xs"
                    : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                }`}
              >
                {start}-{end}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const {
    unitData,
    trackShows,
    globalVenueShows,
    allUsedSongs,
    allVenues,
    showById,
    unitIdByShowId,
  } = useMemo(() => buildIndex(), []);

  const initialSelection = () => {
    const fallback = {
      tab: "show",
      selUnitId: allUnits[0]?.id ?? null,
      selSong: allUsedSongs[0]?.id ?? null,
      selVenue: allVenues[0]?.name ?? null,
      selShow: defaultShowId(allUnits[0]),
    };
    const r =
      parseRoute(window.location.hash) || parseRoute(window.location.pathname);
    if (!r) return fallback;
    if (r.kind === "song" && allUsedSongs.some((s) => s.id === r.value))
      return { ...fallback, tab: "song", selSong: r.value };
    if (r.kind === "show" && unitIdByShowId.has(r.value))
      return {
        ...fallback,
        selUnitId: unitIdByShowId.get(r.value),
        selShow: r.value,
      };
    if (r.kind === "venue" && allVenues.some((v) => v.name === r.value))
      return { ...fallback, tab: "venue", selVenue: r.value };
    return fallback;
  };
  const [initial] = useState(initialSelection);
  const [viewMode, setViewMode] = useState(() => {
    const rawHash = window.location.hash;
    const r =
      parseRoute(rawHash) || parseRoute(window.location.pathname);
    if (r || rawHash === "#/archive") return "archive";
    return "landing";
  });

  const [selUnitId, setSelUnitId] = useState(initial.selUnitId);
  const [tab, setTab] = useState(initial.tab);
  const [selSong, setSelSong] = useState(initial.selSong);
  const [selVenue, setSelVenue] = useState(initial.selVenue);
  const [selShow, setSelShow] = useState(initial.selShow);
  const [q, setQ] = useState("");

  const initialUnit = unitData.get(initial.selUnitId)?.unit;
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
    const sObj = allUsedSongs.find((s) => s.id === initial.selSong);
    return sObj ? getSongAlbum(sObj) : ALBUM_ORDER[0];
  });

  const [venueSortMode, setVenueSortMode] = useState("region"); // "region" | "count"
  const [selRegion, setSelRegion] = useState(() => {
    const vObj = allVenues.find((v) => v.name === initial.selVenue);
    return vObj ? getVenueRegion(vObj) : REGION_ORDER[0];
  });

  // 10-item pagination states
  const [unitPage, setUnitPage] = useState(0);
  const [showPage, setShowPage] = useState(0);
  const [songPage, setSongPage] = useState(0);
  const [venuePage, setVenuePage] = useState(0);

  // Desktop Collapsible Navigator state (default: collapsed/false, persisted in localStorage)
  const [isDesktopNavOpen, setIsDesktopNavOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("hg_desktop_nav_open");
      if (saved !== null) return saved === "true";
    } catch {
      // fallback
    }
    return false;
  });

  const toggleDesktopNav = () => {
    setIsDesktopNavOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("hg_desktop_nav_open", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Mobile Filter Bottom Sheet state & Staged Draft State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [draftState, setDraftState] = useState(null);

  const openFilterDrawer = () => {
    setDraftState({
      category: selCategory,
      year: selYear,
      unitId: selUnitId,
      showId: selShow,
      unitPage: unitPage,
      showPage: showPage,
      songSortMode: songSortMode,
      album: selAlbum,
      songId: selSong,
      songPage: songPage,
      venueSortMode: venueSortMode,
      region: selRegion,
      venueName: selVenue,
      venuePage: venuePage,
    });
    setIsFilterDrawerOpen(true);
  };

  const handleCancelDrawer = () => {
    setIsFilterDrawerOpen(false);
    setDraftState(null);
  };

  const slipRef = useRef(null);

  const current = unitData.get(selUnitId);

  // Hash is the single funnel: selections write hash, hashchange applies state.
  const applyRoute = (r) => {
    if (!r) return;
    setViewMode("archive");
    setIsFilterDrawerOpen(false);
    if (r.kind === "song" && allUsedSongs.some((s) => s.id === r.value)) {
      setTab("song");
      setSelSong(r.value);
      setQ("");
      const songObj = allUsedSongs.find((s) => s.id === r.value);
      if (songObj) {
        setSelAlbum(getSongAlbum(songObj));
      }
    } else if (r.kind === "show" && unitIdByShowId.has(r.value)) {
      const uId = unitIdByShowId.get(r.value);
      const targetUnit = unitData.get(uId)?.unit;
      setSelUnitId(uId);
      setTab("show");
      setSelShow(r.value);
      setQ("");
      if (targetUnit) {
        const cat = getUnitTypeLabel(targetUnit);
        const yr = unitEarliest(targetUnit).split("-")[0];
        setSelCategory(cat);
        if (yr && yr !== "9999") {
          setSelYear(yr);
        }
      }
    } else if (
      r.kind === "venue" &&
      allVenues.some((v) => v.name === r.value)
    ) {
      setTab("venue");
      setSelVenue(r.value);
      setQ("");
      const venueObj = allVenues.find((v) => v.name === r.value);
      if (venueObj) {
        setSelRegion(getVenueRegion(venueObj));
      }
    }
  };

  useEffect(() => {
    const onHash = () => {
      const rawHash = window.location.hash;
      const r =
        parseRoute(rawHash) ||
        parseRoute(window.location.pathname);
      if (!r && (!rawHash || rawHash === "#" || rawHash === "#/")) {
        setViewMode("landing");
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }
      if (rawHash === "#/archive") {
        setViewMode("archive");
        return;
      }
      if (r) {
        setViewMode("archive");
        applyRoute(r);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Close drawer or mobile search modal on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isMobileSearchOpen) {
          setIsMobileSearchOpen(false);
          setQ("");
        } else if (isFilterDrawerOpen) {
          handleCancelDrawer();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFilterDrawerOpen, isMobileSearchOpen]);

  // Mobile Spotlight Modal: visualViewport height & position tracking (virtual keyboard avoidance)
  const [visualViewportStyle, setVisualViewportStyle] = useState({
    height: "100dvh",
    top: 0,
  });

  useEffect(() => {
    if (!isMobileSearchOpen) return;

    const updateViewport = () => {
      if (window.visualViewport) {
        setVisualViewportStyle({
          height: `${window.visualViewport.height}px`,
          top: `${window.visualViewport.offsetTop}px`,
        });
      } else {
        setVisualViewportStyle({
          height: `${window.innerHeight}px`,
          top: 0,
        });
      }
    };

    updateViewport();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewport);
      window.visualViewport.addEventListener("scroll", updateViewport);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.visualViewport.removeEventListener("resize", updateViewport);
        window.visualViewport.removeEventListener("scroll", updateViewport);
      };
    } else {
      window.addEventListener("resize", updateViewport);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("resize", updateViewport);
      };
    }
  }, [isMobileSearchOpen]);

  const go = (hash) => {
    setViewMode("archive");
    applyRoute(parseRoute(hash));
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  };

  const handleSelectShow = (showId) => {
    setQ("");
    setIsFilterDrawerOpen(false);
    setIsMobileSearchOpen(false);
    go(routeHash.show(showId));
  };

  const handleSelectSong = (songId) => {
    setQ("");
    setIsFilterDrawerOpen(false);
    setIsMobileSearchOpen(false);
    go(routeHash.song(songId));
  };

  const handleSelectVenue = (venueName) => {
    setQ("");
    setIsFilterDrawerOpen(false);
    setIsMobileSearchOpen(false);
    go(routeHash.venue(venueName));
  };

  const handleSelectUnit = (uId, explicitShowId = null) => {
    setQ("");
    setIsFilterDrawerOpen(false);
    setIsMobileSearchOpen(false);
    const u = unitData.get(uId)?.unit;
    if (u) {
      setSelUnitId(uId);
      const targetShow = explicitShowId || defaultShowId(u);
      setSelShow(targetShow);
      const cat = getUnitTypeLabel(u);
      const yr = unitEarliest(u).split("-")[0];
      setSelCategory(cat);
      if (yr && yr !== "9999") setSelYear(yr);
      setTab("show");
      go(routeHash.show(targetShow));
    }
  };

  const handleReturnHome = () => {
    setViewMode("landing");
    setQ("");
    window.location.hash = "#/";
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleCommitDrawer = () => {
    if (!draftState) {
      setIsFilterDrawerOpen(false);
      return;
    }
    if (tab === "show") {
      setSelCategory(draftState.category);
      setSelYear(draftState.year);
      setSelUnitId(draftState.unitId);
      setUnitPage(draftState.unitPage);
      setShowPage(draftState.showPage);
      handleSelectShow(draftState.showId);
    } else if (tab === "song") {
      setSongSortMode(draftState.songSortMode);
      setSelAlbum(draftState.album);
      setSongPage(draftState.songPage);
      handleSelectSong(draftState.songId);
    } else if (tab === "venue") {
      setVenueSortMode(draftState.venueSortMode);
      setSelRegion(draftState.region);
      setVenuePage(draftState.venuePage);
      handleSelectVenue(draftState.venueName);
    }
    setIsFilterDrawerOpen(false);
    setDraftState(null);
    setTimeout(() => {
      slipRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const confirmButtonLabel = useMemo(() => {
    if (!draftState) return "確認套用";
    if (tab === "show") {
      const u = unitData.get(draftState.unitId)?.unit;
      const s = (u?.shows || []).find((x) => x.id === draftState.showId);
      if (s) {
        return `確認套用：${s.date.slice(5)} ${s.city || s.venue}`;
      }
      return "確認套用場次";
    }
    if (tab === "song") {
      const s = allUsedSongs.find((x) => x.id === draftState.songId);
      if (s) {
        return `確認套用：《${songTitle[s.id] || s.title || s.id}》`;
      }
      return "確認套用歌曲";
    }
    if (tab === "venue") {
      return draftState.venueName ? `確認套用：${draftState.venueName}` : "確認套用場地";
    }
    return "確認套用";
  }, [draftState, tab, unitData, allUsedSongs, songTitle]);

  const currentShowObj = useMemo(() => {
    return current?.shows?.find((s) => s.id === selShow) || null;
  }, [current, selShow]);

  const currentSongObj = useMemo(() => {
    return allUsedSongs.find((s) => s.id === selSong) || null;
  }, [allUsedSongs, selSong]);

  const currentVenueObj = useMemo(() => {
    return allVenues.find((v) => v.name === selVenue) || null;
  }, [allVenues, selVenue]);

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
    const yearsForCat = Array.from(
      new Set(
        (unitsByCategory[cat] || [])
          .map((u) => unitEarliest(u).split("-")[0])
          .filter((y) => y && y !== "9999")
      )
    ).sort((a, b) => b.localeCompare(a));
    if (!yearsForCat.includes(selYear)) {
      setSelYear(yearsForCat[0] || "2024");
    }
    setUnitPage(0);
  };

  // Filtered units based on category & year (compact, focused)
  const filteredUnits = useMemo(() => {
    return allUnits.filter((u) => {
      if (getUnitTypeLabel(u) !== selCategory) return false;
      const y = unitEarliest(u).split("-")[0];
      return y === selYear;
    });
  }, [selCategory, selYear]);

  // Auto-sync unit selection if current unit not in filtered units
  useEffect(() => {
    if (tab === "show" && filteredUnits.length > 0) {
      if (!filteredUnits.some((u) => u.id === selUnitId)) {
        const nextU = filteredUnits[0];
        setSelUnitId(nextU.id);
        const nextShowId = defaultShowId(nextU);
        setSelShow(nextShowId);
        go(routeHash.show(nextShowId));
      }
    }
  }, [filteredUnits, selUnitId, tab]);

  // Songs sorted by appearance count
  const songsSortedByCount = useMemo(() => {
    return [...allUsedSongs].sort((a, b) => {
      const countA = (trackShows.get(trackKey("song", a.id)) ?? []).length;
      const countB = (trackShows.get(trackKey("song", b.id)) ?? []).length;
      return countB - countA || a.title.localeCompare(b.title);
    });
  }, [allUsedSongs, trackShows]);

  const filteredSongs = useMemo(() => {
    if (songSortMode === "album") {
      return allUsedSongs.filter((s) => getSongAlbum(s) === selAlbum);
    }
    return songsSortedByCount;
  }, [allUsedSongs, songSortMode, selAlbum, songsSortedByCount]);

  // Venues sorted by total shows
  const venuesSortedByCount = useMemo(() => {
    return [...allVenues].sort((a, b) => {
      return b.shows.length - a.shows.length || a.name.localeCompare(b.name);
    });
  }, [allVenues]);

  const filteredVenues = useMemo(() => {
    if (venueSortMode === "region") {
      return allVenues.filter((v) => getVenueRegion(v) === selRegion);
    }
    return venuesSortedByCount;
  }, [allVenues, venueSortMode, selRegion, venuesSortedByCount]);

  // Auto-sync pagination to keep active item in view
  useEffect(() => {
    const idx = filteredUnits.findIndex((u) => u.id === selUnitId);
    if (idx >= 0) {
      setUnitPage(Math.floor(idx / PAGE_SIZE));
    }
  }, [filteredUnits, selUnitId]);

  useEffect(() => {
    if (current?.shows) {
      const idx = current.shows.findIndex((s) => s.id === selShow);
      if (idx >= 0) {
        setShowPage(Math.floor(idx / PAGE_SIZE));
      }
    }
  }, [current, selShow]);

  useEffect(() => {
    const idx = filteredSongs.findIndex((s) => s.id === selSong);
    if (idx >= 0) {
      setSongPage(Math.floor(idx / PAGE_SIZE));
    }
  }, [filteredSongs, selSong]);

  useEffect(() => {
    const idx = filteredVenues.findIndex((v) => v.name === selVenue);
    if (idx >= 0) {
      setVenuePage(Math.floor(idx / PAGE_SIZE));
    }
  }, [filteredVenues, selVenue]);

  // Sliced lists for 10-by-10 display
  const pagedUnits = useMemo(() => {
    const pageCount = Math.ceil(filteredUnits.length / PAGE_SIZE);
    const safePage = Math.min(unitPage, Math.max(0, pageCount - 1));
    return filteredUnits.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  }, [filteredUnits, unitPage]);

  const pagedShows = useMemo(() => {
    const shows = current?.shows || [];
    const pageCount = Math.ceil(shows.length / PAGE_SIZE);
    const safePage = Math.min(showPage, Math.max(0, pageCount - 1));
    return shows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  }, [current, showPage]);

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

  const tplSongs = current?.tpl?.filter((i) => i.songId).length ?? 0;
  const tplCount = current?.tpl?.length ?? 0;
  const footTpl = current?.isTour
    ? `巡演模板：${tplSongs} 首${
        tplCount > tplSongs ? `＋${tplCount - tplSongs}段過場` : ""
      }`
    : "單發場合，曲目全文收錄";

  const sourceSummary = useMemo(() => {
    const sources = new Set();
    for (const s of current?.shows ?? []) {
      for (const u of s.sourceUrls ?? []) {
        if (/higedan\.com/i.test(u)) sources.add("官方網站");
        else if (/x\.com|twitter\.com/i.test(u)) sources.add("X");
        else if (/livefans\.jp/i.test(u)) sources.add("LiveFans");
        else if (/wikipedia\.org/i.test(u)) sources.add("維基百科");
        else {
          try {
            sources.add(new URL(u).hostname.replace(/^www\./, ""));
          } catch {
            sources.add("外部來源");
          }
        }
      }
    }
    if (sources.size === 0) return "LiveFans";
    return Array.from(sources).join(" · ");
  }, [current]);

  const renderShowNavigator = (isDrawer = false) => {
    const curCategory = isDrawer && draftState ? draftState.category : selCategory;
    const curYear = isDrawer && draftState ? draftState.year : selYear;
    const curUnitId = isDrawer && draftState ? draftState.unitId : selUnitId;
    const curShowId = isDrawer && draftState ? draftState.showId : selShow;
    const curUnitPage = isDrawer && draftState ? draftState.unitPage : unitPage;
    const curShowPage = isDrawer && draftState ? draftState.showPage : showPage;

    const curUnits = unitsByCategory[curCategory] || [];
    const curYearStats = new Map();
    for (const u of curUnits) {
      const y = unitEarliest(u).split("-")[0];
      if (y && y !== "9999") {
        const prev = curYearStats.get(y) || { shows: 0, units: 0 };
        prev.shows += u.shows?.length || 0;
        prev.units += 1;
        curYearStats.set(y, prev);
      }
    }
    const dAvailableYears = isDrawer && draftState
      ? Array.from(curYearStats.keys()).sort((a, b) => b.localeCompare(a))
      : availableYears;

    const dFilteredUnits = isDrawer && draftState
      ? curUnits.filter((u) => unitEarliest(u).split("-")[0] === curYear)
      : filteredUnits;

    const dPagedUnits = isDrawer && draftState
      ? (() => {
          const pageCount = Math.ceil(dFilteredUnits.length / PAGE_SIZE);
          const safePage = Math.min(curUnitPage, Math.max(0, pageCount - 1));
          return dFilteredUnits.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        })()
      : pagedUnits;

    const dCurrentUnitData = isDrawer && draftState
      ? unitData.get(curUnitId)
      : current;

    const dCurrentShows = dCurrentUnitData?.shows || [];

    const dPagedShows = isDrawer && draftState
      ? (() => {
          const pageCount = Math.ceil(dCurrentShows.length / PAGE_SIZE);
          const safePage = Math.min(curShowPage, Math.max(0, pageCount - 1));
          return dCurrentShows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        })()
      : pagedShows;

    return (
      <div
        className={`relative rounded-[6px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-sm space-y-4 ${
          isDrawer ? "border-0 shadow-none p-0 sm:p-0" : ""
        }`}
      >
        {/* Step 1: 演出分類 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">🏷️</span>
              <span>1. 選擇演出類型</span>
            </span>
            <span className="font-mono text-[11px] text-muted tabular-nums">
              {categoryStats[curCategory]?.shows || 0} 場演出
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {PERFORMANCE_CATEGORIES.map((cat) => {
              const isCur = curCategory === cat;
              const stat = categoryStats[cat] || { units: 0, shows: 0 };
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    if (isDrawer && draftState) {
                      const units = unitsByCategory[cat] || [];
                      const years = Array.from(
                        new Set(units.map((u) => unitEarliest(u).split("-")[0]))
                      ).sort().reverse();
                      const nextYear = years.includes(draftState.year) ? draftState.year : (years[0] || "2024");
                      const nextUnits = units.filter((u) => unitEarliest(u).split("-")[0] === nextYear);
                      const nextUnit = nextUnits.find((u) => u.id === draftState.unitId) || nextUnits[0] || units[0];
                      const nextShowId = nextUnit ? defaultShowId(nextUnit) : "";
                      setDraftState((prev) => ({
                        ...prev,
                        category: cat,
                        year: nextYear,
                        unitId: nextUnit?.id || "",
                        showId: nextShowId,
                        unitPage: 0,
                        showPage: 0,
                      }));
                    } else {
                      handleCategoryClick(cat);
                    }
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] sm:text-[13px] font-semibold transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                    isCur
                      ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                      : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                  }`}
                >
                  <span>{cat}</span>
                  <span className="font-mono text-[11px] opacity-75 tabular-nums">
                    ({stat.shows}場)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: 演出年份 */}
        <div className="pt-2 border-t border-line-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">📅</span>
              <span>2. 選擇年份</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {dAvailableYears.map((yr) => {
              const isCur = curYear === yr;
              const count = (isDrawer && draftState ? curYearStats : yearStats).get(yr)?.shows || 0;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    if (isDrawer && draftState) {
                      const units = (unitsByCategory[curCategory] || []).filter(
                        (u) => unitEarliest(u).split("-")[0] === yr
                      );
                      const nextUnit = units.find((u) => u.id === draftState.unitId) || units[0];
                      const nextShowId = nextUnit ? defaultShowId(nextUnit) : "";
                      setDraftState((prev) => ({
                        ...prev,
                        year: yr,
                        unitId: nextUnit?.id || "",
                        showId: nextShowId,
                        unitPage: 0,
                        showPage: 0,
                      }));
                    } else {
                      setSelYear(yr);
                      setUnitPage(0);
                    }
                  }}
                  className={`rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-mono font-semibold transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                    isCur
                      ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                      : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                  }`}
                >
                  <span>{yr}</span>
                  <span className="text-[11px] opacity-75 tabular-nums">
                    ({count}場)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: 選擇活動 / 巡演 (十個十個顯示) */}
        <div className="pt-2 border-t border-line-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">🎪</span>
              <span>
                3. 選擇活動／巡演（{curYear} 年 · 共 {dFilteredUnits.length} 部）
              </span>
            </span>
          </div>
          <PaginationPills
            total={dFilteredUnits.length}
            pageSize={PAGE_SIZE}
            page={curUnitPage}
            onPageChange={(p) => {
              if (isDrawer && draftState) {
                setDraftState((prev) => ({ ...prev, unitPage: p }));
              } else {
                setUnitPage(p);
              }
            }}
          />
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {dPagedUnits.map((u) => {
              const isCur = u.id === curUnitId;
              const showCnt = (u.shows ?? []).length;
              const uData = unitData.get(u.id);
              const hasSongs = (uData?.songShows?.size ?? 0) > 0;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    if (isDrawer && draftState) {
                      const targetShowId = defaultShowId(u);
                      setDraftState((prev) => ({
                        ...prev,
                        unitId: u.id,
                        showId: targetShowId,
                        showPage: 0,
                      }));
                    } else {
                      setSelUnitId(u.id);
                      const targetShowId = defaultShowId(u);
                      setSelShow(targetShowId);
                      go(routeHash.show(targetShowId));
                    }
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] sm:text-[13px] font-semibold transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                    isCur
                      ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                      : hasSongs
                      ? "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                      : "bg-paper/70 text-muted border border-dashed border-line hover:bg-tape-tint/40 hover:border-ink/60 hover:text-ink"
                  }`}
                >
                  <span className="truncate max-w-[280px] sm:max-w-none">
                    {shortUnitTitle(u)}
                  </span>
                  {showCnt > 1 ? (
                    <span className="font-mono text-[11px] opacity-80 tabular-nums">
                      ({showCnt}場{!hasSongs ? "·無歌單" : ""})
                    </span>
                  ) : !hasSongs ? (
                    <span className="font-mono text-[11px] opacity-80 tabular-nums">
                      (無歌單)
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: 切換場次日期 (十個十個顯示，單發 1 場直接隱藏) */}
        {dCurrentUnitData?.shows && dCurrentUnitData.shows.length > 1 && (
          <div className="pt-2 border-t border-line-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span aria-hidden="true">🎫</span>
                <span>4. 切換場次日期（全 {dCurrentUnitData.shows.length} 場）</span>
              </span>
            </div>
            <PaginationPills
              total={dCurrentUnitData.shows.length}
              pageSize={PAGE_SIZE}
              page={curShowPage}
              onPageChange={(p) => {
                if (isDrawer && draftState) {
                  setDraftState((prev) => ({ ...prev, showPage: p }));
                } else {
                  setShowPage(p);
                }
              }}
            />
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {dPagedShows.map((s) => {
                const isCur = s.id === curShowId;
                const songCnt = (dCurrentUnitData.full?.get(s.id) || []).filter(
                  (i) => i.songId || i.title
                ).length;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (isDrawer && draftState) {
                        setDraftState((prev) => ({
                          ...prev,
                          showId: s.id,
                        }));
                      } else {
                        handleSelectShow(s.id);
                      }
                    }}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                      isCur
                        ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                        : songCnt > 0
                        ? "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                        : "bg-paper/70 text-muted border border-dashed border-line hover:bg-tape-tint/40 hover:border-ink/60 hover:text-ink"
                    }`}
                  >
                    <span className="font-mono tabular-nums">
                      {s.date.slice(5)}
                    </span>
                    <span className="font-bold">{s.city || s.venue}</span>
                    <span className="font-mono text-[10px] opacity-75 tabular-nums">
                      {songCnt > 0 ? `${songCnt}首` : "無歌單"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSongNavigator = (isDrawer = false) => {
    const curSortMode = isDrawer && draftState ? draftState.songSortMode : songSortMode;
    const curAlbum = isDrawer && draftState ? draftState.album : selAlbum;
    const curSongId = isDrawer && draftState ? draftState.songId : selSong;
    const curPage = isDrawer && draftState ? draftState.songPage : songPage;

    const dFilteredSongs = isDrawer && draftState
      ? (curSortMode === "album"
          ? allUsedSongs.filter((s) => getSongAlbum(s) === curAlbum)
          : songsSortedByCount)
      : filteredSongs;

    const dPagedSongs = isDrawer && draftState
      ? (() => {
          const pageCount = Math.ceil(dFilteredSongs.length / PAGE_SIZE);
          const safePage = Math.min(curPage, Math.max(0, pageCount - 1));
          return dFilteredSongs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        })()
      : pagedSongs;

    return (
      <div
        className={`relative rounded-[6px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-sm space-y-4 ${
          isDrawer ? "border-0 shadow-none p-0 sm:p-0" : ""
        }`}
      >
        {/* Step 1: 排序/分類方式 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">🎵</span>
              <span>1. 歌曲分類方式</span>
            </span>
            <span className="font-mono text-[11px] text-muted tabular-nums">
              共 {allUsedSongs.length} 首曲目
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-[12px] sm:text-[13px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                curSortMode === "album"
                  ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                  : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
              }`}
              onClick={() => {
                if (isDrawer && draftState) {
                  setDraftState((prev) => ({ ...prev, songSortMode: "album", songPage: 0 }));
                } else {
                  setSongSortMode("album");
                  setSongPage(0);
                }
              }}
            >
              <span>💿 依發行專輯分類</span>
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-[12px] sm:text-[13px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                curSortMode === "count"
                  ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                  : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
              }`}
              onClick={() => {
                if (isDrawer && draftState) {
                  setDraftState((prev) => ({ ...prev, songSortMode: "count", songPage: 0 }));
                } else {
                  setSongSortMode("count");
                  setSongPage(0);
                }
              }}
            >
              <span>🏆 依演唱次數排行</span>
            </button>
          </div>
        </div>

        {/* Step 2 (若為專輯分類): 選擇專輯 */}
        {curSortMode === "album" && (
          <div className="pt-2 border-t border-line-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span aria-hidden="true">💿</span>
                <span>2. 選擇發行專輯</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {ALBUM_ORDER.map((alb) => {
                const isCur = curAlbum === alb;
                const sCount = allUsedSongs.filter(
                  (s) => getSongAlbum(s) === alb
                ).length;
                if (sCount === 0) return null;
                return (
                  <button
                    key={alb}
                    type="button"
                    onClick={() => {
                      if (isDrawer && draftState) {
                        setDraftState((prev) => ({ ...prev, album: alb, songPage: 0 }));
                      } else {
                        setSelAlbum(alb);
                        setSongPage(0);
                      }
                    }}
                    className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                      isCur
                        ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                        : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                    }`}
                  >
                    <span>{alb}</span>
                    <span className="font-mono text-[11px] opacity-75 tabular-nums">
                      ({sCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: 選擇歌曲 (十個十個顯示) */}
        <div className="pt-2 border-t border-line-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">🎶</span>
              <span>
                {curSortMode === "album"
                  ? `3. 選擇歌曲（${curAlbum} · 共 ${dFilteredSongs.length} 首）`
                  : `2. 演唱次數排行（共 ${dFilteredSongs.length} 首）`}
              </span>
            </span>
          </div>
          <PaginationPills
            total={dFilteredSongs.length}
            pageSize={PAGE_SIZE}
            page={curPage}
            onPageChange={(p) => {
              if (isDrawer && draftState) {
                setDraftState((prev) => ({ ...prev, songPage: p }));
              } else {
                setSongPage(p);
              }
            }}
          />
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {dPagedSongs.map((s, idx) => {
              const isCur = s.id === curSongId;
              const cnt = (
                trackShows.get(trackKey("song", s.id)) ?? []
              ).length;
              const safePage = Math.min(
                curPage,
                Math.max(0, Math.ceil(dFilteredSongs.length / PAGE_SIZE) - 1)
              );
              const rankNum =
                curSortMode === "count"
                  ? safePage * PAGE_SIZE + idx + 1
                  : idx + 1;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (isDrawer && draftState) {
                      setDraftState((prev) => ({ ...prev, songId: s.id }));
                    } else {
                      handleSelectSong(s.id);
                    }
                  }}
                  className={`rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                    isCur
                      ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                      : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                  }`}
                >
                  {curSortMode === "count" && (
                    <span className="font-mono text-[10px] opacity-60 tabular-nums">
                      #{String(rankNum).padStart(2, "0")}
                    </span>
                  )}
                  <span className="font-bold">{s.title}</span>
                  <span className="font-mono text-[11px] opacity-75 tabular-nums">
                    ({cnt}場)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderVenueNavigator = (isDrawer = false) => {
    const curSortMode = isDrawer && draftState ? draftState.venueSortMode : venueSortMode;
    const curRegion = isDrawer && draftState ? draftState.region : selRegion;
    const curVenueName = isDrawer && draftState ? draftState.venueName : selVenue;
    const curPage = isDrawer && draftState ? draftState.venuePage : venuePage;

    const dFilteredVenues = isDrawer && draftState
      ? (curSortMode === "region"
          ? allVenues.filter((v) => getVenueRegion(v) === curRegion)
          : venuesSortedByCount)
      : filteredVenues;

    const dPagedVenues = isDrawer && draftState
      ? (() => {
          const pageCount = Math.ceil(dFilteredVenues.length / PAGE_SIZE);
          const safePage = Math.min(curPage, Math.max(0, pageCount - 1));
          return dFilteredVenues.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        })()
      : pagedVenues;

    return (
      <div
        className={`relative rounded-[6px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-sm space-y-4 ${
          isDrawer ? "border-0 shadow-none p-0 sm:p-0" : ""
        }`}
      >
        {/* Step 1: 排序/分類方式 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">🏛️</span>
              <span>1. 場地分類方式</span>
            </span>
            <span className="font-mono text-[11px] text-muted tabular-nums">
              共 {allVenues.length} 處場館
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-[12px] sm:text-[13px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                curSortMode === "region"
                  ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                  : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
              }`}
              onClick={() => {
                if (isDrawer && draftState) {
                  setDraftState((prev) => ({ ...prev, venueSortMode: "region", venuePage: 0 }));
                } else {
                  setVenueSortMode("region");
                  setVenuePage(0);
                }
              }}
            >
              <span>📍 依日本地理分區</span>
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-[12px] sm:text-[13px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                curSortMode === "count"
                  ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                  : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
              }`}
              onClick={() => {
                if (isDrawer && draftState) {
                  setDraftState((prev) => ({ ...prev, venueSortMode: "count", venuePage: 0 }));
                } else {
                  setVenueSortMode("count");
                  setVenuePage(0);
                }
              }}
            >
              <span>🏆 依累積場次排行</span>
            </button>
          </div>
        </div>

        {/* Step 2 (若為分區): 選擇地區 */}
        {curSortMode === "region" && (
          <div className="pt-2 border-t border-line-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span aria-hidden="true">📍</span>
                <span>2. 選擇地理分區</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {REGION_ORDER.map((reg) => {
                const isCur = curRegion === reg;
                const vCount = allVenues.filter(
                  (v) => getVenueRegion(v) === reg
                ).length;
                if (vCount === 0) return null;
                return (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => {
                      if (isDrawer && draftState) {
                        setDraftState((prev) => ({ ...prev, region: reg, venuePage: 0 }));
                      } else {
                        setSelRegion(reg);
                        setVenuePage(0);
                      }
                    }}
                    className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                      isCur
                        ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                        : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                    }`}
                  >
                    <span>{reg}</span>
                    <span className="font-mono text-[11px] opacity-75 tabular-nums">
                      ({vCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: 選擇場地 (十個十個顯示) */}
        <div className="pt-2 border-t border-line-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">🏟️</span>
              <span>
                {curSortMode === "region"
                  ? `3. 選擇場地（${curRegion} · 共 ${dFilteredVenues.length} 處）`
                  : `2. 登場次數排行（共 ${dFilteredVenues.length} 處）`}
              </span>
            </span>
          </div>
          <PaginationPills
            total={dFilteredVenues.length}
            pageSize={PAGE_SIZE}
            page={curPage}
            onPageChange={(p) => {
              if (isDrawer && draftState) {
                setDraftState((prev) => ({ ...prev, venuePage: p }));
              } else {
                setVenuePage(p);
              }
            }}
          />
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {dPagedVenues.map((v, idx) => {
              const isCur = v.name === curVenueName;
              const safePage = Math.min(
                curPage,
                Math.max(0, Math.ceil(dFilteredVenues.length / PAGE_SIZE) - 1)
              );
              const rankNum =
                curSortMode === "count"
                  ? safePage * PAGE_SIZE + idx + 1
                  : idx + 1;
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => {
                    if (isDrawer && draftState) {
                      setDraftState((prev) => ({ ...prev, venueName: v.name }));
                    } else {
                      handleSelectVenue(v.name);
                    }
                  }}
                  className={`rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                    isCur
                      ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                      : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                  }`}
                >
                  {curSortMode === "count" && (
                    <span className="font-mono text-[10px] opacity-60 tabular-nums">
                      #{String(rankNum).padStart(2, "0")}
                    </span>
                  )}
                  <span className="font-bold">{v.name}</span>
                  <span className="text-[11px] opacity-75">
                    （{v.city} · {v.shows.length}場）
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      {viewMode === "landing" ? (
        <LandingHero
          onEnterArchive={() => setViewMode("archive")}
          onSelectSong={(sId) => {
            setViewMode("archive");
            handleSelectSong(sId);
          }}
          onSelectUnit={(uId, showId) => {
            setViewMode("archive");
            handleSelectUnit(uId, showId);
          }}
          onSelectVenue={(vName) => {
            setViewMode("archive");
            handleSelectVenue(vName);
          }}
          onSelectShow={(shId) => {
            setViewMode("archive");
            handleSelectShow(shId);
          }}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onSelectTab={(newTab, options) => {
            setViewMode("archive");
            setTab(newTab);
            if (newTab === "song" && options?.sortMode) setSongSortMode(options.sortMode);
            if (newTab === "venue" && options?.sortMode) setVenueSortMode(options.sortMode);
          }}
          totalAllShows={totalAllShows}
          allUsedSongs={allUsedSongs}
          allVenues={allVenues}
          allUnits={allUnits}
          q={q}
          setQ={setQ}
        />
      ) : (
        <Fragment>
          {/* Top Full-Width Sticky Status Bar (Dynamic across Show / Song / Venue) */}
          <div
            className="sticky top-0 z-40 w-full bg-band border-b border-ink/20 shadow-xs select-none"
            onClick={() => {
              slipRef.current?.scrollIntoView({ behavior: "smooth" }) ||
                window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            role="button"
            tabIndex={0}
            title="點擊滾動回單據頂部"
            aria-label="當前狀態導航列，點擊回單據頂部"
          >
            <div className="mx-auto max-w-[960px] px-4 sm:px-6 flex items-center justify-between gap-3 py-1 sm:py-2 font-mono text-[10px] sm:text-[12px] tracking-wider sm:tracking-[0.14em] text-band-ink whitespace-nowrap overflow-hidden cursor-pointer">
              {/* Left: Dynamic Context Title (Pure & Unobstructed) */}
              <div className="truncate min-w-0 font-bold">
                {tab === "show" && (
                  <span>{current?.unit.title ?? ""}</span>
                )}
                {tab === "song" && (
                  <span>
                    <span aria-hidden="true">🎵</span> {currentSongObj?.title || selSong}
                    {currentSongObj?.unreleased
                      ? "（未發行）"
                      : currentSongObj?.album
                      ? `（${currentSongObj.album}）`
                      : ""}
                  </span>
                )}
                {tab === "venue" && (
                  <span>
                    <span aria-hidden="true">🏛️</span> {selVenue}
                    {currentVenueObj?.city ? `（${currentVenueObj.city}）` : ""}
                  </span>
                )}
              </div>

              {/* Right: Dynamic Summary Metadata + Home Button on Far Right */}
              <div className="shrink-0 flex items-center gap-1.5 sm:gap-3 font-bold opacity-90 sm:opacity-100">
                {tab === "show" && (
                  <>
                    <span className="hidden sm:inline opacity-45">●</span>
                    <span className="hidden sm:inline">
                      {current?.shows.length ?? 0} 場 · {current?.songShows.size ?? 0} 首歌曲
                    </span>
                    <span className="sm:hidden">
                      {current?.shows.length ?? 0} 場
                    </span>
                  </>
                )}
                {tab === "song" && (
                  <>
                    <span className="hidden sm:inline opacity-45">●</span>
                    <span className="hidden sm:inline">
                      累計演唱 {(trackShows.get(trackKey("song", selSong)) ?? []).length} 場
                    </span>
                    <span className="sm:hidden">
                      累計 {(trackShows.get(trackKey("song", selSong)) ?? []).length} 場
                    </span>
                    <span className="opacity-45">●</span>
                    <span>歌曲檔案</span>
                  </>
                )}
                {tab === "venue" && (
                  <>
                    <span className="hidden sm:inline opacity-45">●</span>
                    <span className="hidden sm:inline">
                      累計舉辦 {currentVenueObj?.shows?.length ?? 0} 場
                    </span>
                    <span className="sm:hidden">
                      累計 {currentVenueObj?.shows?.length ?? 0} 場
                    </span>
                    <span className="opacity-45">●</span>
                    <span>場地檔案</span>
                  </>
                )}

                <span className="hidden sm:inline opacity-35 select-none shrink-0">|</span>

                {/* Home Action Button (Desktop only; on mobile, Floating Dock already has Home button) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReturnHome();
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-band-ink/10 hover:bg-band-ink/20 active:scale-95 text-band-ink font-bold border border-band-ink/30 transition-all cursor-pointer text-[10px] sm:text-[11px] shrink-0 shadow-2xs"
                  title="返回首頁"
                  aria-label="返回首頁"
                >
                  <span aria-hidden="true">🏠</span>
                  <span>首頁</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Page Container (Centered 960px) */}
          <div className="mx-auto max-w-[960px] px-4 sm:px-6">
            {/* Original Full Header */}
            <header className="pb-0 pt-3.5 sm:pt-6">
              <p className="m-0 mb-1.5 sm:mb-2 font-mono text-[11px] sm:text-[12px] tracking-[0.2em] text-muted font-bold uppercase">
                LIVE PERFORMANCE &amp; SETLIST ARCHIVE
              </p>
              <h1 className="m-0 font-display text-[clamp(17px,4.5vw,44px)] font-extrabold leading-tight tracking-tight">
                Official髭男dism <span className="font-bold text-band-ink">Setlist 檔案庫</span>
              </h1>
              <p className="mt-2 mb-0 text-[12px] sm:text-[14px] text-muted leading-relaxed">
                場次與曲目雙向檔案庫。收錄 2012 年地下獨立時期至當前巡演的完整現場足跡。
              </p>
              <div className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto sm:flex-wrap font-mono text-[11px] sm:text-[12px] text-ink scrollbar-none">
                <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
                  <span aria-hidden="true">📅</span> 2012–2026 年
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
                  <span aria-hidden="true">🎫</span> {totalAllShows} 場公開演出
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
                  <span aria-hidden="true">🎭</span> {PERFORMANCE_CATEGORIES.length} 大演出型態
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
                  <span aria-hidden="true">🎵</span> {allUsedSongs.length} 首原創曲目
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
                  <span aria-hidden="true">📍</span> {allVenues.length} 處歷史場館
                </span>
              </div>
            </header>

      {/* Top 3 Query Tabs */}
      <div
        className="mt-2.5 sm:mt-4 mb-3 grid w-full grid-cols-3 divide-x-[1.5px] divide-ink overflow-hidden rounded-[4px] border-[1.5px] border-ink bg-card shadow-sm"
        role="group"
        aria-label="查詢方向"
      >
        <button
          type="button"
          className={`${queryTabClass(tab === "show")} border-r-[1.5px] border-ink relative`}
          onClick={() => {
            setTab("show");
            setQ("");
            setIsFilterDrawerOpen(false);
          }}
          aria-pressed={tab === "show"}
        >
          <span aria-hidden="true">🎫</span>
          <span>場次</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({totalAllShows})
          </span>
          {tab === "show" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-band" />
          )}
        </button>
        <button
          type="button"
          className={`${queryTabClass(tab === "song")} border-r-[1.5px] border-ink relative`}
          onClick={() => {
            setTab("song");
            setQ("");
            setIsFilterDrawerOpen(false);
            if (!selSong) setSelSong(allUsedSongs[0]?.id ?? null);
          }}
          aria-pressed={tab === "song"}
        >
          <span aria-hidden="true">🎵</span>
          <span>歌曲</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({allUsedSongs.length})
          </span>
          {tab === "song" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-band" />
          )}
        </button>
        <button
          type="button"
          className={`${queryTabClass(tab === "venue")} relative`}
          onClick={() => {
            setTab("venue");
            setQ("");
            setIsFilterDrawerOpen(false);
            if (!selVenue) setSelVenue(allVenues[0]?.name ?? null);
          }}
          aria-pressed={tab === "venue"}
        >
          <span aria-hidden="true">🏛️</span>
          <span>場地</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({allVenues.length})
          </span>
          {tab === "venue" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-band" />
          )}
        </button>
      </div>

      {/* Global SearchBox (Desktop: 常駐展示；Mobile: 改由底部雙鍵 Dock Spotlight 喚起) */}
      <div className="hidden sm:block mb-4 w-full">
        <SearchBox
          q={q}
          setQ={setQ}
          allUsedSongs={allUsedSongs}
          allUnits={allUnits}
          allVenues={allVenues}
          onSelectSong={handleSelectSong}
          onSelectUnit={handleSelectUnit}
          onSelectVenue={handleSelectVenue}
          onSelectShow={handleSelectShow}
          onOpenCalendar={() => setIsCalendarOpen(true)}
        />
      </div>

      {/* Mobile Current Context Summary Bar (Tap to open Filter Bottom Sheet) */}
      <div className="sm:hidden mb-4">
        <button
          type="button"
          onClick={openFilterDrawer}
          className="w-full flex items-center justify-between gap-2.5 rounded-[6px] border-[1.5px] border-ink bg-card px-3.5 py-2 text-left shadow-xs active:bg-paper cursor-pointer transition-colors"
          aria-label="點擊開啟篩選抽屜"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              {tab === "show" ? "🎫" : tab === "song" ? "🎵" : "🏛️"}
            </span>
            <div className="min-w-0 flex flex-col justify-center">
              {tab === "show" && (
                <>
                  <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider truncate">
                    {selYear} · {selCategory} · {current?.unit ? shortUnitTitle(current.unit) : ""}
                  </div>
                  <div className="text-[13px] font-black text-ink truncate leading-tight pt-0.5">
                    {currentShowObj
                      ? `${currentShowObj.date} ${currentShowObj.city || currentShowObj.venue}`
                      : current?.unit
                      ? shortUnitTitle(current.unit)
                      : "選擇場次"}
                  </div>
                </>
              )}
              {tab === "song" && (
                <>
                  <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider truncate">
                    目前選定歌曲 · {currentSongObj?.album ? currentSongObj.album : "歌曲檔案"}
                  </div>
                  <div className="text-[13px] font-black text-ink truncate leading-tight pt-0.5">
                    {currentSongObj ? `《${currentSongObj.title}》` : selSong || "選擇歌曲"}
                  </div>
                </>
              )}
              {tab === "venue" && (
                <>
                  <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider truncate">
                    目前選定場館 · {currentVenueObj?.city ? currentVenueObj.city : "場地紀錄"}
                  </div>
                  <div className="text-[13px] font-black text-ink truncate leading-tight pt-0.5">
                    {currentVenueObj ? `${selVenue} (${currentVenueObj.shows?.length || 0}場)` : selVenue || "選擇場地"}
                  </div>
                </>
              )}
            </div>
          </div>
          <span className="shrink-0 rounded bg-band px-2.5 py-1.5 font-mono text-[11px] font-extrabold text-band-ink border border-ink/30 shadow-2xs">
            變更 ▾
          </span>
        </button>
      </div>

      {/* Single-Column Focused Content Area */}
      <main id="main-content" tabIndex={-1} className="w-full outline-none">
        {/* ===================== TAB 1: SHOW ===================== */}
        {tab === "show" && (
          <div className="flex flex-col gap-4">
            {/* Desktop Navigator (Collapsible) */}
            <div className="hidden sm:block">
              {!isDesktopNavOpen ? (
                <button
                  type="button"
                  onClick={toggleDesktopNav}
                  className="w-full group flex items-center justify-between gap-3 rounded-[6px] border-[1.5px] border-ink bg-card px-4 py-2.5 text-left shadow-xs hover:border-pool hover:shadow-sm active:bg-paper cursor-pointer transition-all motion-reduce:transition-none"
                  title="點擊展開演出場次篩選器"
                  aria-expanded={false}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0" aria-hidden="true">🎫</span>
                    <div className="min-w-0 flex items-baseline gap-2 font-mono text-[12px]">
                      <span className="font-bold text-ink truncate">
                        {selCategory} · {selYear} · {current?.unit ? shortUnitTitle(current.unit) : ""}
                      </span>
                      {currentShowObj && (
                        <span className="text-muted shrink-0">
                          （{currentShowObj.date.slice(5)} {currentShowObj.city || currentShowObj.venue}）
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded bg-band px-3 py-1 font-mono text-[11px] font-extrabold text-band-ink border border-ink/40 shadow-2xs group-hover:bg-tape transition-colors">
                    變更篩選 ▾
                  </span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎫 演出場次篩選器</span>
                    </span>
                    <button
                      type="button"
                      onClick={toggleDesktopNav}
                      className="inline-flex items-center gap-1 rounded bg-paper hover:bg-tape-tint px-2.5 py-1 font-mono text-[11px] font-bold text-ink border border-line-soft hover:border-ink transition-colors cursor-pointer shadow-2xs"
                      title="收合篩選器以專注查看下方歌單小卡"
                      aria-expanded={true}
                    >
                      <span>收合篩選器</span>
                      <span aria-hidden="true">▴</span>
                    </button>
                  </div>
                  {renderShowNavigator(false)}
                </div>
              )}
            </div>

            {/* Setlist Slip Receipt */}
            <section ref={slipRef} className="mt-2 sm:mt-4 scroll-mt-8 sm:scroll-mt-10">
              <ShowSlip
                ud={current}
                showId={selShow}
                onSelectSong={handleSelectSong}
                onSelectShow={handleSelectShow}
                onSelectVenue={handleSelectVenue}
              />
            </section>
          </div>
        )}

        {/* ===================== TAB 2: SONG ===================== */}
        {tab === "song" && (
          <div className="flex flex-col gap-4">
            {/* Desktop Navigator (Collapsible) */}
            <div className="hidden sm:block">
              {!isDesktopNavOpen ? (
                <button
                  type="button"
                  onClick={toggleDesktopNav}
                  className="w-full group flex items-center justify-between gap-3 rounded-[6px] border-[1.5px] border-ink bg-card px-4 py-2.5 text-left shadow-xs hover:border-pool hover:shadow-sm active:bg-paper cursor-pointer transition-all motion-reduce:transition-none"
                  title="點擊展開歌曲檔案篩選器"
                  aria-expanded={false}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0" aria-hidden="true">🎵</span>
                    <div className="min-w-0 flex items-baseline gap-2 font-mono text-[12px]">
                      <span className="font-bold text-ink truncate">
                        《{currentSongObj?.title || selSong}》
                      </span>
                      {currentSongObj?.album && (
                        <span className="text-muted truncate">
                          · {currentSongObj.album}
                        </span>
                      )}
                      <span className="text-muted shrink-0 tabular-nums">
                        · 累積出演 {(trackShows.get(trackKey("song", selSong)) ?? []).length} 場
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded bg-band px-3 py-1 font-mono text-[11px] font-extrabold text-band-ink border border-ink/40 shadow-2xs group-hover:bg-tape transition-colors">
                    變更篩選 ▾
                  </span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎵 歌曲檔案篩選器</span>
                    </span>
                    <button
                      type="button"
                      onClick={toggleDesktopNav}
                      className="inline-flex items-center gap-1 rounded bg-paper hover:bg-tape-tint px-2.5 py-1 font-mono text-[11px] font-bold text-ink border border-line-soft hover:border-ink transition-colors cursor-pointer shadow-2xs"
                      title="收合篩選器以專注查看下方歌曲檔案小卡"
                      aria-expanded={true}
                    >
                      <span>收合篩選器</span>
                      <span aria-hidden="true">▴</span>
                    </button>
                  </div>
                  {renderSongNavigator(false)}
                </div>
              )}
            </div>

            {/* Song Slip Receipt */}
            <section ref={slipRef} className="mt-2 sm:mt-4 scroll-mt-8 sm:scroll-mt-10">
              <SongSlip
                songId={selSong}
                trackShows={trackShows}
                showById={showById}
                onSelectShow={handleSelectShow}
              />
            </section>
          </div>
        )}

        {/* ===================== TAB 3: VENUE ===================== */}
        {tab === "venue" && (
          <div className="flex flex-col gap-4">
            {/* Desktop Navigator (Collapsible) */}
            <div className="hidden sm:block">
              {!isDesktopNavOpen ? (
                <button
                  type="button"
                  onClick={toggleDesktopNav}
                  className="w-full group flex items-center justify-between gap-3 rounded-[6px] border-[1.5px] border-ink bg-card px-4 py-2.5 text-left shadow-xs hover:border-pool hover:shadow-sm active:bg-paper cursor-pointer transition-all motion-reduce:transition-none"
                  title="點擊展開演出場館篩選器"
                  aria-expanded={false}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0" aria-hidden="true">🏛️</span>
                    <div className="min-w-0 flex items-baseline gap-2 font-mono text-[12px]">
                      <span className="font-bold text-ink truncate">
                        {selVenue}
                      </span>
                      {currentVenueObj?.city && (
                        <span className="text-muted truncate">
                          · {currentVenueObj.pref ? `${currentVenueObj.pref} ` : ""}{currentVenueObj.city}
                        </span>
                      )}
                      <span className="text-muted shrink-0 tabular-nums">
                        · 舉辦過 {currentVenueObj?.shows?.length ?? 0} 場演出
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded bg-band px-3 py-1 font-mono text-[11px] font-extrabold text-band-ink border border-ink/40 shadow-2xs group-hover:bg-tape transition-colors">
                    變更篩選 ▾
                  </span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span>🏛️ 演出場館篩選器</span>
                    </span>
                    <button
                      type="button"
                      onClick={toggleDesktopNav}
                      className="inline-flex items-center gap-1 rounded bg-paper hover:bg-tape-tint px-2.5 py-1 font-mono text-[11px] font-bold text-ink border border-line-soft hover:border-ink transition-colors cursor-pointer shadow-2xs"
                      title="收合篩選器以專注查看下方場地檔案小卡"
                      aria-expanded={true}
                    >
                      <span>收合篩選器</span>
                      <span aria-hidden="true">▴</span>
                    </button>
                  </div>
                  {renderVenueNavigator(false)}
                </div>
              )}
            </div>

            {/* Venue Slip Receipt */}
            <section ref={slipRef} className="mt-2 sm:mt-4 scroll-mt-8 sm:scroll-mt-10">
              <VenueSlip
                venueName={selVenue}
                globalVenueShows={globalVenueShows}
                unitData={unitData}
                onSelectShow={handleSelectShow}
                onSelectSong={handleSelectSong}
              />
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 flex flex-wrap gap-x-[18px] gap-y-[6px] border-t-[1.5px] border-ink pt-3 font-mono text-[12px] text-muted">
        <span>{footTpl}</span>
        <span>{current?.isTour ? "各場差異以 insert / skip 記錄" : ""}</span>
        <span>演出順序、安可標記逐場核對 {sourceSummary}</span>
      </footer>
      </div>

      {/* Mobile Filter Bottom Sheet Modal */}
      {isFilterDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs sm:hidden"
          onClick={handleCancelDrawer}
          role="dialog"
          aria-modal="true"
          aria-label="篩選抽屜"
        >
          <div
            className="w-full max-h-[85vh] flex flex-col rounded-t-2xl border-t-[2px] border-x-[2px] border-ink bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle & header */}
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-3 bg-paper">
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden="true">
                  {tab === "show" ? "🏷️" : tab === "song" ? "🎵" : "🏛️"}
                </span>
                <span className="font-display text-sm font-black text-ink">
                  {tab === "show"
                    ? "篩選演出場次"
                    : tab === "song"
                    ? "挑選歌曲演出檔案"
                    : "挑選場地歷史紀錄"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelDrawer}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-paper border border-line-soft text-muted hover:text-ink hover:bg-tape-tint cursor-pointer font-bold"
                aria-label="關閉抽屜"
              >
                ✕
              </button>
            </div>

            {/* Sheet Body (Scrollable) */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {tab === "show" && renderShowNavigator(true)}
              {tab === "song" && renderSongNavigator(true)}
              {tab === "venue" && renderVenueNavigator(true)}
            </div>

            {/* Bottom Sticky Action Bar (Staged Commit: Cancel + Confirm Apply) */}
            <div className="border-t border-line-soft bg-paper p-3 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCancelDrawer}
                className="w-1/3 rounded bg-card py-2.5 font-mono text-[13px] font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer active:scale-[0.98]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCommitDrawer}
                className="flex-1 rounded bg-band py-2.5 px-3 font-display text-[13px] font-black text-band-ink border border-ink/40 shadow-xs hover:brightness-105 transition-all cursor-pointer active:scale-[0.98] truncate"
              >
                {confirmButtonLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Buttons (Vertical Stack: Top Round Search FAB + Bottom Filter Pill FAB) */}
      <div className="fixed bottom-5 right-4 z-40 sm:hidden flex flex-col items-end gap-2.5 select-none">
        {/* Secondary Action: Search Round FAB (Paper White with Ink Border) */}
        <button
          type="button"
          onClick={() => {
            setIsMobileSearchOpen(true);
            setIsFilterDrawerOpen(false);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full border-[2px] border-ink bg-paper text-ink shadow-[2.5px_2.5px_0_#000] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all text-base"
          aria-label="開啟全域搜尋"
        >
          <span aria-hidden="true">🔍</span>
        </button>

        {/* Primary Action: Filter Pill FAB (Brand Yellow with Ink Border) */}
        <button
          type="button"
          onClick={openFilterDrawer}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border-[2px] border-ink bg-band text-band-ink shadow-[3px_3px_0_#000] font-display text-[13px] font-black cursor-pointer hover:brightness-105 active:scale-95 transition-all"
          aria-label="開啟篩選抽屜"
        >
          <span className="text-base" aria-hidden="true">
            {tab === "show" ? "🏷️" : tab === "song" ? "🎵" : "🏛️"}
          </span>
          <span>
            {tab === "show" ? "篩選場次" : tab === "song" ? "挑選歌曲" : "挑選場地"}
          </span>
        </button>
      </div>

      {/* Mobile Search Spotlight Modal */}
      {isMobileSearchOpen && (
        <div
          className="fixed inset-x-0 z-50 flex flex-col bg-card/95 backdrop-blur-md sm:hidden overflow-hidden"
          style={{
            height: visualViewportStyle.height,
            top: visualViewportStyle.top,
          }}
          role="dialog"
          aria-modal="true"
          aria-label="全域搜尋"
        >
          <SearchBox
            q={q}
            setQ={setQ}
            allUsedSongs={allUsedSongs}
            allUnits={allUnits}
            allVenues={allVenues}
            autoFocus={true}
            isMobileModal={true}
            onCloseModal={() => {
              setIsMobileSearchOpen(false);
              setQ("");
            }}
            onSelectSong={handleSelectSong}
            onSelectUnit={handleSelectUnit}
            onSelectVenue={handleSelectVenue}
            onSelectShow={handleSelectShow}
            onOpenCalendar={() => setIsCalendarOpen(true)}
          />
        </div>
      )}

      {/* Mobile Floating Action Cluster (Left-aligned: Home + Scroll to Top) */}
      <div className="fixed bottom-5 left-4 z-30 sm:hidden flex items-center gap-2 select-none">
        <button
          type="button"
          onClick={handleReturnHome}
          className="inline-flex items-center gap-1 px-3 h-10 rounded-full bg-paper/95 text-ink font-bold shadow-md border-[1.5px] border-ink text-[12px] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all backdrop-blur-xs"
          aria-label="回到首頁門面"
          title="回到首頁門面"
        >
          <span aria-hidden="true">🏠</span>
          <span>首頁</span>
        </button>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-paper/95 text-ink font-bold shadow-md border border-ink text-[14px] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all backdrop-blur-xs"
          aria-label="回到頁首"
          title="回到頁首"
        >
          ↑
        </button>
      </div>
        </Fragment>
      )}

      {/* 📅 Global Calendar Modal (ADR-0096) */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        allUnits={allUnits}
        onSelectShow={handleSelectShow}
      />
    </Fragment>
  );
}
