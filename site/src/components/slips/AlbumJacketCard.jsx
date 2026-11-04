import { useI18n } from "../../lib/i18n.jsx";

/**
 * VinylRecordSvg
 * Retro vinyl record placeholder with concentric groove rings and spindle hole.
 * Follows ticket aesthetic tokens (ADR-0143).
 */
function VinylRecordSvg({ className = "w-full h-full" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Vinyl Outer Disc */}
      <circle cx="32" cy="32" r="30" className="fill-ink/90" />
      {/* Concentric Grooves */}
      <circle cx="32" cy="32" r="26" className="stroke-paper/15" strokeWidth="0.75" />
      <circle cx="32" cy="32" r="22" className="stroke-paper/20" strokeWidth="0.75" />
      <circle cx="32" cy="32" r="18" className="stroke-paper/15" strokeWidth="0.75" />
      <circle cx="32" cy="32" r="14" className="stroke-paper/20" strokeWidth="0.75" />
      {/* Center Label */}
      <circle cx="32" cy="32" r="10" className="fill-band stroke-band-ink/40" strokeWidth="0.5" />
      {/* Center Spindle Hole */}
      <circle cx="32" cy="32" r="2.5" className="fill-paper" />
    </svg>
  );
}

/**
 * AlbumJacketCard
 * Compact physical album jacket micro-card in SongSlip Header (ADR-0143).
 * Renders official album cover or retro vinyl placeholder fallback.
 */
export function AlbumJacketCard({ title, coverUrl, onOpenLightbox }) {
  const { t } = useI18n();

  if (!coverUrl) {
    return (
      <div
        className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-[4px] border border-ink/20 bg-paper/80 p-1 shadow-2xs flex items-center justify-center select-none"
        title={t("slips.song.unreleasedJacket", "未正式發行作品（黑膠唱片）")}
        aria-label={t("slips.song.unreleasedJacket", "未正式發行作品（黑膠唱片）")}
        role="img"
      >
        <VinylRecordSvg className="w-full h-full drop-shadow-2xs" />
      </div>
    );
  }

  const altText = t("slips.song.albumJacketAlt", "《{title}》唱片封面", { title });
  const viewTitle = t("slips.song.viewJacket", "查看《{title}》唱片封面", { title });

  return (
    <button
      type="button"
      onClick={onOpenLightbox}
      className="group relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-[4px] border border-ink/25 bg-paper shadow-2xs overflow-hidden cursor-pointer select-none transition-colors duration-150 hover:border-ink hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-band/60"
      title={viewTitle}
      aria-label={viewTitle}
      data-testid="song-album-jacket-btn"
    >
      <img
        src={coverUrl}
        alt={altText}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      {/* Subtle zoom indicator on hover */}
      <span
        className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white/95 drop-shadow-2xs font-mono text-[10px] font-bold"
        aria-hidden="true"
      >
        🔍
      </span>
    </button>
  );
}
