import { useState, useMemo, useEffect, useRef } from "react";
import {
  OVERSEAS_INSET_BOUNDS,
  OKINAWA_INSET_BOUNDS,
  PORTRAIT_OVERSEAS_INSET_BOUNDS,
  PORTRAIT_OKINAWA_INSET_BOUNDS,
  OVERSEAS_COUNTRIES,
  OVERSEAS_TARGET_KEY,
  MAIN_PORTRAIT_OFFSET,
  OVERSEAS_PORTRAIT_OFFSET,
  OKINAWA_PORTRAIT_OFFSET,
  projectPointToLayout,
  buildPrefectureMapStats,
  computeSpiderfyOffsets,
} from "../lib/venue-map.js";
import {
  PREFECTURE_PATHS,
  MAP_GRATICULE_PATHS,
  getZoomViewBox,
  getZoomScaleFactor,
} from "../lib/japan-map-paths.js";
import {
  buildTransitPath,
  pointOnTransit,
  tangentAngleOnTransit,
  computeFollowCamViewBox,
} from "../lib/journey-playback.js";
import { useJourneyPlayback } from "../lib/use-journey-playback.js";
import { JourneyPlaybackControls } from "./JourneyPlaybackControls.jsx";
import { venueProfiles } from "../lib/locales/venues.js";
import { useI18n } from "../lib/i18n.jsx";

const EMPTY_LIST = [];

/**
 * Handcrafted 3D Isometric Touring 6-Seater Red SUV with Silver Roof Rack (pure SVG vectors).
 * Pure crimson red paint finish without black borders ("旁邊不用黑邊框 保持全紅").
 */
export function TourVan3D({ angle = 0, scale = 0.7 }) {
  return (
    <g transform={`rotate(${angle}) scale(${scale})`}>
      {/* 1. Soft Ground Contact Shadow */}
      <ellipse cx="0" cy="2.5" rx="15" ry="7.5" fill="var(--color-ink)" opacity="0.25" />

      {/* 2. Front Headlight Beams illuminating the road forward */}
      <polygon points="12,-5.5 30,-12 30,-1.5 12,-3.5" fill="var(--color-band)" opacity="0.35" />
      <polygon points="12,3.5 30,1.5 30,12 12,5.5" fill="var(--color-band)" opacity="0.35" />
      <circle cx="12" cy="-4.5" r="1.3" fill="#fff" opacity="0.95" />
      <circle cx="12" cy="4.5" r="1.3" fill="#fff" opacity="0.95" />

      {/* 3. Four Rubber Tires with Silver Alloy Rims */}
      <rect x="5.5" y="-8.8" width="5.5" height="2.5" rx="1.2" fill="#18181b" />
      <circle cx="8.2" cy="-7.5" r="0.9" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.4" />
      <rect x="5.5" y="6.3" width="5.5" height="2.5" rx="1.2" fill="#18181b" />
      <circle cx="8.2" cy="7.5" r="0.9" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.4" />
      <rect x="-10" y="-8.8" width="5.5" height="2.5" rx="1.2" fill="#18181b" />
      <circle cx="-7.2" cy="-7.5" r="0.9" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.4" />
      <rect x="-10" y="6.3" width="5.5" height="2.5" rx="1.2" fill="#18181b" />
      <circle cx="-7.2" cy="7.5" r="0.9" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.4" />

      {/* 4. Pure Crimson Red 6-Seater SUV Body (純粹熱血全紅烤漆，無黑邊框) */}
      <rect x="-12.5" y="-6.8" width="25" height="13.6" rx="3.5" fill="#dc2626" />
      {/* Sleek roof ridge highlight in vibrant scarlet */}
      <path d="M-11.5,-6 L11.5,-6 L11.5,-3.5 L-11.5,-3.5 Z" fill="#ef4444" opacity="0.85" />
      <path d="M-11.5,3.5 L11.5,3.5 L11.5,6 L-11.5,6 Z" fill="#b91c1c" opacity="0.4" />

      {/* 5. Silver Side Mirrors (純銀色後視鏡，無黑外框) */}
      <rect x="5.5" y="-8" width="2" height="1.6" rx="0.6" fill="#e2e8f0" />
      <rect x="5.5" y="6.4" width="2" height="1.6" rx="0.6" fill="#e2e8f0" />

      {/* 6. 6-Seater 3-Row Tinted Privacy Windows (三排座深色座艙車窗玻璃) */}
      <path d="M4.5,-5.2 L9.2,-4.2 L9.2,4.2 L4.5,5.2 Z" fill="#0f172a" />
      <line x1="5.5" y1="-3.2" x2="8.2" y2="1.5" stroke="#94a3b8" strokeWidth="0.7" opacity="0.7" />
      <rect x="0.5" y="-5.6" width="3.5" height="1.6" rx="0.5" fill="#0f172a" />
      <rect x="0.5" y="4" width="3.5" height="1.6" rx="0.5" fill="#0f172a" />
      <rect x="-4.5" y="-5.6" width="4" height="1.6" rx="0.5" fill="#0f172a" />
      <rect x="-4.5" y="4" width="4" height="1.6" rx="0.5" fill="#0f172a" />
      <rect x="-9.5" y="-5.6" width="4" height="1.6" rx="0.5" fill="#0f172a" />
      <rect x="-9.5" y="4" width="4" height="1.6" rx="0.5" fill="#0f172a" />
      <rect x="-11.8" y="-3.8" width="1.6" height="7.6" rx="0.6" fill="#0f172a" />

      {/* 7. Silver Metallic Roof Rack with Touring Gear (銀色金屬巡演樂器行李架) */}
      <line x1="-8.5" y1="-4.6" x2="3.5" y2="-4.6" stroke="#f1f5f9" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="-8.5" y1="-4.6" x2="3.5" y2="-4.6" stroke="#94a3b8" strokeWidth="0.4" strokeLinecap="round" />
      <line x1="-8.5" y1="4.6" x2="3.5" y2="4.6" stroke="#f1f5f9" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="-8.5" y1="4.6" x2="3.5" y2="4.6" stroke="#94a3b8" strokeWidth="0.4" strokeLinecap="round" />
      <line x1="-7" y1="-4.6" x2="-7" y2="4.6" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="-2.5" y1="-4.6" x2="-2.5" y2="4.6" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="2" y1="-4.6" x2="2" y2="4.6" stroke="#e2e8f0" strokeWidth="1" />
      <rect x="-6" y="-3" width="7.5" height="6" rx="1.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
      <line x1="-6" y1="0" x2="1.5" y2="0" stroke="#94a3b8" strokeWidth="0.6" />

      {/* 8. Rear Tail Lights (紅寶石尾燈) */}
      <rect x="-12.5" y="-5.5" width="1" height="2" rx="0.5" fill="#ef4444" />
      <rect x="-12.5" y="3.5" width="1" height="2" rx="0.5" fill="#ef4444" />
    </g>
  );
}

/**
 * Handcrafted 3D Aerodynamic Touring Jet in Platinum Silver Metallic (pure SVG vectors).
 * Styled in pure paint finish matching the touring van (zero black border, deep tinted windows, forward headlights).
 */
export function TourAirplane3D({ angle = 0, scale = 0.72 }) {
  return (
    <g transform={`rotate(${angle}) scale(${scale})`}>
      {/* 1. Ground Shadow (gliding across islands and ocean below) */}
      <g transform="translate(-1, 10) scale(0.9)" opacity="0.22" fill="var(--color-ink)">
        <path d="M-14,0 L-4,-14 L3,-14 L0,-1 L11,-1 L15,0 L11,1 L0,1 L3,14 L-4,14 L-14,0 Z" />
      </g>

      {/* 2. Elevated Aircraft Body */}
      <g transform="translate(0, -5)">
        {/* Forward Headlight Beams illuminating the flight path */}
        <polygon points="12,-3 32,-9 32,-1 12,-1.5" fill="var(--color-band)" opacity="0.35" />
        <polygon points="12,1.5 32,1 32,9 12,3" fill="var(--color-band)" opacity="0.35" />
        <circle cx="12" cy="-2" r="1.1" fill="#fff" opacity="0.95" />
        <circle cx="12" cy="2" r="1.1" fill="#fff" opacity="0.95" />

        {/* Jet Exhaust Heat Contrails behind turbofans */}
        <polygon points="-4,-7.2 -18,-9.5 -18,-5 -4,-7.2" fill="var(--color-band)" opacity="0.25" />
        <polygon points="-4,7.2 -18,5 -18,9.5 -4,7.2" fill="var(--color-band)" opacity="0.25" />

        {/* Swept Main Wings in Platinum Silver Metallic (no black outline) */}
        <polygon points="-4,-16 2.5,-16 2.5,-2 0,-1 0,1 2.5,2 2.5,16 -4,16 -2,2 -2,-2" fill="#e2e8f0" />
        <polygon points="-1,-15 2,-15 2,-2 -1,-2" fill="#f8fafc" opacity="0.85" />
        <polygon points="-1,2 2,2 2,15 -1,15" fill="#f8fafc" opacity="0.85" />

        {/* Wingtip Navigation Lights (Port Red / Starboard Green) */}
        <circle cx="2" cy="-16" r="1.1" fill="var(--color-request)" />
        <circle cx="2" cy="16" r="1.1" fill="#22c55e" />

        {/* Twin Turbofan Jet Engines */}
        <rect x="-4" y="-8.4" width="7" height="2.4" rx="1.2" fill="#64748b" />
        <rect x="-4" y="6" width="7" height="2.4" rx="1.2" fill="#64748b" />
        <rect x="-3.5" y="-8.1" width="5.5" height="1.8" rx="0.9" fill="#cbd5e1" />
        <rect x="-3.5" y="6.3" width="5.5" height="1.8" rx="0.9" fill="#cbd5e1" />
        <ellipse cx="2.6" cy="-7.2" rx="0.5" ry="0.9" fill="#0f172a" />
        <ellipse cx="2.6" cy="7.2" rx="0.5" ry="0.9" fill="#0f172a" />

        {/* Aerodynamic Fuselage (Platinum Pearl White / Silver, no black border) */}
        <path d="M-15,0 C-15,-2.8 -4,-3.2 11,-1.8 C14.5,-0.9 16.5,0 16.5,0 C16.5,0 14.5,0.9 11,1.8 C-4,3.2 -15,2.8 -15,0 Z" fill="#f8fafc" />
        <path d="M-14,-0.5 C-14,-2.2 -3,-2.6 10,-1.4 C13,-0.6 15,0 15,0 C13,0.3 10,0.5 -14,-0.5 Z" fill="#ffffff" opacity="0.9" />
        <path d="M-14,0.5 C-4,2.6 10,1.4 15,0 C14,0.7 10.5,1.6 -4,2.6 Z" fill="#cbd5e1" opacity="0.5" />

        {/* Cockpit Canopy (Deep Tinted Window with Silver Glare Line) */}
        <path d="M8,-1.2 L12.5,-0.8 L12.5,0.8 L8,1.2 Z" fill="#0f172a" />
        <line x1="8.8" y1="-0.7" x2="11.8" y2="0.3" stroke="#94a3b8" strokeWidth="0.6" opacity="0.8" />

        {/* Passenger Cabin Privacy Windows (5 on each flank) */}
        <circle cx="5" cy="-1.7" r="0.45" fill="#0f172a" />
        <circle cx="2.5" cy="-1.9" r="0.45" fill="#0f172a" />
        <circle cx="0" cy="-2" r="0.45" fill="#0f172a" />
        <circle cx="-2.5" cy="-2" r="0.45" fill="#0f172a" />
        <circle cx="-5" cy="-1.9" r="0.45" fill="#0f172a" />
        <circle cx="5" cy="1.7" r="0.45" fill="#0f172a" />
        <circle cx="2.5" cy="1.9" r="0.45" fill="#0f172a" />
        <circle cx="0" cy="2" r="0.45" fill="#0f172a" />
        <circle cx="-2.5" cy="2" r="0.45" fill="#0f172a" />
        <circle cx="-5" cy="1.9" r="0.45" fill="#0f172a" />

        {/* Horizontal Stabilizers & Tail Fin */}
        <polygon points="-16,-6 -12,-6 -10,0 -12,6 -16,6 -13,0" fill="#e2e8f0" />
        <polygon points="-15,0 -11,-0.5 -9.5,0 -11,0.5" fill="#cbd5e1" />
        {/* Official Band Gold Tail Fin Accent */}
        <rect x="-14" y="-0.4" width="3.2" height="0.8" fill="var(--color-band)" />
      </g>
    </g>
  );
}

export function VenueMapCanvas({
  mode = "venues",
  layout = "auto",
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
  const [hoveredPref, setHoveredPref] = useState(null);
  const [localCity, setLocalCity] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const containerRef = useRef(null);
  const prevPrefRef = useRef(selectedPrefecture);
  const cardRefs = useRef(new Map());

  useEffect(() => {
    if (hoveredVenue && cardRefs.current.has(hoveredVenue)) {
      cardRefs.current.get(hoveredVenue)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [hoveredVenue]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const activeLayout =
    layout === "portrait" || layout === "landscape"
      ? layout
      : isSmallScreen
      ? "portrait"
      : "landscape";
  const isPortrait = activeLayout === "portrait";

  const getZoneTransform = (zone) => {
    if (!isPortrait) return undefined;
    if (zone === "overseas") {
      return `translate(${OVERSEAS_PORTRAIT_OFFSET.x}, ${OVERSEAS_PORTRAIT_OFFSET.y})`;
    }
    if (zone === "okinawa") {
      return `translate(${OKINAWA_PORTRAIT_OFFSET.x}, ${OKINAWA_PORTRAIT_OFFSET.y})`;
    }
    return `translate(${MAIN_PORTRAIT_OFFSET.x}, ${MAIN_PORTRAIT_OFFSET.y})`;
  };

  useEffect(() => {
    if (selectedPrefecture && !prevPrefRef.current && typeof window !== "undefined") {
      if (window.innerWidth < 768 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.top < 30 || rect.top > 160) {
          containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
    prevPrefRef.current = selectedPrefecture;
  }, [selectedPrefecture]);

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

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modalZoom, setModalZoom] = useState(1);
  const [modalPan, setModalPan] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef(null);
  const touchDistRef = useRef(null);

  useEffect(() => {
    if (!isFullscreen) {
      setModalZoom(1);
      setModalPan({ x: 0, y: 0 });
    }
  }, [isFullscreen]);

  useEffect(() => {
    setModalZoom(1);
    setModalPan({ x: 0, y: 0 });
  }, [selectedPrefecture]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX - modalPan.x,
        y: e.touches[0].clientY - modalPan.y,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && touchStartRef.current && modalZoom > 1) {
      const newX = e.touches[0].clientX - touchStartRef.current.x;
      const newY = e.touches[0].clientY - touchStartRef.current.y;
      const maxPan = 180 * (modalZoom - 1);
      setModalPan({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    } else if (e.touches.length === 2 && touchDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / touchDistRef.current;
      if (Math.abs(factor - 1) > 0.05) {
        setModalZoom((prev) => Math.min(3.5, Math.max(1, Number((prev * factor).toFixed(2)))));
        touchDistRef.current = dist;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    touchDistRef.current = null;
  };


  useEffect(() => {
    if (isFullscreen && typeof document !== "undefined") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isFullscreen]);

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

  const journeyStops = journey?.stops || EMPTY_LIST;
  const journeyTransitions = journey?.transitions || EMPTY_LIST;
  const playback = useJourneyPlayback(journeyTransitions);
  const { frame } = playback;
  const [finaleOverview, setFinaleOverview] = useState(false);

  useEffect(() => {
    if (!frame.isComplete) {
      setFinaleOverview(false);
      return;
    }
    // Pause on final stop stub for 1.8 seconds, then pull out to full national overview
    const timer = setTimeout(() => {
      setFinaleOverview(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [frame.isComplete]);

  const arrivedStopIndex = Math.min(frame.arrivedStopIndex ?? frame.completedLegs, Math.max(0, journeyStops.length - 1));
  const currentStop = journeyStops[arrivedStopIndex] || null;
  const currentStopPoint = currentStop?.svgPoint
    ? projectPointToLayout(currentStop.svgPoint, activeLayout)
    : null;
  const activeLeg = frame.currentLeg;
  const activeLegFrom = activeLeg?.fromSvg
    ? projectPointToLayout(activeLeg.fromSvg, activeLayout)
    : null;
  const activeLegTo = activeLeg?.toSvg
    ? projectPointToLayout(activeLeg.toSvg, activeLayout)
    : null;
  const activeLegPath =
    activeLeg && activeLeg.transitMode !== "stay" && activeLegFrom && activeLegTo
      ? buildTransitPath(activeLegFrom, activeLegTo, activeLeg.transitMode)
      : "";
  const vehiclePoint =
    activeLeg && activeLeg.transitMode !== "stay" && activeLegFrom && activeLegTo
      ? pointOnTransit(activeLegFrom, activeLegTo, activeLeg.transitMode, frame.legT)
      : null;
  const vehicleAngle = useMemo(() => {
    if (!activeLeg || activeLeg.transitMode === "stay" || !activeLegFrom || !activeLegTo) return 0;
    return tangentAngleOnTransit(activeLegFrom, activeLegTo, activeLeg.transitMode, frame.legT);
  }, [activeLeg, activeLegFrom, activeLegTo, frame.legT]);

  const [lastHeading, setLastHeading] = useState(0);
  useEffect(() => {
    if (activeLeg && activeLeg.transitMode !== "stay" && activeLegFrom && activeLegTo) {
      const a = tangentAngleOnTransit(activeLegFrom, activeLegTo, activeLeg.transitMode, frame.legT);
      setLastHeading(a);
    }
  }, [activeLeg, activeLegFrom, activeLegTo, frame.legT]);

  const effectiveHeading = activeLeg && activeLeg.transitMode !== "stay" ? vehicleAngle : lastHeading;

  const cameraFocusPoint = useMemo(() => {
    if (vehiclePoint) {
      // For cross-sea flights between main islands and insets, stay focused on departure zone
      // until mid-flight (legT >= 0.5), preventing premature camera jumping before take-off completes.
      const fromZone = activeLeg?.fromSvg?.zone || "main";
      const toZone = activeLeg?.toSvg?.zone || "main";
      const zone = fromZone === toZone ? fromZone : (frame.legT >= 0.5 ? toZone : fromZone);
      return { x: vehiclePoint.x, y: vehiclePoint.y, zone };
    }
    if (currentStopPoint) {
      return currentStopPoint;
    }
    return null;
  }, [vehiclePoint, activeLeg, currentStopPoint, frame.legT]);

  const currentViewBox = useMemo(() => {
    if (mode === "venues") {
      return getZoomViewBox(selectedPrefecture, activeLayout);
    }
    return computeFollowCamViewBox(cameraFocusPoint, {
      cameraMode: playback.cameraMode,
      isComplete: finaleOverview,
      layout: activeLayout,
    });
  }, [mode, selectedPrefecture, activeLayout, cameraFocusPoint, playback.cameraMode, finaleOverview]);

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

  // Zoom-aware scale: pins, labels and spiderfy radius shrink as the viewBox zooms in
  const pinScale = 1 / Math.max(1, getZoomScaleFactor(currentViewBox));

  const spiderfiedFocusedVenues = useMemo(
    () => computeSpiderfyOffsets(focusedVenuesRaw, { radiusPx: Number((9 * pinScale).toFixed(2)) }),
    [focusedVenuesRaw, pinScale]
  );

  // Target resolution for venue mode HUD card (ADR-0124)
  // Macro Overview (selectedPrefecture is null): Strictly prefecture-level.
  //   - Hovering a prefecture/callout: shows that prefecture.
  //   - Idle (not hovering): shows national overview.
  // Spotlight Zoom (selectedPrefecture is set): Micro venue-level.
  //   - Hovering a venue pin / drilldown list item: shows that specific venue.
  //   - Idle: shows current prefecture summary.
  const activeVenueCanonical = selectedPrefecture ? hoveredVenue : null;
  const activePrefecture = selectedPrefecture || hoveredPref;

  const venueHudData = useMemo(() => {
    if (mode !== "venues") return null;

    if (activeVenueCanonical) {
      const shows = globalVenueShows[activeVenueCanonical] || [];
      const profile = (allVenues || []).find(
        (v) => (v.name || v.canonical) === activeVenueCanonical
      );
      const pref = profile?.prefecture || "";
      const city = profile?.city || "";
      const isSanin =
        pref === "島根縣" || pref === "鳥取縣" || activeVenueCanonical.includes("松江");
      const isHub = shows.length >= 16;

      return {
        type: "venue",
        title: localizeVenue(activeVenueCanonical),
        badgeText: isSanin
          ? `🌱 ${t("venueMap.saninBadge")}`
          : isHub
          ? `🔥 ${shows.length} ${t("navigators.showsUnit")}`
          : `🏛️ ${shows.length} ${t("navigators.showsUnit")}`,
        badgeStyle: isSanin
          ? "bg-band text-band-ink"
          : isHub
          ? "bg-request text-request-ink"
          : "bg-band text-band-ink",
        subText: `${city ? `${t(`cities.${city}`, city)} · ` : ""}${t(`prefectures.${pref}`, pref)}`,
        actionText: t("venueMap.venueHudAction"),
        showCount: shows.length,
        onClick: () => onSelectVenue && onSelectVenue(activeVenueCanonical),
      };
    }

    if (activePrefecture) {
      const isOverseas = activePrefecture === OVERSEAS_TARGET_KEY || activePrefecture === "overseas";
      const prefStat = mapStats.byPrefecture[activePrefecture];
      const isSanin = prefStat?.isSaninSanctuary;
      const showsCount = isOverseas
        ? OVERSEAS_COUNTRIES.reduce((acc, c) => acc + (mapStats.byPrefecture[c]?.showCount || 0), 0)
        : prefStat?.showCount || 0;
      const venuesCount = isOverseas
        ? OVERSEAS_COUNTRIES.reduce((acc, c) => acc + (mapStats.byPrefecture[c]?.venueCount || 0), 0)
        : prefStat?.venueCount || 0;
      const isUnvisited = showsCount === 0;

      const prefName = isOverseas
        ? t("venueMap.overseasBadge", null, { count: mapStats.overseasCountryCount })
        : t(`prefectures.${activePrefecture}`, activePrefecture);

      const isClickable = !isUnvisited && !selectedPrefecture;

      return {
        type: "prefecture",
        title: prefName,
        badgeText: isSanin
          ? `🌱 ${t("venueMap.saninBadge")}`
          : isUnvisited
          ? t("venueMap.tierUnvisited")
          : t("venueMap.venueHudPrefBadge", null, {
              venues: venuesCount,
              shows: showsCount,
            }),
        badgeStyle: isSanin
          ? "bg-band text-band-ink"
          : isUnvisited
          ? "bg-card text-muted border border-ink/30"
          : "bg-band text-band-ink",
        subText: isUnvisited
          ? t("venueMap.unvisitedNotice", null, { pref: prefName })
          : selectedPrefecture === activePrefecture
          ? t("venueMap.venuesMapZoomedHint")
          : t("venueMap.venuesMapExploreHint"),
        actionText: isClickable ? t("venueMap.venueHudZoomAction") : null,
        showCount: isUnvisited ? null : showsCount,
        onClick: isClickable
          ? () => {
              if (onSelectPrefecture) onSelectPrefecture(activePrefecture);
            }
          : null,
      };
    }

    // Default National Overview State
    return {
      type: "overview",
      title: t("venueMap.venuesMapOverviewTitle"),
      badgeText: `🇯🇵 ${mapStats.visitedJapanPrefectureCount}/${mapStats.totalJapanPrefectures} (${mapStats.completionPercent}%)`,
      badgeStyle: "bg-band text-band-ink",
      subText: t("venueMap.overseasBadge", null, { count: mapStats.overseasCountryCount }),
      actionText: t("venueMap.venuesMapExploreHint"),
      showCount: null,
      onClick: null,
    };
  }, [
    mode,
    activeVenueCanonical,
    activePrefecture,
    globalVenueShows,
    allVenues,
    mapStats,
    selectedPrefecture,
    onSelectVenue,
    onSelectPrefecture,
    localizeVenue,
    t,
  ]);

  const isMoving = Boolean(activeLeg && activeLeg.transitMode !== "stay");
  const destStop = activeLeg && activeLeg.toIndex != null ? journeyStops[activeLeg.toIndex] : null;
  const hudStop = isMoving && destStop ? destStop : currentStop;

  // Completed legs only change when the cursor crosses a stop boundary, so memoise their
  // elements: hundreds of SVG nodes must not be reconciled on every animation frame.
  // Comet Trail 3-tier hierarchy (ADR-0124, DESIGN.md §6):
  // - Active head: full opacity + vehicle marker + pulse wave
  // - Recent tail (last 4 legs): semi-transparent glow (opacity 0.55, width 1.8)
  // - Historic footprint: subtle glow (opacity 0.18, width 1.0)
  const footprintLegs = useMemo(
    () =>
      journeyTransitions.slice(0, frame.completedLegs).map((tr) => {
        const isRecentTail = tr.index >= frame.completedLegs - 4;
        const tier = isRecentTail ? "tail" : "historic";
        const opacity = isRecentTail ? "0.55" : "0.18";
        const fromPt = tr.fromSvg ? projectPointToLayout(tr.fromSvg, activeLayout) : null;
        const toPt = tr.toSvg ? projectPointToLayout(tr.toSvg, activeLayout) : null;
        if (tr.transitMode === "stay") {
          if (!fromPt) return null;
          return (
            <circle
              key={`footprint-stay-${tr.index}`}
              data-leg-state="footprint"
              data-leg-tier={tier}
              data-leg-mode="stay"
              cx={fromPt.x}
              cy={fromPt.y}
              r={isRecentTail ? "5.5" : "4"}
              fill="none"
              stroke="var(--color-band)"
              strokeWidth={isRecentTail ? "1.5" : "0.9"}
              opacity={opacity}
              vectorEffect="non-scaling-stroke"
            />
          );
        }
        if (!fromPt || !toPt) return null;
        const d = buildTransitPath(fromPt, toPt, tr.transitMode);
        if (!d) return null;
        return (
          <path
            key={`footprint-${tr.index}`}
            data-leg-state="footprint"
            data-leg-tier={tier}
            data-leg-mode={tr.transitMode}
            d={d}
            fill="none"
            stroke={tr.transitMode === "flight" ? "var(--color-request)" : "var(--color-solo)"}
            strokeWidth={isRecentTail ? "1.8" : "1.0"}
            strokeDasharray={tr.transitMode === "flight" ? "4 3" : undefined}
            strokeLinecap="round"
            opacity={opacity}
            vectorEffect="non-scaling-stroke"
          />
        );
      }),
    [journeyTransitions, frame.completedLegs, activeLayout]
  );

  const footprintStops = useMemo(
    () =>
      journeyStops.slice(0, frame.completedLegs).map((stop) => {
        if (!stop.svgPoint) return null;
        const stopPt = projectPointToLayout(stop.svgPoint, activeLayout);
        const isRecentTail = stop.index >= frame.completedLegs - 4;
        const tier = isRecentTail ? "tail" : "historic";
        const opacity = isRecentTail ? "0.75" : "0.25";
        return (
          <circle
            key={`arrived-${stop.showId}-${stop.index}`}
            data-stop-state="footprint"
            data-stop-tier={tier}
            cx={stopPt.x}
            cy={stopPt.y}
            r={isRecentTail ? "3.2" : "2.2"}
            fill="var(--color-card)"
            stroke="var(--color-ink)"
            strokeWidth={isRecentTail ? "1.0" : "0.7"}
            opacity={opacity}
            vectorEffect="non-scaling-stroke"
          />
        );
      }),
    [journeyStops, frame.completedLegs, activeLayout]
  );

  const handleKeyActivate = (e, callback) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  const renderMapSvg = (inModal = false) => (
    <svg
                viewBox={currentViewBox}
                width="100%"
                height="auto"
                role="region"
                aria-label={t("venueMap.regionAria")}
                className={`block w-full select-none transition-all duration-300 motion-reduce:transition-none ${
        inModal
          ? "h-full w-full object-contain"
          : mode === "venues" && selectedPrefecture
          ? "h-[280px] sm:h-[300px] md:h-full md:max-h-[440px] object-contain"
          : mode === "journey"
          ? isPortrait
            ? "h-[520px] sm:h-[600px] md:h-[640px] w-full object-contain"
            : "h-[420px] sm:h-[520px] md:h-[640px] w-full object-contain"
          : "h-auto"
      }`}
              >
          <g
            data-testid="map-world-layer"
            transform={inModal && (modalZoom !== 1 || modalPan.x !== 0 || modalPan.y !== 0)
              ? `translate(${modalPan.x}, ${modalPan.y}) scale(${modalZoom})`
              : undefined}
            style={inModal ? { transformOrigin: isPortrait ? "270px 465px" : "400px 280px" } : undefined}
          >
            {/* 0. Ocean Graticule (macro overview, landscape only) */}
          {(mode !== "venues" || !selectedPrefecture) && !isPortrait ? (
            <g data-testid="ocean-graticule-layer" pointerEvents="none" opacity="0.5">
              {MAP_GRATICULE_PATHS.map((gr) => (
                <g key={gr.id}>
                  <path
                    d={gr.d}
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeWidth="0.6"
                    strokeDasharray="2 4"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={gr.lx}
                    y={gr.ly}
                    textAnchor={gr.id.startsWith("lat") ? "end" : "start"}
                    fontFamily="var(--font-mono)"
                    fontSize="7"
                    fill="var(--color-ink)"
                  >
                    {gr.label}
                  </text>
                </g>
              ))}
            </g>
          ) : null}

          {/* 1. Top-Left Perforated Ticket Stub Inset: Overseas Asia */}
          {(() => {
            const ovBounds = isPortrait ? PORTRAIT_OVERSEAS_INSET_BOUNDS : OVERSEAS_INSET_BOUNDS;
            return (
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
                  x={ovBounds.x}
                  y={ovBounds.y}
                  width={ovBounds.width}
                  height={ovBounds.height}
                  rx="3"
                  fill="var(--color-card)"
                  stroke="var(--color-ink)"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x={ovBounds.x + 10}
                  y={ovBounds.y + 18}
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fontWeight="bold"
                  fill="var(--color-ink)"
                >
                  {t("venueMap.overseasInsetTitle")}
                </text>
                <text
                  x={ovBounds.x + 10}
                  y={ovBounds.y + 32}
                  fontSize="9.5"
                  fontWeight="bold"
                  fill="var(--color-muted)"
                >
                  {t("venueMap.overseasInsetSub")}
                </text>
              </g>
            );
          })()}

          {/* 1.5 Triptych Divider 1: Overseas -> Japan Mainland (Portrait only) */}
          {isPortrait && (!selectedPrefecture || inModal) && (
            <g data-testid="triptych-divider-overseas" pointerEvents="none">
              <line
                x1="16"
                y1="245"
                x2="524"
                y2="245"
                stroke="var(--color-ink)"
                strokeWidth="1.2"
                strokeDasharray="6 4"
                opacity="0.45"
              />
              <rect
                x="140"
                y="235"
                width="260"
                height="20"
                rx="2"
                fill="var(--color-card)"
                stroke="var(--color-ink)"
                strokeWidth="0.8"
              />
              <text
                x="270"
                y="249"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="9"
                fontWeight="bold"
                fill="var(--color-ink)"
                letterSpacing="0.08em"
              >
                ✂ ── {t("venueMap.japanMainlandTitle")} ── ✂
              </text>
            </g>
          )}

          {/* 2. Bottom-Right Perforated Ticket Stub Inset: Okinawa */}
          {(() => {
            const okBounds = isPortrait ? PORTRAIT_OKINAWA_INSET_BOUNDS : OKINAWA_INSET_BOUNDS;
            return (
              <g data-testid="okinawa-inset">
                <rect
                  x={okBounds.x}
                  y={okBounds.y}
                  width={okBounds.width}
                  height={okBounds.height}
                  rx="3"
                  fill="var(--color-card)"
                  stroke="var(--color-ink)"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x={okBounds.x + 10}
                  y={okBounds.y + 18}
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fontWeight="bold"
                  fill="var(--color-ink)"
                >
                  {t("venueMap.okinawaInsetTitle")}
                </text>
              </g>
            );
          })()}

          {/* 2.2 Triptych Divider 2: Japan Mainland -> Okinawa (Portrait only) */}
          {isPortrait && (!selectedPrefecture || inModal) && (
            <g data-testid="triptych-divider-okinawa" pointerEvents="none">
              <line
                x1="16"
                y1="835"
                x2="524"
                y2="835"
                stroke="var(--color-ink)"
                strokeWidth="1.2"
                strokeDasharray="6 4"
                opacity="0.45"
              />
              <rect
                x="160"
                y="825"
                width="220"
                height="20"
                rx="2"
                fill="var(--color-card)"
                stroke="var(--color-ink)"
                strokeWidth="0.8"
              />
              <text
                x="270"
                y="839"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="9"
                fontWeight="bold"
                fill="var(--color-ink)"
                letterSpacing="0.08em"
              >
                ✂ ── {t("venueMap.okinawaInsetTitle")} ── ✂
              </text>
            </g>
          )}

          {/* 2.5 Land Offset Micro-Shadow (DESIGN.md §5) */}
          <g data-testid="land-shadow-layer" pointerEvents="none" opacity="0.12" transform="translate(1.2, 1.4)">
            {PREFECTURE_PATHS.map((geo) => (
              <path
                key={`shadow-${geo.prefecture}`}
                d={geo.path}
                fill="var(--color-ink)"
                transform={isPortrait ? getZoneTransform(geo.zone) : undefined}
              />
            ))}
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
              const isDimmed =
                Boolean(selectedPrefecture) && !isSelected && mode === "venues";

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
                  transform={isPortrait ? getZoneTransform(geo.zone) : undefined}
                  onClick={() => {
                    if (stat.tier !== "unvisited" && onSelectPrefecture) {
                      onSelectPrefecture(geo.prefecture);
                    }
                  }}
                  onKeyDown={(e) =>
                    handleKeyActivate(e, () => {
                      if (stat.tier !== "unvisited" && onSelectPrefecture) {
                        onSelectPrefecture(geo.prefecture);
                      }
                    })
                  }
                  className={stat.tier === "unvisited" ? "cursor-default focus:outline-none" : "cursor-pointer focus:outline-none"}
                  opacity={isDimmed ? 0.28 : 1}
                  data-dimmed={isDimmed ? "true" : undefined}
                  onMouseEnter={() => setHoveredPref(geo.prefecture)}
                  onMouseLeave={() => setHoveredPref(null)}
                  onFocus={() => setHoveredPref(geo.prefecture)}
                  onBlur={() => setHoveredPref(null)}
                >
                  <path
                    d={geo.path}
                    fill={fillToken}
                    stroke={strokeToken}
                    strokeWidth={isSelected ? "2" : stat.tier === "unvisited" ? "0.9" : "1"}
                    strokeDasharray={stat.tier === "unvisited" ? "3 2" : undefined}
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </g>

          {/* 3b-2. Inset Side Labels (beside islands, never on top of them) */}
          <g data-testid="map-inset-labels" pointerEvents="none">
            {PREFECTURE_PATHS.filter((g) => g.zone !== "main").map((geo) => {
              const st = mapStats.byPrefecture[geo.prefecture];
              if (!st || st.showCount <= 0) return null;
              if (selectedPrefecture && selectedPrefecture !== geo.prefecture && selectedPrefecture !== OVERSEAS_TARGET_KEY) {
                return null;
              }
              const lx = geo.zone === "okinawa" ? geo.cx + 18 : geo.cx + 20;
              return (
                <g
                  key={`inset-label-${geo.prefecture}`}
                  transform={isPortrait ? getZoneTransform(geo.zone) : undefined}
                >
                  <text
                    x={lx}
                    y={geo.cy + 3}
                    fontFamily="var(--font-mono)"
                    fontSize="8.5"
                    fontWeight="bold"
                    fill="var(--color-ink)"
                  >
                    {t(`prefectures.${geo.prefecture}`, geo.prefecture)} {st.showCount}
                  </text>
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

                const pt = projectPointToLayout(v.svgPoint, activeLayout);
                return (
                  <g key={v.canonical}>
                    {v.isSpiderfied && (
                      <line
                        x1={pt.anchorX}
                        y1={pt.anchorY}
                        x2={pt.x}
                        y2={pt.y}
                        stroke="var(--color-ink)"
                        strokeWidth="0.9"
                        strokeDasharray="1.5 1.5"
                      />
                    )}
                    <g
                      transform={`translate(${pt.x}, ${pt.y})`}
                      data-testid="venue-map-pin"
                      data-venue={v.canonical}
                      role="button"
                      tabIndex={0}
                      aria-label={pinAria}
                      onMouseEnter={() => setHoveredVenue(v.canonical)}
                      onMouseLeave={() => setHoveredVenue(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHoveredVenue(v.canonical);
                        if (onSelectVenue) onSelectVenue(v.canonical);
                        if (inModal) setIsFullscreen(false);
                      }}
                      onKeyDown={(e) => {
                        handleKeyActivate(e, () => {
                          if (onSelectVenue) onSelectVenue(v.canonical);
                          if (inModal) setIsFullscreen(false);
                        });
                      }}
                      className="cursor-pointer focus:outline-none"
                    >
                      {/* Invisible Touch Shield: expands hit target to >= 32px on touchscreens */}
                      <circle
                        cx="0"
                        cy="0"
                        r={Math.max(16 * pinScale, 14)}
                        fill="transparent"
                        pointerEvents="all"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r={(isHighlighted ? 6.5 : 4.8) * pinScale}
                        fill={isHighlighted ? "var(--color-request)" : "var(--color-band)"}
                        stroke="var(--color-ink)"
                        strokeWidth="1.2"
                        vectorEffect="non-scaling-stroke"
                      />
                      <text
                        x="0"
                        y={2.5 * pinScale}
                        textAnchor="middle"
                        fontFamily="var(--font-mono)"
                        fontSize={6.5 * pinScale}
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

          {/* 5. Career / Tour Journey Route Layer — sequential playback (ADR-0124, DESIGN.md §5) */}
          {mode === "journey" && journey && (
            <g data-testid="journey-route-layer">
              {/* 5a. Footprint: legs already travelled remain as low-opacity traces */}
              <g data-testid="journey-footprint-layer">{footprintLegs}</g>
              <g data-testid="journey-footprint-stops">{footprintStops}</g>

              {/* 5b. Current leg: drawn on demand, with a vehicle moving along it */}
              {activeLeg && activeLeg.transitMode === "stay" && activeLegFrom && (
                <g
                  data-leg-state="active-stay"
                  data-leg-mode="stay"
                  transform={`translate(${activeLegFrom.x}, ${activeLegFrom.y})`}
                  pointerEvents="none"
                >
                  {playback.isPlaying && (
                    <>
                      <circle r="16" fill="var(--color-band)" opacity="0.35" className="animate-ping" />
                      <circle r="10" fill="none" stroke="var(--color-band)" strokeWidth="1.8" opacity="0.7" className="animate-pulse" />
                    </>
                  )}
                  <circle
                    r="5"
                    fill="none"
                    stroke="var(--color-band)"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}

              {activeLeg && activeLeg.transitMode !== "stay" && activeLegPath && (
                <path
                  data-leg-state="active"
                  data-leg-mode={activeLeg.transitMode}
                  d={activeLegPath}
                  fill="none"
                  stroke={activeLeg.transitMode === "flight" ? "var(--color-request)" : "var(--color-solo)"}
                  strokeWidth="2.4"
                  strokeDasharray="100"
                  strokeDashoffset={100 - frame.legT * 100}
                  pathLength="100"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {activeLeg && vehiclePoint && frame.legT >= 0 && (
                <g
                  data-testid="journey-vehicle-marker"
                  data-leg-mode={activeLeg.transitMode}
                  transform={`translate(${vehiclePoint.x}, ${vehiclePoint.y})`}
                  pointerEvents="none"
                >
                  {activeLeg.transitMode === "flight" ? (
                    <TourAirplane3D
                      angle={effectiveHeading}
                      scale={playback.cameraMode === "overview" || finaleOverview ? 1.4 : 0.72}
                    />
                  ) : (
                    <TourVan3D
                      angle={effectiveHeading}
                      scale={playback.cameraMode === "overview" || finaleOverview ? 1.35 : 0.7}
                    />
                  )}
                </g>
              )}

              {/* 5c. Arrival: stop marker plus a ticket stub with that stop's date & venue */}
              {currentStopPoint && (
                <g
                  data-testid="journey-current-stop"
                  data-stop-number={currentStop.stopNumber}
                  transform={`translate(${currentStopPoint.x}, ${currentStopPoint.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${currentStop.date} ${localizeVenue(currentStop.venue)}`}
                  onClick={() => {
                    if (onSelectShow) onSelectShow(currentStop.showId);
                    if (inModal) setIsFullscreen(false);
                  }}
                  onKeyDown={(e) =>
                    handleKeyActivate(e, () => {
                      if (onSelectShow) onSelectShow(currentStop.showId);
                      if (inModal) setIsFullscreen(false);
                    })
                  }
                  className="cursor-pointer"
                >
                  {/* Golden Pulse Wave on arrival */}
                  {playback.isPlaying && (
                    <circle
                      r="14"
                      fill="var(--color-band)"
                      opacity="0.35"
                      className="animate-ping"
                      pointerEvents="none"
                    />
                  )}
                  <circle
                    r="6.5"
                    fill={currentStop.isFinal ? "var(--color-request)" : "var(--color-band)"}
                    stroke="var(--color-ink)"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    y="2.6"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize={String(currentStop.stopNumber).length > 2 ? 5.6 : 7}
                    fontWeight="bold"
                    fill={currentStop.isFinal ? "var(--color-card)" : "var(--color-band-ink)"}
                    aria-hidden="true"
                  >
                    {currentStop.isFirst ? "S" : currentStop.isFinal ? "F" : currentStop.stopNumber}
                  </text>
                </g>
              )}
            </g>
          )}
          </g>
        </svg>
  );

  return (
    <div
      ref={containerRef}
      className="space-y-3 scroll-mt-14"
      data-testid="venue-map-container"
    >
      {/* Top Status & Legend Bar (Venues mode only) */}
      {mode === "venues" && (
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
        </div>
      )}

      {/* 2. Main Map & Drilldown Region (Single-column when macro overview/journey; Dual-column side-by-side on md: when prefecture zoomed) */}
      <div
        className={
          mode === "venues" && selectedPrefecture
            ? "grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-stretch"
            : "space-y-3"
        }
      >
        <div className={mode === "venues" && selectedPrefecture ? "md:col-span-5 flex flex-col" : ""}>
          <div className="rounded-[3px] border-[1.5px] border-ink bg-paper shadow-xs overflow-hidden flex flex-col flex-1">
            <div className="relative flex items-center justify-center overflow-hidden flex-1">
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
                {mode === "venues" && selectedPrefecture && (
                  <button
                    type="button"
                    data-testid="map-reset-zoom-btn"
                    onClick={() => onSelectPrefecture && onSelectPrefecture(null)}
                    aria-label={t("venueMap.backToNationalAria")}
                    className="rounded-[3px] border-[1.5px] border-ink bg-band px-2.5 py-1 font-mono text-[11px] font-extrabold text-band-ink shadow-xs hover:bg-card cursor-pointer transition-colors motion-reduce:transition-none"
                  >
                    {t("venueMap.backToNational")}
                  </button>
                )}
                <button
                  type="button"
                  data-testid="map-fullscreen-btn"
                  onClick={() => setIsFullscreen(true)}
                  aria-label={t("venueMap.fullscreenAria")}
                  className="rounded-[3px] border-[1.5px] border-ink bg-card px-2.5 py-1 font-mono text-[11px] font-extrabold text-ink shadow-xs hover:bg-band hover:text-band-ink cursor-pointer transition-colors motion-reduce:transition-none"
                >
                  {t("venueMap.fullscreen")}
                </button>
              </div>

              {/* Desktop-only floating HUD card inside map (when not zoomed into a prefecture) */}
              {mode === "venues" && venueHudData && !selectedPrefecture && (
                <div
                  data-testid="venue-hud-card"
                  className={`hidden md:block absolute bottom-2.5 left-2.5 z-10 max-w-[280px] rounded-[3px] border-[1.5px] border-ink bg-card p-2 sm:p-2.5 shadow-sm select-none transition-colors ${
                    venueHudData.onClick
                      ? "hover:border-band cursor-pointer focus:outline-none focus:ring-2 focus:ring-band"
                      : "cursor-default"
                  }`}
                  role={venueHudData.onClick ? "button" : undefined}
                  tabIndex={venueHudData.onClick ? 0 : undefined}
                  onClick={venueHudData.onClick || undefined}
                  onKeyDown={(e) => {
                    if (venueHudData.onClick) {
                      handleKeyActivate(e, venueHudData.onClick);
                    }
                  }}
                >
                  {/* Header: Dynamic Status Badge */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold uppercase tracking-wider ${venueHudData.badgeStyle}`}
                    >
                      {venueHudData.badgeText}
                    </span>
                    {venueHudData.showCount != null && (
                      <span className="font-mono text-[11px] font-extrabold text-muted tabular-nums">
                        {venueHudData.showCount} {t("navigators.showsUnit")}
                      </span>
                    )}
                  </div>

                  {/* Title: Adaptive Full Text, No Truncation, Multi-line Natural Wrapping */}
                  <div className="font-bold text-[12px] sm:text-[13px] leading-tight text-ink break-words my-1">
                    {venueHudData.title}
                  </div>

                  {/* Subtext + Action Link */}
                  <div className="flex items-center justify-between gap-1 mt-1 text-[10px] sm:text-[11px] text-muted font-mono border-t border-dashed border-ink/20 pt-1">
                    <span className="truncate">
                      {venueHudData.subText}
                    </span>
                    {venueHudData.actionText && (
                      <span className="text-[10px] font-bold text-band-ink shrink-0">
                        {venueHudData.actionText}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom-Left Fixed Ticket HUD (Journey mode: desktop floating HUD; mobile docks below map frame) */}
              {mode === "journey" && hudStop && (
                <div
                  data-testid="journey-hud-card"
                  className="hidden md:block absolute bottom-2.5 left-2.5 z-10 max-w-[280px] rounded-[3px] border-[1.5px] border-ink bg-card p-2 sm:p-2.5 shadow-sm select-none hover:border-band cursor-pointer focus:outline-none focus:ring-2 focus:ring-band transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectShow && onSelectShow(hudStop.showId)}
                  onKeyDown={(e) => handleKeyActivate(e, () => onSelectShow && onSelectShow(hudStop.showId))}
                  aria-label={t("venueMap.hudViewShowAria", null, {
                    date: hudStop.date,
                    venue: localizeVenue(hudStop.venue),
                  })}
                >
                  {/* Header: Dynamic Status Badge + Show Date */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold uppercase tracking-wider ${
                        isMoving
                          ? "bg-solo text-solo-ink"
                          : hudStop.isFinal
                          ? "bg-request text-request-ink"
                          : "bg-band text-band-ink"
                      }`}
                    >
                      {isMoving && <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />}
                      {isMoving
                        ? `${activeLeg?.transitMode === "flight" ? "✈️ " : "🚐 "}${t("venueMap.hudNextStop", null, { n: hudStop.stopNumber })}`
                        : hudStop.isFinal
                        ? `🏁 ${t("venueMap.hudFinale")}`
                        : hudStop.isFirst
                        ? `🎸 ${t("venueMap.hudStart")}`
                        : activeLeg?.transitMode === "stay"
                        ? `🏕️ ${t("venueMap.hudStay")}`
                        : `📍 ${t("venueMap.hudArrivedStop", null, { n: hudStop.stopNumber })}`}
                    </span>
                    <span className="font-mono text-[11px] font-extrabold text-muted">
                      {hudStop.date}
                    </span>
                  </div>

                  {/* Venue Name: Adaptive Full Text, No Truncation, Multi-line Natural Wrapping */}
                  <div className="font-bold text-[12px] sm:text-[13px] leading-tight text-ink break-words my-1">
                    {localizeVenue(hudStop.venue)}
                  </div>

                  {/* City & Prefecture + Click Setlist Link */}
                  <div className="flex items-center justify-between gap-1 mt-1 text-[10px] sm:text-[11px] text-muted font-mono border-t border-dashed border-ink/20 pt-1">
                    <span className="truncate">
                      {hudStop.city ? `${t(`cities.${hudStop.city}`, hudStop.city)} · ` : ""}
                      {t(`prefectures.${hudStop.prefecture}`, hudStop.prefecture)}
                    </span>
                    <span className="text-[10px] font-bold text-band-ink shrink-0">
                      SETLIST ➔
                    </span>
                  </div>
                </div>
              )}

              {renderMapSvg(false)}
            </div>

            {/* Mobile Docked Status Ribbon (md:hidden, docked below map frame, 100% unobscured canvas) */}
            {mode === "venues" && venueHudData && (
              <div
                data-testid="venue-hud-card"
                className={`md:hidden border-t border-ink/20 bg-card px-3 py-2 flex items-center justify-between gap-2 select-none ${
                  venueHudData.onClick ? "cursor-pointer active:bg-tape-tint/50" : ""
                }`}
                role={venueHudData.onClick ? "button" : undefined}
                tabIndex={venueHudData.onClick ? 0 : undefined}
                onClick={venueHudData.onClick || undefined}
                onKeyDown={(e) => {
                  if (venueHudData.onClick) {
                    handleKeyActivate(e, venueHudData.onClick);
                  }
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold uppercase tracking-wider ${venueHudData.badgeStyle}`}
                  >
                    {venueHudData.badgeText}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-[12px] leading-tight text-ink">
                      {venueHudData.title}
                    </div>
                    <div className="truncate text-[10px] text-muted font-mono">
                      {venueHudData.subText}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {venueHudData.showCount != null && (
                    <span className="font-mono text-[11px] font-extrabold text-muted tabular-nums">
                      {venueHudData.showCount} {t("navigators.showsUnit")}
                    </span>
                  )}
                  {venueHudData.actionText && (
                    <span className="rounded-[2px] bg-band px-1.5 py-0.5 font-mono text-[10px] font-bold text-band-ink">
                      {venueHudData.actionText}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Docked Journey HUD Ribbon (md:hidden, docked below map frame, 100% unobscured canvas) */}
        {mode === "journey" && hudStop && (
          <div
            data-testid="journey-hud-card"
            className="md:hidden border-[1.5px] border-ink bg-card px-3 py-2 rounded-[3px] shadow-2xs flex items-center justify-between gap-2 select-none cursor-pointer active:bg-tape-tint/50"
            role="button"
            tabIndex={0}
            onClick={() => onSelectShow && onSelectShow(hudStop.showId)}
            onKeyDown={(e) => handleKeyActivate(e, () => onSelectShow && onSelectShow(hudStop.showId))}
            aria-label={t("venueMap.hudViewShowAria", null, {
              date: hudStop.date,
              venue: localizeVenue(hudStop.venue),
            })}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isMoving
                    ? "bg-solo text-solo-ink"
                    : hudStop.isFinal
                    ? "bg-request text-request-ink"
                    : "bg-band text-band-ink"
                }`}
              >
                {isMoving && <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />}
                {isMoving
                  ? `${activeLeg?.transitMode === "flight" ? "✈️ " : "🚐 "}${t("venueMap.hudNextStop", null, { n: hudStop.stopNumber })}`
                  : hudStop.isFinal
                  ? `🏁 ${t("venueMap.hudFinale")}`
                  : hudStop.isFirst
                  ? `🎸 ${t("venueMap.hudStart")}`
                  : activeLeg?.transitMode === "stay"
                  ? `🏕️ ${t("venueMap.hudStay")}`
                  : `📍 ${t("venueMap.hudArrivedStop", null, { n: hudStop.stopNumber })}`}
              </span>
              <div className="min-w-0">
                <div className="truncate font-bold text-[12px] leading-tight text-ink">
                  {localizeVenue(hudStop.venue)}
                </div>
                <div className="truncate text-[10px] text-muted font-mono">
                  {hudStop.city ? `${t(`cities.${hudStop.city}`, hudStop.city)} · ` : ""}
                  {t(`prefectures.${hudStop.prefecture}`, hudStop.prefecture)}
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-extrabold text-muted">
                {hudStop.date}
              </span>
              <span className="rounded-[2px] bg-band px-1.5 py-0.5 font-mono text-[10px] font-bold text-band-ink">
                SETLIST ➔
              </span>
            </div>
          </div>
        )}

        {/* Journey Playback Transport: docked directly underneath the map card */}
        {mode === "journey" && journey && (
          <div data-testid="journey-playback-dock" className="shrink-0">
            <JourneyPlaybackControls playback={playback} stops={journeyStops} />
          </div>
        )}

        {/* Hint bar when in macro view */}
        {mode === "venues" && !selectedPrefecture && (
          <p className="m-0 font-mono text-[11px] text-muted">
            {t("venueMap.clickHint")}
          </p>
        )}

        {/* Drilled-Down Prefecture City Pills & Synchronized Venue Cards List */}
        {mode === "venues" && selectedPrefecture && (
          <div
            className="flex md:col-span-7 rounded-[3px] border-[1.5px] border-ink bg-card p-3 sm:p-4 shadow-xs flex-col max-h-[360px] md:max-h-[440px] space-y-2.5 overflow-hidden"
            data-testid="map-drilldown-panel"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-2 shrink-0">
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
              <div className="flex flex-wrap gap-1.5 py-1 shrink-0" data-testid="map-city-pills">
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

            {/* Venue Ticket Stub Cards List (Internal scrollable on mobile and md: desktop) */}
            {spiderfiedFocusedVenues.length === 0 ? (
              <p className="m-0 py-2 text-[12px] text-muted">
                {t("venueMap.unvisitedNotice", null, {
                  pref: t(`prefectures.${selectedPrefecture}`, selectedPrefecture),
                })}
              </p>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {spiderfiedFocusedVenues.map((v) => {
                  const isHighlighted =
                    hoveredVenue === v.canonical || selectedVenue === v.canonical;
                  return (
                    <button
                      key={v.canonical}
                      type="button"
                      data-testid="map-venue-card"
                      ref={(el) => {
                        if (el) cardRefs.current.set(v.canonical, el);
                        else cardRefs.current.delete(v.canonical);
                      }}
                      onMouseEnter={() => setHoveredVenue(v.canonical)}
                      onMouseLeave={() => setHoveredVenue(null)}
                      onClick={() => onSelectVenue && onSelectVenue(v.canonical)}
                      className={`w-full flex items-center justify-between gap-2 rounded-[3px] border px-3 py-2 text-left cursor-pointer transition-colors motion-reduce:transition-none ${
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
      {/* Fullscreen Interactive Map Modal (Fullscreen Sheet) */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("venueMap.fullscreenAria")}
          data-testid="map-fullscreen-modal"
          className="fixed inset-0 z-50 flex flex-col bg-paper p-3 sm:p-5 overflow-hidden"
        >
          {/* Modal Header Bar */}
          <div className="flex items-center justify-between border-b border-ink/20 pb-2.5 mb-2.5 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate font-mono text-[13px] sm:text-[14px] font-black text-ink">
                {mode === "journey"
                  ? t("venueMap.journeyTitle", "全生涯巡演足跡")
                  : selectedPrefecture
                  ? t("venueMap.venuesInPrefTitle", null, {
                      pref: t(`prefectures.${selectedPrefecture}`, selectedPrefecture),
                      venues: focusedVenuesRaw.length,
                      shows: focusedPrefEntries.reduce((s, e) => s + e.showCount, 0),
                    })
                  : t("venueMap.venuesMapOverviewTitle")}
              </span>
              {!selectedPrefecture && mode !== "journey" && (
                <span className="shrink-0 rounded-[3px] bg-band px-2 py-0.5 font-mono text-[11px] font-bold text-band-ink border border-ink/30">
                  {mapStats.completionPercent}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedPrefecture && (
                <button
                  type="button"
                  onClick={() => onSelectPrefecture && onSelectPrefecture(null)}
                  className="rounded-[3px] border border-ink/40 bg-card px-2.5 py-1 font-mono text-[11px] font-bold text-ink hover:bg-band hover:text-band-ink cursor-pointer transition-colors"
                >
                  {t("venueMap.backToNational")}
                </button>
              )}
              <button
                type="button"
                data-testid="map-fullscreen-close"
                onClick={() => setIsFullscreen(false)}
                aria-label={t("venueMap.fullscreenCloseAria")}
                className="rounded-[3px] border-[1.5px] border-ink bg-card px-3 py-1 font-mono text-[11px] sm:text-[12px] font-extrabold text-ink hover:bg-request hover:text-request-ink cursor-pointer transition-colors shadow-2xs"
              >
                {t("venueMap.fullscreenClose")}
              </button>
            </div>
          </div>

          {/* Modal Map Frame (Dynamic height: 85-90% when national overview; 50-55% when prefecture selected) */}
          <div
            className={`relative rounded-[3px] border-[1.5px] border-ink bg-paper shadow-xs overflow-hidden flex items-center justify-center transition-all ${
              selectedPrefecture ? "h-[50vh] sm:h-[55vh] shrink-0" : "flex-1 min-h-0"
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {renderMapSvg(true)}

            {/* Floating Zoom Controls (+ / - / Reset) */}
            <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 shadow-md">
              <button
                type="button"
                data-testid="modal-zoom-in"
                onClick={() => setModalZoom((z) => Math.min(3.5, Number((z + 0.5).toFixed(1))))}
                aria-label="Zoom in"
                className="h-8 w-8 rounded-[3px] border-[1.5px] border-ink bg-card font-mono text-[16px] font-black text-ink hover:bg-band hover:text-band-ink flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
              >
                +
              </button>
              <button
                type="button"
                data-testid="modal-zoom-out"
                onClick={() => {
                  setModalZoom((z) => {
                    const next = Math.max(1, Number((z - 0.5).toFixed(1)));
                    if (next === 1) setModalPan({ x: 0, y: 0 });
                    return next;
                  });
                }}
                aria-label="Zoom out"
                className="h-8 w-8 rounded-[3px] border-[1.5px] border-ink bg-card font-mono text-[16px] font-black text-ink hover:bg-band hover:text-band-ink flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
              >
                -
              </button>
              {modalZoom > 1 && (
                <button
                  type="button"
                  data-testid="modal-zoom-reset"
                  onClick={() => {
                    setModalZoom(1);
                    setModalPan({ x: 0, y: 0 });
                  }}
                  aria-label="Reset zoom"
                  className="h-8 w-8 rounded-[3px] border-[1.5px] border-ink bg-band font-mono text-[11px] font-black text-band-ink hover:bg-card hover:text-ink flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
                >
                  ↺
                </button>
              )}
            </div>
          </div>

          {/* National Overview Bottom Hint Bar when no prefecture is selected */}
          {mode === "venues" && !selectedPrefecture && (
            <div className="shrink-0 p-2 text-center font-mono text-[11px] text-muted border-t border-ink/20 mt-1">
              🇯🇵 {t("venueMap.clickHint")}
            </div>
          )}

          {/* Modal Drawer: Venue Cards list when prefecture is selected in venues mode */}
          {mode === "venues" && selectedPrefecture && (
            <div className="mt-2.5 flex-1 min-h-0 flex flex-col rounded-[3px] border-[1.5px] border-ink bg-card p-3 shadow-xs shrink-0 overflow-hidden">
              {/* City Filter Capsules */}
              {focusedCities.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-line-soft shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveCity(null)}
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold cursor-pointer transition-colors ${
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
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold cursor-pointer transition-colors ${
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

              {/* Scrollable venue cards list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pt-2 custom-scrollbar">
                {spiderfiedFocusedVenues.map((v) => {
                  const isHighlighted = hoveredVenue === v.canonical || selectedVenue === v.canonical;
                  return (
                    <button
                      key={v.canonical}
                      type="button"
                      data-testid="modal-venue-card"
                      onClick={() => {
                        if (onSelectVenue) onSelectVenue(v.canonical);
                        setIsFullscreen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 rounded-[3px] border px-3 py-1.5 text-left cursor-pointer transition-colors ${
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
            </div>
          )}

          {/* Modal Journey Playback Controls */}
          {mode === "journey" && journey && (
            <div className="mt-2 shrink-0">
              <JourneyPlaybackControls playback={playback} stops={journeyStops} />
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default VenueMapCanvas;
