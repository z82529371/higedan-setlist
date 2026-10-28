import { useMemo } from "react";
import { buildJourneySequence } from "../../lib/venue-map.js";
import { venueProfilesByCanonical } from "../../lib/locales/venues.js";
import { VenueMapCanvas } from "../VenueMapCanvas.jsx";

/**
 * Tour Journey Route Map Panel (ADR-0124, Issue #54).
 * Visualizes the tour's movement trajectory from START to FINAL,
 * distinguishing overland (van), flight, and residency (stay),
 * badging online livestreams, and hosting interactive stops.
 */
export function TourJourneyMapPanel({
  rawShows = [],
  tourJourney: incomingJourney,
  tourVenueShows: incomingVenueShows,
  onSelectShow,
  localizeVenue,
  t,
}) {
  const tourJourney = useMemo(() => {
    if (incomingJourney) return incomingJourney;
    return buildJourneySequence(rawShows, venueProfilesByCanonical, { includeTvBroadcasts: false });
  }, [incomingJourney, rawShows]);

  const tourVenueShows = useMemo(() => {
    if (incomingVenueShows) return incomingVenueShows;
    const map = new Map();
    for (const stop of tourJourney?.stops || []) {
      if (!map.has(stop.venue)) map.set(stop.venue, []);
      map.get(stop.venue).push(stop);
    }
    return map;
  }, [incomingVenueShows, tourJourney]);

  if (!tourJourney) return null;

  const firstStop = tourJourney.stops?.[0] || null;
  const finalStop = tourJourney.stops?.[tourJourney.stops.length - 1] || null;

  return (
    <div data-testid="tour-journey-panel" className="space-y-3">
      {/* Route Info Bar */}
      <div
        data-testid="tour-journey-info-bar"
        className="flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-line-soft bg-paper p-2.5 font-mono text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          {firstStop && (
            <span
              data-testid="tour-start-stop"
              className="inline-flex items-center gap-1 rounded bg-tape/30 px-2 py-0.5 border border-ink/20 font-bold text-ink"
            >
              <span className="text-band-ink font-extrabold">{t("slips.tour.routeStart", "首站")}:</span>
              <span>{firstStop.date} {localizeVenue(firstStop.venue)}</span>
            </span>
          )}
          {finalStop && (
            <span
              data-testid="tour-final-stop"
              className="inline-flex items-center gap-1 rounded bg-request/15 px-2 py-0.5 border border-request/30 font-bold text-request"
            >
              <span className="font-extrabold">{t("slips.tour.routeFinal", "終點")}:</span>
              <span>{finalStop.date} {localizeVenue(finalStop.venue)}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted font-bold">
          <span>🚐 {tourJourney.summary.vanCount} {t("slips.tour.vanTransit", "陸路")}</span>
          <span>·</span>
          <span>✈️ {tourJourney.summary.flightCount} {t("slips.tour.flightTransit", "航線")}</span>
          <span>·</span>
          <span>🏕️ {tourJourney.summary.stayCount} {t("slips.tour.stayTransit", "連日駐留")}</span>
          <span>·</span>
          <span>📏 ~{tourJourney.summary.totalDistanceKm} km</span>
        </div>

        {tourJourney.virtualShows.length > 0 && (
          <div
            data-testid="tour-virtual-shows-badge"
            className="w-full mt-1 flex flex-wrap items-center gap-1.5 rounded bg-tape-tint/70 px-2.5 py-1 border border-ink/25 text-[11px] font-bold text-ink"
          >
            <span>📡</span>
            <span>{t("slips.tour.virtualShows", "線上配信場")} ({tourJourney.virtualShows.length})：</span>
            <span className="font-normal">
              {tourJourney.virtualShows.map((v) => `${v.date} ${localizeVenue(v.venue)}`).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div className="rounded-[4px] border border-ink/20 overflow-hidden bg-card">
        <VenueMapCanvas
          mode="journey"
          journey={tourJourney}
          globalVenueShows={tourVenueShows}
          onSelectShow={onSelectShow}
          tourSequence={tourJourney.transitions}
          animalAnimationProps={{
            stops: tourJourney.stops,
            transitions: tourJourney.transitions,
          }}
        />
      </div>
    </div>
  );
}

export default TourJourneyMapPanel;
