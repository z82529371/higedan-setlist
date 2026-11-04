import { useState, useRef, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { getSongCover } from "../../lib/song-spotify.js";
import { getSongReleaseProvenance } from "../../lib/song-release.js";

const HOVER_DEBOUNCE_MS = 180;

/**
 * SongJacketHoverCard
 * Desktop-only Mini Vinyl Sleeve hover card for Stage Setlists (ADR-0145).
 * Preserves the pristine receipt typography of ShowSlip / TourSlip while providing
 * instant visual album jacket reconnaissance for songs with official artwork.
 */
export function SongJacketHoverCard({
  songId,
  title,
  linkTitle,
  href,
  className = "",
  onClick,
  children,
  forceOpen = false,
  ...restProps
}) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(forceOpen);
  const timerRef = useRef(null);

  // Sync forceOpen for testing
  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  const cover = songId ? getSongCover(songId) : null;
  const hasCover = !!cover?.coverUrl;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const handleMouseEnter = () => {
    if (!hasCover) return;
    // Guard against touch devices that fire simulated mouseenter
    if (typeof window !== "undefined" && window.matchMedia && !window.matchMedia("(hover: hover)").matches) {
      return;
    }
    clearTimer();
    timerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, HOVER_DEBOUNCE_MS);
  };

  const handleMouseLeave = () => {
    clearTimer();
    if (!forceOpen) {
      setIsOpen(false);
    }
  };

  const handleClick = (e) => {
    clearTimer();
    if (!forceOpen) {
      setIsOpen(false);
    }
    onClick?.(e);
  };

  const linkContent = children || title;

  // If no cover artwork exists (unreleased, acoustic jam, interlude), render pure link without overhead
  if (!hasCover) {
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
        title={linkTitle}
        {...restProps}
      >
        {linkContent}
      </a>
    );
  }

  const provenance = getSongReleaseProvenance(songId, locale);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid="song-jacket-hover-container"
    >
      <a
        href={href}
        className={className}
        onClick={handleClick}
        title={linkTitle}
        {...restProps}
      >
        {linkContent}
      </a>

      {isOpen && (
        <span
          role="tooltip"
          aria-hidden="true"
          data-testid="song-jacket-hover-sleeve"
          className="pointer-events-none absolute left-0 bottom-full mb-2 z-40 w-72 max-w-[calc(100vw-32px)] flex items-center gap-3 rounded-[3px] border border-ink/40 bg-card p-2.5 shadow-[4px_4px_0_rgba(0,0,0,0.18)] dark:shadow-none select-none text-left animate-in fade-in zoom-in-95 duration-100 [@media(hover:none)]:hidden"
        >
          {/* Mini Vinyl Sleeve artwork */}
          <span className="relative shrink-0 w-16 h-16 rounded-[2px] overflow-hidden border border-ink/20 shadow-2xs bg-paper">
            <img
              src={cover.coverUrl}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </span>

          {/* Sleeve metadata */}
          <span className="min-w-0 flex-1 flex flex-col justify-center">
            <span className="text-[12px] font-bold text-ink truncate font-sans">
              {title}
            </span>
            {provenance && (
              <span className="text-[10px] text-muted truncate mt-0.5 font-mono">
                {provenance}
              </span>
            )}
            <span className="text-[10px] text-ink-muted dark:text-ink/80 mt-1 flex items-center gap-1 font-mono font-semibold">
              <span>{t("slips.song.viewSongHistory", "點擊檢視單曲歷史 →")}</span>
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
