import { trackKey } from "../../lib/track.js";
import { useI18n } from "../../lib/i18n.jsx";

export function ArchiveStatusBar({
  tab,
  current,
  selSong,
  currentSongObj,
  selVenue,
  currentVenueObj,
  trackShows,
  slipRef,
  handleReturnHome,
}) {
  const { t } = useI18n();
  return (
    <div
      className="sticky top-0 z-40 w-full bg-band border-b border-ink/20 shadow-xs select-none"
      onClick={() => {
        if (slipRef.current) {
          slipRef.current.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      role="button"
      tabIndex={0}
      title={t("statusBar.backToTopTitle", "點擊滾動回單據頂部")}
      aria-label={t("statusBar.backToTopAria", "當前狀態導航列，點擊回單據頂部")}
    >
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 flex items-center justify-between gap-3 py-1 sm:py-2 font-mono text-[10px] sm:text-[12px] tracking-wider sm:tracking-[0.14em] text-band-ink whitespace-nowrap overflow-hidden cursor-pointer">
        {/* Left: Dynamic Context Title */}
        <div className="truncate min-w-0 font-bold">
          {tab === "show" && <span>{current?.unit.title ?? ""}</span>}
          {tab === "song" && (
            <span>
              <span aria-hidden="true">🎵</span> {currentSongObj?.title || selSong}
              {currentSongObj?.unreleased
                ? t("statusBar.unreleasedSuffix", "（未發行）")
                : currentSongObj?.album
                ? `（${currentSongObj.album}）`
                : ""}
            </span>
          )}
          {tab === "venue" && (
            <span>
              <span aria-hidden="true">🏛️</span> {selVenue}
              {currentVenueObj?.city ? `（${currentVenueObj.city}）` : ""}
            </span>
          )}
        </div>

        {/* Right: Dynamic Summary Metadata + Home Button on Far Right */}
        <div className="shrink-0 flex items-center gap-1.5 sm:gap-3 font-bold opacity-90 sm:opacity-100">
          {tab === "show" && (
            <>
              <span className="hidden sm:inline opacity-45">●</span>
              <span className="hidden sm:inline">
                {t("statusBar.showSummary", "{shows} 場 · {songs} 首歌曲", { shows: current?.shows.length ?? 0, songs: current?.songShows.size ?? 0 })}
              </span>
              <span className="sm:hidden">{t("statusBar.showSummaryMobile", "{shows} 場", { shows: current?.shows.length ?? 0 })}</span>
            </>
          )}
          {tab === "song" && (
            <>
              <span className="hidden sm:inline opacity-45">●</span>
              <span className="hidden sm:inline">
                {t("statusBar.songTotal", "累計演唱 {count} 場", { count: (trackShows.get(trackKey("song", selSong)) ?? []).length })}
              </span>
              <span className="sm:hidden">
                {t("statusBar.songTotalMobile", "累計 {count} 場", { count: (trackShows.get(trackKey("song", selSong)) ?? []).length })}
              </span>
              <span className="opacity-45">●</span>
              <span>{t("statusBar.songArchive", "歌曲檔案")}</span>
            </>
          )}
          {tab === "venue" && (
            <>
              <span className="hidden sm:inline opacity-45">●</span>
              <span className="hidden sm:inline">
                {t("statusBar.venueTotal", "累計舉辦 {count} 場", { count: currentVenueObj?.shows?.length ?? 0 })}
              </span>
              <span className="sm:hidden">
                {t("statusBar.venueTotalMobile", "累計 {count} 場", { count: currentVenueObj?.shows?.length ?? 0 })}
              </span>
              <span className="opacity-45">●</span>
              <span>{t("statusBar.venueArchive", "場地檔案")}</span>
            </>
          )}

          <span className="hidden sm:inline opacity-35 select-none shrink-0">|</span>

          {/* Home Action Button (Desktop only; on mobile, Floating Dock already has Home button) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReturnHome();
            }}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-band-ink/10 hover:bg-band-ink/20 active:scale-95 text-band-ink font-bold border border-band-ink/30 transition-all cursor-pointer text-[10px] sm:text-[11px] shrink-0 shadow-2xs"
            title={t("statusBar.backHomeTitle", "返回首頁")}
            aria-label={t("statusBar.backHomeAria", "返回首頁")}
          >
            <span aria-hidden="true">🏠</span>
            <span>{t("statusBar.home", "首頁")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
