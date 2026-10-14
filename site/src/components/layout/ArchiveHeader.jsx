import { queryTabClass } from "../../lib/constants.js";

export function ArchiveHeader({
  totalAllShows,
  allUsedSongs,
  allVenues,
  categoriesCount,
  tab,
  setTab,
  setQ,
  setIsFilterDrawerOpen,
}) {
  return (
    <>
      <header className="pb-0 pt-3.5 sm:pt-6">
        <p className="m-0 mb-1.5 sm:mb-2 font-mono text-[11px] sm:text-[12px] tracking-[0.2em] text-muted font-bold uppercase">
          LIVE PERFORMANCE &amp; SETLIST ARCHIVE
        </p>
        <h1 className="m-0 font-display text-[clamp(17px,4.5vw,44px)] font-extrabold leading-tight tracking-tight">
          Official髭男dism <span className="font-bold text-band-ink">Setlist 檔案庫</span>
        </h1>
        <p className="mt-2 mb-0 text-[12px] sm:text-[14px] text-muted leading-relaxed">
          場次與曲目雙向檔案庫。收錄 2012 年地下獨立時期至當前巡演的完整現場足跡。
        </p>
        <div className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto sm:flex-wrap font-mono text-[11px] sm:text-[12px] text-ink scrollbar-none">
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">📅</span> 2012–2026 年
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">🎫</span> {totalAllShows} 場公開演出
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">🎭</span> {categoriesCount} 大演出型態
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">🎵</span> {allUsedSongs.length} 首原創曲目
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">📍</span> {allVenues.length} 處歷史場館
          </span>
        </div>
      </header>

      {/* Top 3 Query Tabs */}
      <div
        className="mt-2.5 sm:mt-4 mb-3 grid w-full grid-cols-3 divide-x-[1.5px] divide-ink overflow-hidden rounded-[4px] border-[1.5px] border-ink bg-card shadow-sm"
        role="group"
        aria-label="查詢方向"
      >
        <button
          type="button"
          className={`${queryTabClass(tab === "show")} border-r-[1.5px] border-ink relative`}
          onClick={() => {
            setTab("show");
            setQ("");
            setIsFilterDrawerOpen(false);
          }}
          aria-pressed={tab === "show"}
        >
          <span aria-hidden="true">🎫</span>
          <span>場次</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({totalAllShows})
          </span>
        </button>

        <button
          type="button"
          className={`${queryTabClass(tab === "song")} border-r-[1.5px] border-ink relative`}
          onClick={() => {
            setTab("song");
            setQ("");
            setIsFilterDrawerOpen(false);
          }}
          aria-pressed={tab === "song"}
        >
          <span aria-hidden="true">🎵</span>
          <span>歌曲</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({allUsedSongs.length})
          </span>
        </button>

        <button
          type="button"
          className={`${queryTabClass(tab === "venue")} relative`}
          onClick={() => {
            setTab("venue");
            setQ("");
            setIsFilterDrawerOpen(false);
          }}
          aria-pressed={tab === "venue"}
        >
          <span aria-hidden="true">🏛️</span>
          <span>場地</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({allVenues.length})
          </span>
        </button>
      </div>
    </>
  );
}
