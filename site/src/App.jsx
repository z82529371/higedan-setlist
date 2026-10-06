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
} from "./lib/domain.js";
import { trackKey, parseRoute, routeHash } from "./lib/track.js";
import { ShowSlip, SongSlip, VenueSlip } from "./components/slips.jsx";
import SearchBox from "./components/SearchBox.jsx";
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

  const slipRef = useRef(null);

  const current = unitData.get(selUnitId);

  // Hash is the single funnel: selections write hash, hashchange applies state.
  const applyRoute = (r) => {
    if (!r) return;
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
      const r =
        parseRoute(window.location.hash) ||
        parseRoute(window.location.pathname);
      applyRoute(r);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (hash) => {
    applyRoute(parseRoute(hash));
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  };

  const handleSelectShow = (showId) => {
    setQ("");
    go(routeHash.show(showId));
  };

  const handleSelectSong = (songId) => {
    setQ("");
    go(routeHash.song(songId));
  };

  const handleSelectVenue = (venueName) => {
    setQ("");
    go(routeHash.venue(venueName));
  };

  const totalAllShows = useMemo(() => {
    return allUnits.reduce((acc, u) => acc + (u.shows?.length || 0), 0);
  }, []);

  // Category counts and statistics
  const categoryStats = useMemo(() => {
    const stats = {};
    for (const cat of PERFORMANCE_CATEGORIES) {
      stats[cat] = { units: 0, shows: 0 };
    }
    for (const u of allUnits) {
      const t = getUnitTypeLabel(u);
      if (!stats[t]) stats[t] = { units: 0, shows: 0 };
      stats[t].units += 1;
      stats[t].shows += u.shows?.length || 0;
    }
    return stats;
  }, []);

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
    const yearsForCat = new Set();
    for (const u of allUnits) {
      if (getUnitTypeLabel(u) === cat) {
        const y = unitEarliest(u).split("-")[0];
        if (y && y !== "9999") yearsForCat.add(y);
      }
    }
    const sorted = Array.from(yearsForCat).sort((a, b) => b.localeCompare(a));
    if (!yearsForCat.has(selYear)) {
      setSelYear(sorted[0] || "2024");
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

  return (
    <Fragment>
      {/* Top Banner */}
      <div className="mx-[-16px] sm:mx-[-24px] flex flex-wrap items-center gap-x-5 gap-y-2 bg-band px-4 sm:px-6 py-2.5 font-mono text-[12px] tracking-[0.14em] text-band-ink">
        <span>{current?.unit.title ?? ""}</span>
        <span className="opacity-45">●</span>
        <span>
          {current?.shows.length ?? 0} 場 · {current?.songShows.size ?? 0} 首歌曲
        </span>
        <span className="opacity-45">●</span>
        <span>資料來源 {sourceSummary}</span>
      </div>

      {/* Header */}
      <header className="pb-2 pt-8">
        <p className="m-0 mb-[10px] font-mono text-[12px] tracking-[0.22em] text-muted">
          <span className="mr-2 inline-block rounded-full border-[1.5px] border-ink px-[10px] py-[1px] tracking-[0.18em] text-ink font-bold">
            {current?.isTour ? "巡演檔案" : "演出檔案"}
          </span>
          {current
            ? `${shortUnitTitle(current.unit)}・場次 × 歌曲雙向查詢`
            : ""}
        </p>
        <h1 className="m-0 font-display text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.1] tracking-[0.01em] [text-wrap:balance]">
          那一晚，<span className="font-bold text-pool">他們唱了什麼。</span>
        </h1>
      </header>

      {/* Top 3 Query Tabs */}
      <div
        className="mt-7 mb-3 grid w-full grid-cols-3 divide-x-[1.5px] divide-ink overflow-hidden rounded-[4px] border-[1.5px] border-ink bg-card shadow-sm"
        role="group"
        aria-label="查詢方向"
      >
        <button
          type="button"
          className={`${queryTabClass(tab === "show")} border-r-[1.5px] border-ink relative`}
          onClick={() => {
            setTab("show");
            setQ("");
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

      {/* Global SearchBox */}
      <div className="mb-5 w-full">
        <SearchBox
          q={q}
          setQ={setQ}
          allUsedSongs={allUsedSongs}
          allUnits={allUnits}
          allVenues={allVenues}
          onSelectSong={handleSelectSong}
          onSelectUnit={(uId) => {
            const u = unitData.get(uId)?.unit;
            if (u) {
              setSelUnitId(uId);
              const defShow = defaultShowId(u);
              setSelShow(defShow);
              const cat = getUnitTypeLabel(u);
              const yr = unitEarliest(u).split("-")[0];
              setSelCategory(cat);
              if (yr && yr !== "9999") setSelYear(yr);
              go(routeHash.show(defShow));
            }
          }}
          onSelectVenue={handleSelectVenue}
        />
      </div>

      {/* Single-Column Focused Content Area */}
      <main id="main-content" tabIndex={-1} className="w-full outline-none">
        {/* ===================== TAB 1: SHOW ===================== */}
        {tab === "show" && (
          <div className="flex flex-col gap-4">
            {/* Beginner-Proof 4-Tier Wrapping Pill Kiosk Navigator */}
            <div className="rounded-[6px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-sm space-y-4">
              {/* Step 1: 演出分類 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <span aria-hidden="true">🏷️</span>
                    <span>1. 選擇演出類型</span>
                  </span>
                  <span className="font-mono text-[11px] text-muted tabular-nums">
                    {categoryStats[selCategory]?.shows || 0} 場演出
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {PERFORMANCE_CATEGORIES.map((cat) => {
                    const isCur = selCategory === cat;
                    const stat = categoryStats[cat] || { units: 0, shows: 0 };
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryClick(cat)}
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
                  {availableYears.map((yr) => {
                    const isCur = selYear === yr;
                    const count = yearStats.get(yr)?.shows || 0;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setSelYear(yr);
                          setUnitPage(0);
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
                      3. 選擇活動／巡演（{selYear} 年 · 共 {filteredUnits.length} 部）
                    </span>
                  </span>
                </div>
                <PaginationPills
                  total={filteredUnits.length}
                  pageSize={PAGE_SIZE}
                  page={unitPage}
                  onPageChange={setUnitPage}
                />
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {pagedUnits.map((u) => {
                    const isCur = u.id === selUnitId;
                    const showCnt = (u.shows ?? []).length;
                    const uData = unitData.get(u.id);
                    const hasSongs = (uData?.songShows?.size ?? 0) > 0;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelUnitId(u.id);
                          const targetShowId = defaultShowId(u);
                          setSelShow(targetShowId);
                          go(routeHash.show(targetShowId));
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
              {current?.shows && current.shows.length > 1 && (
                <div className="pt-2 border-t border-line-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span aria-hidden="true">🎫</span>
                      <span>4. 切換場次日期（全 {current.shows.length} 場）</span>
                    </span>
                  </div>
                  <PaginationPills
                    total={current.shows.length}
                    pageSize={PAGE_SIZE}
                    page={showPage}
                    onPageChange={setShowPage}
                  />
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {pagedShows.map((s) => {
                      const isCur = s.id === selShow;
                      const songCnt = (current.full.get(s.id) || []).filter(
                        (i) => i.songId || i.title
                      ).length;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectShow(s.id)}
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

            {/* Setlist Slip Receipt */}
            <section ref={slipRef}>
              <ShowSlip
                ud={current}
                showId={selShow}
                onSelectSong={handleSelectSong}
                onSelectShow={handleSelectShow}
              />
            </section>
          </div>
        )}

        {/* ===================== TAB 2: SONG ===================== */}
        {tab === "song" && (
          <div className="flex flex-col gap-4">
            {/* Song Selector Card */}
            <div className="rounded-[6px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-sm space-y-4">
              {/* Step 1: 排序/分類方式 */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <span aria-hidden="true">🎵</span>
                  <span>1. 歌曲分類方式</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                      songSortMode === "album"
                        ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                        : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
                    }`}
                    onClick={() => {
                      setSongSortMode("album");
                      setSongPage(0);
                    }}
                  >
                    💿 依發行專輯分類
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                      songSortMode === "count"
                        ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                        : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
                    }`}
                    onClick={() => {
                      setSongSortMode("count");
                      setSongPage(0);
                    }}
                  >
                    🏆 依演唱次數排行
                  </button>
                </div>
              </div>

              {/* Step 2 (若為專輯分類): 選擇專輯 */}
              {songSortMode === "album" && (
                <div className="pt-2 border-t border-line-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span aria-hidden="true">💿</span>
                      <span>2. 選擇發行專輯</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {ALBUM_ORDER.map((alb) => {
                      const isCur = selAlbum === alb;
                      const sCount = allUsedSongs.filter(
                        (s) => getSongAlbum(s) === alb
                      ).length;
                      if (sCount === 0) return null;
                      return (
                        <button
                          key={alb}
                          type="button"
                          onClick={() => {
                            setSelAlbum(alb);
                            setSongPage(0);
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
                      {songSortMode === "album"
                        ? `2. 選擇歌曲（${selAlbum} · 共 ${filteredSongs.length} 首）`
                        : `2. 演唱次數排行（共 ${filteredSongs.length} 首）`}
                    </span>
                  </span>
                </div>
                <PaginationPills
                  total={filteredSongs.length}
                  pageSize={PAGE_SIZE}
                  page={songPage}
                  onPageChange={setSongPage}
                />
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {pagedSongs.map((s, idx) => {
                    const isCur = s.id === selSong;
                    const cnt = (
                      trackShows.get(trackKey("song", s.id)) ?? []
                    ).length;
                    const safePage = Math.min(
                      songPage,
                      Math.max(0, Math.ceil(filteredSongs.length / PAGE_SIZE) - 1)
                    );
                    const rankNum =
                      songSortMode === "count"
                        ? safePage * PAGE_SIZE + idx + 1
                        : idx + 1;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSong(s.id)}
                        className={`rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                          isCur
                            ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                            : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                        }`}
                      >
                        {songSortMode === "count" && (
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

            {/* Song Slip Receipt */}
            <section ref={slipRef}>
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
            {/* Venue Selector Card */}
            <div className="rounded-[6px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-sm space-y-4">
              {/* Step 1: 排序/分類方式 */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <span aria-hidden="true">🏛️</span>
                  <span>1. 場地分類方式</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                      venueSortMode === "region"
                        ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                        : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
                    }`}
                    onClick={() => {
                      setVenueSortMode("region");
                      setVenuePage(0);
                    }}
                  >
                    📍 依日本地理分區
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                      venueSortMode === "count"
                        ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                        : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
                    }`}
                    onClick={() => {
                      setVenueSortMode("count");
                      setVenuePage(0);
                    }}
                  >
                    🏆 依累積場次排行
                  </button>
                </div>
              </div>

              {/* Step 2 (若為分區): 選擇地區 */}
              {venueSortMode === "region" && (
                <div className="pt-2 border-t border-line-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span aria-hidden="true">📍</span>
                      <span>2. 選擇地理分區</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {REGION_ORDER.map((reg) => {
                      const isCur = selRegion === reg;
                      const vCount = allVenues.filter(
                        (v) => getVenueRegion(v) === reg
                      ).length;
                      if (vCount === 0) return null;
                      return (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => {
                            setSelRegion(reg);
                            setVenuePage(0);
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
                      {venueSortMode === "region"
                        ? `2. 選擇場地（${selRegion} · 共 ${filteredVenues.length} 處）`
                        : `2. 登場次數排行（共 ${filteredVenues.length} 處）`}
                    </span>
                  </span>
                </div>
                <PaginationPills
                  total={filteredVenues.length}
                  pageSize={PAGE_SIZE}
                  page={venuePage}
                  onPageChange={setVenuePage}
                />
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {pagedVenues.map((v, idx) => {
                    const isCur = v.name === selVenue;
                    const safePage = Math.min(
                      venuePage,
                      Math.max(0, Math.ceil(filteredVenues.length / PAGE_SIZE) - 1)
                    );
                    const rankNum =
                      venueSortMode === "count"
                        ? safePage * PAGE_SIZE + idx + 1
                        : idx + 1;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => handleSelectVenue(v.name)}
                        className={`rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                          isCur
                            ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                            : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                        }`}
                      >
                        {venueSortMode === "count" && (
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

            {/* Venue Slip Receipt */}
            <section ref={slipRef}>
              <VenueSlip
                venueName={selVenue}
                globalVenueShows={globalVenueShows}
                unitData={unitData}
                onSelectShow={handleSelectShow}
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
    </Fragment>
  );
}
