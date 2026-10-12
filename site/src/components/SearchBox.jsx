import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { getSongAlbum, getUnitTypeLabel, shortUnitTitle, songUnreleased, unitEarliest } from "../lib/domain.js";

export default function SearchBox({
  q,
  setQ,
  allUsedSongs,
  allUnits,
  allVenues,
  onSelectSong,
  onSelectUnit,
  onSelectVenue,
  onSelectShow,
  onOpenCalendar,
  size = "md", // "md" | "lg"
  autoFocus = false,
  isMobileModal = false,
  onCloseModal,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const needle = q.trim().toLowerCase();
  // Normalize date needle without delimiters (e.g. "2024-09-21" -> "20240921")
  const dateRawNeedle = needle.replace(/[-/.]/g, "");

  const { matchedSongs, matchedUnits, matchedVenues, matchedShows, flatItems } = useMemo(() => {
    if (!needle) {
      return { matchedSongs: [], matchedUnits: [], matchedVenues: [], matchedShows: [], flatItems: [] };
    }

    // 1. Shows matching date or show title (ADR-0096 Date-Aware Search)
    const shows = [];
    const isDatePattern = /^\d{2,4}([-/.]\d{1,2})?([-/.]\d{1,2})?$/.test(needle) || /^\d{4,8}$/.test(needle);

    for (const u of allUnits) {
      for (const s of u.shows || []) {
        const sDate = s.date || "";
        const sDateRaw = sDate.replace(/[-/.]/g, "");
        const sTitle = (s.title || "").toLowerCase();

        // Exact or prefix/contains matching on date formats
        const matchDate =
          sDate.includes(needle) ||
          (dateRawNeedle.length >= 4 && sDateRaw.includes(dateRawNeedle)) ||
          (isDatePattern && (sDate.startsWith(needle) || sDate.endsWith(needle)));

        if (matchDate || (needle.length >= 3 && sTitle.includes(needle))) {
          shows.push({
            type: "show",
            id: s.id,
            date: sDate,
            title: s.title || s.venue || "演出場次",
            unitTitle: shortUnitTitle(u) || u.title,
            venue: s.venue,
            city: s.city,
            badge: getUnitTypeLabel(u),
          });
        }
      }
    }

    // Sort shows by date descending
    shows.sort((a, b) => b.date.localeCompare(a.date));

    // 2. Songs & Title tracks
    const songs = [];
    for (const s of allUsedSongs) {
      const title = (s.title || "").toLowerCase();
      const titleJa = (s.titleJa || "").toLowerCase();
      const titleEn = (s.titleEn || "").toLowerCase();
      const ruby = (s.ruby || "").toLowerCase();
      if (
        title.includes(needle) ||
        titleJa.includes(needle) ||
        titleEn.includes(needle) ||
        ruby.includes(needle)
      ) {
        let sub = null;
        if (s.titleJa && s.titleJa !== s.title && s.titleJa.toLowerCase().includes(needle)) {
          sub = s.titleJa;
        } else if (s.titleEn && s.titleEn !== s.title && s.titleEn.toLowerCase().includes(needle)) {
          sub = s.titleEn;
        }
        songs.push({
          type: "song",
          id: s.id,
          title: s.title,
          subTitle: sub,
          album: getSongAlbum(s),
          unreleased: s.unreleased || songUnreleased.has(s.id),
        });
      }
    }

    // 3. Units (Tours & Events)
    const units = [];
    for (const u of allUnits) {
      const title = (u.title || "").toLowerCase();
      const shortTitle = (shortUnitTitle(u) || "").toLowerCase();
      const year = unitEarliest(u).split("-")[0];
      const type = (u.type || (u.isTour ? "巡演專場" : "特別專場")).toLowerCase();
      if (
        title.includes(needle) ||
        shortTitle.includes(needle) ||
        type.includes(needle) ||
        (needle.length >= 4 && year.includes(needle))
      ) {
        units.push({
          type: "unit",
          id: u.id,
          title: shortUnitTitle(u) || u.title,
          year,
          badge: getUnitTypeLabel(u),
        });
      }
    }

    // 4. Venues
    const venues = [];
    for (const v of allVenues) {
      const name = (v.name || "").toLowerCase();
      const city = (v.city || "").toLowerCase();
      const region = (v.region || "").toLowerCase();
      const pref = (v.prefecture || "").toLowerCase();
      if (
        name.includes(needle) ||
        city.includes(needle) ||
        region.includes(needle) ||
        pref.includes(needle)
      ) {
        venues.push({
          type: "venue",
          id: v.name,
          name: v.name,
          city: v.city,
          count: v.shows?.length ?? 0,
        });
      }
    }

    const showsSlice = shows.slice(0, 5);
    const songsSlice = songs.slice(0, 5);
    const unitsSlice = units.slice(0, 5);
    const venuesSlice = venues.slice(0, 5);

    // If query looks like a date, prioritize shows first
    const flat = isDatePattern
      ? [...showsSlice, ...unitsSlice, ...songsSlice, ...venuesSlice]
      : [...showsSlice, ...songsSlice, ...unitsSlice, ...venuesSlice];

    return {
      matchedShows: shows,
      matchedSongs: songs,
      matchedUnits: units,
      matchedVenues: venues,
      flatItems: flat,
    };
  }, [needle, dateRawNeedle, allUsedSongs, allUnits, allVenues]);

  // Reset activeIndex when query changes
  useEffect(() => {
    setActiveIndex(-1);
    if (needle) {
      setIsOpen(true);
    }
  }, [needle]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectItem = (item) => {
    if (!item) return;
    setIsOpen(false);
    inputRef.current?.blur();
    if (item.type === "show") {
      if (onSelectShow) onSelectShow(item.id);
    } else if (item.type === "song") {
      onSelectSong(item.id);
    } else if (item.type === "unit") {
      onSelectUnit(item.id);
    } else if (item.type === "venue") {
      onSelectVenue(item.id);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || flatItems.length === 0) {
      if (e.key === "ArrowDown" && needle) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? flatItems.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIndex >= 0 ? flatItems[activeIndex] : flatItems[0];
      handleSelectItem(target);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQ("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const renderResultsList = (isModal = false) => {
    let runningIndex = 0;

    if (flatItems.length === 0) {
      return (
        <div className="px-4 py-8 text-center font-mono text-[13px] text-muted">
          無相符的日期、歌曲、演出或場地
        </div>
      );
    }

    return (
      <Fragment>
        {/* 📅 場次日期分組 (ADR-0096) */}
        {matchedShows.length > 0 && (
          <div>
            <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-line-soft bg-paper/95 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.1em] text-muted uppercase backdrop-blur-xs">
              <span><span aria-hidden="true">📅</span> 歷史場次日期</span>
              <span className="text-[11px] font-normal opacity-75">
                {matchedShows.length} 場
              </span>
            </div>
            {matchedShows.slice(0, 5).map((sh) => {
              const itemIdx = runningIndex++;
              const isActive = activeIndex === itemIdx;
              return (
                <div
                  key={`show-${sh.id}`}
                  role="option"
                  aria-selected={isActive}
                  className={`flex cursor-pointer items-center justify-between border-b border-line-soft/60 px-3.5 py-2.5 text-[14px] transition-colors last:border-b-0 ${
                    isActive
                      ? "bg-pool-wash font-semibold text-pool"
                      : "text-ink hover:bg-paper"
                  }`}
                  onMouseEnter={() => setActiveIndex(itemIdx)}
                  onClick={() => handleSelectItem(sh)}
                >
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[13px] text-ink">
                        {sh.date}
                      </span>
                      <span className="truncate text-[13px] text-muted">
                        {sh.unitTitle}
                      </span>
                    </div>
                    <span className="truncate font-mono text-[11px] text-muted">
                      📍 {sh.city} {sh.venue}
                    </span>
                  </div>
                  <span className="ml-2 shrink-0 font-mono text-[11px] px-1.5 py-0.5 rounded bg-paper border border-line-soft text-muted">
                    {sh.badge}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 🎵 歌曲分組 */}
        {matchedSongs.length > 0 && (
          <div>
            <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-line-soft bg-paper/95 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.1em] text-muted uppercase backdrop-blur-xs">
              <span><span aria-hidden="true">🎵</span> 歌曲</span>
              <span className="text-[11px] font-normal opacity-75">
                {matchedSongs.length} 首
              </span>
            </div>
            {matchedSongs.slice(0, 5).map((s) => {
              const itemIdx = runningIndex++;
              const isActive = activeIndex === itemIdx;
              return (
                <div
                  key={`song-${s.type}-${s.id}`}
                  role="option"
                  aria-selected={isActive}
                  className={`flex cursor-pointer items-center justify-between border-b border-line-soft/60 px-3.5 py-2.5 text-[14px] transition-colors last:border-b-0 ${
                    isActive
                      ? "bg-pool-wash font-semibold text-pool"
                      : "text-ink hover:bg-paper"
                  }`}
                  onMouseEnter={() => setActiveIndex(itemIdx)}
                  onClick={() => handleSelectItem(s)}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {s.title}
                      {s.unreleased && (
                        <span className="ml-1 text-[11px] font-normal text-muted">
                          （未發行）
                        </span>
                      )}
                    </span>
                    {s.subTitle && (
                      <span className="font-mono text-[11px] text-muted">
                        {s.subTitle}
                      </span>
                    )}
                  </div>
                  <span className="ml-2 shrink-0 font-mono text-[11px] text-muted">
                    {s.album}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 🎤 演出／巡演分組 */}
        {matchedUnits.length > 0 && (
          <div>
            <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-line-soft bg-paper/95 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.1em] text-muted uppercase backdrop-blur-xs">
              <span><span aria-hidden="true">🎤</span> 演出活動</span>
              <span className="text-[11px] font-normal opacity-75">
                {matchedUnits.length} 部
              </span>
            </div>
            {matchedUnits.slice(0, 5).map((u) => {
              const itemIdx = runningIndex++;
              const isActive = activeIndex === itemIdx;
              return (
                <div
                  key={`unit-${u.id}`}
                  role="option"
                  aria-selected={isActive}
                  className={`flex cursor-pointer items-center justify-between border-b border-line-soft/60 px-3.5 py-2.5 text-[14px] transition-colors last:border-b-0 ${
                    isActive
                      ? "bg-pool-wash font-semibold text-pool"
                      : "text-ink hover:bg-paper"
                  }`}
                  onMouseEnter={() => setActiveIndex(itemIdx)}
                  onClick={() => handleSelectItem(u)}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{u.title}</span>
                    <span className="font-mono text-[11px] text-muted">
                      {u.year} 年
                    </span>
                  </div>
                  <span className="ml-2 shrink-0 font-mono text-[11px] text-muted">
                    {u.badge}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 📍 場地分組 */}
        {matchedVenues.length > 0 && (
          <div>
            <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-line-soft bg-paper/95 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.1em] text-muted uppercase backdrop-blur-xs">
              <span><span aria-hidden="true">📍</span> 場地</span>
              <span className="text-[11px] font-normal opacity-75">
                {matchedVenues.length} 處
              </span>
            </div>
            {matchedVenues.slice(0, 5).map((v) => {
              const itemIdx = runningIndex++;
              const isActive = activeIndex === itemIdx;
              return (
                <div
                  key={`venue-${v.id}`}
                  role="option"
                  aria-selected={isActive}
                  className={`flex cursor-pointer items-center justify-between border-b border-line-soft/60 px-3.5 py-2.5 text-[14px] transition-colors last:border-b-0 ${
                    isActive
                      ? "bg-pool-wash font-semibold text-pool"
                      : "text-ink hover:bg-paper"
                  }`}
                  onMouseEnter={() => setActiveIndex(itemIdx)}
                  onClick={() => handleSelectItem(v)}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{v.name}</span>
                    <span className="font-mono text-[11px] text-muted">
                      {v.city}
                    </span>
                  </div>
                  <span className="ml-2 shrink-0 font-mono text-[11px] text-muted">
                    {v.count} 場
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部導航提示 */}
        {!isModal && (
          <div className="sticky bottom-0 border-t border-line-soft bg-paper px-3 py-1 font-mono text-[11px] text-muted flex items-center justify-between">
            <span>↑↓ 選擇・Enter 跳轉・Esc 關閉</span>
          </div>
        )}
      </Fragment>
    );
  };

  // Mobile Spotlight Modal Mode: Full-screen Stream Body layout
  if (isMobileModal) {
    return (
      <div ref={containerRef} className="flex flex-col h-full w-full bg-card">
        {/* Top Input Bar */}
        <div className="flex items-center gap-2 border-b border-line-soft bg-paper px-3 py-2.5 shadow-xs shrink-0">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-3 text-muted text-sm pointer-events-none select-none" aria-hidden="true">
              🔍
            </span>
            <input
              ref={inputRef}
              id="mobile-spotlight-q"
              type="search"
              name="q"
              spellCheck={false}
              role="combobox"
              aria-expanded={Boolean(needle)}
              aria-autocomplete="list"
              aria-controls="mobile-search-results-list"
              className="w-full rounded-[3px] border-[1.5px] border-ink bg-card py-2 pl-8 pr-16 text-[16px] text-ink placeholder:text-muted focus:border-pool focus:ring-2 focus:ring-pool/30 focus:outline-none"
              placeholder="搜尋歌曲、日期、演出、場地…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {q && (
              <button
                type="button"
                className="absolute right-9 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[12px] text-muted hover:bg-paper hover:text-ink cursor-pointer"
                onClick={handleClear}
                title="清空搜尋"
                aria-label="清空搜尋"
              >
                ✕
              </button>
            )}
            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-[4px] hover:bg-tape-tint text-ink cursor-pointer text-sm"
                title="開啟演出日曆"
                aria-label="開啟演出日曆"
              >
                📅
              </button>
            )}
          </div>
          {onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-paper border border-line-soft font-bold text-muted hover:text-ink hover:bg-tape-tint active:scale-95 cursor-pointer text-sm"
              aria-label="關閉搜尋"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modal Stream Body */}
        {!needle ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-muted select-none">
            <span className="text-3xl mb-2" aria-hidden="true">🔍</span>
            <p className="font-bold text-ink text-sm m-0 mb-1">搜尋全檔案庫</p>
            <p className="text-xs text-muted m-0">輸入歌曲名、日期（如 2024-09-21）、巡演或場館…</p>
            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-ink bg-band px-3.5 py-1.5 text-xs font-bold text-band-ink shadow-2xs hover:brightness-95 active:scale-95 cursor-pointer"
              >
                <span>📅</span>
                <span>依演出日曆瀏覽</span>
              </button>
            )}
          </div>
        ) : (
          <div
            id="mobile-search-results-list"
            role="listbox"
            onScroll={() => {
              if (inputRef.current === document.activeElement) {
                inputRef.current.blur();
              }
            }}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-card divide-y divide-line-soft/40"
          >
            {renderResultsList(true)}
          </div>
        )}
      </div>
    );
  }

  // Desktop In-Flow SearchBox Mode: Floating Dropdown
  return (
    <div
      ref={containerRef}
      className="relative flex w-full items-center"
    >
      <label
        htmlFor="global-q"
        className="sr-only"
      >
        搜尋
      </label>
      <div className="relative w-full flex items-center">
        <span
          className={`absolute left-3.5 text-muted pointer-events-none select-none ${
            size === "lg" ? "text-base sm:text-lg" : "text-sm"
          }`}
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          ref={inputRef}
          id="global-q"
          type="search"
          name="q"
          spellCheck={false}
          role="combobox"
          aria-expanded={isOpen && Boolean(needle)}
          aria-autocomplete="list"
          aria-controls="search-dropdown-list"
          className={`w-full rounded-[6px] border-[1.5px] border-ink bg-card text-ink placeholder:text-muted focus:border-pool focus:ring-2 focus:ring-pool/30 focus:outline-none transition-shadow ${
            size === "lg"
              ? "py-3 sm:py-3.5 pl-10 sm:pl-11 pr-20 text-[16px] sm:text-[16px] shadow-sm font-sans"
              : "py-2 pl-8 pr-16 text-[16px] sm:text-[14px]"
          }`}
          placeholder="搜尋歌曲、日期（如 2024-09）、演出、場地…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (needle) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 ${
          size === "lg" ? "right-2 sm:right-2.5" : "right-1.5"
        }`}>
          {q && (
            <button
              type="button"
              className="rounded px-1.5 py-0.5 font-mono text-[12px] text-muted hover:bg-paper hover:text-ink cursor-pointer"
              onClick={handleClear}
              title="清空搜尋"
              aria-label="清空搜尋"
            >
              ✕
            </button>
          )}

          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              className={`flex items-center justify-center rounded-[4px] border border-ink/20 bg-paper hover:bg-tape-tint text-ink cursor-pointer shadow-2xs active:scale-95 transition-transform ${
                size === "lg" ? "h-8 w-8 text-base" : "h-7 w-7 text-sm"
              }`}
              title="開啟演出日曆 (ADR-0096)"
              aria-label="開啟演出日曆"
            >
              📅
            </button>
          )}
        </div>

        {isOpen && Boolean(needle) && (
          <div
            id="search-dropdown-list"
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-y-auto rounded-[3px] border-[1.5px] border-ink bg-card shadow-[4px_4px_0_rgba(23,35,59,0.16)] max-h-[48vh] sm:max-h-[380px]"
          >
            {renderResultsList(false)}
          </div>
        )}
      </div>
    </div>
  );
}
