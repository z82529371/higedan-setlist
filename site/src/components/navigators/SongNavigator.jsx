import { PaginationPills, PAGE_SIZE } from "./PaginationPills.jsx";
import { ALBUM_ORDER } from "../../lib/constants.js";
import { getSongAlbum } from "../../lib/domain.js";
import { trackKey } from "../../lib/track.js";

export function SongNavigator({
  isDrawer = false,
  draftState,
  setDraftState,
  songSortMode,
  setSongSortMode,
  selAlbum,
  setSelAlbum,
  selSong,
  songPage,
  setSongPage,
  allUsedSongs,
  songsSortedByCount,
  filteredSongs,
  pagedSongs,
  trackShows,
  handleSelectSong,
}) {
    const curSortMode = isDrawer && draftState ? draftState.songSortMode : songSortMode;
    const curAlbum = isDrawer && draftState ? draftState.album : selAlbum;
    const curSongId = isDrawer && draftState ? draftState.songId : selSong;
    const curPage = isDrawer && draftState ? draftState.songPage : songPage;

    const dFilteredSongs = isDrawer && draftState
      ? (curSortMode === "album"
          ? allUsedSongs.filter((s) => getSongAlbum(s) === curAlbum)
          : songsSortedByCount)
      : filteredSongs;

    const dPagedSongs = isDrawer && draftState
      ? (() => {
          const pageCount = Math.ceil(dFilteredSongs.length / PAGE_SIZE);
          const safePage = Math.min(curPage, Math.max(0, pageCount - 1));
          return dFilteredSongs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        })()
      : pagedSongs;

    return (
      <div
        className={`relative rounded-[6px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-sm space-y-4 ${
          isDrawer ? "border-0 shadow-none p-0 sm:p-0" : ""
        }`}
      >
        {/* Step 1: 排序/分類方式 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">🎵</span>
              <span>1. 歌曲分類方式</span>
            </span>
            <span className="font-mono text-[11px] text-muted tabular-nums">
              共 {allUsedSongs.length} 首曲目
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-[12px] sm:text-[13px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                curSortMode === "album"
                  ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                  : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
              }`}
              onClick={() => {
                if (isDrawer && draftState) {
                  setDraftState((prev) => ({ ...prev, songSortMode: "album", songPage: 0 }));
                } else {
                  setSongSortMode("album");
                  setSongPage(0);
                }
              }}
            >
              <span>💿 依發行專輯分類</span>
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-[12px] sm:text-[13px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                curSortMode === "count"
                  ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                  : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
              }`}
              onClick={() => {
                if (isDrawer && draftState) {
                  setDraftState((prev) => ({ ...prev, songSortMode: "count", songPage: 0 }));
                } else {
                  setSongSortMode("count");
                  setSongPage(0);
                }
              }}
            >
              <span>🏆 依演唱次數排行</span>
            </button>
          </div>
        </div>

        {/* Step 2 (若為專輯分類): 選擇專輯 */}
        {curSortMode === "album" && (
          <div className="pt-2 border-t border-line-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span aria-hidden="true">💿</span>
                <span>2. 選擇發行專輯</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {ALBUM_ORDER.map((alb) => {
                const isCur = curAlbum === alb;
                const sCount = allUsedSongs.filter(
                  (s) => getSongAlbum(s) === alb
                ).length;
                if (sCount === 0) return null;
                return (
                  <button
                    key={alb}
                    type="button"
                    onClick={() => {
                      if (isDrawer && draftState) {
                        setDraftState((prev) => ({ ...prev, album: alb, songPage: 0 }));
                      } else {
                        setSelAlbum(alb);
                        setSongPage(0);
                      }
                    }}
                    className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                      isCur
                        ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                        : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                    }`}
                  >
                    <span>{alb}</span>
                    <span className="font-mono text-[11px] opacity-75 tabular-nums">
                      ({sCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: 選擇歌曲 (十個十個顯示) */}
        <div className="pt-2 border-t border-line-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span aria-hidden="true">🎶</span>
              <span>
                {curSortMode === "album"
                  ? `3. 選擇歌曲（${curAlbum} · 共 ${dFilteredSongs.length} 首）`
                  : `2. 演唱次數排行（共 ${dFilteredSongs.length} 首）`}
              </span>
            </span>
          </div>
          <PaginationPills
            total={dFilteredSongs.length}
            pageSize={PAGE_SIZE}
            page={curPage}
            onPageChange={(p) => {
              if (isDrawer && draftState) {
                setDraftState((prev) => ({ ...prev, songPage: p }));
              } else {
                setSongPage(p);
              }
            }}
          />
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {dPagedSongs.map((s, idx) => {
              const isCur = s.id === curSongId;
              const cnt = (
                trackShows.get(trackKey("song", s.id)) ?? []
              ).length;
              const safePage = Math.min(
                curPage,
                Math.max(0, Math.ceil(dFilteredSongs.length / PAGE_SIZE) - 1)
              );
              const rankNum =
                curSortMode === "count"
                  ? safePage * PAGE_SIZE + idx + 1
                  : idx + 1;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (isDrawer && draftState) {
                      setDraftState((prev) => ({ ...prev, songId: s.id }));
                    } else {
                      handleSelectSong(s.id);
                    }
                  }}
                  className={`rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                    isCur
                      ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                      : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                  }`}
                >
                  {curSortMode === "count" && (
                    <span className="font-mono text-[10px] opacity-60 tabular-nums">
                      #{String(rankNum).padStart(2, "0")}
                    </span>
                  )}
                  <span className="font-bold">{s.title}</span>
                  <span className="font-mono text-[11px] opacity-75 tabular-nums">
                    ({cnt}場)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
}
