import { trackKey } from "../../lib/track.js";

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
      title="點擊滾動回單據頂部"
      aria-label="當前狀態導航列，點擊回單據頂部"
    >
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 flex items-center justify-between gap-3 py-1 sm:py-2 font-mono text-[10px] sm:text-[12px] tracking-wider sm:tracking-[0.14em] text-band-ink whitespace-nowrap overflow-hidden cursor-pointer">
        {/* Left: Dynamic Context Title */}
        <div className="truncate min-w-0 font-bold">
          {tab === "show" && <span>{current?.unit.title ?? ""}</span>}
          {tab === "song" && (
            <span>
              <span aria-hidden="true">🎵</span> {currentSongObj?.title || selSong}
              {currentSongObj?.unreleased
                ? "（未發行）"
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
                {current?.shows.length ?? 0} 場 · {current?.songShows.size ?? 0} 首歌曲
              </span>
              <span className="sm:hidden">{current?.shows.length ?? 0} 場</span>
            </>
          )}
          {tab === "song" && (
            <>
              <span className="hidden sm:inline opacity-45">●</span>
              <span className="hidden sm:inline">
                累計演唱 {(trackShows.get(trackKey("song", selSong)) ?? []).length} 場
              </span>
              <span className="sm:hidden">
                累計 {(trackShows.get(trackKey("song", selSong)) ?? []).length} 場
              </span>
              <span className="opacity-45">●</span>
              <span>歌曲檔案</span>
            </>
          )}
          {tab === "venue" && (
            <>
              <span className="hidden sm:inline opacity-45">●</span>
              <span className="hidden sm:inline">
                累計舉辦 {currentVenueObj?.shows?.length ?? 0} 場
              </span>
              <span className="sm:hidden">
                累計 {currentVenueObj?.shows?.length ?? 0} 場
              </span>
              <span className="opacity-45">●</span>
              <span>場地檔案</span>
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
            title="返回首頁"
            aria-label="返回首頁"
          >
            <span aria-hidden="true">🏠</span>
            <span>首頁</span>
          </button>
        </div>
      </div>
    </div>
  );
}
