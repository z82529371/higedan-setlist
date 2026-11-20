import { useState, useMemo } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { computeRankings } from "../../lib/ranking.js";
import { SLIP_ARTICLE, SLIP_TAPE } from "../../lib/constants.js";
import { TicketPerforationDivider, TicketBarcodeFooter } from "../slips/TicketCommon.jsx";
import { SongCoverThumbnail } from "../slips/AlbumJacketCard.jsx";
import { ArchiveFooter } from "../layout/ArchiveFooter.jsx";
import { BrandPageHeader } from "../common/BrandPageHeader.jsx";

export function RankingPage({
  allUsedSongs = [],
  allVenues = [],
  trackShows = new Map(),
  showById = new Map(),
  onSelectSong,
  onSelectVenue,
}) {
  const { t } = useI18n();
  const [boardType, setBoardType] = useState("allTime"); // "allTime" | "oneMan" | "festival" | "venue"

  const { allTimeSongs, oneManSongs, festivalSongs, topVenues } = useMemo(() => {
    return computeRankings({
      allUsedSongs,
      allVenues,
      trackShows,
      showById,
    });
  }, [allUsedSongs, allVenues, trackShows, showById]);

  // Current active list & config
  const currentList = useMemo(() => {
    if (boardType === "oneMan") return oneManSongs.slice(0, 20);
    if (boardType === "festival") return festivalSongs.slice(0, 20);
    if (boardType === "venue") return topVenues.slice(0, 10);
    return allTimeSongs.slice(0, 20);
  }, [boardType, allTimeSongs, oneManSongs, festivalSongs, topVenues]);

  const top3 = useMemo(() => currentList.slice(0, 3), [currentList]);
  const restList = useMemo(() => currentList.slice(3), [currentList]);

  const isVenueBoard = boardType === "venue";

  const handleItemClick = (item) => {
    if (isVenueBoard && onSelectVenue) onSelectVenue(item.name);
    else if (!isVenueBoard && onSelectSong) onSelectSong(item.id);
  };

  const renderRunnerUpCard = (item, rankLabel, orderClass, desktopMinHeight) => (
    <button
      type="button"
      onClick={() => handleItemClick(item)}
      className={`${orderClass} rounded-[3px] border-[1.5px] border-ink bg-card p-3 sm:p-5 shadow-[3px_3px_0_rgba(0,0,0,0.12)] dark:shadow-none text-left cursor-pointer hover:bg-tape-tint/30 touch-stamp transition-colors flex flex-col justify-between ${desktopMinHeight} relative group`}
    >
      {/* Desktop Top Row: Rank Badge + Play Rate */}
      <div className="hidden sm:flex items-center justify-between gap-2 w-full">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] bg-paper text-ink font-mono font-bold text-xs border border-ink/40">
          <span>{rankLabel}</span>
        </span>
        <span className="font-mono text-[11px] font-bold text-muted tabular-nums">
          {item.playRate.toFixed(1)}%
        </span>
      </div>

      {/* Main Content Row (Compact horizontal on mobile, vertical body on desktop) */}
      <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 w-full sm:my-3">
        <span className="sm:hidden shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-paper text-ink font-mono font-bold text-[11px] border border-ink/40">
          {rankLabel}
        </span>
        {!isVenueBoard && (
          <SongCoverThumbnail songId={item.id} title={item.title} size={48} />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm sm:text-lg text-ink group-hover:text-band-ink transition-colors truncate sm:whitespace-normal sm:line-clamp-2 leading-snug">
            {isVenueBoard ? item.name : item.title}
          </div>
          {!isVenueBoard && item.album && (
            <div className="text-[11px] text-muted mt-0.5 sm:mt-1 font-medium truncate flex items-center gap-1">
              <span>💿</span>
              <span className="truncate">{item.album}</span>
            </div>
          )}
          {isVenueBoard && item.prefecture && (
            <div className="text-[11px] text-muted mt-0.5 sm:mt-1 font-medium truncate flex items-center gap-1">
              <span>📍</span>
              <span className="truncate">{item.prefecture} · {item.country}</span>
            </div>
          )}
        </div>
        <div className="sm:hidden shrink-0 text-right">
          <div className="font-mono text-sm font-black text-ink tabular-nums leading-tight">
            {item.count} <span className="text-[11px] font-sans font-normal text-muted">{t("ranking.showsUnit", "場")}</span>
          </div>
          <div className="font-mono text-[10px] font-bold text-muted tabular-nums">
            {item.playRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Desktop Bottom Row: Year Range + Count */}
      <div className="hidden sm:flex pt-2 border-t border-line-soft items-baseline justify-between w-full">
        <span className="font-mono text-[10px] text-muted">
          {!isVenueBoard && item.firstYear ? `${item.firstYear}–${item.latestYear}` : ""}
        </span>
        <span className="font-mono text-base font-black text-ink tabular-nums">
          {item.count} <span className="text-xs font-sans font-normal text-muted">{t("ranking.showsUnit", "場")}</span>
        </span>
      </div>
    </button>
  );

  return (
    <div className="mx-auto max-w-[960px] px-3 sm:px-6 pt-8 pb-16 sm:py-8 select-none font-sans">
      {/* Main Ticket Receipt Card */}
      <article className={SLIP_ARTICLE}>
        {/* Washi Masking Tape Top Pin */}
        <div className={SLIP_TAPE} aria-hidden="true" />

        {/* Ticket Header Title Block (Compact on mobile) */}
        <header className="flex flex-col items-center text-center pb-3 sm:pb-4">
          <BrandPageHeader
            align="center"
            subBrand="LIVE RANKING"
            sectionLabel={t("ranking.title", "演出排行")}
            subtitle={t("ranking.subtitle", "歷年現場演出歌曲與場館累積次數統計")}
          />

          {/* Stats Badge */}
          <div className="mt-2.5 sm:mt-3.5 flex items-center justify-center gap-2">
            <span
              data-testid="ranking-stats-badge"
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-tape px-2.5 sm:px-3 py-0.5 sm:py-1 font-mono text-[11px] sm:text-[13px] font-extrabold text-ink shadow-2xs"
            >
              <span aria-hidden="true">🎖️</span>
              <span>
                {boardType === "venue"
                  ? `${topVenues.length} VENUES`
                  : `${allTimeSongs.length} SONGS ARCHIVED`}
              </span>
            </span>
          </div>
        </header>

        {/* Perforation Divider */}
        <TicketPerforationDivider />

        {/* Sub-board Selector Tabs: single-row horizontal scroll on mobile, wrapped on desktop */}
        <div
          className="mt-4 mb-5 flex items-center flex-nowrap overflow-x-auto scrollbar-none gap-1.5 pb-3 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-start sm:gap-2 border-b border-line-soft"
          role="tablist"
          aria-label={t("ranking.title", "演出排行")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={boardType === "allTime"}
            onClick={() => setBoardType("allTime")}
            className={`shrink-0 rounded-[3px] px-2.5 py-1 sm:px-3.5 sm:py-1.5 font-mono text-[11px] sm:text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              boardType === "allTime"
                ? "bg-band text-band-ink border-[1.5px] border-ink shadow-xs"
                : "bg-paper text-ink border border-ink/30 hover:bg-tape-tint/50"
            }`}
          >
            <span aria-hidden="true">🌟</span>
            <span>{t("ranking.tabAllTime", "歌曲總榜")}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={boardType === "oneMan"}
            onClick={() => setBoardType("oneMan")}
            className={`shrink-0 rounded-[3px] px-2.5 py-1 sm:px-3.5 sm:py-1.5 font-mono text-[11px] sm:text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              boardType === "oneMan"
                ? "bg-band text-band-ink border-[1.5px] border-ink shadow-xs"
                : "bg-paper text-ink border border-ink/30 hover:bg-tape-tint/50"
            }`}
          >
            <span aria-hidden="true">🎪</span>
            <span>{t("ranking.tabOneMan", "專場巡演榜")}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={boardType === "festival"}
            onClick={() => setBoardType("festival")}
            className={`shrink-0 rounded-[3px] px-2.5 py-1 sm:px-3.5 sm:py-1.5 font-mono text-[11px] sm:text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              boardType === "festival"
                ? "bg-band text-band-ink border-[1.5px] border-ink shadow-xs"
                : "bg-paper text-ink border border-ink/30 hover:bg-tape-tint/50"
            }`}
          >
            <span aria-hidden="true">🎸</span>
            <span>{t("ranking.tabFestival", "音樂節出勤榜")}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={boardType === "venue"}
            onClick={() => setBoardType("venue")}
            className={`shrink-0 rounded-[3px] px-2.5 py-1 sm:px-3.5 sm:py-1.5 font-mono text-[11px] sm:text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              boardType === "venue"
                ? "bg-band text-band-ink border-[1.5px] border-ink shadow-xs"
                : "bg-paper text-ink border border-ink/30 hover:bg-tape-tint/50"
            }`}
          >
            <span aria-hidden="true">🏟️</span>
            <span>{t("ranking.tabVenue", "登場場館榜")}</span>
          </button>
        </div>

        {/* Top 3 Physical Podium (實體立體頒獎台) */}
        {top3.length > 0 && (
          <section className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 items-end">
              {/* Rank 2 (Silver - Left Step) */}
              {top3[1] && renderRunnerUpCard(top3[1], "#02", "order-2 sm:order-1", "sm:min-h-[195px]")}

              {/* Rank 1 (Gold - Elevated Center) */}
              {top3[0] && (
                <button
                  type="button"
                  onClick={() => handleItemClick(top3[0])}
                  className="order-1 sm:order-2 rounded-[3px] border-[2px] border-ink bg-card p-3.5 sm:p-6 shadow-[4px_4px_0_rgba(0,0,0,0.16)] dark:shadow-none text-left cursor-pointer hover:bg-tape-tint/30 touch-stamp transition-colors flex flex-col justify-between sm:min-h-[225px] relative overflow-hidden group"
                >
                  {/* Gold Banner Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-band" />
                  
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-[2px] bg-band text-band-ink font-mono font-black text-xs border border-ink/40">
                      <span>#01</span>
                    </span>
                    <span className="font-mono text-[11px] sm:text-xs font-bold text-band-ink bg-tape px-1.5 py-0.5 rounded border border-ink/20 tabular-nums">
                      {top3[0].playRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="my-2.5 sm:my-3 flex items-start gap-3 sm:gap-3.5">
                    {!isVenueBoard && (
                      <SongCoverThumbnail songId={top3[0].id} title={top3[0].title} size={60} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-base sm:text-xl text-ink group-hover:text-band-ink transition-colors line-clamp-2 leading-tight">
                        {isVenueBoard ? top3[0].name : top3[0].title}
                      </div>
                      {!isVenueBoard && top3[0].album && (
                        <div className="text-[11px] sm:text-xs text-muted mt-1 font-medium truncate flex items-center gap-1">
                          <span>💿</span>
                          <span>{top3[0].album}</span>
                        </div>
                      )}
                      {isVenueBoard && top3[0].prefecture && (
                        <div className="text-[11px] sm:text-xs text-muted mt-1 font-medium truncate flex items-center gap-1">
                          <span>📍</span>
                          <span>{top3[0].prefecture} · {top3[0].country}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line-soft flex items-baseline justify-between w-full">
                    <span className="font-mono text-[10px] sm:text-[11px] text-muted">
                      {!isVenueBoard && top3[0].firstYear ? `${top3[0].firstYear}–${top3[0].latestYear}` : ""}
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-black text-ink tabular-nums">
                      {top3[0].count} <span className="text-xs font-sans font-normal text-muted">{t("ranking.showsUnit", "場")}</span>
                    </span>
                  </div>
                </button>
              )}

              {/* Rank 3 (Bronze - Right Step) */}
              {top3[2] && renderRunnerUpCard(top3[2], "#03", "order-3", "sm:min-h-[180px]")}
            </div>

            {/* Continuous Architectural Podium Base Step */}
            <div className="hidden sm:grid grid-cols-3 gap-3 mt-1.5">
              <div className="h-4 bg-paper/80 border border-ink/20 rounded-b-[3px] flex items-center justify-center font-mono text-[9px] text-muted font-bold tracking-widest uppercase">
                STEP II
              </div>
              <div className="h-6 bg-tape/40 border border-ink/30 rounded-b-[3px] flex items-center justify-center font-mono text-[10px] text-ink font-black tracking-widest uppercase shadow-2xs">
                ★ 1ST PODIUM ★
              </div>
              <div className="h-3 bg-paper/80 border border-ink/20 rounded-b-[3px] flex items-center justify-center font-mono text-[9px] text-muted font-bold tracking-widest uppercase">
                STEP III
              </div>
            </div>
          </section>
        )}

        {/* 4 to 20 Ranked Progress List (Concert Setlist Style Run Sheet) */}
        {restList.length > 0 && (
          <section className="rounded-[3px] border border-ink/30 bg-card p-3 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-line-soft font-mono text-[11px] font-bold text-muted uppercase tracking-wider">
              <span>{t("ranking.rankTableRankTitle", "名次 · 項目")}</span>
              <span>{t("ranking.rankTableCountTitle", "演出次數")}</span>
            </div>

            <div className="divide-y divide-line-soft">
              {restList.map((item) => {
                const rankFormatted = String(item.rank).padStart(2, "0");
                const label = isVenueBoard ? item.name : item.title;
                const subLabel = isVenueBoard
                  ? `${item.prefecture || item.country || ""}`
                  : item.album || "";

                return (
                  <button
                    key={isVenueBoard ? item.name : item.id}
                    type="button"
                    onClick={() => {
                      if (isVenueBoard && onSelectVenue) onSelectVenue(item.name);
                      else if (!isVenueBoard && onSelectSong) onSelectSong(item.id);
                    }}
                    className="w-full text-left py-2.5 px-2 hover:bg-tape-tint/50 touch-stamp transition-colors cursor-pointer rounded-[2px] group relative overflow-hidden"
                  >
                    {/* Background Progress Fill Bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-band/15 rounded-[2px] transition-all pointer-events-none"
                      style={{ width: `${Math.max(4, item.percent)}%` }}
                      aria-hidden="true"
                    />

                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="font-mono text-xs font-bold text-muted w-7 shrink-0 tabular-nums">
                          #{rankFormatted}
                        </span>
                        {!isVenueBoard && (
                          <SongCoverThumbnail songId={item.id} title={item.title} size={36} />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-ink group-hover:text-band-ink transition-colors truncate block">
                            {label}
                          </span>
                          {subLabel && (
                            <span className="text-[10px] sm:text-[11px] text-muted block truncate mt-0.5">
                              {subLabel}
                              {!isVenueBoard && item.firstYear && (
                                <span className="font-mono ml-1.5 opacity-75">
                                  ({item.firstYear}–{item.latestYear})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2.5">
                        <div className="hidden sm:flex flex-col items-end w-20">
                          <div className="w-full h-1.5 bg-paper border border-ink/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-band"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-muted tabular-nums mt-0.5">
                            {item.playRate.toFixed(1)}%
                          </span>
                        </div>

                        <span className="font-mono text-xs sm:text-sm font-black text-ink tabular-nums">
                          {item.count}
                          <span className="text-[11px] font-sans ml-0.5 font-normal text-muted">
                            {t("ranking.showsUnit", "場")}
                          </span>
                        </span>
                        <span className="text-muted group-hover:translate-x-0.5 transition-transform text-xs" aria-hidden="true">
                          →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Ticket Barcode Footer */}
        <TicketBarcodeFooter
          serial="HIGEDAN-CONCERT-RANKING-DATA"
          label={t("ranking.title", "演出排行")}
        />
      </article>

      <ArchiveFooter />
    </div>
  );
}

export default RankingPage;
