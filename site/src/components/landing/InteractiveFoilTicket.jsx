import { useState, useRef, useEffect } from "react";
import {
  TicketPerforationDivider,
  TicketBarcodeFooter,
} from "../slips/TicketCommon.jsx";
import { VinylRecordSvg } from "../slips/AlbumJacketCard.jsx";
import { getSongCover } from "../../lib/song-spotify.js";
import { localizeVenue } from "../../lib/locales/venues.js";
import { useI18n } from "../../lib/i18n.jsx";

export default function InteractiveFoilTicket({
  card,
  cardIndex,
  deckLength,
  onNextCard,
  onOpenShow,
}) {
  const { t, locale } = useI18n();
  const cardRef = useRef(null);
  const flipTimerRef = useRef(null);

  const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false });
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  const handlePointerMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const py = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    const ry = (px - 0.5) * 22;
    const rx = (0.5 - py) * 18;
    setTilt({ rx, ry, active: true });
  };

  const handlePointerLeave = () => {
    setTilt((prev) => ({ ...prev, rx: 0, ry: 0, active: false }));
  };

  const handleFlipNext = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    flipTimerRef.current = setTimeout(() => {
      onNextCard?.();
      setIsFlipping(false);
    }, 150);
  };

  const cover = card?.featuredSongId ? getSongCover(card.featuredSongId) : null;
  const venueDisplay = card?.venueName
    ? localizeVenue(card.venueName, locale)
    : "";
  const serial = card?.date
    ? `HGD-${card.date.replace(/-/g, "")}-${String(cardIndex + 1).padStart(2, "0")}`
    : "HGD-2012-2026-ARCHIVE";

  const transformStyle = isFlipping
    ? "rotateY(-22deg) scale(0.95)"
    : `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) scale(${tilt.active ? 1.025 : 1})`;

  const dynamicShadow = tilt.active
    ? `${Math.round(-tilt.ry * 0.85)}px ${Math.round(tilt.rx * 0.85 + 7)}px 0 rgba(0, 0, 0, 0.22)`
    : undefined;

  return (
    <div
      className="flex flex-col items-center w-full max-w-[400px] mx-auto lg:ml-auto"
      style={{ perspective: "850px" }}
      data-testid="landing-foil-ticket"
    >
      {/* 3D Interactive Foil-Sheen Collectible Ticket */}
      <div
        ref={cardRef}
        onMouseMove={handlePointerMove}
        onPointerMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onPointerLeave={handlePointerLeave}
        style={{
          transform: transformStyle,
          transformStyle: "preserve-3d",
          boxShadow: dynamicShadow,
          transition: tilt.active
            ? "transform 60ms ease-out, box-shadow 60ms ease-out"
            : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 420ms ease, opacity 150ms ease",
          opacity: isFlipping ? 0.65 : 1,
          willChange: "transform",
        }}
        className="relative w-full rounded-[3px] border-[1.5px] border-ink bg-card shadow-[5px_5px_0_rgba(0,0,0,0.16)] dark:shadow-none select-none"
      >
        {/* Top Serrated Washi Tape synced to Tour Era Accent */}
        <div
          className="washi-tape pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 rotate-[1.4deg] h-[24px] w-[124px] border-x border-dashed border-ink/40 z-30 transition-colors duration-300"
          style={{ backgroundColor: "var(--era-accent, var(--color-band))" }}
          aria-hidden="true"
        />

        {/* Era-Colored Top Ticket Band */}
        <div
          className="rounded-t-[2px] px-4 pt-5 pb-3.5 sm:px-5 flex items-center justify-between gap-2 border-b-[1.5px] border-ink transition-colors duration-300"
          style={{
            backgroundColor: "var(--era-accent, var(--color-band))",
            color: "var(--era-accent-ink, var(--color-band-ink))",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] font-black tracking-[0.18em] uppercase truncate">
              LIVE ARCHIVE PASS
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] font-bold tabular-nums">
            {card?.date && <span className="whitespace-nowrap">{card.date}</span>}
            {deckLength > 1 && (
              <span className="opacity-75">
                {String(cardIndex + 1).padStart(2, "0")}/{String(deckLength).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>

        {/* Ticket Body */}
        <div className="px-4 pt-4 pb-4 sm:px-[26px] sm:pt-5 sm:pb-5 text-left">
          {/* Show Masthead + Real Official Album Jacket */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="relative shrink-0 w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-[3px] border-[1.5px] border-ink bg-paper overflow-hidden shadow-xs">
              {cover?.coverUrl ? (
                <img
                  src={cover.coverUrl}
                  alt={cover.title || card?.tourLabel || "Official髭男dism"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full p-1.5 flex items-center justify-center">
                  <VinylRecordSvg className="w-full h-full" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="m-0 font-display text-[15px] sm:text-[17px] font-black text-ink leading-snug line-clamp-2">
                {card?.tourLabel || "Official髭男dism"}
              </h2>
              {venueDisplay && (
                <p className="mt-1 mb-0 text-[12px] text-muted font-medium truncate">
                  {venueDisplay}
                  {card?.city ? ` · ${card.city}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Perforation Seam */}
          <TicketPerforationDivider />

          {/* Real Setlist Preview (M01–M03) */}
          {card?.previewTracks?.length > 0 && (
            <ol className="m-0 p-0 list-none space-y-1.5">
              {card.previewTracks.map((track) => (
                <li
                  key={track.cue}
                  className="flex items-baseline gap-2.5 text-[12px] sm:text-[13px] border-b border-line-soft/70 pb-1 last:border-b-0"
                >
                  <span className="font-mono text-[11px] font-bold text-ink/60 tabular-nums shrink-0">
                    {track.cue}
                  </span>
                  <span className="font-semibold text-ink truncate">
                    {track.title}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {card?.totalTracks > 3 && (
            <p className="mt-2 mb-0 font-mono text-[11px] font-semibold text-ink/70 tabular-nums">
              {t("landing.ticketCard.moreSongs", "等共 {count} 首演出曲目").replace(
                "{count}",
                String(card.totalTracks)
              )}
            </p>
          )}

          {/* Compact Vintage Barcode Footer */}
          <div className="-mt-4">
            <TicketBarcodeFooter
              serial={serial}
              label="ADMIT ONE // MASTER ARCHIVE PASS"
            />
          </div>
        </div>
      </div>

      {/* Tactile Card Controls Beneath the 3D Ticket */}
      <div className="mt-4 w-full flex items-center justify-center gap-2.5">
        <button
          type="button"
          data-testid="landing-random-show-btn"
          onClick={handleFlipNext}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[3px] border-[1.5px] border-ink bg-card text-ink font-semibold text-[12px] sm:text-[13px] shadow-xs dark:shadow-none hover:bg-paper transition-colors motion-reduce:transition-none cursor-pointer touch-stamp focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className={`font-mono text-[13px] font-black transition-transform duration-300 ${
              isFlipping ? "rotate-180" : ""
            }`}
          >
            ↻
          </span>
          <span>
            {t("landing.ticketCard.nextTicket", "抽換下一張")}
          </span>
        </button>

        {card?.showId && (
          <button
            type="button"
            onClick={() => onOpenShow?.(card)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[3px] border-[1.5px] border-ink font-bold text-[12px] sm:text-[13px] shadow-xs dark:shadow-none hover:brightness-105 transition-all motion-reduce:transition-none cursor-pointer touch-stamp focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none"
            style={{
              backgroundColor: "var(--era-accent, var(--color-band))",
              color: "var(--era-accent-ink, var(--color-band-ink))",
            }}
          >
            <span>{t("landing.ticketCard.openSetlist", "開啟這場歌單")}</span>
            <span aria-hidden="true" className="font-mono font-black">
              →
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
