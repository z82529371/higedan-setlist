import { useState, useMemo } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { computeRankings } from "../../lib/ranking.js";
import { SLIP_ARTICLE, SLIP_TAPE } from "../../lib/constants.js";
import { TicketPerforationDivider, TicketBarcodeFooter } from "../slips/TicketCommon.jsx";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import { MobileFloatingControls } from "../layout/MobileFloatingControls.jsx";

export function RankingPage({
  allUsedSongs = [],
  allVenues = [],
  trackShows = new Map(),
  showById = new Map(),
  ticketCount = 0,
  onSelectSong,
  onSelectVenue,
  onReturnArchive,
  onReturnHome,
  onSelectTickets,
  onSelectJourney,
  storage,
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

  return (
    <div className="mx-auto max-w-[960px] px-3 sm:px-6 pt-3 pb-24 sm:py-8 select-none font-sans">
      {/* Top Navigation & Language Utility Bar (Desktop only, mobile uses floating controls) */}
      <div className="mb-4 sm:mb-6 hidden sm:flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onReturnArchive && (
            <button
              type="button"
              onClick={onReturnArchive}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-3 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("ranking.backToArchive", "返回檔案庫")}
            >
              <span aria-hidden="true">←</span>
              <span>{t("ranking.backToArchive", "返回檔案庫")}</span>
            </button>
          )}
          {onReturnHome && (
            <button
              type="button"
              onClick={onReturnHome}
              className="inline-flex items-center gap-1 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("ranking.backToHome", "返回首頁")}
            >
              <span aria-hidden="true">🏠</span>
            </button>
          )}
          {onSelectTickets && (
            <button
              type="button"
              onClick={onSelectTickets}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("ticketBook.title", "我的巡演票夾")}
            >
              <span aria-hidden="true">🎟️</span>
              <span>{t("nav.ticketBook", "票夾")}</span>
              {ticketCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-band text-band-ink font-mono font-bold text-[9px] min-w-[15px] h-[15px] px-1 border border-ink tabular-nums">
                  {ticketCount}
                </span>
              )}
            </button>
          )}
          {onSelectJourney && (
            <button
              type="button"
              onClick={onSelectJourney}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("nav.journeyTitle", "全生涯巡演足跡")}
            >
              <span aria-hidden="true">🚐</span>
              <span>{t("nav.journey", "巡演足跡")}</span>
            </button>
          )}
        </div>
        <LanguageSwitcher />
      </div>

      {/* Main Ticket Receipt Card */}
      <article className={SLIP_ARTICLE}>
        {/* Washi Masking Tape Top Pin */}
        <div className={SLIP_TAPE} aria-hidden="true" />

        {/* Ticket Header Title Block */}
        <header className="flex flex-col items-center text-center pb-4">
          <div className="mb-2.5 inline-flex items-center justify-center w-12 h-12 rounded-[4px] bg-band border-[1.5px] border-ink shadow-2xs">
            <span className="text-2xl" aria-hidden="true">🏆</span>
          </div>

          <p className="m-0 font-mono text-[11px] sm:text-[12px] tracking-[0.2em] text-muted font-bold uppercase">
            CONCERT ARCHIVE // STATISTICS
          </p>

          <h1 className="m-0 mt-1.5 font-display text-[clamp(20px,4.5vw,36px)] font-black leading-tight tracking-tight text-ink">
            Official髭男dism <span className="font-bold text-band-ink">{t("ranking.title", "演出排行")}</span>
          </h1>

          <p className="mt-2 mb-0 text-[12px] sm:text-[14px] text-muted max-w-[560px] leading-relaxed">
            {t("ranking.subtitle", "歷年現場演出歌曲與場館累積次數統計")}
          </p>

          {/* Stats Badge */}
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <span
              data-testid="ranking-stats-badge"
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-tape px-3 py-1 font-mono text-[12px] sm:text-[13px] font-extrabold text-ink shadow-2xs"
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

        {/* Sub-board Selector Tabs (Toolbar styled like TicketBook and Journey bars) */}
        <div
          className="my-5 flex flex-wrap items-center justify-center sm:justify-start gap-2 border-b border-line-soft pb-4"
          role="tablist"
          aria-label={t("ranking.title", "演出排行")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={boardType === "allTime"}
            onClick={() => setBoardType("allTime")}
            className={`rounded-[3px] px-3.5 py-1.5 font-mono text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              boardType === "allTime"
                ? "bg-band text-band-ink border-[1.5px] border-ink shadow-xs"
                : "bg-paper text-ink border border-ink/30 hover:bg-tape-tint/50"
            }`}
          >
            <span aria-hidden="true">🌟</span>
            <span>{t("ranking.tabAllTime", "歌曲總榜")}</span>
            <span className="font-mono text-[10px] opacity-75 tabular-nums">Top 20</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={boardType === "oneMan"}
            onClick={() => setBoardType("oneMan")}
            className={`rounded-[3px] px-3.5 py-1.5 font-mono text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
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
            className={`rounded-[3px] px-3.5 py-1.5 font-mono text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
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
            className={`rounded-[3px] px-3.5 py-1.5 font-mono text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              boardType === "venue"
                ? "bg-band text-band-ink border-[1.5px] border-ink shadow-xs"
                : "bg-paper text-ink border border-ink/30 hover:bg-tape-tint/50"
            }`}
          >
            <span aria-hidden="true">🏟️</span>
            <span>{t("ranking.tabVenue", "登場場館榜")}</span>
            <span className="font-mono text-[10px] opacity-75 tabular-nums">Top 10</span>
          </button>
        </div>

        {/* Top 3 Physical Podium (實體立體頒獎台) */}
        {top3.length > 0 && (
          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              {/* Rank 2 (Silver - Left Step) */}
              {top3[1] && (
                <button
                  type="button"
                  onClick={() => {
                    if (isVenueBoard && onSelectVenue) onSelectVenue(top3[1].name);
                    else if (!isVenueBoard && onSelectSong) onSelectSong(top3[1].id);
                  }}
                  className="order-2 sm:order-1 rounded-[3px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-xs text-left cursor-pointer hover:bg-tape-tint/30 active:scale-[0.99] transition-all flex flex-col justify-between sm:min-h-[195px] relative group"
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] bg-paper text-ink font-mono font-bold text-xs border border-ink/40 shadow-2xs">
                      <span aria-hidden="true">🥈</span>
                      <span>#02</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-muted tabular-nums">
                      {top3[1].playRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="my-3">
                    <div className="font-bold text-base sm:text-lg text-ink group-hover:text-band-ink transition-colors line-clamp-2 leading-snug">
                      {isVenueBoard ? top3[1].name : top3[1].title}
                    </div>
                    {!isVenueBoard && top3[1].album && (
                      <div className="text-[11px] text-muted mt-1 font-medium truncate flex items-center gap-1">
                        <span>💿</span>
                        <span>{top3[1].album}</span>
                      </div>
                    )}
                    {isVenueBoard && top3[1].prefecture && (
                      <div className="text-[11px] text-muted mt-1 font-medium truncate flex items-center gap-1">
                        <span>📍</span>
                        <span>{top3[1].prefecture} · {top3[1].country}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-line-soft flex items-baseline justify-between w-full">
                    <span className="font-mono text-[10px] text-muted">
                      {!isVenueBoard && top3[1].firstYear ? `${top3[1].firstYear}–${top3[1].latestYear}` : ""}
                    </span>
                    <span className="font-mono text-base font-black text-ink tabular-nums">
                      {top3[1].count} <span className="text-xs font-sans font-normal text-muted">{t("ranking.showsUnit", "場")}</span>
                    </span>
                  </div>
                </button>
              )}

              {/* Rank 1 (Gold - Elevated Center) */}
              {top3[0] && (
                <button
                  type="button"
                  onClick={() => {
                    if (isVenueBoard && onSelectVenue) onSelectVenue(top3[0].name);
                    else if (!isVenueBoard && onSelectSong) onSelectSong(top3[0].id);
                  }}
                  className="order-1 sm:order-2 rounded-[3px] border-[2px] border-ink bg-card p-5 sm:p-6 shadow-md text-left cursor-pointer hover:bg-tape-tint/30 active:scale-[0.99] transition-all flex flex-col justify-between sm:min-h-[225px] relative overflow-hidden group"
                >
                  {/* Gold Banner Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-band" />
                  
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-band text-band-ink font-mono font-black text-xs border border-ink/40 shadow-2xs">
                      <span aria-hidden="true">🥇</span>
                      <span>#01</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-band-ink bg-tape px-1.5 py-0.5 rounded border border-ink/20 tabular-nums">
                      {top3[0].playRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="my-3">
                    <div className="font-black text-lg sm:text-xl text-ink group-hover:text-band-ink transition-colors line-clamp-2 leading-tight">
                      {isVenueBoard ? top3[0].name : top3[0].title}
                    </div>
                    {!isVenueBoard && top3[0].album && (
                      <div className="text-xs text-muted mt-1 font-medium truncate flex items-center gap-1">
                        <span>💿</span>
                        <span>{top3[0].album}</span>
                      </div>
                    )}
                    {isVenueBoard && top3[0].prefecture && (
                      <div className="text-xs text-muted mt-1 font-medium truncate flex items-center gap-1">
                        <span>📍</span>
                        <span>{top3[0].prefecture} · {top3[0].country}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-line-soft flex items-baseline justify-between w-full">
                    <span className="font-mono text-[11px] text-muted">
                      {!isVenueBoard && top3[0].firstYear ? `${top3[0].firstYear}–${top3[0].latestYear}` : ""}
                    </span>
                    <span className="font-mono text-xl font-black text-ink tabular-nums">
                      {top3[0].count} <span className="text-xs font-sans font-normal text-muted">{t("ranking.showsUnit", "場")}</span>
                    </span>
                  </div>
                </button>
              )}

              {/* Rank 3 (Bronze - Right Step) */}
              {top3[2] && (
                <button
                  type="button"
                  onClick={() => {
                    if (isVenueBoard && onSelectVenue) onSelectVenue(top3[2].name);
                    else if (!isVenueBoard && onSelectSong) onSelectSong(top3[2].id);
                  }}
                  className="order-3 rounded-[3px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-xs text-left cursor-pointer hover:bg-tape-tint/30 active:scale-[0.99] transition-all flex flex-col justify-between sm:min-h-[180px] relative group"
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] bg-paper text-ink font-mono font-bold text-xs border border-ink/40 shadow-2xs">
                      <span aria-hidden="true">🥉</span>
                      <span>#03</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-muted tabular-nums">
                      {top3[2].playRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="my-3">
                    <div className="font-bold text-base sm:text-lg text-ink group-hover:text-band-ink transition-colors line-clamp-2 leading-snug">
                      {isVenueBoard ? top3[2].name : top3[2].title}
                    </div>
                    {!isVenueBoard && top3[2].album && (
                      <div className="text-[11px] text-muted mt-1 font-medium truncate flex items-center gap-1">
                        <span>💿</span>
                        <span>{top3[2].album}</span>
                      </div>
                    )}
                    {isVenueBoard && top3[2].prefecture && (
                      <div className="text-[11px] text-muted mt-1 font-medium truncate flex items-center gap-1">
                        <span>📍</span>
                        <span>{top3[2].prefecture} · {top3[2].country}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-line-soft flex items-baseline justify-between w-full">
                    <span className="font-mono text-[10px] text-muted">
                      {!isVenueBoard && top3[2].firstYear ? `${top3[2].firstYear}–${top3[2].latestYear}` : ""}
                    </span>
                    <span className="font-mono text-base font-black text-ink tabular-nums">
                      {top3[2].count} <span className="text-xs font-sans font-normal text-muted">{t("ranking.showsUnit", "場")}</span>
                    </span>
                  </div>
                </button>
              )}
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
                    className="w-full text-left py-2.5 px-2 hover:bg-tape-tint/50 active:scale-[0.99] transition-all cursor-pointer rounded-[2px] group relative overflow-hidden"
                  >
                    {/* Background Progress Fill Bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-band/15 rounded-[2px] transition-all pointer-events-none"
                      style={{ width: `${Math.max(4, item.percent)}%` }}
                      aria-hidden="true"
                    />

                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-bold text-muted w-8 shrink-0 tabular-nums">
                          #{rankFormatted}
                        </span>
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

      {/* Mobile Floating Action Controls */}
      <MobileFloatingControls
        tab="ranking"
        onReturnHome={onReturnHome}
        onReturnArchive={onReturnArchive}
        onSelectTickets={onSelectTickets}
        onSelectJourney={onSelectJourney}
        storage={storage}
      />
    </div>
  );
}

export default RankingPage;
