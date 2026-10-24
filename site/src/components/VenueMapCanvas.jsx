import { useState, useMemo, useEffect } from "react";
import {
  MAP_VIEWBOX,
  OVERSEAS_INSET_BOUNDS,
  OKINAWA_INSET_BOUNDS,
  OVERSEAS_COUNTRIES,
  OVERSEAS_TARGET_KEY,
  buildPrefectureMapStats,
  computeSpiderfyOffsets,
  formatMapBadgeLabel,
} from "../lib/venue-map.js";
import {
  PREFECTURE_PATHS,
  getZoomViewBox,
} from "../lib/japan-map-paths.js";
import { venueProfiles } from "../lib/locales/venues.js";
import { useI18n } from "../lib/i18n.jsx";

function buildCurvePath(fromSvg, toSvg, transitMode) {
  if (!fromSvg || !toSvg) return "";
  const dx = toSvg.x - fromSvg.x;
  const dy = toSvg.y - fromSvg.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return "";

  const midX = (fromSvg.x + toSvg.x) / 2;
  const midY = (fromSvg.y + toSvg.y) / 2;
  const arcFactor = transitMode === "flight" ? 0.24 : 0.12;
  const offset = Math.min(85, Math.max(8, dist * arcFactor));
  const nx = -dy / dist;
  const ny = dx / dist;
  const cx = Number((midX + nx * offset).toFixed(1));
  const cy = Number((midY + ny * offset - (transitMode === "flight" ? 14 : 0)).toFixed(1));

  return `M${fromSvg.x},${fromSvg.y} Q${cx},${cy} ${toSvg.x},${toSvg.y}`;
}

export function VenueMapCanvas({
  mode = "venues",
  allVenues = [],
  globalVenueShows = null,
  selectedPrefecture = null,
  onSelectPrefecture,
  selectedCity = null,
  onSelectCity,
  selectedVenue = null,
  onSelectVenue,
  journey = null,
  onSelectShow,
}) {
  const { t, localizeVenue } = useI18n();
  const [hoveredVenue, setHoveredVenue] = useState(null);
  const [localCity, setLocalCity] = useState(null);

  const activeCity = selectedCity !== undefined ? selectedCity : localCity;
  const setActiveCity = (c) => {
    setLocalCity(c);
    if (onSelectCity) onSelectCity(c);
  };

  useEffect(() => {
    setLocalCity(null);
  }, [selectedPrefecture]);

  useEffect(() => {
    if (!selectedPrefecture || !onSelectPrefecture) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onSelectPrefecture(null);
      }
    };
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedPrefecture, onSelectPrefecture]);

  const effectiveVenues = useMemo(() => {
    if (allVenues?.some((v) => typeof v.lat === "number")) {
      return allVenues;
    }
    return venueProfiles;
  }, [allVenues]);

  const mapStats = useMemo(
    () => buildPrefectureMapStats(effectiveVenues, globalVenueShows),
    [effectiveVenues, globalVenueShows]
  );

  const currentViewBox = useMemo(
    () => (mode === "venues" ? getZoomViewBox(selectedPrefecture) : MAP_VIEWBOX.str),
    [mode, selectedPrefecture]
  );

  const focusedPrefEntries = useMemo(() => {
    if (!selectedPrefecture) return [];
    if (selectedPrefecture === OVERSEAS_TARGET_KEY || selectedPrefecture === "overseas") {
      return OVERSEAS_COUNTRIES.map((c) => mapStats.byPrefecture[c]).filter(Boolean);
    }
    const single = mapStats.byPrefecture[selectedPrefecture];
    return single ? [single] : [];
  }, [selectedPrefecture, mapStats]);

  const focusedCities = useMemo(() => {
    const cities = [];
    for (const entry of focusedPrefEntries) {
      for (const c of entry.cities || []) {
        if (c.showCount > 0 || c.venueCount > 0) {
          cities.push(c);
        }
      }
    }
    return cities;
  }, [focusedPrefEntries]);

  const focusedVenuesRaw = useMemo(() => {
    const list = [];
    for (const entry of focusedPrefEntries) {
      for (const v of entry.venues || []) {
        if (v.showCount > 0 || (allVenues || []).some((av) => (av.name || av.canonical) === v.canonical)) {
          if (!activeCity || v.city === activeCity) {
            list.push(v);
          }
        }
      }
    }
    return list;
  }, [focusedPrefEntries, activeCity, allVenues]);

  const spiderfiedFocusedVenues = useMemo(
    () => computeSpiderfyOffsets(focusedVenuesRaw, { radiusPx: 9 }),
    [focusedVenuesRaw]
  );

  const handleKeyActivate = (e, callback) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  return (
    <div className="space-y-3" data-testid="venue-map-container">
      {/* Top Status & Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-ink/30 bg-paper px-3 py-2 text-[12px]">
        <div className="flex flex-wrap items-center gap-2 font-mono font-bold text-ink">
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-band px-2 py-0.5 text-band-ink border border-ink/40 shadow-xs">
            {t("venueMap.completionBadge", null, {
              visited: mapStats.visitedJapanPrefectureCount,
              total: mapStats.totalJapanPrefectures,
              percent: mapStats.completionPercent,
            })}
          </span>
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-card px-2 py-0.5 text-ink border border-ink/30">
            {t("venueMap.overseasBadge", null, {
              count: mapStats.overseasCountryCount,
            })}
          </span>
        </div>

        {mode === "venues" && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-[2px] border border-dashed border-ink/60 bg-paper" />
              <span>{t("venueMap.tierUnvisited")}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-[2px] border border-ink bg-tape-soft" />
              <span>{t("venueMap.tierVisited")}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-bold">
              <span className="inline-block h-3 w-3 rounded-[2px] border border-ink bg-band" />
              <span>{t("venueMap.tierHub")}</span>
            </span>
          </div>
        )}

        {mode === "journey" && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-ink">
            <span className="inline-flex items-center gap-1">
              <span>{t("venueMap.legendVan")}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span>{t("venueMap.legendFlight")}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span>{t("venueMap.legendStay")}</span>
            </span>
          </div>
        )}
      </div>

      {/* SVG Map Frame */}
      <div className="relative overflow-hidden rounded-[3px] border-[1.5px] border-ink bg-paper shadow-xs">
        {mode === "venues" && selectedPrefecture && (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
            <button
              type="button"
              data-testid="map-reset-zoom-btn"
              onClick={() => onSelectPrefecture && onSelectPrefecture(null)}
              aria-label={t("venueMap.backToNationalAria")}
              className="rounded-[3px] border-[1.5px] border-ink bg-band px-3 py-1 font-mono text-[12px] font-extrabold text-band-ink shadow-xs hover:bg-card cursor-pointer transition-colors motion-reduce:transition-none"
            >
              {t("venueMap.backToNational")}
            </button>
          </div>
        )}

        <svg
          viewBox={currentViewBox}
          width="100%"
          height="auto"
          role="region"
          aria-label={t("venueMap.regionAria")}
          className="block w-full h-auto select-none transition-all duration-300 motion-reduce:transition-none"
        >
          {/* 1. Top-Left Perforated Ticket Stub Inset: Overseas Asia */}
          <g
            data-testid="overseas-asia-inset"
            role="button"
            tabIndex={0}
            aria-label={t("venueMap.overseasInsetSub")}
            onClick={() => onSelectPrefecture && onSelectPrefecture(OVERSEAS_TARGET_KEY)}
            onKeyDown={(e) =>
              handleKeyActivate(e, () => onSelectPrefecture && onSelectPrefecture(OVERSEAS_TARGET_KEY))
            }
            className="cursor-pointer focus:outline-none"
          >
            <rect
              x={OVERSEAS_INSET_BOUNDS.x}
              y={OVERSEAS_INSET_BOUNDS.y}
              width={OVERSEAS_INSET_BOUNDS.width}
              height={OVERSEAS_INSET_BOUNDS.height}
              rx="3"
              fill="var(--color-card)"
              stroke="var(--color-ink)"
              strokeWidth="1.5"
              strokeDasharray="5 3"
            />
            <text
              x={OVERSEAS_INSET_BOUNDS.x + 10}
              y={OVERSEAS_INSET_BOUNDS.y + 18}
              fontFamily="var(--font-mono)"
              fontSize="10"
              fontWeight="bold"
              fill="var(--color-ink)"
            >
              {t("venueMap.overseasInsetTitle")}
            </text>
            <text
              x={OVERSEAS_INSET_BOUNDS.x + 10}
              y={OVERSEAS_INSET_BOUNDS.y + 32}
              fontSize="9.5"
              fontWeight="bold"
              fill="var(--color-muted)"
            >
              {t("venueMap.overseasInsetSub")}
            </text>
          </g>

          {/* 2. Bottom-Right Perforated Ticket Stub Inset: Okinawa */}
          <g data-testid="okinawa-inset">
            <rect
              x={OKINAWA_INSET_BOUNDS.x}
              y={OKINAWA_INSET_BOUNDS.y}
              width={OKINAWA_INSET_BOUNDS.width}
              height={OKINAWA_INSET_BOUNDS.height}
              rx="3"
              fill="var(--color-card)"
              stroke="var(--color-ink)"
              strokeWidth="1.5"
              strokeDasharray="5 3"
            />
            <text
              x={OKINAWA_INSET_BOUNDS.x + 10}
              y={OKINAWA_INSET_BOUNDS.y + 18}
              fontFamily="var(--font-mono)"
              fontSize="10"
              fontWeight="bold"
              fill="var(--color-ink)"
            >
              {t("venueMap.okinawaInsetTitle")}
            </text>
          </g>

          {/* 3. Prefecture & Overseas Country Polygons + Badges */}
          <g data-testid="prefecture-layer">
            {PREFECTURE_PATHS.map((geo) => {
              const stat = mapStats.byPrefecture[geo.prefecture] || {
                showCount: 0,
                activeVenueCount: 0,
                tier: "unvisited",
                isSaninSanctuary: false,
              };
              const isSelected =
                selectedPrefecture === geo.prefecture ||
                (selectedPrefecture === OVERSEAS_TARGET_KEY && geo.zone === "overseas");
              const locPref = t(`prefectures.${geo.prefecture}`, geo.prefecture);

              const fillToken =
                stat.tier === "unvisited"
                  ? "var(--color-paper)"
                  : stat.tier === "sanctuary_or_hub"
                  ? "var(--color-band)"
                  : "var(--color-tape-soft)";

              const strokeToken =
                stat.tier === "unvisited"
                  ? "var(--color-muted)"
                  : "var(--color-ink)";

              const ariaLabel =
                stat.showCount > 0
                  ? t("venueMap.prefAriaVisited", null, {
                      pref: locPref,
                      venues: stat.activeVenueCount || stat.venueCount,
                      shows: stat.showCount,
                    })
                  : t("venueMap.prefAriaUnvisited", null, {
                      pref: locPref,
                    });

              return (
                <g
                  key={geo.prefecture}
                  data-pref={geo.prefecture}
                  data-tier={stat.tier}
                  role="button"
                  tabIndex={0}
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  onClick={() => onSelectPrefecture && onSelectPrefecture(geo.prefecture)}
                  onKeyDown={(e) =>
                    handleKeyActivate(e, () => onSelectPrefecture && onSelectPrefecture(geo.prefecture))
                  }
                  className="cursor-pointer focus:outline-none"
                >
                  <path
                    d={geo.path}
                    fill={fillToken}
                    stroke={strokeToken}
                    strokeWidth={isSelected ? "2.2" : stat.tier === "unvisited" ? "1" : "1.2"}
                    strokeDasharray={stat.tier === "unvisited" ? "3 2" : undefined}
                  />

                  {/* Macro Badge or Label */}
                  {(!selectedPrefecture || isSelected) && (
                    <g transform={`translate(${geo.cx}, ${geo.cy})`}>
                      {stat.tier === "sanctuary_or_hub" || geo.zone !== "main" ? (
                        <>
                          <rect
                            x="-22"
                            y="-9"
                            width="44"
                            height="18"
                            rx="3"
                            fill={stat.tier === "sanctuary_or_hub" ? "var(--color-band)" : "var(--color-card)"}
                            stroke="var(--color-ink)"
                            strokeWidth="1.2"
                          />
                          <text
                            x="0"
                            y="3.5"
                            textAnchor="middle"
                            fontFamily="var(--font-mono)"
                            fontSize="8.5"
                            fontWeight="bold"
                            fill={stat.tier === "sanctuary_or_hub" ? "var(--color-band-ink)" : "var(--color-ink)"}
                          >
                            {formatMapBadgeLabel(locPref, stat.isSaninSanctuary)} {stat.showCount}
                          </text>
                        </>
                      ) : stat.showCount > 0 ? (
                        <circle
                          cx="0"
                          cy="0"
                          r="3.2"
                          fill="var(--color-ink)"
                        />
                      ) : null}
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* 4. Spotlight Zoom Individual Venue Pins (with Spiderfy radial offset) */}
          {mode === "venues" && selectedPrefecture && (
            <g data-testid="venue-pins-layer">
              {spiderfiedFocusedVenues.map((v) => {
                if (!v.svgPoint) return null;
                const isHighlighted =
                  hoveredVenue === v.canonical || selectedVenue === v.canonical;
                const locVenueName = localizeVenue(v.canonical);
                const locCityName = v.city ? t(`cities.${v.city}`, v.city) : "";
                const pinAria = t("venueMap.pinAria", null, {
                  venue: locVenueName,
                  city: locCityName,
                  shows: v.showCount,
                });

                return (
                  <g key={v.canonical}>
                    {v.isSpiderfied && (
                      <line
                        x1={v.svgPoint.anchorX}
                        y1={v.svgPoint.anchorY}
                        x2={v.svgPoint.x}
                        y2={v.svgPoint.y}
                        stroke="var(--color-ink)"
                        strokeWidth="0.9"
                        strokeDasharray="1.5 1.5"
                      />
                    )}
                    <g
                      transform={`translate(${v.svgPoint.x}, ${v.svgPoint.y})`}
                      data-testid="venue-map-pin"
                      data-venue={v.canonical}
                      role="button"
                      tabIndex={0}
                      aria-label={pinAria}
                      onMouseEnter={() => setHoveredVenue(v.canonical)}
                      onMouseLeave={() => setHoveredVenue(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectVenue) onSelectVenue(v.canonical);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onSelectVenue) onSelectVenue(v.canonical);
                        }
                      }}
                      className="cursor-pointer focus:outline-none"
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r={isHighlighted ? "6.5" : "4.8"}
                        fill={isHighlighted ? "var(--color-request)" : "var(--color-band)"}
                        stroke="var(--color-ink)"
                        strokeWidth="1.2"
                      />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        fontFamily="var(--font-mono)"
                        fontSize="6.5"
                        fontWeight="bold"
                        fill={isHighlighted ? "var(--color-card)" : "var(--color-band-ink)"}
                      >
                        {v.showCount}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}

          {/* 5. Career / Tour Journey Route Layer */}
          {mode === "journey" && journey && (
            <g data-testid="journey-route-layer">
              {/* Transitions: van (pool solid/dashed curve) & flight (request high-arc dashed) */}
              {(journey.transitions || []).map((tr) => {
                if (tr.transitMode === "stay") {
                  if (!tr.fromSvg) return null;
                  return (
                    <circle
                      key={`stay-${tr.index}`}
                      cx={tr.fromSvg.x}
                      cy={tr.fromSvg.y}
                      r="8"
                      fill="none"
                      stroke="var(--color-band)"
                      strokeWidth="1.6"
                      strokeDasharray="2 2"
                    />
                  );
                }
                const d = buildCurvePath(tr.fromSvg, tr.toSvg, tr.transitMode);
                if (!d) return null;
                const isFlight = tr.transitMode === "flight";
                return (
                  <path
                    key={`tr-${tr.index}`}
                    d={d}
                    fill="none"
                    stroke={isFlight ? "var(--color-request)" : "var(--color-solo)"}
                    strokeWidth={isFlight ? "1.8" : "2.2"}
                    strokeDasharray={isFlight ? "4 3" : "6 3"}
                    opacity="0.85"
                  />
                );
              })}

              {/* First & Final Stop Callout Badges */}
              {(journey.stops || []).map((stop) => {
                if (!stop.svgPoint) return null;
                if (!stop.isFirst && !stop.isFinal) return null;
                return (
                  <g
                    key={`milestone-${stop.showId}-${stop.index}`}
                    transform={`translate(${stop.svgPoint.x}, ${stop.svgPoint.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${stop.date} ${localizeVenue(stop.venue)}`}
                    onClick={() => onSelectShow && onSelectShow(stop.showId)}
                    onKeyDown={(e) =>
                      handleKeyActivate(e, () => onSelectShow && onSelectShow(stop.showId))
                    }
                    className="cursor-pointer"
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="7"
                      fill={stop.isFirst ? "var(--color-band)" : "var(--color-request)"}
                      stroke="var(--color-ink)"
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                      fontSize="7.5"
                      fontWeight="bold"
                      fill={stop.isFirst ? "var(--color-band-ink)" : "var(--color-card)"}
                    >
                      {stop.isFirst ? "S" : "F"}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Hint bar when in macro view */}
      {mode === "venues" && !selectedPrefecture && (
        <p className="m-0 font-mono text-[11px] text-muted">
          {t("venueMap.clickHint")}
        </p>
      )}

      {/* Drilled-Down Prefecture City Pills & Synchronized Venue Cards List */}
      {mode === "venues" && selectedPrefecture && (
        <div
          className="rounded-[3px] border-[1.5px] border-ink bg-card p-3 sm:p-4 shadow-xs space-y-3"
          data-testid="map-drilldown-panel"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] font-extrabold text-ink">
                {t("venueMap.venuesInPrefTitle", null, {
                  pref: t(`prefectures.${selectedPrefecture}`, selectedPrefecture),
                  venues: focusedVenuesRaw.length,
                  shows: focusedPrefEntries.reduce((s, e) => s + e.showCount, 0),
                })}
              </span>
              {focusedPrefEntries.some((e) => e.isSaninSanctuary) && (
                <span className="rounded-[3px] bg-band px-2 py-0.5 font-mono text-[11px] font-bold text-band-ink border border-ink/40">
                  {t("venueMap.saninBadge")}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelectPrefecture && onSelectPrefecture(null)}
              className="rounded-[3px] border border-ink/40 bg-paper px-2.5 py-1 font-mono text-[11px] font-bold text-ink hover:bg-band hover:text-band-ink cursor-pointer transition-colors"
            >
              {t("venueMap.backToNational")}
            </button>
          </div>

          {/* City Filter Capsules */}
          {focusedCities.length > 1 && (
            <div className="flex flex-wrap gap-1.5" data-testid="map-city-pills">
              <button
                type="button"
                onClick={() => setActiveCity(null)}
                className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                  !activeCity
                    ? "bg-band text-band-ink border border-ink/40 shadow-2xs"
                    : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
                }`}
              >
                {t("venueMap.filterAllCities")}
              </button>
              {focusedCities.map((c) => {
                const isCurCity = activeCity === c.city;
                return (
                  <button
                    key={c.hubId}
                    type="button"
                    onClick={() => setActiveCity(isCurCity ? null : c.city)}
                    className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                      isCurCity
                        ? "bg-band text-band-ink border border-ink/40 shadow-2xs"
                        : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
                    }`}
                  >
                    <span>{t(`cities.${c.city}`, c.city)}</span>
                    <span className="ml-1 opacity-75 tabular-nums">({c.venueCount})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Venue Ticket Stub Cards List */}
          {spiderfiedFocusedVenues.length === 0 ? (
            <p className="m-0 py-2 text-[12px] text-muted">
              {t("venueMap.unvisitedNotice", null, {
                pref: t(`prefectures.${selectedPrefecture}`, selectedPrefecture),
              })}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {spiderfiedFocusedVenues.map((v) => {
                const isHighlighted =
                  hoveredVenue === v.canonical || selectedVenue === v.canonical;
                return (
                  <button
                    key={v.canonical}
                    type="button"
                    data-testid="map-venue-card"
                    onMouseEnter={() => setHoveredVenue(v.canonical)}
                    onMouseLeave={() => setHoveredVenue(null)}
                    onClick={() => onSelectVenue && onSelectVenue(v.canonical)}
                    className={`flex items-center justify-between gap-2 rounded-[3px] border px-3 py-2 text-left cursor-pointer transition-colors motion-reduce:transition-none ${
                      isHighlighted
                        ? "border-ink bg-band text-band-ink font-bold shadow-xs"
                        : "border-line-soft bg-paper text-ink hover:border-ink hover:bg-tape-tint/40"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold">
                        {localizeVenue(v.canonical)}
                      </div>
                      <div className="truncate text-[11px] opacity-80">
                        {v.city ? t(`cities.${v.city}`, v.city) : ""}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-[3px] border border-ink/30 bg-card px-2 py-0.5 font-mono text-[11px] font-bold text-ink tabular-nums">
                      {v.showCount} {t("navigators.showsUnit")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VenueMapCanvas;
