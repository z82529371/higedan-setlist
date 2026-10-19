import { useState, useEffect, useMemo, useRef } from "react";
import {
  allUnits,
  defaultShowId,
  getUnitTypeLabel,
  unitEarliest,
  getSongAlbum,
  getVenueRegion,
  songTitle,
  shortUnitTitle,
  formatShowPlace,
} from "../lib/domain.js";
import { parseRoute, routeHash } from "../lib/routes.js";
import { useI18n, DEFAULT_LOCALE } from "../lib/i18n.jsx";
import { resolveVenueCanonical } from "../lib/locales/venues.js";

export function useArchiveRoute({
  unitData,
  allUsedSongs,
  allVenues,
  unitIdByShowId,
  filterState,
  initialDraftState = null,
}) {
  const { t, locale } = useI18n();

  const appendLang = (h) => {
    if (!h || !locale || locale === DEFAULT_LOCALE) return h;
    const [path, qs] = h.split("?");
    const params = new URLSearchParams(qs || "");
    if (!params.has("lang")) {
      params.set("lang", locale);
    }
    const newQs = params.toString();
    return newQs ? `${path}?${newQs}` : path;
  };
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
      showSubMode: allUnits[0]?.templateSetlist ? "tour" : "show",
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
        tab: "show",
        showSubMode: "show",
        selUnitId: unitIdByShowId.get(r.value),
        selShow: r.value,
      };
    const resolvedVenue = r.kind === "venue" ? (resolveVenueCanonical(r.value) || r.value) : null;
    if (r.kind === "venue" && allVenues.some((v) => v.name === resolvedVenue))
      return { ...fallback, tab: "venue", selVenue: resolvedVenue };
    if (r.kind === "tour") {
      const uEntry = unitData.get(r.value);
      if (uEntry) {
        const defShow = defaultShowId(uEntry.unit);
        if (uEntry.isTour) {
          return {
            ...fallback,
            tab: "show",
            showSubMode: "tour",
            selUnitId: r.value,
            selShow: defShow,
          };
        } else {
          return {
            ...fallback,
            tab: "show",
            showSubMode: "show",
            selUnitId: r.value,
            selShow: defShow,
          };
        }
      }
    }
    return fallback;
  };

  const [initial] = useState(initialSelection);
  const [viewMode, setViewMode] = useState(() => {
    const rawHash = window.location.hash;
    if (rawHash === "#/archive") return "archive";
    const r =
      parseRoute(rawHash) || parseRoute(window.location.pathname);
    if (!r) return "landing";
    if (r.kind === "song" && allUsedSongs.some((s) => s.id === r.value)) return "archive";
    if (r.kind === "show" && unitIdByShowId.has(r.value)) return "archive";
    if (r.kind === "venue" && allVenues.some((v) => v.name === (resolveVenueCanonical(r.value) || r.value))) return "archive";
    if (r.kind === "tour") {
      const uEntry = unitData.get(r.value);
      if (uEntry) return "archive";
      return "landing";
    }
    return "landing";
  });

  const [selUnitId, setSelUnitId] = useState(initial.selUnitId);
  const [tab, setTab] = useState(initial.tab);
  const [showSubMode, setShowSubMode] = useState(initial.showSubMode || "show");
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
  const [draftState, setDraftState] = useState(initialDraftState);

  const openFilterDrawer = () => {
    setDraftState({
      category: selCategory,
      year: selYear,
      unitId: selUnitId,
      showId: selShow,
      showSubMode: showSubMode,
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
      setShowSubMode("show");
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
    } else if (r.kind === "tour") {
      const uEntry = unitData.get(r.value);
      if (!uEntry) {
        setViewMode("landing");
        window.location.hash = appendLang("#/");
        return;
      }
      setTab("show");
      setSelUnitId(r.value);
      setQ("");
      const targetUnit = uEntry.unit;
      if (targetUnit) {
        const cat = getUnitTypeLabel(targetUnit);
        const yr = unitEarliest(targetUnit).split("-")[0];
        setSelCategory(cat);
        if (yr && yr !== "9999") {
          setSelYear(yr);
        }
      }
      const defShow = defaultShowId(targetUnit);
      if (defShow) {
        setSelShow(defShow);
      }
      if (!uEntry.isTour) {
        setShowSubMode("show");
        const targetHash = appendLang(routeHash.show(defShow));
        if (defShow && window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
      } else {
        setShowSubMode("tour");
        const targetHash = appendLang(routeHash.tour(r.value));
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
      }
    } else if (r.kind === "venue") {
      const resolvedVenue = resolveVenueCanonical(r.value) || r.value;
      if (allVenues.some((v) => v.name === resolvedVenue)) {
        setTab("venue");
        setSelVenue(resolvedVenue);
        setQ("");
        const venueObj = allVenues.find((v) => v.name === resolvedVenue);
        if (venueObj) {
          setSelRegion(getVenueRegion(venueObj));
        }
        if (r.value !== resolvedVenue && typeof window !== "undefined") {
          const canonicalHash = appendLang(routeHash.venue(resolvedVenue));
          if (window.location.hash !== canonicalHash) {
            window.history.replaceState(null, "", canonicalHash);
          }
        }
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
        if (r.kind === "tour" && !unitData.get(r.value)) {
          setViewMode("landing");
          window.location.hash = appendLang("#/");
          window.scrollTo({ top: 0, behavior: "instant" });
          return;
        }
        if (r.kind === "show" && !unitIdByShowId.has(r.value)) {
          setViewMode("landing");
          window.location.hash = appendLang("#/");
          window.scrollTo({ top: 0, behavior: "instant" });
          return;
        }
        if (r.kind === "song" && !allUsedSongs.some((s) => s.id === r.value)) {
          setViewMode("landing");
          window.location.hash = appendLang("#/");
          window.scrollTo({ top: 0, behavior: "instant" });
          return;
        }
        if (r.kind === "venue") {
          const resolvedVenue = resolveVenueCanonical(r.value) || r.value;
          if (!allVenues.some((v) => v.name === resolvedVenue)) {
            setViewMode("landing");
            window.location.hash = appendLang("#/");
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
          }
        }
        setViewMode("archive");
        applyRoute(r);
      } else {
        setViewMode("landing");
        window.location.hash = appendLang("#/");
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [unitData, unitIdByShowId, allUsedSongs, allVenues]);

  useEffect(() => {
    const rawHash = window.location.hash;
    const r = parseRoute(rawHash);
    if (r && r.kind === "tour") {
      const uEntry = unitData.get(r.value);
      if (uEntry && !uEntry.isTour) {
        const defShow = defaultShowId(uEntry.unit);
        const targetHash = appendLang(routeHash.show(defShow));
        if (defShow && window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
      }
    }
  }, [unitData]);

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
    const targetHash = appendLang(hash);
    applyRoute(parseRoute(targetHash));
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  };

  const handleSelectShow = (showId) => {
    setQ("");
    setIsFilterDrawerOpen(false);
    setIsMobileSearchOpen(false);
    setShowSubMode("show");
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
    const uEntry = unitData.get(uId);
    const u = uEntry?.unit;
    if (u) {
      setSelUnitId(uId);
      const cat = getUnitTypeLabel(u);
      const yr = unitEarliest(u).split("-")[0];
      setSelCategory(cat);
      if (yr && yr !== "9999") setSelYear(yr);
      setTab("show");

      if (explicitShowId) {
        setShowSubMode("show");
        setSelShow(explicitShowId);
        go(routeHash.show(explicitShowId));
      } else if (uEntry?.isTour) {
        setShowSubMode("tour");
        const targetShow = defaultShowId(u);
        setSelShow(targetShow);
        go(routeHash.tour(uId));
      } else {
        setShowSubMode("show");
        const targetShow = defaultShowId(u);
        setSelShow(targetShow);
        go(routeHash.show(targetShow));
      }
    }
  };

  const handleSelectTourMode = () => {
    const currentUnit = unitData.get(selUnitId);
    if (currentUnit?.isTour) {
      setShowSubMode("tour");
      go(routeHash.tour(selUnitId));
    }
  };

  const handleSelectShowMode = () => {
    setShowSubMode("show");
    const targetShow = selShow || defaultShowId(unitData.get(selUnitId)?.unit);
    if (targetShow) {
      go(routeHash.show(targetShow));
    }
  };

  const handleToggleSubMode = (nextMode) => {
    if (nextMode === "tour") {
      handleSelectTourMode();
    } else {
      handleSelectShowMode();
    }
  };

  const handleReturnHome = () => {
    setViewMode("landing");
    setQ("");
    window.location.hash = appendLang("#/");
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
      const isTour = unitData.get(draftState.unitId)?.isTour;
      if (draftState.showSubMode === "tour" && isTour) {
        setShowSubMode("tour");
        setSelShow(draftState.showId);
        go(routeHash.tour(draftState.unitId));
      } else {
        setShowSubMode("show");
        handleSelectShow(draftState.showId);
      }
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
    if (!draftState) return t("confirm.apply", "確認套用");
    if (tab === "show") {
      const uEntry = unitData.get(draftState.unitId);
      const u = uEntry?.unit;
      const isTour = uEntry?.isTour;
      if (draftState.showSubMode === "tour" && isTour) {
        return t("confirm.applyTour", "確認套用：{title}（巡演總覽）", { title: shortUnitTitle(u) });
      }
      const s = (u?.shows || []).find((x) => x.id === draftState.showId);
      if (s) {
        const place = formatShowPlace(s, t);
        return t("confirm.applyShow", "確認套用：{date} {place}", { date: s.date.slice(5), place });
      }
      return t("confirm.applyShowFallback", "確認套用場次");
    }
    if (tab === "song") {
      const s = allUsedSongs.find((x) => x.id === draftState.songId);
      if (s) {
        return t("confirm.applySong", "確認套用：《{title}》", { title: songTitle[s.id] || s.title || s.id });
      }
      return t("confirm.applySongFallback", "確認套用歌曲");
    }
    if (tab === "venue") {
      return draftState.venueName ? t("confirm.applyVenue", "確認套用：{venue}", { venue: draftState.venueName }) : t("confirm.applyVenueFallback", "確認套用場地");
    }
    return t("confirm.apply", "確認套用");
  }, [draftState, tab, unitData, allUsedSongs, t]);

  return {
    initial,
    viewMode,
    setViewMode,
    tab,
    setTab,
    showSubMode,
    setShowSubMode,
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
    handleSelectTourMode,
    handleSelectShowMode,
    handleToggleSubMode,
    handleReturnHome,
    appendLang,
    visualViewportStyle,
  };
}
