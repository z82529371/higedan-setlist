import { useState, useMemo } from "react";
import { PaginationPills, PAGE_SIZE } from "./PaginationPills.jsx";
import { REGION_ORDER } from "../../lib/constants.js";
import {
  allUnits as domainAllUnits,
  getVenueRegion,
  getUnitTypeLabel,
  shortUnitTitle,
} from "../../lib/domain.js";
import { buildJourneySequence } from "../../lib/venue-map.js";
import { venueProfilesByCanonical } from "../../lib/locales/venues.js";
import { VenueMapCanvas } from "../VenueMapCanvas.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export function VenueNavigator({
  isDrawer = false,
  draftState,
  setDraftState,
  venueSubMode = "venues",
  setVenueSubMode,
  venueSortMode,
  setVenueSortMode,
  selMapPrefecture = null,
  setSelMapPrefecture,
  selMapCity = null,
  setSelMapCity,
  selRegion,
  setSelRegion,
  selVenue,
  venuePage,
  setVenuePage,
  allVenues = [],
  allUnits,
  globalVenueShows,
  venuesSortedByCount = [],
  filteredVenues = [],
  pagedVenues = [],
  handleSelectVenue,
  handleSelectShow,
  handleSelectMap,
  handleSelectMapJourney,
}) {
  const { t, localizeVenue } = useI18n();
  const [includeTv, setIncludeTv] = useState(false);
  const [journeyYear, setJourneyYear] = useState("ALL");
  const [journeyTourId, setJourneyTourId] = useState("ALL");

  const curSortMode = isDrawer && draftState ? draftState.venueSortMode : venueSortMode;
  const curRegion = isDrawer && draftState ? draftState.region : selRegion;
  const curVenueName = isDrawer && draftState ? draftState.venueName : selVenue;
  const curPage = isDrawer && draftState ? draftState.venuePage : venuePage;
  const curSubMode = venueSubMode || "venues";

  const unitsList = allUnits && allUnits.length > 0 ? allUnits : domainAllUnits;

  const { allCareerShows, tourOptions, careerYears } = useMemo(() => {
    const shows = [];
    const tours = [];
    const yearsSet = new Set();

    for (const u of unitsList) {
      const uType = getUnitTypeLabel(u);
      const uTitle = shortUnitTitle(u);
      if (u.templateSetlist || u.isTour) {
        tours.push({ id: u.id, title: uTitle });
      }
      for (const s of u.shows || []) {
        const yr = (s.date || "").slice(0, 4);
        if (yr && yr !== "9999") yearsSet.add(yr);
        shows.push({
          ...s,
          unitId: u.id,
          unitTitle: uTitle,
          unitType: uType,
        });
      }
    }

    return {
      allCareerShows: shows,
      tourOptions: tours,
      careerYears: Array.from(yearsSet).sort(),
    };
  }, [unitsList]);

  const filteredCareerShows = useMemo(() => {
    return allCareerShows.filter((s) => {
      if (journeyTourId !== "ALL" && s.unitId !== journeyTourId) return false;
      if (journeyYear !== "ALL" && !(s.date || "").startsWith(journeyYear)) return false;
      return true;
    });
  }, [allCareerShows, journeyYear, journeyTourId]);

  const baseCareerJourney = useMemo(
    () => buildJourneySequence(filteredCareerShows, venueProfilesByCanonical, { includeTvBroadcasts: false }),
    [filteredCareerShows]
  );

  const activeJourney = useMemo(() => {
    if (!includeTv) return baseCareerJourney;
    return buildJourneySequence(filteredCareerShows, venueProfilesByCanonical, { includeTvBroadcasts: true });
  }, [filteredCareerShows, includeTv, baseCareerJourney]);

  const dFilteredVenues =
    isDrawer && draftState
      ? curSortMode === "region"
        ? allVenues.filter((v) => getVenueRegion(v) === curRegion)
        : venuesSortedByCount
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
      {/* Top Dual Mode Switcher: 🏛️ Venues Map & Ranking vs 🚐 2012-2026 Career Journey Route */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-[3px] border border-ink/40 bg-paper p-1"
        role="group"
        aria-label={t("navigators.venueSortModeTitle")}
      >
        <button
          type="button"
          data-testid="venue-mode-venues"
          aria-pressed={curSubMode === "venues"}
          onClick={() => {
            if (setVenueSubMode) setVenueSubMode("venues");
            if (curSortMode === "map" && handleSelectMap) {
              handleSelectMap(selMapPrefecture);
            }
          }}
          className={`rounded-[3px] px-3 py-1.5 font-mono text-[12px] sm:text-[13px] font-extrabold transition-colors cursor-pointer ${
            curSubMode === "venues"
              ? "bg-band text-band-ink border border-ink shadow-xs"
              : "bg-transparent text-ink hover:bg-card"
          }`}
        >
          {t("navigators.modeVenues")}
        </button>

        <button
          type="button"
          data-testid="venue-mode-journey"
          aria-pressed={curSubMode === "journey"}
          onClick={() => {
            if (handleSelectMapJourney) {
              handleSelectMapJourney();
            } else if (setVenueSubMode) {
              setVenueSubMode("journey");
            }
          }}
          className={`rounded-[3px] px-3 py-1.5 font-mono text-[12px] sm:text-[13px] font-extrabold transition-colors cursor-pointer ${
            curSubMode === "journey"
              ? "bg-band text-band-ink border border-ink shadow-xs"
              : "bg-transparent text-ink hover:bg-card"
          }`}
        >
          {t("navigators.modeJourney")}
        </button>
      </div>

      {curSubMode === "journey" ? (
        <div className="space-y-4" data-testid="career-journey-panel">
          {/* Header & TV Broadcast Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-3">
            <div>
              <div className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
                {t("venueMap.journeySubtitle")}
              </div>
              <h2 className="m-0 mt-0.5 text-[15px] sm:text-[17px] font-extrabold text-ink">
                {t("venueMap.journeyTitle")}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="journey-tv-toggle"
                aria-pressed={includeTv}
                onClick={() => setIncludeTv((prev) => !prev)}
                className={`rounded-[3px] px-3 py-1 font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                  includeTv
                    ? "bg-band text-band-ink border border-ink shadow-xs"
                    : "bg-paper text-ink border border-ink/40 hover:bg-tape-tint/50"
                }`}
              >
                <span>{includeTv ? "✓ " : ""}</span>
                <span>
                  {t("venueMap.includeTvToggle", null, {
                    count: baseCareerJourney.excludedTvCount ?? 24,
                  })}
                </span>
              </button>
              {activeJourney.summary.virtualCount > 0 && (
                <span className="rounded-[3px] border border-ink/30 bg-paper px-2.5 py-1 font-mono text-[11px] font-bold text-ink">
                  {t("venueMap.virtualBadge", null, {
                    count: activeJourney.summary.virtualCount,
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Year & Tour Filter Controls */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setJourneyYear("ALL");
                  setJourneyTourId("ALL");
                }}
                className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                  journeyYear === "ALL" && journeyTourId === "ALL"
                    ? "bg-band text-band-ink border border-ink/40 shadow-2xs"
                    : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
                }`}
              >
                {t("venueMap.filterAllYears")}
              </button>
              {careerYears.map((yr) => {
                const isCurYr = journeyYear === yr && journeyTourId === "ALL";
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setJourneyTourId("ALL");
                      setJourneyYear(isCurYr ? "ALL" : yr);
                    }}
                    className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold cursor-pointer transition-colors tabular-nums ${
                      isCurYr
                        ? "bg-band text-band-ink border border-ink/40 shadow-2xs"
                        : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>

            {tourOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="journey-tour-select"
                  className="font-mono text-[11px] font-bold text-muted shrink-0"
                >
                  {t("venueMap.filterByTour")}:
                </label>
                <select
                  id="journey-tour-select"
                  value={journeyTourId}
                  onChange={(e) => {
                    setJourneyTourId(e.target.value);
                    if (e.target.value !== "ALL") setJourneyYear("ALL");
                  }}
                  className="rounded-[3px] border border-ink/40 bg-paper px-2.5 py-1 font-mono text-[12px] font-bold text-ink"
                >
                  <option value="ALL">{t("venueMap.allToursOption")}</option>
                  {tourOptions.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Journey Summary Counters */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold text-ink">
            <span className="rounded-[3px] bg-band px-2.5 py-1 text-band-ink border border-ink/40 shadow-2xs tabular-nums">
              {t("venueMap.statsStops", null, { count: activeJourney.summary.totalStops })}
            </span>
            <span className="rounded-[3px] bg-paper px-2.5 py-1 border border-ink/30 tabular-nums">
              {t("venueMap.statsVan", null, { count: activeJourney.summary.vanCount })}
            </span>
            <span className="rounded-[3px] bg-paper px-2.5 py-1 border border-ink/30 tabular-nums">
              {t("venueMap.statsFlight", null, { count: activeJourney.summary.flightCount })}
            </span>
            <span className="rounded-[3px] bg-paper px-2.5 py-1 border border-ink/30 tabular-nums">
              {t("venueMap.statsStay", null, { count: activeJourney.summary.stayCount })}
            </span>
            <span className="rounded-[3px] bg-paper px-2.5 py-1 border border-ink/30 tabular-nums">
              {t("venueMap.statsDistance", null, {
                km: activeJourney.summary.totalDistanceKm.toLocaleString(),
              })}
            </span>
          </div>

          {/* SVG Route Map */}
          <VenueMapCanvas
            mode="journey"
            allVenues={allVenues}
            globalVenueShows={globalVenueShows}
            journey={activeJourney}
            onSelectShow={handleSelectShow}
          />

          {/* First & Final Stop Endpoints */}
          {activeJourney.stops.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[activeJourney.stops[0], activeJourney.stops.at(-1)].map((st, idx) => {
                if (!st) return null;
                const isFirst = idx === 0;
                return (
                  <button
                    key={`${isFirst ? "first" : "final"}-${st.showId}`}
                    type="button"
                    onClick={() => handleSelectShow && handleSelectShow(st.showId)}
                    className="flex items-center justify-between gap-2 rounded-[3px] border border-ink/40 bg-paper px-3 py-2 text-left hover:bg-band hover:text-band-ink cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] font-bold uppercase opacity-75">
                        {isFirst ? t("venueMap.firstStopLabel") : t("venueMap.finalStopLabel")}
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] font-extrabold min-w-0">
                        <span className="font-mono whitespace-nowrap shrink-0">{st.date}</span>
                        <span aria-hidden="true" className="shrink-0">·</span>
                        <span className="truncate">{localizeVenue(st.venue)}</span>
                      </div>
                      <div className="truncate text-[11px] opacity-80">
                        {st.city ? t(`cities.${st.city}`, st.city) : ""} · {st.unitTitle}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold shrink-0">
                      #{st.stopNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
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
                <span>{t("navigators.byRegion")}</span>
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
            <>
              {/* Step 2 (若為分區): 選擇地區 */}
              {curSortMode === "region" && (
                <div className="pt-2 border-t border-line-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span aria-hidden="true">📍</span>
                      <span>{t("navigators.selectRegion")}</span>
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
                          <span>{t(`regions.${reg}`, reg)}</span>
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
                        ? t("navigators.selectVenueStep", null, {
                            region: t(`regions.${curRegion}`, curRegion),
                            count: dFilteredVenues.length,
                          })
                        : t("navigators.venueCountRankingStep", null, {
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
                        <span className="font-bold">{localizeVenue(v.name)}</span>
                        <span className="text-[11px] opacity-75">
                          （{v.city ? `${t("cities." + v.city, v.city)} · ` : ""}{v.shows.length}{t("navigators.showsUnit")}）
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
