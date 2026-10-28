import { useState, useMemo } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { buildPrefectureMapStats, buildJourneySequence } from "../../lib/venue-map.js";
import { venueProfiles, venueProfilesByCanonical } from "../../lib/locales/venues.js";
import { VenueMapCanvas } from "../VenueMapCanvas.jsx";

/**
 * Fan's Personal Concert Footprint & Prefecture Conquest Map (ADR-0124, Issue #54).
 * Embeds in TicketBook milestone section, lights up conquered 47 prefectures and overseas cities
 * based on fan's locally checked-in shows (strictly excluding virtual livestreams), and traces personal journey.
 */
export function TicketBookFootprintMap({
  attendedShows = [],
  allVenues = null,
  onSelectShow,
}) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(true);

  // 1. Filter out online livestreams; only physical live shows count towards cartographic footprint
  const physicalShows = useMemo(() => {
    return (attendedShows || [])
      .filter((item) => {
        const v = item?.venue || item?.show?.venue || "";
        const city = item?.city || item?.show?.city || "";
        const isVirt =
          item?.isVirtual === true ||
          item?.show?.isVirtual === true ||
          v === "線上直播" ||
          v?.startsWith?.("線上直播") ||
          city === "線上直播";
        return !isVirt && (item?.show || item?.venue || item?.date);
      })
      .map((item) => {
        const s = item.show || item;
        return {
          ...s,
          id: s.id || item.showKey || item.entry?.showKey || item.id,
          date: s.date || item.date || item.attendedAt || "",
          venue: s.venue || item.venue || "",
          city: s.city || item.city || "",
          prefecture: s.prefecture || item.prefecture || "",
          unitTitle: item.shortTitle || item.title || s.title || "",
        };
      })
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [attendedShows]);

  // 2. Build chronological journey sequence for personal concert trajectory
  const fanJourney = useMemo(() => {
    if (physicalShows.length === 0) return null;
    return buildJourneySequence(physicalShows, venueProfilesByCanonical, { includeTvBroadcasts: false });
  }, [physicalShows]);

  // 3. Build venue appearances map for lighting up visited prefectures
  const fanVenueShows = useMemo(() => {
    const map = new Map();
    for (const s of physicalShows) {
      const vName = s.venue || "";
      if (!vName) continue;
      if (!map.has(vName)) map.set(vName, []);
      map.get(vName).push(s);
    }
    return map;
  }, [physicalShows]);

  const effectiveVenuesList = allVenues?.length ? allVenues : venueProfiles;

  // 4. Compute personal prefecture completion statistics
  const footprintStats = useMemo(() => {
    return buildPrefectureMapStats(effectiveVenuesList, fanVenueShows);
  }, [effectiveVenuesList, fanVenueShows]);

  const visitedJapanCount = footprintStats.visitedJapanPrefectureCount || 0;
  const overseasCount = footprintStats.overseasCountryCount || 0;
  const conquestPercentage = Math.min(100, Math.max(0, Math.round((visitedJapanCount / 47) * 1000) / 10));

  return (
    <div
      data-testid="ticket-book-footprint-map"
      className="mt-4 rounded-[4px] border border-line-soft bg-paper/40 p-3 sm:p-4 space-y-3"
    >
      {/* Header bar: Title & Conquest Progress Badge + Collapse Toggle */}
      <button
        type="button"
        data-testid="toggle-footprint-map-btn"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line-soft/80 pb-2.5 text-left cursor-pointer select-none focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg select-none" aria-hidden="true">
            🗺️
          </span>
          <div>
            <h3 className="m-0 font-display text-[14px] sm:text-[15px] font-bold text-ink leading-tight">
              {t("ticketBook.footprintTitle", "我的參戰足跡地圖")}
            </h3>
            <p className="m-0 mt-0.5 font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
              PERSONAL TOUR FOOTPRINT & CONQUEST
            </p>
          </div>
        </div>

        {/* Progress Pill + Collapse Chevron */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="footprint-progress-badge"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-tape px-2.5 py-1 font-mono text-[11px] font-bold text-ink shadow-2xs"
          >
            <span>🇯🇵</span>
            <span>
              {t("ticketBook.prefectureProgress", "已踏破 {visited} / 47 都道府縣", { visited: visitedJapanCount })}
            </span>
            {overseasCount > 0 && (
              <span className="text-band-ink font-extrabold">
                + {overseasCount} {t("ticketBook.overseasCountUnit", "海外城市")}
              </span>
            )}
          </span>
          <span className="font-mono text-[11px] font-bold text-muted transition-transform select-none" aria-hidden="true">
            {isExpanded ? "▼" : "▶"}
          </span>
        </div>
      </button>

      {isExpanded && (
        <>
          {/* Conquest Progress Bar */}
          <div className="space-y-1">
        <div className="flex items-center justify-between font-mono text-[10px] text-muted font-bold">
          <span>{conquestPercentage}% CONQUERED</span>
          <span>{visitedJapanCount} / 47</span>
        </div>
        <div
          className="w-full h-1.5 bg-paper-dark/30 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={conquestPercentage}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            className="h-full bg-band transition-all duration-300"
            style={{ width: `${conquestPercentage}%` }}
          />
        </div>
      </div>

      {/* Map Canvas or Empty State */}
      {physicalShows.length === 0 ? (
        <div
          data-testid="footprint-empty-hint"
          className="rounded-[3px] border border-dashed border-line-soft bg-paper/60 p-6 text-center text-xs text-muted space-y-1"
        >
          <div className="text-xl select-none" aria-hidden="true">📍</div>
          <p className="m-0 font-medium">
            {t(
              "ticketBook.footprintEmptyHint",
              "尚未登錄實體參戰場次，打卡後將自動點亮已踏破之都道府縣與移動軌跡！"
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Map Canvas Frame */}
          <div className="rounded-[4px] border border-ink/20 overflow-hidden bg-card">
            <VenueMapCanvas
              mode="journey"
              journey={fanJourney}
              globalVenueShows={fanVenueShows}
              allVenues={effectiveVenuesList}
              onSelectShow={onSelectShow}
              tourSequence={fanJourney?.transitions || []}
              playbackOptions={{ initialProgress: "end" }}
            />
          </div>

          {/* Footer Metadata & Conquered Tags */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[11px] text-muted">
            <div className="flex flex-wrap items-center gap-2 font-bold text-ink">
              <span>{fanJourney?.stops?.length || 0} STOPS</span>
              <span>·</span>
              <span>🚐 {fanJourney?.summary?.vanCount || 0} {t("slips.tour.vanTransit", "陸路")}</span>
              <span>·</span>
              <span>✈️ {fanJourney?.summary?.flightCount || 0} {t("slips.tour.flightTransit", "航線")}</span>
              <span>·</span>
              <span>🏕️ {fanJourney?.summary?.stayCount || 0} {t("slips.tour.stayTransit", "連日駐留")}</span>
              <span>·</span>
              <span>📏 ~{fanJourney?.summary?.totalDistanceKm || 0} km</span>
            </div>

            {/* Conquered Prefectures Chips */}
            {footprintStats.visitedJapanPrefectures.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {footprintStats.visitedJapanPrefectures.slice(0, 10).map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center rounded bg-tape-tint/70 px-1.5 py-0.2 text-[10px] font-bold text-ink border border-ink/20"
                  >
                    {t(`prefectures.${p}`, p)}
                  </span>
                ))}
                {footprintStats.visitedJapanPrefectures.length > 10 && (
                  <span className="text-[10px] text-muted font-bold">
                    +{footprintStats.visitedJapanPrefectures.length - 10}...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default TicketBookFootprintMap;
