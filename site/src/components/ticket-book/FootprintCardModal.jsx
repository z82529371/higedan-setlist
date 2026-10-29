import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { showDate, formatShowVenueCity } from "../../lib/domain.js";
import { exportElementToPng } from "../../lib/image-export.js";
import { TicketPerforationDivider, TicketBarcodeFooter } from "../slips/TicketCommon.jsx";
import { SLIP_TAPE } from "../../lib/constants.js";
import { getSafeStorage, getTicketBookHolderName, setTicketBookHolderName } from "../../lib/ticket-book.js";
import { buildPrefectureMapStats, buildJourneySequence } from "../../lib/venue-map.js";
import { venueProfiles, venueProfilesByCanonical } from "../../lib/locales/venues.js";
import { getPlaybackFrame } from "../../lib/journey-playback.js";
import { useJourneyPlayback } from "../../lib/use-journey-playback.js";
import { VenueMapCanvas } from "../VenueMapCanvas.jsx";

/**
 * FootprintCardModal (Issue #56, ADR-0129, ADR-0131, ADR-0133).
 * Renders the 540px Tour Footprint Commemorative Postcard with live interactive
 * journey preview and high-resolution 2× Retina PNG offline export.
 * Completes the "Fan Memory Trinity" (現場票根, 生涯成就, 參戰足跡明信片).
 */
export function FootprintCardModal({
  isOpen,
  onClose,
  attendedShows = [],
  storage: propStorage,
  allVenues = null,
  initialImageUrl = null,
}) {
  const { t, locale } = useI18n();
  const cardRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const storage = propStorage || getSafeStorage();

  const [isExportingPng, setIsExportingPng] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialImageUrl || "");

  const initialHolder = getTicketBookHolderName(storage);
  const [inputHolderName, setInputHolderName] = useState(initialHolder);
  const [appliedHolderName, setAppliedHolderName] = useState(initialHolder);

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

  // 2. Build chronological journey sequence
  const fanJourney = useMemo(() => {
    if (physicalShows.length === 0) return null;
    const seq = buildJourneySequence(physicalShows, venueProfilesByCanonical, { includeTvBroadcasts: false });
    if (seq) {
      seq.isPersonal = true;
    }
    return seq;
  }, [physicalShows]);

  // 3. Controlled Playback for 1×/2×/4× speed selection and interactive preview (Overview Camera like main website)
  const journeyTransitions = fanJourney?.transitions || [];
  const playback = useJourneyPlayback(journeyTransitions, {
    initialProgress: 0,
    initialPlaying: true,
    initialCameraMode: "overview",
  });

  const [manualProgress, setManualProgress] = useState(null);

  const effectivePlayback = useMemo(() => {
    if (manualProgress === null) return playback;
    return {
      ...playback,
      progress: manualProgress,
      frame: getPlaybackFrame(journeyTransitions, manualProgress),
      isPlaying: false,
    };
  }, [manualProgress, playback, journeyTransitions]);

  // 4. Build venue appearances map
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

  // 5. Compute personal prefecture completion statistics
  const footprintStats = useMemo(() => {
    return buildPrefectureMapStats(effectiveVenuesList, fanVenueShows);
  }, [effectiveVenuesList, fanVenueShows]);

  const visitedJapanCount = footprintStats.visitedJapanPrefectureCount || 0;
  const overseasCount = footprintStats.overseasCountryCount || 0;

  const earliestShow = physicalShows[0] || null;
  const latestShow = physicalShows[physicalShows.length - 1] || null;

  const yearSpan = useMemo(() => {
    if (!earliestShow || !latestShow) return "";
    const y1 = earliestShow.date?.slice(0, 4) || "";
    const y2 = latestShow.date?.slice(0, 4) || "";
    if (!y1 && !y2) return "";
    if (y1 === y2) return y1;
    return `${y1} – ${y2}`;
  }, [earliestShow, latestShow]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Sync holder name whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    const h = getTicketBookHolderName(storage);
    setInputHolderName(h);
    setAppliedHolderName(h);
  }, [isOpen, storage]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const commitHolder = (nextHolder) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setAppliedHolderName(nextHolder);
    setTicketBookHolderName(nextHolder, storage);
    setImageUrl("");
  };

  const handleHolderChange = (val) => {
    const trimmed = val.slice(0, 40);
    setInputHolderName(trimmed);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      commitHolder(trimmed);
    }, 600);
  };

  const handleInputBlur = () => {
    commitHolder(inputHolderName);
  };

  const isDark = typeof document !== "undefined" && document.documentElement?.getAttribute("data-theme") === "dark";
  const cardBgColor = isDark ? "#111319" : "#f8f7f4";

  // Invalidate cached PNG whenever modal opens or customization changes
  useEffect(() => {
    if (!initialImageUrl) {
      setImageUrl("");
    }
  }, [isOpen, appliedHolderName, cardBgColor, locale, initialImageUrl]);

  const cleanHolder = (appliedHolderName || "fan").trim().replace(/[\s/\\:*?"<>|]+/g, "-");
  const dateStr = new Date().toISOString().slice(0, 10);
  const downloadPngFileName = `higedan-footprint-${cleanHolder}-${dateStr}.png`;

  // One-Click High-Res PNG Export (Guarantees Full Completed Souvenir with 參戰紀念 Postmark)
  const handleExportPng = useCallback(async () => {
    if (!cardRef.current) return;
    setIsExportingPng(true);

    // Freeze to completed journey state so the saved postcard always shows full route & stamped seal
    const prevManualProgress = manualProgress;
    setManualProgress(journeyTransitions.length);

    // Wait for React to render completed state in DOM
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 60));

    try {
      const url = await exportElementToPng(cardRef.current, {
        width: 540,
        pixelRatio: 2,
        borderRadius: "8px",
        topPadding: 16,
        cardBackground: cardBgColor,
      });
      if (url) {
        setImageUrl(url);

        // Native browser download
        if (typeof document !== "undefined") {
          const a = document.createElement("a");
          a.href = url;
          a.download = downloadPngFileName;
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => a.remove(), 1000);
        }
      }
    } catch (err) {
      console.error("Export footprint PNG failed:", err);
    } finally {
      setManualProgress(prevManualProgress);
      setIsExportingPng(false);
    }
  }, [cardBgColor, downloadPngFileName, journeyTransitions.length, manualProgress]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="footprint-card-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[580px] my-auto flex flex-col items-center">
        {/* Modal Top Actions Toolbar */}
        <div className="w-full flex items-center justify-between pb-2 text-card gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base sm:text-lg select-none" aria-hidden="true">
              🗺️
            </span>
            <span className="font-mono text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-card truncate">
              {t("ticketBook.footprintModalTitle", "個人參戰足跡紀念明信片")}
            </span>
          </div>

          <button
            type="button"
            data-testid="close-footprint-modal-btn"
            onClick={onClose}
            className="rounded p-1 text-card hover:text-card/80 text-base sm:text-lg font-bold cursor-pointer shrink-0"
            aria-label={t("common.close", "關閉")}
          >
            ✕
          </button>
        </div>

        {/* Customizer Drawer / Holder Input */}
        <div className="w-full bg-ink/80 border border-card/30 rounded-[8px] p-2.5 mb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-lg">
          <label
            htmlFor="footprint-holder-input"
            className="font-mono text-xs font-bold text-card flex items-center gap-1.5 shrink-0"
          >
            <span aria-hidden="true">👤</span>
            <span>{t("ticketBook.holderLabel", "歌迷暱稱・ID")}</span>
          </label>
          <input
            id="footprint-holder-input"
            type="text"
            data-testid="footprint-holder-input"
            maxLength={40}
            value={inputHolderName}
            onChange={(e) => handleHolderChange(e.target.value)}
            onBlur={handleInputBlur}
            placeholder={t("ticketBook.holderPlaceholder", "例如：@higedan_fan 或 小明")}
            className="w-full sm:max-w-[280px] bg-card text-ink border border-card/40 rounded px-2.5 py-1 text-xs placeholder:text-ink/50 focus:border-band focus:outline-none font-mono"
          />
        </div>

        {/* Postcard Export Node (ADR-0100, ADR-0129, ADR-0131, ADR-0133: radius <= 8px, AAA contrast) */}
        <div className="relative w-full max-w-[540px] pt-3 sm:pt-4">
          <div
            ref={cardRef}
            data-testid="footprint-postcard"
            className="relative w-full max-w-[540px] rounded-[8px] border-[2px] border-ink bg-card p-3.5 sm:p-6 shadow-[4px_4px_0_rgba(0,0,0,0.2)] text-ink select-none"
            style={{ backgroundColor: cardBgColor }}
          >
            {/* Top Washi Tape Pin */}
            <div className={SLIP_TAPE} aria-hidden="true" />

            {/* Postcard Header */}
            <div className="text-center pt-2 pb-2.5 sm:pb-3">
              <p className="m-0 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-[0.2em] text-ink">
                {t("ticketBook.footprintPostcardSubtitle", "CONCERT TICKET BOOK // TOUR FOOTPRINT POSTCARD")}
              </p>
              <h2 className="m-0 mt-1 font-display text-[20px] sm:text-[24px] font-black text-ink leading-tight">
                Official髭男dism
              </h2>
              <p className="m-0 mt-0.5 font-display text-[13px] sm:text-[15px] font-bold text-band-ink">
                {t("ticketBook.footprintPostcardTitle", "Official髭男dism 參戰足跡明信片")}
              </p>

              {/* Meta bar: Year range + Serial */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2 font-mono text-[10px] sm:text-[11px] font-bold text-muted flex-wrap">
                <span className="rounded bg-paper px-2 py-0.5 border border-ink/20 text-ink">
                  POSTCARD #{String(physicalShows.length).padStart(3, "0")}
                </span>
                {yearSpan && (
                  <span className="rounded bg-paper px-2 py-0.5 border border-ink/20 text-ink">
                    📅 {yearSpan}
                  </span>
                )}
              </div>

              {/* Holder Name Badge (Privacy-friendly: only shown when non-empty) */}
              {appliedHolderName && (
                <div
                  data-testid="footprint-holder-badge"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] font-mono text-[11px] font-bold border border-ink/30 bg-paper/60 text-ink mt-2"
                >
                  <span className="font-bold text-[10px]">👤 HOLDER:</span>
                  <span className="font-black">{appliedHolderName}</span>
                </div>
              )}
            </div>

            {/* Central High-Contrast Lighted Map Card */}
            <div
              data-testid="footprint-map-card"
              className="mt-1 mb-3 rounded-[6px] border border-ink/25 bg-paper/30 overflow-hidden"
            >
              <VenueMapCanvas
                mode="journey"
                layout="landscape"
                journey={fanJourney}
                isPersonal={true}
                globalVenueShows={fanVenueShows}
                allVenues={effectiveVenuesList}
                tourSequence={fanJourney?.transitions || []}
                playbackOptions={null}
                controlledPlayback={effectivePlayback}
                hideControls={true}
                hidePlayback={true}
                hideHud={true}
                compact={true}
              />
            </div>

            <TicketPerforationDivider />

            {/* Bottom Section: Commemorative "參戰紀念" Postmark Seal & Expedition Statistics (Compact Unbroken Row, ADR-0133) */}
            <div className="pt-3 pb-2 flex flex-row items-center justify-between gap-2.5 sm:gap-4">
              {/* Commemorative Postmark Seal (參戰紀念 / LIVE MEMORIAL) */}
              <div
                data-testid="footprint-postmark"
                className={`shrink-0 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-band-ink/75 bg-tape-tint/30 rotate-[-4deg] p-1 select-none shadow-2xs transition-all duration-300 ${
                  effectivePlayback.frame.isComplete ? "scale-100 opacity-100" : "scale-95 opacity-50"
                }`}
              >
                <div className="w-full h-full rounded-full border border-band-ink/50 flex flex-col items-center justify-center text-center p-0.5 font-mono">
                  <span className="text-[6px] sm:text-[7.5px] font-black tracking-widest text-ink uppercase">
                    OFFICIAL HIGEDAN
                  </span>
                  <span className="text-[9.5px] sm:text-[11px] font-black tracking-wider text-band-ink my-0.5 whitespace-nowrap">
                    {t("ticketBook.footprintPostmarkText", "參戰紀念")}
                  </span>
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-muted tabular-nums">
                    {dateStr}
                  </span>
                </div>
              </div>

              {/* Expedition Metrics Pair (Focused on Prefectures and Shows) */}
              <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 sm:gap-3 text-center">
                <div className="bg-paper/70 border border-ink/20 rounded p-1.5 sm:p-2.5 flex flex-col justify-center min-w-0">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold text-muted uppercase truncate">
                    {t("ticketBook.footprintPrefectures", "踏破縣市")}
                  </span>
                  <span
                    data-testid="footprint-stat-prefectures"
                    className="font-display text-[15px] sm:text-[17px] font-black text-ink leading-tight mt-0.5"
                  >
                    {visitedJapanCount} / 47
                  </span>
                  {overseasCount > 0 && (
                    <span className="font-mono text-[8.5px] sm:text-[9.5px] font-bold text-band-ink truncate">
                      +{overseasCount} {t("ticketBook.overseasCountUnit", "海外城市")}
                    </span>
                  )}
                </div>

                <div className="bg-paper/70 border border-ink/20 rounded p-1.5 sm:p-2.5 flex flex-col justify-center min-w-0">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold text-muted uppercase truncate">
                    {t("ticketBook.footprintTotalShows", "參戰場次")}
                  </span>
                  <span
                    data-testid="footprint-stat-shows"
                    className="font-display text-[15px] sm:text-[17px] font-black text-ink leading-tight mt-0.5"
                  >
                    {physicalShows.length}
                  </span>
                  <span className="font-mono text-[8px] sm:text-[9px] font-bold text-muted uppercase truncate">
                    ATTENDED SHOWS
                  </span>
                </div>
              </div>
            </div>

            {/* First and Latest Show Odyssey Bookends */}
            {(earliestShow || latestShow) && (
              <div className="mt-2.5 pt-2.5 border-t border-dashed border-ink/20 space-y-1.5 font-mono text-[11px]">
                {earliestShow && (
                  <div
                    data-testid="footprint-first-show"
                    className="flex items-center justify-between gap-2 text-ink"
                  >
                    <span className="text-[10px] font-bold text-muted shrink-0 flex items-center gap-1">
                      <span aria-hidden="true">🚩</span>
                      <span>{t("ticketBook.footprintFirstShow", "初陣・最初參戰")}:</span>
                    </span>
                    <span className="truncate font-bold text-right text-[11px]">
                      <span className="whitespace-nowrap shrink-0 mr-1.5 text-muted font-normal">
                        {earliestShow ? (earliestShow.date ? showDate(earliestShow, locale) : earliestShow.date) : "--"}
                      </span>
                      {formatShowVenueCity(earliestShow, t, locale)}
                    </span>
                  </div>
                )}
                {latestShow && (
                  <div
                    data-testid="footprint-latest-show"
                    className="flex items-center justify-between gap-2 text-ink"
                  >
                    <span className="text-[10px] font-bold text-muted shrink-0 flex items-center gap-1">
                      <span aria-hidden="true">🏁</span>
                      <span>{t("ticketBook.footprintLatestShow", "最新參戰")}:</span>
                    </span>
                    <span className="truncate font-bold text-right text-[11px]">
                      <span className="whitespace-nowrap shrink-0 mr-1.5 text-muted font-normal">
                        {latestShow ? (latestShow.date ? showDate(latestShow, locale) : latestShow.date) : "--"}
                      </span>
                      {formatShowVenueCity(latestShow, t, locale)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3">
              <TicketBarcodeFooter
                serial="TICKET BOOK // TOUR FOOTPRINT"
                label={t("ticketBook.footprintPostcardTitle", "Official髭男dism 參戰足跡明信片")}
              />
            </div>
          </div>

          {/* Seamless Real <img> overlay for native right-click / long-press saving */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={t("ticketBook.footprintPostcardTitle", "Official髭男dism 參戰足跡明信片")}
              className="absolute inset-0 w-full h-full rounded-[8px] block object-top cursor-default z-10"
              style={{
                WebkitTouchCallout: "default",
                userSelect: "auto",
                pointerEvents: "auto",
              }}
            />
          )}
        </div>

        {/* Modal Bottom Single Action: Clean One-Click PNG Save (ADR-0133) */}
        <div className="w-full mt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            data-testid="footprint-save-png-btn"
            disabled={isExportingPng}
            onClick={handleExportPng}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] font-mono text-xs font-bold bg-band text-band-ink border border-ink/40 shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          >
            <span aria-hidden="true">{isExportingPng ? "⏳" : "📸"}</span>
            <span>
              {isExportingPng
                ? t("memorial.generating", "高清紀念卡生成中...")
                : t("ticketBook.saveStaticPngBtn", "儲存明信片 (PNG)")}
            </span>
          </button>
        </div>

        {/* Save Hint Notice */}
        <div className="mt-2 text-center text-xs text-card/80 font-mono">
          <span aria-hidden="true">💡 </span>
          <span>{t("memorial.saveHint", "手機長按小卡存入相簿 · 電腦點右鍵另存圖片")}</span>
        </div>
      </div>
    </div>
  );
}

export default FootprintCardModal;
