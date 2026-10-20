import { useRef, useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { showDate, formatShowVenueCity } from "../../lib/domain.js";
import { exportElementToPng } from "../../lib/image-export.js";
import { TicketPerforationDivider, TicketBarcodeFooter } from "../slips/TicketCommon.jsx";
import { SLIP_TAPE } from "../../lib/constants.js";
import { getSafeStorage, getTicketBookHolderName, setTicketBookHolderName } from "../../lib/ticket-book.js";

export function MilestoneCardModal({ isOpen, onClose, milestones, storage: propStorage }) {
  const { t, locale } = useI18n();
  const cardRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const storage = propStorage || getSafeStorage();

  const [isExporting, setIsExporting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const initialHolder = getTicketBookHolderName(storage);
  const [inputHolderName, setInputHolderName] = useState(initialHolder);
  const [appliedHolderName, setAppliedHolderName] = useState(initialHolder);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Sync holder name whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    const h = getTicketBookHolderName(storage);
    setInputHolderName(h);
    setAppliedHolderName(h);
  }, [isOpen, storage]);

  // Cleanup debounce timer on unmount
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
    setImageUrl(""); // Invalidate cached image to re-render canvas
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

  // Auto-generate PNG preview when modal opens or holder changes for instant right-click/long-press save
  useEffect(() => {
    if (!isOpen || !milestones || imageUrl) return;
    let isMounted = true;
    setIsExporting(true);
    const timer = setTimeout(async () => {
      try {
        if (!cardRef.current) return;
        const url = await exportElementToPng(cardRef.current, {
          width: 540,
          pixelRatio: 2,
          borderRadius: "8px",
          topPadding: 16,
        });
        if (isMounted && url) {
          setImageUrl(url);
        }
      } catch (err) {
        console.error("Export milestone card failed:", err);
      } finally {
        if (isMounted) setIsExporting(false);
      }
    }, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, milestones, locale, imageUrl, appliedHolderName]);

  if (!isOpen || !milestones) return null;

  const earliest = milestones.earliestShow;
  const latest = milestones.latestShow;
  const attendedList = milestones.attendedShowsList || [];

  return (
    <div
      data-testid="milestone-card-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[580px] my-auto flex flex-col items-center">
        {/* Modal Top Actions Toolbar */}
        <div className="w-full flex items-center justify-between pb-3 text-card">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              🎫
            </span>
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-card">
              {t("ticketBook.milestonesTitle", "生涯里程碑")} // 540PX
            </span>
          </div>
          <button
            type="button"
            data-testid="close-milestone-modal-btn"
            onClick={onClose}
            className="rounded p-1 text-card hover:text-card/80 text-lg font-bold cursor-pointer"
            aria-label={t("common.close", "關閉")}
          >
            ✕
          </button>
        </div>

        {/* Customizer Drawer / Holder Input */}
        <div className="w-full bg-ink/80 border border-card/30 rounded-[8px] p-2.5 mb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-lg">
          <label
            htmlFor="milestone-holder-input"
            className="font-mono text-xs font-bold text-card flex items-center gap-1.5 shrink-0"
          >
            <span aria-hidden="true">👤</span>
            <span>{t("ticketBook.holderLabel", "歌迷暱稱・ID")}</span>
          </label>
          <input
            id="milestone-holder-input"
            type="text"
            data-testid="milestone-holder-input"
            maxLength={40}
            value={inputHolderName}
            onChange={(e) => handleHolderChange(e.target.value)}
            onBlur={handleInputBlur}
            placeholder={t("ticketBook.holderPlaceholder", "例如：@higedan_fan 或 小明")}
            className="w-full sm:max-w-[280px] bg-card text-ink border border-card/40 rounded px-2.5 py-1 text-xs placeholder:text-ink/50 focus:border-band focus:outline-none font-mono"
          />
        </div>

        {/* 540px Ticket Card Export Node (ADR-0100 & DESIGN.md: radius <= 8px, AAA contrast) */}
        <div className="relative shrink-0 w-[540px] max-w-full">
          <div
            ref={cardRef}
            data-testid="milestone-summary-card"
            className="relative w-[540px] max-w-full rounded-[8px] border-[2px] border-ink bg-card p-5 sm:p-6 shadow-[4px_4px_0_rgba(0,0,0,0.2)] text-ink select-none"
            style={{ width: "540px" }}
          >
          {/* Top Washi Tape Pin */}
          <div className={SLIP_TAPE} aria-hidden="true" />

          {/* Card Header */}
          <div className="text-center pt-2 pb-3">
            <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
              {t("ticketBook.summaryCardSubtitle", "CONCERT TICKET BOOK // CAREER MILESTONES")}
            </p>
            <h2 className="m-0 mt-1 font-display text-[22px] sm:text-[24px] font-black text-ink leading-tight">
              Official髭男dism
            </h2>
            <p className="m-0 mt-0.5 font-display text-[15px] font-bold text-band-ink">
              {t("ticketBook.summaryCardTitle", "Official髭男dism 生涯參戰總結")}
            </p>

            {/* Holder Name Badge (Privacy-friendly: only shown when non-empty) */}
            {appliedHolderName && (
              <div
                data-testid="milestone-holder-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] font-mono text-[11px] font-bold border border-ink/30 bg-paper/60 text-ink mt-2"
              >
                <span className="font-bold text-[10px]">👤 HOLDER:</span>
                <span className="font-black">{appliedHolderName}</span>
              </div>
            )}
          </div>

          <TicketPerforationDivider />

          {/* 4 Core Metrics Grid (High contrast ink tokens >= 7:1 AAA) */}
          <div className="my-4 grid grid-cols-4 gap-2">
            {/* Shows */}
            <div
              data-testid="milestone-card-total-shows"
              className="rounded-[4px] border border-ink/30 bg-paper/60 p-2 text-center"
            >
              <div className="font-mono text-[10px] font-bold text-ink uppercase">
                {t("ticketBook.totalShows", "總場次")}
              </div>
              <div className="my-0.5 font-mono text-[20px] font-black text-ink leading-tight">
                {milestones.totalShows}
              </div>
              <div className="font-mono text-[10px] text-ink font-bold">
                {t("ticketBook.showsUnit", "{count} 場", { count: milestones.totalShows })}
              </div>
            </div>

            {/* Tours */}
            <div
              data-testid="milestone-card-total-tours"
              className="rounded-[4px] border border-ink/30 bg-paper/60 p-2 text-center"
            >
              <div className="font-mono text-[10px] font-bold text-ink uppercase">
                {t("ticketBook.totalTours", "巡演數")}
              </div>
              <div className="my-0.5 font-mono text-[20px] font-black text-ink leading-tight">
                {milestones.totalTours}
              </div>
              <div className="font-mono text-[10px] text-ink font-bold">
                {t("ticketBook.toursUnit", "{count} 巡演", { count: milestones.totalTours })}
              </div>
            </div>

            {/* Cities */}
            <div
              data-testid="milestone-card-total-cities"
              className="rounded-[4px] border border-ink/30 bg-paper/60 p-2 text-center"
            >
              <div className="font-mono text-[10px] font-bold text-ink uppercase">
                {t("ticketBook.totalCities", "足跡城市")}
              </div>
              <div className="my-0.5 font-mono text-[20px] font-black text-ink leading-tight">
                {milestones.totalCities}
              </div>
              <div className="font-mono text-[10px] text-ink font-bold">
                {t("ticketBook.citiesUnit", "{count} 城市", { count: milestones.totalCities })}
              </div>
            </div>

            {/* Coverage */}
            <div
              data-testid="milestone-card-coverage"
              className="rounded-[4px] border border-ink/30 bg-paper/60 p-2 text-center"
            >
              <div className="font-mono text-[10px] font-bold text-ink uppercase">
                {t("ticketBook.coverage", "歌曲解鎖率")}
              </div>
              <div className="my-0.5 font-mono text-[20px] font-black text-ink leading-tight">
                {milestones.coveragePercentage}%
              </div>
              <div className="font-mono text-[10px] text-ink font-bold">
                {milestones.unlockedSongCount} / {milestones.totalCatalogSongs}
              </div>
            </div>
          </div>

          {/* Timeline First & Latest */}
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <div
              data-testid="milestone-card-first-show"
              className="rounded-[4px] border border-ink/20 bg-paper/40 p-2.5 text-[11px]"
            >
              <div className="flex items-center justify-between text-ink font-mono font-bold mb-0.5">
                <span>{t("ticketBook.firstShow", "最初參戰")}</span>
                <span>{earliest?.date ? (earliest.show ? showDate(earliest.show, locale) : earliest.date) : "--"}</span>
              </div>
              <div className="font-bold text-ink truncate text-[12px]">
                {earliest?.title || "--"}
              </div>
              {earliest && (
                <div className="text-ink text-[11px] truncate mt-0.5 font-medium">
                  📍 {earliest.show ? formatShowVenueCity(earliest.show, t, locale) : earliest.venue || earliest.city}
                </div>
              )}
            </div>

            <div
              data-testid="milestone-card-latest-show"
              className="rounded-[4px] border border-ink/20 bg-paper/40 p-2.5 text-[11px]"
            >
              <div className="flex items-center justify-between text-ink font-mono font-bold mb-0.5">
                <span>{t("ticketBook.latestShow", "最近參戰")}</span>
                <span>{latest?.date ? (latest.show ? showDate(latest.show, locale) : latest.date) : "--"}</span>
              </div>
              <div className="font-bold text-ink truncate text-[12px]">
                {latest?.title || "--"}
              </div>
              {latest && (
                <div className="text-ink text-[11px] truncate mt-0.5 font-medium">
                  📍 {latest.show ? formatShowVenueCity(latest.show, t, locale) : latest.venue || latest.city}
                </div>
              )}
            </div>
          </div>

          {/* Attended Shows Chronicle Footprint */}
          {attendedList.length > 0 && (
            <div
              data-testid="milestone-card-attended-list"
              className="rounded-[4px] border border-ink/30 bg-paper/30 p-3 mb-3.5"
            >
              <div className="font-mono text-[11px] font-bold text-ink uppercase mb-2 flex items-center justify-between border-b border-ink/20 pb-1">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🎪</span>
                  <span>{t("ticketBook.attendedListTitle", "參戰足跡全紀錄")}</span>
                </span>
                <span className="text-[10px] tabular-nums font-bold text-ink/80">
                  {t("ticketBook.showsUnit", "{count} 場", { count: attendedList.length })}
                </span>
              </div>
              <div className="space-y-1.5">
                {attendedList.map((entry, idx) => {
                  const num = String(idx + 1).padStart(2, "0");
                  const dateStr = entry.show ? showDate(entry.show, locale) : entry.date;
                  const venueStr = entry.show ? formatShowVenueCity(entry.show, t, locale) : entry.venue || entry.city;
                  return (
                    <div
                      key={entry.showKey || idx}
                      className="p-2 rounded border border-ink/20 bg-card space-y-0.5 text-[11px]"
                    >
                      {/* Line 1: Date and Location */}
                      <div className="flex items-center justify-between text-[11px] font-mono leading-tight">
                        <div className="flex items-center gap-1.5 font-extrabold text-ink tabular-nums">
                          <span className="text-[10px] text-band-ink font-bold">#{num}</span>
                          <span>{dateStr}</span>
                        </div>
                        {venueStr && (
                          <span className="text-[10px] font-medium text-ink/80 truncate max-w-[60%]">
                            📍 {venueStr}
                          </span>
                        )}
                      </div>

                      {/* Line 2: Tour / Show Title */}
                      <div className="font-bold text-ink text-[12px] truncate leading-tight">
                        {entry.title || "--"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <TicketPerforationDivider />

          {/* Vintage Barcode Footer */}
          <TicketBarcodeFooter
            serial="TICKET BOOK // CAREER MILESTONES // 540PX"
            label={t("ticketBook.summaryCardTitle", "Official髭男dism 生涯參戰總結")}
          />
        </div>

        {/* Seamless Real <img> overlay for native right-click / long-press saving */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={t("ticketBook.summaryCardTitle", "Official髭男dism 生涯參戰總結")}
            className="absolute inset-0 w-full h-full rounded-[8px] block object-top cursor-default z-10"
            style={{
              WebkitTouchCallout: "default",
              userSelect: "auto",
              pointerEvents: "auto",
            }}
          />
        )}
      </div>

      {/* Save Hint Notice */}
      <div className="w-full mt-4 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-card bg-ink/75 border border-card/30 px-3 py-1.5 rounded-lg font-mono">
          <span aria-hidden="true">{isExporting ? "⏳" : "💡"}</span>
          <span className="font-bold">
            {isExporting
              ? t("memorial.generating", "高清紀念卡生成中...")
              : t("memorial.saveHint", "手機長按小卡存入相簿 · 電腦點右鍵另存圖片")}
          </span>
        </div>
      </div>
    </div>
  </div>
);
}
