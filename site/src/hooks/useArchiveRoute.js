import { useState, useEffect, useMemo, useRef } from "react";
import {
  allUnits,
  defaultShowId,
  getUnitTypeLabel,
  unitEarliest,
  getSongAlbum,
  getVenueRegion,
  songTitle,
} from "../lib/domain.js";
import { parseRoute, routeHash } from "../lib/track.js";

export function useArchiveRoute({
  unitData,
  allUsedSongs,
  allVenues,
  unitIdByShowId,
  filterState,
}) {
  const {
    selCategory,
    setSelCategory,
    selYear,
    setSelYear,
    unitPage,
    setUnitPage,
    showPage,
    setShowPage,
    songSortMode,
    setSongSortMode,
    selAlbum,
    setSelAlbum,
    songPage,
    setSongPage,
    venueSortMode,
    setVenueSortMode,
    selRegion,
    setSelRegion,
    venuePage,
    setVenuePage,
  } = filterState;

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

  // Desktop Collapsible Navigator state (persisted in localStorage)
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
  }, [draftState, tab, unitData, allUsedSongs]);

  return {
    initial,
    viewMode,
    setViewMode,
    tab,
    setTab,
    selUnitId,
    setSelUnitId,
    selShow,
    setSelShow,
    selSong,
    setSelSong,
    selVenue,
    setSelVenue,
    q,
    setQ,
    isDesktopNavOpen,
    toggleDesktopNav,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    isMobileSearchOpen,
    setIsMobileSearchOpen,
    isCalendarOpen,
    setIsCalendarOpen,
    draftState,
    setDraftState,
    openFilterDrawer,
    handleCancelDrawer,
    handleCommitDrawer,
    confirmButtonLabel,
    slipRef,
    go,
    handleSelectShow,
    handleSelectSong,
    handleSelectVenue,
    handleSelectUnit,
    handleReturnHome,
    visualViewportStyle,
  };
}
