import { useState, useMemo } from "react";
import { ALBUM_ORDER } from "../../lib/constants.js";
import { getSongAlbum } from "../../lib/domain.js";
import { trackKey } from "../../lib/track.js";
import { useI18n } from "../../lib/i18n.jsx";
import { SongCoverThumbnail } from "../slips/AlbumJacketCard.jsx";

export function SongNavigator({
  isDrawer = false,
  draftState,
  setDraftState,
  songSortMode = "album",
  setSongSortMode,
  selAlbum = ALBUM_ORDER[0],
  setSelAlbum,
  selSong,
  allUsedSongs = [],
  trackShows = new Map(),
  handleSelectSong,
}) {
  const { t } = useI18n();
  const [localQuery, setLocalQuery] = useState("");

  const curSortMode = isDrawer && draftState ? draftState.songSortMode : songSortMode;
  const curAlbum = isDrawer && draftState ? draftState.album : selAlbum;
  const curSongId = isDrawer && draftState ? draftState.songId : selSong;

  // Filter songs based on current album and search query
  const displayedSongs = useMemo(() => {
    let list = allUsedSongs;

    // Album filter
    if (curAlbum) {
      list = list.filter((s) => getSongAlbum(s) === curAlbum);
    }

    // Search query filter
    const q = localQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const title = (s.title || "").toLowerCase();
        const id = (s.id || "").toLowerCase();
        return title.includes(q) || id.includes(q);
      });
    }

    // Sort order
    if (curSortMode === "count") {
      return [...list].sort((a, b) => {
        const cntA = trackShows.get(trackKey("song", a.id))?.length || 0;
        const cntB = trackShows.get(trackKey("song", b.id))?.length || 0;
        return cntB - cntA || String(a.title || a.id || "").localeCompare(String(b.title || b.id || ""));
      });
    }

    return list;
  }, [allUsedSongs, curAlbum, localQuery, curSortMode, trackShows]);

  const handleAlbumChange = (alb) => {
    if (isDrawer && setDraftState) {
      setDraftState((prev) => ({ ...prev, album: alb }));
    } else if (setSelAlbum) {
      setSelAlbum(alb);
    }
  };

  const handleSortChange = (mode) => {
    if (isDrawer && setDraftState) {
      setDraftState((prev) => ({ ...prev, songSortMode: mode }));
    } else if (setSongSortMode) {
      setSongSortMode(mode);
    }
  };

  const handleSongClick = (songId) => {
    if (isDrawer && setDraftState) {
      setDraftState((prev) => ({ ...prev, songId }));
    } else if (handleSelectSong) {
      handleSelectSong(songId);
    }
  };

  return (
    <div
      className={`relative rounded-[6px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-sm space-y-4 ${
        isDrawer ? "border-0 shadow-none p-0 sm:p-0" : ""
      }`}
    >
      {/* Step 1: 選擇專輯世代 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <span aria-hidden="true">💿</span>
            <span>{t("navigators.selectAlbum", "1. 發行專輯")}</span>
          </span>
          <span className="font-mono text-[11px] text-muted tabular-nums">
            {t("navigators.songsCount", "共 {count} 首曲目").replace("{count}", String(allUsedSongs.length))}
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
                onClick={() => handleAlbumChange(alb)}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                  isCur
                    ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                    : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                }`}
              >
                <span>{t("albumGroups." + alb, alb)}</span>
                <span className="font-mono text-[11px] opacity-75 tabular-nums">
                  ({sCount})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: 排序與即時搜尋過濾 */}
      <div className="pt-2 border-t border-line-soft flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className={`rounded-[3px] px-2.5 py-1 text-[12px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
              curSortMode === "album"
                ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
            }`}
            onClick={() => handleSortChange("album")}
          >
            <span>{t("songNav.byTracklist", "💿 依發行曲序")}</span>
          </button>
          <button
            type="button"
            className={`rounded-[3px] px-2.5 py-1 text-[12px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
              curSortMode === "count"
                ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
            }`}
            onClick={() => handleSortChange("count")}
          >
            <span>{t("songNav.bySongCount", "🏆 依演唱次數排行")}</span>
          </button>
        </div>

        {/* Search input filter */}
        <div className="relative w-full sm:w-48">
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={t("songNav.searchPlaceholder", "搜尋歌名...")}
            className="w-full text-xs px-2.5 py-1 rounded-[3px] border border-line-soft bg-paper text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => setLocalQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs font-mono"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Step 3: 曲目清單 */}
      <div className="pt-2 border-t border-line-soft">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <span aria-hidden="true">🎶</span>
            <span>
              {t("navigators.selectSong", "2. 選擇歌曲")}
              <span className="opacity-75 font-normal ml-1">
                ({t("songNav.filteredCount", "共 {count} 首", { count: displayedSongs.length })})
              </span>
            </span>
          </span>
        </div>

        {displayedSongs.length === 0 ? (
          <div className="text-center py-6 text-muted text-xs font-mono">
            {t("songNav.noResults", "無相符歌曲")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-[360px] overflow-y-auto pr-1">
            {displayedSongs.map((s, idx) => {
              const isCur = s.id === curSongId;
              const cnt = (
                trackShows.get(trackKey("song", s.id)) ?? []
              ).length;
              const rankNum = idx + 1;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSongClick(s.id)}
                  className={`rounded-full pl-1.5 pr-3 py-1 text-[12px] sm:text-[13px] font-medium transition-colors motion-reduce:transition-none cursor-pointer inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                    isCur
                      ? "bg-band text-band-ink font-bold shadow-xs border border-ink/40"
                      : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                  }`}
                >
                  <SongCoverThumbnail songId={s.id} title={s.title} size={20} rounded="rounded-full" />
                  {curSortMode === "count" && (
                    <span className="font-mono text-[10px] opacity-60 tabular-nums">
                      #{String(rankNum).padStart(2, "0")}
                    </span>
                  )}
                  <span className="font-bold">{s.title}</span>
                  <span className="font-mono text-[11px] opacity-75 tabular-nums">
                    ({cnt}{t("navigators.showsUnit", "場")})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SongNavigator;
