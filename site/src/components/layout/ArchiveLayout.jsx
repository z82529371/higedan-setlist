import { useMemo } from "react";
import { shortUnitTitle, formatShowPlace } from "../../lib/domain.js";
import { trackKey } from "../../lib/track.js";
import { PERFORMANCE_CATEGORIES } from "../../lib/constants.js";
import { ShowSlip, SongSlip, VenueSlip, TourSlip } from "../slips/index.js";
import {
  ShowNavigator,
  SongNavigator,
  VenueNavigator,
} from "../navigators/index.js";
import { ArchiveStatusBar } from "./ArchiveStatusBar.jsx";
import { ArchiveHeader } from "./ArchiveHeader.jsx";
import { FilterDrawer } from "./FilterDrawer.jsx";
import { MobileSearchModal } from "./MobileSearchModal.jsx";
import { MobileFloatingControls } from "./MobileFloatingControls.jsx";
import SearchBox from "../SearchBox.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export function ArchiveLayout({
  filterState,
  routeState,
  unitData,
  trackShows,
  globalVenueShows,
  allUsedSongs,
  allVenues,
  allUnits,
  showById,
}) {
  const { t } = useI18n();
  const {
    tab,
    setTab,
    showSubMode,
    selUnitId,
    selShow,
    selSong,
    selVenue,
    q,
    setQ,
    isDesktopNavOpen,
    toggleDesktopNav,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    isMobileSearchOpen,
    setIsMobileSearchOpen,
    setIsCalendarOpen,
    draftState,
    setDraftState,
    openFilterDrawer,
    handleCancelDrawer,
    handleCommitDrawer,
    confirmButtonLabel,
    slipRef,
    handleSelectShow,
    handleSelectSong,
    handleSelectVenue,
    handleSelectUnit,
    handleSelectTourMode,
    handleReturnHome,
    visualViewportStyle,
  } = routeState;

  const current = unitData.get(selUnitId);

  const currentShowObj = useMemo(() => {
    return current?.shows?.find((s) => s.id === selShow) || null;
  }, [current, selShow]);

  const currentSongObj = useMemo(() => {
    return allUsedSongs.find((s) => s.id === selSong) || null;
  }, [allUsedSongs, selSong]);

  const currentVenueObj = useMemo(() => {
    return allVenues.find((v) => v.name === selVenue) || null;
  }, [allVenues, selVenue]);

  const tplSongs = current?.tpl?.filter((i) => i.songId).length ?? 0;
  const tplCount = current?.tpl?.length ?? 0;
  const footTpl = current?.isTour
    ? t("layout.tourTemplate", "巡演模板 {songs} 首（共 {parts} 段落）", { songs: tplSongs, parts: tplCount })
    : current?.unit.title;

  const sourceSummary = useMemo(() => {
    if (!current?.unit?.shows) return "LiveFans";
    const sources = new Set();
    for (const sh of current.unit.shows) {
      for (const u of sh.sourceUrls || []) {
        if (/higedan\.com/i.test(u)) sources.add(t("layout.sourceOfficial", "官方網站"));
        else if (/x\.com|twitter\.com/i.test(u)) sources.add("X");
        else if (/livefans\.jp/i.test(u)) sources.add("LiveFans");
        else if (/wikipedia\.org/i.test(u)) sources.add(t("layout.sourceWiki", "維基百科"));
        else {
          try {
            sources.add(new URL(u).hostname.replace(/^www\./, ""));
          } catch {
            sources.add(t("layout.sourceExternal", "外部來源"));
          }
        }
      }
    }
    if (sources.size === 0) return "LiveFans";
    return Array.from(sources).join(" · ");
  }, [current, t]);

  const renderShowNavigator = (isDrawer = false) => (
    <ShowNavigator
      isDrawer={isDrawer}
      draftState={draftState}
      setDraftState={setDraftState}
      showSubMode={showSubMode}
      selCategory={filterState.selCategory}
      selYear={filterState.selYear}
      setSelYear={filterState.setSelYear}
      selUnitId={selUnitId}
      selShow={selShow}
      unitPage={filterState.unitPage}
      setUnitPage={filterState.setUnitPage}
      showPage={filterState.showPage}
      setShowPage={filterState.setShowPage}
      unitsByCategory={filterState.unitsByCategory}
      categoryStats={filterState.categoryStats}
      availableYears={filterState.availableYears}
      yearStats={filterState.yearStats}
      filteredUnits={filterState.filteredUnits}
      pagedUnits={filterState.pagedUnits}
      current={current}
      unitData={unitData}
      handleCategoryClick={filterState.handleCategoryClick}
      handleSelectUnit={handleSelectUnit}
      handleSelectShow={handleSelectShow}
      handleSelectTourMode={handleSelectTourMode}
    />
  );

  const renderSongNavigator = (isDrawer = false) => (
    <SongNavigator
      isDrawer={isDrawer}
      draftState={draftState}
      setDraftState={setDraftState}
      songSortMode={filterState.songSortMode}
      setSongSortMode={filterState.setSongSortMode}
      selAlbum={filterState.selAlbum}
      setSelAlbum={filterState.setSelAlbum}
      selSong={selSong}
      songPage={filterState.songPage}
      setSongPage={filterState.setSongPage}
      allUsedSongs={allUsedSongs}
      songsSortedByCount={filterState.songsSortedByCount}
      filteredSongs={filterState.filteredSongs}
      pagedSongs={filterState.pagedSongs}
      trackShows={trackShows}
      handleSelectSong={handleSelectSong}
    />
  );

  const renderVenueNavigator = (isDrawer = false) => (
    <VenueNavigator
      isDrawer={isDrawer}
      draftState={draftState}
      setDraftState={setDraftState}
      venueSortMode={filterState.venueSortMode}
      setVenueSortMode={filterState.setVenueSortMode}
      selRegion={filterState.selRegion}
      setSelRegion={filterState.setSelRegion}
      selVenue={selVenue}
      venuePage={filterState.venuePage}
      setVenuePage={filterState.setVenuePage}
      allVenues={allVenues}
      venuesSortedByCount={filterState.venuesSortedByCount}
      filteredVenues={filterState.filteredVenues}
      pagedVenues={filterState.pagedVenues}
      handleSelectVenue={handleSelectVenue}
    />
  );

  return (
    <>
      {/* Top Full-Width Sticky Status Bar */}
      <ArchiveStatusBar
        tab={tab}
        current={current}
        selSong={selSong}
        currentSongObj={currentSongObj}
        selVenue={selVenue}
        currentVenueObj={currentVenueObj}
        trackShows={trackShows}
        slipRef={slipRef}
        handleReturnHome={handleReturnHome}
      />

      {/* Main Page Container (Centered 960px) */}
      <div className="mx-auto max-w-[960px] px-4 sm:px-6">
        {/* Archive Header with 3 Query Tabs */}
        <ArchiveHeader
          totalAllShows={filterState.totalAllShows}
          allUsedSongs={allUsedSongs}
          allVenues={allVenues}
          categoriesCount={PERFORMANCE_CATEGORIES.length}
          tab={tab}
          setTab={setTab}
          setQ={setQ}
          setIsFilterDrawerOpen={setIsFilterDrawerOpen}
        />

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
            aria-label={t("layout.openFilterAria", "點擊開啟篩選抽屜")}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0" aria-hidden="true">
                {tab === "show" ? "🎫" : tab === "song" ? "🎵" : "🏛️"}
              </span>
              <div className="min-w-0 flex flex-col justify-center">
                {tab === "show" && (
                  <>
                    <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider truncate">
                      {filterState.selYear} · {t(`categories.${filterState.selCategory}`, filterState.selCategory)} · {current?.unit ? shortUnitTitle(current.unit) : ""}
                    </div>
                    <div className="text-[13px] font-black text-ink truncate leading-tight pt-0.5">
                      {showSubMode === "tour" && current?.isTour
                        ? `📜 ${shortUnitTitle(current.unit)}（${t("slips.modeTour", "巡演總覽")}）`
                        : currentShowObj
                        ? `${currentShowObj.date} ${formatShowPlace(currentShowObj, t)}`
                        : current?.unit
                        ? shortUnitTitle(current.unit)
                        : t("navigators.selectShow", t("layout.selectShowFallback", "選擇場次"))}
                    </div>
                  </>
                )}
                {tab === "song" && (
                  <>
                    <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider truncate">
                      {t("slips.allAccessTourOverview", t("layout.currentSong", "目前選定歌曲"))} · {currentSongObj?.album ? currentSongObj.album : t("nav.songs", "歌曲檔案")}
                    </div>
                    <div className="text-[13px] font-black text-ink truncate leading-tight pt-0.5">
                      {currentSongObj ? `《${currentSongObj.title}》` : selSong || t("navigators.selectSong", t("layout.selectSongFallback", "選擇歌曲"))}
                    </div>
                  </>
                )}
                {tab === "venue" && (
                  <>
                    <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider truncate">
                      {t("nav.venues", t("layout.currentVenue", "目前選定場館"))} · {currentVenueObj?.city ? t("cities." + currentVenueObj.city, currentVenueObj.city) : t("nav.venues", t("layout.venueRecordFallback", "場地紀錄"))}
                    </div>
                    <div className="text-[13px] font-black text-ink truncate leading-tight pt-0.5">
                      {currentVenueObj ? `${selVenue} ${t("layout.venueCountSuffix", "({count}場)", { count: currentVenueObj.shows?.length || 0 })}` : selVenue || t("navigators.selectVenue", t("layout.selectVenueFallback", "選擇場地"))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <span className="shrink-0 rounded bg-band px-2.5 py-1.5 font-mono text-[11px] font-extrabold text-band-ink border border-ink/30 shadow-2xs">
              {t("navigators.drawer.changeFilter", "變更 ▾")}
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
                    title={t("navigators.drawer.expandFilterTitle", "點擊展開演出場次篩選器")}
                    aria-expanded={false}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0" aria-hidden="true">🎫</span>
                      <div className="min-w-0 flex items-baseline gap-2 font-mono text-[12px]">
                        <span className="font-bold text-ink truncate">
                          {t(`categories.${filterState.selCategory}`, filterState.selCategory)} · {filterState.selYear} · {current?.unit ? shortUnitTitle(current.unit) : ""}
                        </span>
                        {showSubMode === "tour" && current?.isTour ? (
                          <span className="text-band font-bold shrink-0">
                            （📜 {t("slips.modeTour", "巡演總覽")} · {t("slips.totalShows", `全 ${current.shows?.length || 0} 場`).replace("{count}", current.shows?.length || 0)}）
                          </span>
                        ) : currentShowObj ? (
                          <span className="text-muted shrink-0">
                            （{currentShowObj.date.slice(5)} {formatShowPlace(currentShowObj, t)}）
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-band px-3 py-1 font-mono text-[11px] font-extrabold text-band-ink border border-ink/40 shadow-2xs group-hover:bg-tape transition-colors">
                      {t("navigators.drawer.changeFilter", "變更篩選 ▾")}
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <span>🎫 {t("navigators.drawer.showFilterTitle", "演出場次篩選器")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={toggleDesktopNav}
                        className="inline-flex items-center gap-1 rounded bg-paper hover:bg-tape-tint px-2.5 py-1 font-mono text-[11px] font-bold text-ink border border-line-soft hover:border-ink transition-colors cursor-pointer shadow-2xs"
                        title={t("navigators.drawer.collapseFilter", "收合篩選器")}
                        aria-expanded={true}
                      >
                        <span>{t("navigators.drawer.collapseFilter", "收合篩選器")}</span>
                        <span aria-hidden="true">▴</span>
                      </button>
                    </div>
                    {renderShowNavigator(false)}
                  </div>
                )}
              </div>

              {/* Setlist Slip Receipt */}
              <section ref={slipRef} className="mt-2 sm:mt-4 scroll-mt-8 sm:scroll-mt-10">
                {showSubMode === "tour" && current?.isTour ? (
                  <TourSlip
                    tourUnitData={current?.unit}
                    ud={current}
                    onSelectSong={handleSelectSong}
                    onSelectShow={handleSelectShow}
                  />
                ) : (
                  <ShowSlip
                    ud={current}
                    showId={selShow}
                    onSelectSong={handleSelectSong}
                    onSelectShow={handleSelectShow}
                    onSelectVenue={handleSelectVenue}
                  />
                )}
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
                    title={t("layout.songFilterExpandTitle", "點擊展開歌曲檔案篩選器")}
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
                          · {t("layout.songPlayedTotal", "累積出演 {count} 場", { count: (trackShows.get(trackKey("song", selSong)) ?? []).length })}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-band px-3 py-1 font-mono text-[11px] font-extrabold text-band-ink border border-ink/40 shadow-2xs group-hover:bg-tape transition-colors">
                      {t("navigators.drawer.changeFilter", "變更篩選 ▾")}
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <span>🎵 {t("layout.songFilterTitle", "歌曲檔案篩選器")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={toggleDesktopNav}
                        className="inline-flex items-center gap-1 rounded bg-paper hover:bg-tape-tint px-2.5 py-1 font-mono text-[11px] font-bold text-ink border border-line-soft hover:border-ink transition-colors cursor-pointer shadow-2xs"
                        title={t("layout.collapseSongFilterTitle", "收合篩選器以專注查看下方歌曲檔案小卡")}
                        aria-expanded={true}
                      >
                        <span>{t("navigators.drawer.collapseFilter", "收合篩選器")}</span>
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
                  unitData={unitData}
                  onSelectShow={handleSelectShow}
                  onSelectVenue={handleSelectVenue}
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
                    title={t("layout.venueFilterExpandTitle", "點擊展開演出場館篩選器")}
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
                            · {currentVenueObj.prefecture ? `${t("prefectures." + currentVenueObj.prefecture, currentVenueObj.prefecture)} ` : ""}{t("cities." + currentVenueObj.city, currentVenueObj.city)}
                          </span>
                        )}
                        <span className="text-muted shrink-0 tabular-nums">
                          · {t("layout.venuePlayedTotal", "舉辦過 {count} 場演出", { count: currentVenueObj?.shows?.length ?? 0 })}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-band px-3 py-1 font-mono text-[11px] font-extrabold text-band-ink border border-ink/40 shadow-2xs group-hover:bg-tape transition-colors">
                      {t("navigators.drawer.changeFilter", "變更篩選 ▾")}
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <span>🏛️ {t("navigators.drawer.venueFilterTitle", "演出場館篩選器")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={toggleDesktopNav}
                        className="inline-flex items-center gap-1 rounded bg-paper hover:bg-tape-tint px-2.5 py-1 font-mono text-[11px] font-bold text-ink border border-line-soft hover:border-ink transition-colors cursor-pointer shadow-2xs"
                        title={t("navigators.drawer.collapseFilter", "收合篩選器")}
                        aria-expanded={true}
                      >
                        <span>{t("navigators.drawer.collapseFilter", "收合篩選器")}</span>
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
          <span>{current?.isTour ? t("layout.diffNote", "各場差異以 insert / skip 記錄") : ""}</span>
          <span>{t("layout.verifyNote", "演出順序、安可標記逐場核對 {sources}", { sources: sourceSummary })}</span>
        </footer>
      </div>

      {/* Mobile Filter Bottom Sheet Modal */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        tab={tab}
        onClose={handleCancelDrawer}
        onCommit={handleCommitDrawer}
        confirmButtonLabel={confirmButtonLabel}
        renderShowNavigator={renderShowNavigator}
        renderSongNavigator={renderSongNavigator}
        renderVenueNavigator={renderVenueNavigator}
      />

      {/* Mobile Floating Action Buttons & Docks */}
      <MobileFloatingControls
        tab={tab}
        onOpenSearch={() => {
          setIsMobileSearchOpen(true);
          setIsFilterDrawerOpen(false);
        }}
        onOpenDrawer={openFilterDrawer}
        onReturnHome={handleReturnHome}
      />

      {/* Mobile Search Spotlight Modal */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        visualViewportStyle={visualViewportStyle}
        q={q}
        setQ={setQ}
        allUsedSongs={allUsedSongs}
        allUnits={allUnits}
        allVenues={allVenues}
        onClose={() => {
          setIsMobileSearchOpen(false);
          setQ("");
        }}
        onSelectSong={handleSelectSong}
        onSelectUnit={handleSelectUnit}
        onSelectVenue={handleSelectVenue}
        onSelectShow={handleSelectShow}
        onOpenCalendar={() => setIsCalendarOpen(true)}
      />
    </>
  );
}
