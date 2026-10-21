import { useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { routeHash } from "../../lib/routes.js";

export function LiveSongChecklistDrawer({
  isOpen,
  onClose,
  milestones,
  onFilterBySong,
  currentFilterSongId,
  initialFilter = "all",
}) {
  const { t, locale } = useI18n();
  const [activeFilter, setActiveFilter] = useState(initialFilter); // "all" | "unlocked" | "locked"

  // Sync initialFilter when provided or when modal opens
  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !milestones) return null;

  const albumGroups = milestones.albumGroups || [];
  const totalUnlocked = milestones.unlockedSongCount || 0;
  const totalCatalog = milestones.totalCatalogSongs || 0;
  const totalLocked = Math.max(0, totalCatalog - totalUnlocked);
  const overallPercentage = milestones.coveragePercentage || 0;

  return (
    <div
      data-testid="live-song-checklist-drawer"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-ink/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("ticketBook.checklistTitle", "現場曲庫解鎖成就圖鑑")}
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <div className="relative max-h-[90vh] sm:max-h-[85vh] w-full sm:max-w-[640px] rounded-t-[8px] sm:rounded-[8px] border-t-[2px] sm:border-[1.5px] border-x-[2px] sm:border-x-[1.5px] border-ink bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center pt-2 pb-1" aria-hidden="true">
          <div className="h-1.5 w-12 rounded-full bg-line-soft" />
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-line-soft px-4 sm:px-5 py-3 bg-paper/60">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              📖
            </span>
            <div>
              <h2 className="m-0 font-display text-[15px] sm:text-[16px] font-bold text-ink leading-tight">
                {t("ticketBook.checklistTitle", "現場曲庫解鎖成就圖鑑")}
              </h2>
              <p className="m-0 text-[10px] sm:text-[11px] font-bold text-ink uppercase tracking-wider">
                {t("ticketBook.checklistSubtitle", "LIVE SONG CHECKLIST // REPERTOIRE ARCHIVE")}
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="song-checklist-close-btn"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-paper border border-ink/20 text-ink hover:bg-tape-tint cursor-pointer font-bold text-xs"
            aria-label={t("ticketBook.clearFilter", "關閉")}
          >
            ✕
          </button>
        </div>

        {/* Global Progress & Filter Tabs Toolbar */}
        <div className="border-b border-line-soft bg-paper/40 px-4 sm:px-5 py-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] sm:text-[12px] font-bold text-ink">
            <span>
              {t("ticketBook.checklistProgress", "共已解鎖 {unlocked} / {total} 首（{percentage}%）", {
                unlocked: totalUnlocked,
                total: totalCatalog,
                percentage: overallPercentage,
              })}
            </span>
            <div className="h-2 w-full sm:w-36 bg-line-soft rounded-full overflow-hidden border border-ink/20">
              <div
                className="h-full bg-band transition-all duration-300"
                style={{ width: `${Math.min(100, overallPercentage)}%` }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              data-testid="checklist-filter-all"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer border ${
                activeFilter === "all"
                  ? "bg-band text-band-ink border-ink shadow-2xs"
                  : "bg-card text-ink border-ink/30 hover:bg-tape-tint"
              }`}
            >
              {t("ticketBook.filterAll", "全部")} ({totalCatalog})
            </button>
            <button
              type="button"
              data-testid="checklist-filter-unlocked"
              onClick={() => setActiveFilter("unlocked")}
              className={`px-3 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer border ${
                activeFilter === "unlocked"
                  ? "bg-band text-band-ink border-ink shadow-2xs"
                  : "bg-card text-ink border-ink/30 hover:bg-tape-tint"
              }`}
            >
              {t("ticketBook.filterUnlocked", "僅看已解鎖")} ({totalUnlocked})
            </button>
            <button
              type="button"
              data-testid="checklist-filter-locked"
              onClick={() => setActiveFilter("locked")}
              className={`px-3 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer border ${
                activeFilter === "locked"
                  ? "bg-band text-band-ink border-ink shadow-2xs"
                  : "bg-card text-ink border-ink/30 hover:bg-tape-tint"
              }`}
            >
              {t("ticketBook.filterLocked", "尚未解鎖")} ({totalLocked})
            </button>
          </div>
        </div>

        {/* Scrollable Song Album Groups */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 space-y-4">
          {(() => {
            const groupsWithVisible = albumGroups.map((group) => {
              const visibleSongs = group.songs.filter((song) => {
                if (activeFilter === "unlocked") return song.unlocked;
                if (activeFilter === "locked") return !song.unlocked;
                return true;
              });
              return { group, visibleSongs };
            }).filter(({ visibleSongs }) => visibleSongs.length > 0);

            if (groupsWithVisible.length === 0) {
              return (
                <div
                  data-testid="checklist-empty-state"
                  className="py-12 text-center rounded-[6px] border border-dashed border-line-soft bg-paper/30"
                >
                  <p className="font-bold text-[13px] sm:text-[14px] text-ink m-0">
                    {t("ticketBook.noChecklistMatches", "目前篩選條件下無符合的曲目")}
                  </p>
                </div>
              );
            }

            return groupsWithVisible.map(({ group, visibleSongs }) => {
              const isAllComplete = group.completionPercentage >= 100;
              const albumTitle = t("albumGroups." + group.album, group.album);

              return (
                <section
                  key={group.album}
                  className="rounded-[6px] border border-line-soft bg-paper/20 p-3"
                >
                  {/* Album Header & Completion Bar */}
                  <div className="flex flex-col gap-1.5 border-b border-line-soft/80 pb-2 mb-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span aria-hidden="true">💿</span>
                        <h3 className="m-0 font-display text-[13px] sm:text-[14px] font-bold text-ink truncate">
                          {albumTitle}
                        </h3>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isAllComplete && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-band text-band-ink font-mono text-[10px] font-black px-1.5 py-0.5 border border-ink shadow-2xs">
                            <span>🏆</span>
                            <span>{t("ticketBook.albumComplete", "COMPLETE")}</span>
                          </span>
                        )}
                        <span className="font-mono text-[11px] font-bold text-ink">
                          {group.unlockedCount} / {group.totalSongs} ({group.completionPercentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Album Progress Bar */}
                    <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden border border-ink/10">
                      <div
                        className="h-full bg-band transition-all duration-300"
                        style={{ width: `${Math.min(100, group.completionPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Song List */}
                  <div className="divide-y divide-line-soft/60">
                    {visibleSongs.map((song) => {
                      const isFiltered = currentFilterSongId === song.id;

                      if (song.unlocked) {
                        return (
                          <div
                            key={song.id}
                            onClick={() => onFilterBySong?.(song.id, song.title)}
                            className="flex items-center justify-between gap-2 py-2 group cursor-pointer hover:bg-tape-tint/30 rounded px-1 -mx-1 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0 font-bold text-ink" aria-hidden="true">
                                🎵
                              </span>
                              <span className="font-bold text-[13px] text-ink truncate group-hover:text-band-ink transition-colors">
                                {song.title}
                              </span>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {/* Unlocked Stamp Badge */}
                              <span className="inline-flex items-center gap-1 rounded-[3px] border border-ink/40 bg-tape px-2 py-0.5 font-mono text-[11px] font-bold text-ink shadow-2xs">
                                <span>✓</span>
                                <span>{t("ticketBook.unlockedBadge", "已解鎖")}</span>
                                <span>({t("ticketBook.timesUnit", "{count} 次", { count: song.count })})</span>
                              </span>

                              {/* Click to filter timeline */}
                              <button
                                type="button"
                                data-testid={`checklist-song-${song.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFilterBySong?.(song.id, song.title);
                                }}
                                className={`inline-flex items-center gap-1 rounded-[3px] border px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer touch-stamp ${
                                  isFiltered
                                    ? "bg-band text-band-ink border-ink"
                                    : "border-ink/30 bg-card text-ink hover:bg-tape-tint"
                                }`}
                                title={t("ticketBook.filterBySong", "篩選參戰場次 →")}
                              >
                                <span>{t("ticketBook.filterBySong", "篩選參戰場次 →")}</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // Locked song
                      return (
                        <div
                          key={song.id}
                          className="flex items-center justify-between gap-2 py-2 group"
                        >
                          <a
                            href={routeHash.song(song.id, { lang: locale })}
                            className="flex items-center gap-2 min-w-0 no-underline text-inherit hover:underline"
                          >
                            <span className="shrink-0 text-ink/70" aria-hidden="true">
                              🔒
                            </span>
                            <span className="font-medium text-[13px] text-ink truncate">
                              {song.title}
                            </span>
                          </a>

                          <div className="shrink-0 flex items-center gap-2">
                            {/* Locked Stamp Badge (AAA contrast with text-ink) */}
                            <span className="inline-flex items-center rounded-[3px] border border-dashed border-ink/40 bg-paper/60 px-2 py-0.5 text-[11px] font-bold text-ink">
                              {t("ticketBook.lockedStamp", "尚未在現場解鎖")}
                            </span>

                            {/* Link to song slip */}
                            <a
                              href={routeHash.song(song.id, { lang: locale })}
                              data-testid={`checklist-song-${song.id}`}
                              className="inline-flex items-center gap-1 rounded-[3px] border border-ink/30 bg-paper px-2 py-0.5 text-[11px] font-bold text-ink hover:bg-tape-tint transition-colors no-underline"
                              title={t("ticketBook.jumpToSong", "查看歌曲歷史檔案 →")}
                            >
                              <span>{t("ticketBook.jumpToSong", "查看歌曲歷史檔案 →")}</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
