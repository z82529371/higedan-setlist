import { Fragment, useMemo } from "react";
import { allUnits, buildIndex } from "./lib/domain.js";
import { ArchiveLayout } from "./components/layout/index.js";
import { TicketBookPage } from "./components/ticket-book/TicketBookPage.jsx";
import { JourneyPage } from "./components/journey/index.js";
import { useArchiveFilter, useArchiveRoute } from "./hooks/index.js";
import { I18nProvider } from "./lib/i18n.jsx";
import LandingHero from "./components/LandingHero.jsx";
import CalendarModal from "./components/CalendarModal.jsx";
import "./style.css";

export function AppContent({ probeRoute } = {}) {
  const {
    unitData,
    trackShows,
    globalVenueShows,
    allUsedSongs,
    allVenues,
    showById,
    unitIdByShowId,
  } = useMemo(() => buildIndex(), []);

  const initialUnitId = allUnits[0]?.id ?? null;
  const initialSongId = allUsedSongs[0]?.id ?? null;
  const initialVenueName = allVenues[0]?.name ?? null;

  // 1. Filter & Pagination state & calculations
  const filterState = useArchiveFilter({
    unitData,
    trackShows,
    globalVenueShows,
    allUsedSongs,
    allVenues,
    initialUnitId,
    initialSongId,
    initialVenueName,
  });

  // 2. Routing, selection, deep link & drawer state
  const routeState = useArchiveRoute({
    unitData,
    allUsedSongs,
    allVenues,
    unitIdByShowId,
    filterState,
  });

  if (probeRoute) {
    probeRoute(routeState);
  }

  const {
    viewMode,
    setViewMode,
    setTab,
    q,
    setQ,
    isCalendarOpen,
    setIsCalendarOpen,
    handleSelectShow,
    handleSelectSong,
    handleSelectVenue,
    handleSelectUnit,
    handleSelectTickets,
    handleSelectJourney,
    handleReturnArchive,
    handleReturnHome,
  } = routeState;

  return (
    <Fragment>
      {viewMode === "landing" ? (
        <LandingHero
          onEnterArchive={() => setViewMode("archive")}
          onSelectSong={(sId) => {
            setViewMode("archive");
            handleSelectSong(sId);
          }}
          onSelectUnit={(uId, showId) => {
            setViewMode("archive");
            handleSelectUnit(uId, showId);
          }}
          onSelectVenue={(vName) => {
            setViewMode("archive");
            handleSelectVenue(vName);
          }}
          onSelectShow={(shId) => {
            setViewMode("archive");
            handleSelectShow(shId);
          }}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onSelectTickets={handleSelectTickets}
          onSelectJourney={handleSelectJourney}
          onSelectTab={(newTab, options) => {
            setViewMode("archive");
            setTab(newTab);
            if (newTab === "song" && options?.sortMode) filterState.setSongSortMode(options.sortMode);
            if (newTab === "venue" && options?.sortMode) filterState.setVenueSortMode(options.sortMode);
          }}
          totalAllShows={filterState.totalAllShows}
          allUsedSongs={allUsedSongs}
          allVenues={allVenues}
          allUnits={allUnits}
          q={q}
          setQ={setQ}
        />
      ) : viewMode === "tickets" ? (
        <TicketBookPage
          unitData={unitData}
          showById={showById}
          unitIdByShowId={unitIdByShowId}
          allUsedSongs={allUsedSongs}
          onSelectShow={handleSelectShow}
          onReturnArchive={handleReturnArchive}
          onReturnHome={handleReturnHome}
        />
      ) : viewMode === "journey" ? (
        <JourneyPage
          allUnits={allUnits}
          allVenues={allVenues}
          globalVenueShows={globalVenueShows}
          onSelectShow={handleSelectShow}
          onReturnArchive={handleReturnArchive}
          onReturnHome={handleReturnHome}
          onSelectTickets={handleSelectTickets}
        />
      ) : (
        <ArchiveLayout
          filterState={filterState}
          routeState={routeState}
          unitData={unitData}
          trackShows={trackShows}
          globalVenueShows={globalVenueShows}
          allUsedSongs={allUsedSongs}
          allVenues={allVenues}
          allUnits={allUnits}
          showById={showById}
        />
      )}

      {/* 📅 Global Calendar Modal (ADR-0096) */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        allUnits={allUnits}
        onSelectShow={handleSelectShow}
      />
    </Fragment>
  );
}

export default function App({ initialLocale, probeRoute } = {}) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <AppContent probeRoute={probeRoute} />
    </I18nProvider>
  );
}
