import { useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { routeHash } from "../../lib/routes.js";

/**
 * CoverLightboxModal (ADR-0143, ADR-0144)
 * Fullscreen high-resolution 640x640 Retina album jacket preview modal
 * with bidirectional deep-link button to official release card.
 */
export function CoverLightboxModal({
  isOpen,
  onClose,
  title,
  alias,
  album,
  provenance,
  releaseId,
  coverUrl,
  highResCoverUrl,
  spotifyTrackUrl,
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayCover = highResCoverUrl || coverUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-lightbox-title"
      data-testid="cover-lightbox-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm sm:max-w-md bg-card rounded-lg border border-line-soft shadow-xs overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-paper border-b border-line-soft">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="inline-block h-2 w-2 rounded-full border border-ink bg-band shrink-0"
              aria-hidden="true"
            />
            <span
              id="cover-lightbox-title"
              className="font-mono text-xs font-bold text-ink uppercase tracking-wider truncate"
            >
              {t("slips.song.jacketModalTitle", "官方唱片封套")}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-6 w-6 rounded border border-line-soft bg-paper hover:bg-tape/40 text-ink text-xs font-bold transition-colors cursor-pointer select-none"
            aria-label={t("common.close", "關閉")}
            title={t("common.close", "關閉")}
            data-testid="cover-lightbox-close-btn"
          >
            ✕
          </button>
        </div>

        {/* High-res Image Stage */}
        <div className="relative aspect-square w-full bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
          {displayCover ? (
            <img
              src={displayCover}
              alt={t("slips.song.albumJacketAlt", "《{title}》唱片封面", { title })}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-muted font-mono text-xs">
              {t("slips.song.unreleasedJacket", "未正式發行作品（黑膠唱片）")}
            </div>
          )}
        </div>

        {/* Caption & Metadata Footer */}
        <div className="p-3.5 bg-card flex flex-col gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-black text-lg text-ink leading-tight truncate">
              {title}
            </h3>
            <div className="flex flex-col gap-0.5 mt-1 font-mono text-xs text-muted">
              {alias && <div className="truncate">{alias}</div>}
              {provenance ? (
                <div className="text-ink/80 font-medium text-pretty">{provenance}</div>
              ) : album ? (
                <div>· {album}</div>
              ) : null}
            </div>
          </div>

          {(releaseId || spotifyTrackUrl) && (
            <div className="pt-2 border-t border-line-soft/80 flex items-center justify-between gap-2 flex-wrap">
              {releaseId ? (
                <a
                  href={routeHash.releases({ tab: "discography", id: releaseId })}
                  onClick={onClose}
                  data-testid="cover-lightbox-release-btn"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-ink/30 bg-tape hover:bg-tape-tint text-ink font-mono text-xs font-bold transition-colors no-underline cursor-pointer"
                  title={t("slips.song.viewReleaseDetails", "查看實體發行規格與曲目")}
                >
                  <span>💿 {t("slips.song.viewReleaseDetails", "查看實體發行規格")} ➔</span>
                </a>
              ) : (
                <span />
              )}

              {spotifyTrackUrl && (
                <a
                  href={spotifyTrackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] border border-line-soft bg-paper hover:bg-band hover:border-band hover:text-band-ink text-ink font-mono text-xs font-bold transition-colors no-underline cursor-pointer"
                  title={t("slips.song.listenOnSpotify", "在 Spotify 聆聽")}
                >
                  <span>🎧 {t("slips.song.listenOnSpotify", "在 Spotify 聆聽")} ↗</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
