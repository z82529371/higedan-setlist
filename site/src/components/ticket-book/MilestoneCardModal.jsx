import { useRef, useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { showDate, formatShowVenueCity } from "../../lib/domain.js";
import { exportElementToPng } from "../../lib/image-export.js";
import { TicketPerforationDivider, TicketBarcodeFooter } from "../slips/TicketCommon.jsx";
import { SLIP_TAPE } from "../../lib/constants.js";

export function MilestoneCardModal({ isOpen, onClose, milestones }) {
  const { t, locale } = useI18n();
  const cardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-generate PNG preview when modal opens for instant right-click/long-press save
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
  }, [isOpen, milestones, locale, imageUrl]);

  if (!isOpen || !milestones) return null;

  const topSongs = milestones.topSongs || [];
  const earliest = milestones.earliestShow;
  const latest = milestones.latestShow;

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

          {/* Top 3 Live Songs */}
          <div
            data-testid="milestone-card-top-songs"
            className="rounded-[4px] border border-ink/30 bg-paper/30 p-3 mb-3.5"
          >
            <div className="font-mono text-[11px] font-bold text-ink uppercase mb-2 flex items-center gap-1.5 border-b border-ink/20 pb-1">
              <span>🔥</span>
              <span>{t("ticketBook.topSongs", "現場神曲 Top 3")}</span>
            </div>
            {topSongs.length === 0 ? (
              <p className="m-0 text-center py-1 font-mono text-[11px] text-ink">--</p>
            ) : (
              <div className="space-y-1.5">
                {topSongs.map((song, idx) => {
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
                  return (
                    <div
                      key={song.songId}
                      className="flex items-center justify-between gap-2 text-[12px] bg-card p-1.5 rounded border border-ink/20"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold">{medal}</span>
                        <span className="font-bold text-ink truncate">{song.title}</span>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-ink">
                        {t("ticketBook.timesUnit", "{count} 次", { count: song.count })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
