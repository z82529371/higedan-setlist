import { PaginationPills, PAGE_SIZE } from "./PaginationPills.jsx";
import { REGION_ORDER } from "../../lib/constants.js";
import { getVenueRegion } from "../../lib/domain.js";

export function VenueNavigator({
  isDrawer = false,
  draftState,
  setDraftState,
  venueSortMode,
  setVenueSortMode,
  selRegion,
  setSelRegion,
  selVenue,
  venuePage,
  setVenuePage,
  allVenues,
  venuesSortedByCount,
  filteredVenues,
  pagedVenues,
  handleSelectVenue,
}) {
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
}
