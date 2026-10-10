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
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const needle = q.trim().toLowerCase();

  const { matchedSongs, matchedUnits, matchedVenues, flatItems } = useMemo(() => {
    if (!needle) {
      return { matchedSongs: [], matchedUnits: [], matchedVenues: [], flatItems: [] };
    }

    // 1. Songs & Title tracks
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

    // 2. Units (Tours & Events)
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

    // 3. Venues
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

    const songsSlice = songs.slice(0, 5);
    const unitsSlice = units.slice(0, 5);
    const venuesSlice = venues.slice(0, 5);

    const flat = [...songsSlice, ...unitsSlice, ...venuesSlice];

    return {
      matchedSongs: songs,
      matchedUnits: units,
      matchedVenues: venues,
      flatItems: flat,
    };
  }, [needle, allUsedSongs, allUnits, allVenues]);

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
    if (item.type === "song") {
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

  let runningIndex = 0;

  return (
    <div
      ref={containerRef}
      className="relative flex w-full items-center gap-2"
    >
      <label
        htmlFor="global-q"
        className="shrink-0 whitespace-nowrap font-mono text-[12px] font-bold tracking-[0.08em] text-muted"
      >
        全域搜尋
      </label>
      <div className="relative w-full">
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
          className="w-full rounded-[3px] border-[1.5px] border-ink bg-card py-2 pl-3 pr-8 text-[16px] sm:text-[14px] text-ink placeholder:text-muted focus:border-pool focus:ring-2 focus:ring-pool/30 focus:outline-none"
          placeholder="搜尋歌曲、演出、場地…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (needle) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {q && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[12px] text-muted hover:bg-paper hover:text-ink cursor-pointer"
            onClick={handleClear}
            title="清空搜尋"
            aria-label="清空搜尋"
          >
            ✕
          </button>
        )}

        {isOpen && Boolean(needle) && (
          <div
            id="search-dropdown-list"
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[48vh] sm:max-h-[380px] overflow-y-auto rounded-[3px] border-[1.5px] border-ink bg-card shadow-[4px_4px_0_rgba(23,35,59,0.16)]"
          >
            {flatItems.length === 0 ? (
              <div className="px-4 py-5 text-center font-mono text-[13px] text-muted">
                無相符的歌曲、演出或場地
              </div>
            ) : (
              <Fragment>
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
                          className={`flex cursor-pointer items-center justify-between border-b border-line-soft/60 px-3 py-2 text-[13px] transition-colors last:border-b-0 ${
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
                      <span><span aria-hidden="true">🎤</span> 演出／巡演</span>
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
                          className={`flex cursor-pointer items-center justify-between border-b border-line-soft/60 px-3 py-2 text-[13px] transition-colors last:border-b-0 ${
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
                          <span className="ml-2 shrink-0 rounded-[2px] border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-muted">
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
                          className={`flex cursor-pointer items-center justify-between border-b border-line-soft/60 px-3 py-2 text-[13px] transition-colors last:border-b-0 ${
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
                <div className="sticky bottom-0 border-t border-line-soft bg-paper px-3 py-1 font-mono text-[11px] text-muted flex items-center justify-between">
                  <span>↑↓ 選擇・Enter 跳轉・Esc 關閉</span>
                </div>
              </Fragment>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
