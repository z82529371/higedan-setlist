import { PaginationPills, PAGE_SIZE } from "./PaginationPills.jsx";
import { PERFORMANCE_CATEGORIES } from "../../lib/constants.js";
import { unitEarliest, shortUnitTitle, defaultShowId } from "../../lib/domain.js";

export function ShowNavigator({
  isDrawer = false,
  draftState,
  setDraftState,
  showSubMode = "show",
  selCategory,
  selYear,
  setSelYear,
  selUnitId,
  selShow,
  unitPage,
  setUnitPage,
  showPage,
  setShowPage,
  unitsByCategory,
  categoryStats,
  availableYears,
  yearStats,
  filteredUnits,
  pagedUnits,
  current,
  unitData,
  handleCategoryClick,
  handleSelectUnit,
  handleSelectShow,
  handleSelectTourMode,
}) {
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
    const showPageCount = Math.ceil(dCurrentShows.length / PAGE_SIZE);
    const safeShowPage = Math.min(curShowPage, Math.max(0, showPageCount - 1));
    const dPagedShows = dCurrentShows.slice(
      safeShowPage * PAGE_SIZE,
      (safeShowPage + 1) * PAGE_SIZE
    );

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
              const statsSource = isDrawer && draftState ? curYearStats : (yearStats || curYearStats);
              const count = statsSource?.get(yr)?.shows || 0;
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
                      const isTour = !!u.templateSetlist;
                      setDraftState((prev) => ({
                        ...prev,
                        unitId: u.id,
                        showId: targetShowId,
                        showSubMode: isTour ? "tour" : "show",
                        showPage: 0,
                      }));
                    } else {
                      handleSelectUnit(u.id);
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
              {dCurrentUnitData?.isTour && (
                <button
                  type="button"
                  onClick={() => {
                    if (isDrawer && draftState) {
                      setDraftState((prev) => ({
                        ...prev,
                        showSubMode: "tour",
                      }));
                    } else if (handleSelectTourMode) {
                      handleSelectTourMode();
                    }
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold font-mono transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                    (isDrawer && draftState ? draftState.showSubMode === "tour" : showSubMode === "tour")
                      ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                      : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                  }`}
                  title="查看此巡演的共識母單與出賽統計"
                >
                  <span>📜</span>
                  <span>巡演總覽大票</span>
                </button>
              )}
              {dPagedShows.map((s) => {
                const isCur =
                  s.id === curShowId &&
                  (isDrawer && draftState
                    ? draftState.showSubMode !== "tour"
                    : showSubMode !== "tour");
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
                          showSubMode: "show",
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
}
