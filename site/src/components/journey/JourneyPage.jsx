import { useState, useMemo } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import {
  allUnits as domainAllUnits,
  getUnitTypeLabel,
  shortUnitTitle,
} from "../../lib/domain.js";
import { buildJourneySequence } from "../../lib/venue-map.js";
import { venueProfilesByCanonical } from "../../lib/locales/venues.js";
import { VenueMapCanvas } from "../VenueMapCanvas.jsx";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import { SLIP_TAPE } from "../../lib/constants.js";
import { MobileFloatingControls } from "../layout/MobileFloatingControls.jsx";
import { JourneyFilterDrawer } from "./JourneyFilterDrawer.jsx";

export function JourneyPage({
  allUnits,
  allVenues = [],
  globalVenueShows,
  onSelectShow,
  onReturnArchive,
  onReturnHome,
  onSelectTickets,
}) {
  const { t } = useI18n();
  const [includeTv, setIncludeTv] = useState(false);
  const [journeyYear, setJourneyYear] = useState("ALL");
  const [journeyTourId, setJourneyTourId] = useState("ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const unitsList = allUnits && allUnits.length > 0 ? allUnits : domainAllUnits;

  const { allCareerShows, tourOptions, careerYears } = useMemo(() => {
    const shows = [];
    const tours = [];
    const yearsSet = new Set();

    for (const u of unitsList) {
      const uType = getUnitTypeLabel(u);
      const uTitle = shortUnitTitle(u);
      if (u.type === "巡演專場") {
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

  const currentJourneyTitle = useMemo(() => {
    return t("venueMap.journeyTitle");
  }, [t]);

  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6 pt-4 pb-24 sm:py-8 select-none">
      {/* Top Floating Control Bar: desktop only */}
      <div className="hidden sm:flex mb-4 sm:mb-6 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onReturnArchive && (
              <button
                type="button"
                onClick={onReturnArchive}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-3 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
                title={t("ticketBook.backToArchive", "返回檔案庫")}
              >
                <span aria-hidden="true">←</span>
                <span>{t("ticketBook.backToArchive", "返回檔案庫")}</span>
              </button>
            )}
            {onReturnHome && (
              <button
                type="button"
                onClick={onReturnHome}
                className="inline-flex items-center gap-1 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
                title={t("ticketBook.backToHome", "返回首頁")}
              >
                <span aria-hidden="true">🏠</span>
              </button>
            )}
          </div>
          <LanguageSwitcher />
        </div>

        {/* Main Ticket Receipt Article */}
        <main>
          <article className="relative rounded-[3px] border-[1.5px] border-ink bg-card px-3 sm:px-[26px] pb-6 pt-6 sm:pt-7 shadow-[5px_5px_0_rgba(0,0,0,0.14)]">
          {/* Washi Masking Tape Top Pin */}
          <div className={SLIP_TAPE} aria-hidden="true" />

          {/* Streamlined Ticket Header Title Block: compact & elegant */}
          <header className="flex flex-col items-center text-center pb-3 border-b border-line-soft">
            <h1 className="m-0 font-display text-[clamp(18px,4vw,28px)] font-black leading-tight tracking-tight text-ink flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl" aria-hidden="true">🚐</span>
              <span>Official髭男dism <span className="font-bold text-band-ink">{currentJourneyTitle}</span></span>
            </h1>

            {/* Stats Badge */}
            <div className="mt-2.5 flex items-center justify-center gap-2">
              <span
                data-testid="journey-stops-badge"
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-tape px-3 py-0.5 font-mono text-[11px] sm:text-[12px] font-extrabold text-ink shadow-2xs"
              >
                <span aria-hidden="true">🚐</span>
                <span>{activeJourney.stops.length} STOPS</span>
              </span>
            </div>
          </header>

          {/* Desktop-only Interactive Controls & Filters Toolbar */}
          <div
            data-testid="journey-filter-bar"
            className="hidden sm:flex flex-wrap items-center justify-between gap-2 border-b border-line-soft py-3"
          >
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

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="journey-year-select"
                  className="font-mono text-[11px] font-bold text-muted shrink-0"
                >
                  {t("venueMap.filterByYear")}:
                </label>
                <select
                  id="journey-year-select"
                  data-testid="journey-year-select"
                  value={journeyTourId !== "ALL" ? "ALL" : journeyYear}
                  onChange={(e) => {
                    setJourneyTourId("ALL");
                    setJourneyYear(e.target.value);
                  }}
                  className="rounded-[3px] border border-ink/40 bg-paper px-2.5 py-1 font-mono text-[12px] font-bold text-ink tabular-nums"
                >
                  <option value="ALL">{t("venueMap.allToursOption")}</option>
                  {careerYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
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
                    data-testid="journey-tour-select"
                    value={journeyTourId}
                    onChange={(e) => {
                      setJourneyTourId(e.target.value);
                      if (e.target.value !== "ALL") setJourneyYear("ALL");
                    }}
                    className="rounded-[3px] border border-ink/40 bg-paper px-2.5 py-1 font-mono text-[12px] font-bold text-ink max-w-[260px] truncate"
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
          </div>

          {/* Interactive Map & Docked Playback Controls */}
          <div className="mt-4 space-y-3" data-testid="career-journey-panel">
            <VenueMapCanvas
              mode="journey"
              allVenues={allVenues}
              globalVenueShows={globalVenueShows}
              journey={activeJourney}
              onSelectShow={onSelectShow}
            />
          </div>
        </article>
      </main>

      {/* Mobile Floating Action Controls */}
      <MobileFloatingControls
        tab="journey"
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onReturnHome={onReturnHome}
        onSelectTickets={onSelectTickets}
        onReturnArchive={onReturnArchive}
      />

      {/* Mobile Journey Filter Drawer */}
      <JourneyFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApply={({ tourId, year, includeTv: nextIncludeTv }) => {
          setJourneyTourId(tourId);
          setJourneyYear(year);
          setIncludeTv(nextIncludeTv);
        }}
        tourOptions={tourOptions}
        careerYears={careerYears}
        currentTourId={journeyTourId}
        currentYear={journeyYear}
        includeTv={includeTv}
        excludedTvCount={baseCareerJourney.excludedTvCount ?? 24}
        virtualCount={activeJourney.summary.virtualCount}
      />
    </div>
  );
}

export default JourneyPage;
