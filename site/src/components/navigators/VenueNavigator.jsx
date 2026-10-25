import { PaginationPills, PAGE_SIZE } from "./PaginationPills.jsx";
import { VenueMapCanvas } from "../VenueMapCanvas.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export function VenueNavigator({
  isDrawer = false,
  draftState,
  setDraftState,
  venueSortMode,
  setVenueSortMode,
  selMapPrefecture = null,
  setSelMapPrefecture,
  selMapCity = null,
  setSelMapCity,
  _selRegion,
  _setSelRegion,
  selVenue,
  venuePage,
  setVenuePage,
  allVenues = [],
  _allUnits,
  globalVenueShows,
  venuesSortedByCount = [],
  filteredVenues = [],
  pagedVenues = [],
  handleSelectVenue,
  _handleSelectShow,
  handleSelectMap,
  _handleSelectMapJourney,
}) {
  const { t, localizeVenue } = useI18n();

  const curSortMode = isDrawer && draftState ? draftState.venueSortMode : venueSortMode;
  const curVenueName = isDrawer && draftState ? draftState.venueName : selVenue;
  const curPage = isDrawer && draftState ? draftState.venuePage : venuePage;

  const dFilteredVenues =
    isDrawer && draftState
      ? venuesSortedByCount
      : filteredVenues;

  const dPagedVenues =
    isDrawer && draftState
      ? (() => {
          const pageCount = Math.ceil(dFilteredVenues.length / PAGE_SIZE);
          const safePage = Math.min(curPage, Math.max(0, pageCount - 1));
          return dFilteredVenues.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        })()
      : pagedVenues;

  const handlePrefectureClick = (pref) => {
    if (setSelMapPrefecture) setSelMapPrefecture(pref);
    if (handleSelectMap) {
      handleSelectMap(pref);
    }
  };

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
            <span>{t("navigators.venueSortModeTitle")}</span>
          </span>
          <span className="font-mono text-[11px] text-muted tabular-nums">
            {t("navigators.venuesCount", null, { count: allVenues.length })}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            type="button"
            data-testid="venue-sort-map"
            className={`rounded-full px-3 py-1.5 text-[12px] sm:text-[13px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
              curSortMode === "map"
                ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
            }`}
            onClick={() => {
              if (isDrawer && draftState) {
                setDraftState((prev) => ({ ...prev, venueSortMode: "map", venuePage: 0 }));
              } else {
                setVenueSortMode("map");
                setVenuePage(0);
                if (handleSelectMap) handleSelectMap(selMapPrefecture);
              }
            }}
          >
            <span>{t("navigators.byMap")}</span>
          </button>
          <button
            type="button"
            data-testid="venue-sort-count"
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
            <span>{t("navigators.byCount")}</span>
          </button>
        </div>
      </div>

      {curSortMode === "map" ? (
        <div className="pt-2 border-t border-line-soft">
          <VenueMapCanvas
            mode="venues"
            allVenues={allVenues}
            globalVenueShows={globalVenueShows}
            selectedPrefecture={selMapPrefecture}
            onSelectPrefecture={handlePrefectureClick}
            selectedCity={selMapCity}
            onSelectCity={setSelMapCity}
            selectedVenue={curVenueName}
            onSelectVenue={(vName) => {
              if (isDrawer && draftState) {
                setDraftState((prev) => ({ ...prev, venueName: vName }));
              } else if (handleSelectVenue) {
                handleSelectVenue(vName);
              }
            }}
          />
        </div>
      ) : (
        <div className="pt-2 border-t border-line-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">🏟️</span>
              <span>
                {t("navigators.venueCountRankingStep", null, {
                  count: dFilteredVenues.length,
                })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2 mt-2">
            {dPagedVenues.map((v) => {
              const count = globalVenueShows ? globalVenueShows.get(v.name)?.length || 0 : 0;
              const isSelected = curVenueName === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  data-testid="venue-candidate-card"
                  onClick={() => {
                    if (isDrawer && draftState) {
                      setDraftState((prev) => ({ ...prev, venueName: v.name }));
                    } else if (handleSelectVenue) {
                      handleSelectVenue(v.name);
                    }
                  }}
                  className={`flex items-center justify-between gap-1.5 rounded-[4px] px-2.5 py-2 text-left font-mono text-[11px] sm:text-[12px] transition-all cursor-pointer ${
                    isSelected
                      ? "bg-band text-band-ink font-bold border border-ink/40 shadow-xs"
                      : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold">{localizeVenue(v.name)}</div>
                    {v.city && (
                      <div className="text-[10px] text-muted truncate">
                        {v.prefecture ? `${t("prefectures." + v.prefecture, v.prefecture)} ` : ""}{t("cities." + v.city, v.city)}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                    {count}
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

export default VenueNavigator;
