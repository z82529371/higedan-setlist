import { useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { showDate, formatShowVenueCity, shortUnitTitle } from "../../lib/domain.js";
import { TicketBookFootprintMap } from "./TicketBookFootprintMap.jsx";

function MilestoneProgressBar({ percentage }) {
  const safePercentage = Math.min(100, Math.max(0, percentage || 0));
  return (
    <div
      data-testid="milestone-coverage-bar"
      className="w-full h-1.5 bg-paper-dark/30 rounded-full overflow-hidden my-1"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        className="h-full bg-accent rounded-full transition-all duration-300"
        style={{ width: `${safePercentage}%` }}
      />
    </div>
  );
}

export function TicketBookMilestoneDashboard({
  milestones,
  onOpenSummaryCard,
  onOpenSongChecklist,
  enrichedShows,
  allVenues,
  onSelectShow,
  storage,
}) {
  const { t, locale } = useI18n();

  if (!milestones) return null;

  const [topSongsOpen, setTopSongsOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);

  const topSongs = milestones.topSongs || [];
  const earliest = milestones.earliestShow;
  const latest = milestones.latestShow;

  return (
    <div
      data-testid="ticket-book-milestones-dashboard"
      className="mb-6"
    >
      {/* Header bar: Title & Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-soft pb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            🏆
          </span>
          <div>
            <h2 className="m-0 font-display text-[15px] sm:text-[16px] font-bold text-ink leading-tight">
              {t("ticketBook.milestonesTitle", "生涯里程碑")}
            </h2>
            <p className="m-0 mt-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-ink uppercase tracking-wider">
              CAREER MILESTONES & REPERTOIRE
            </p>
          </div>
        </div>

        {onOpenSummaryCard && (
          <button
            type="button"
            data-testid="generate-summary-card-btn"
            onClick={onOpenSummaryCard}
            className="inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-band text-band-ink font-bold text-[11px] sm:text-[12px] px-3.5 py-1.5 border-[1.5px] border-ink shadow-2xs hover:brightness-105 transition-all cursor-pointer touch-stamp self-start sm:self-auto"
            title={t("ticketBook.generateCard", "產生生涯總結小卡")}
          >
            <span aria-hidden="true">🎫</span>
            <span>{t("ticketBook.generateCard", "產生生涯總結小卡")}</span>
            <span aria-hidden="true">✨</span>
          </button>
        )}
      </div>

      {/* 4-Stat Metric Cards (AAA Contrast >= 7:1) */}
      <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Shows */}
        <div
          data-testid="milestone-total-shows"
          className="rounded-[4px] border border-ink/20 bg-paper/60 p-2.5 sm:p-3 text-center flex flex-col justify-between"
        >
          <div className="font-mono text-[10px] sm:text-[11px] font-bold text-ink uppercase">
            {t("ticketBook.totalShows", "總場次")}
          </div>
          <div className="my-1 font-mono text-[18px] sm:text-[22px] font-black text-ink leading-none">
            {milestones.totalShows}
          </div>
          <div className="font-mono text-[10px] text-ink font-bold">
            {t("ticketBook.showsUnit", "{count} 場", { count: milestones.totalShows })}
          </div>
        </div>

        {/* Total Tours */}
        <div
          data-testid="milestone-total-tours"
          className="rounded-[4px] border border-ink/20 bg-paper/60 p-2.5 sm:p-3 text-center flex flex-col justify-between"
        >
          <div className="font-mono text-[10px] sm:text-[11px] font-bold text-ink uppercase">
            {t("ticketBook.totalTours", "巡演數")}
          </div>
          <div className="my-1 font-mono text-[18px] sm:text-[22px] font-black text-ink leading-none">
            {milestones.totalTours}
          </div>
          <div className="font-mono text-[10px] text-ink font-bold">
            {t("ticketBook.toursUnit", "{count} 巡演", { count: milestones.totalTours })}
          </div>
        </div>

        {/* Total Cities */}
        <div
          data-testid="milestone-total-cities"
          className="rounded-[4px] border border-ink/20 bg-paper/60 p-2.5 sm:p-3 text-center flex flex-col justify-between"
        >
          <div className="font-mono text-[10px] sm:text-[11px] font-bold text-ink uppercase">
            {t("ticketBook.totalCities", "足跡城市")}
          </div>
          <div className="my-1 font-mono text-[18px] sm:text-[22px] font-black text-ink leading-none">
            {milestones.totalCities}
          </div>
          <div className="font-mono text-[10px] text-ink font-bold">
            {t("ticketBook.citiesUnit", "{count} 城市", { count: milestones.totalCities })}
          </div>
        </div>

        {/* Song Repertoire Coverage */}
        {onOpenSongChecklist ? (
          <button
            type="button"
            data-testid="milestone-coverage"
            onClick={onOpenSongChecklist}
            className="rounded-[4px] border border-ink/20 bg-paper/60 p-2.5 sm:p-3 text-center flex flex-col justify-between hover:border-ink hover:bg-tape-tint/50 cursor-pointer transition-all touch-stamp group text-left sm:text-center"
            title={t("ticketBook.viewChecklist", "查看現場曲庫解鎖成就圖鑑")}
          >
            <div className="font-mono text-[10px] sm:text-[11px] font-bold text-ink uppercase flex items-center justify-center gap-1">
              <span>{t("ticketBook.coverage", "歌曲解鎖率")}</span>
            </div>
            <div className="my-1 font-mono text-[18px] sm:text-[22px] font-black text-ink leading-none text-center">
              {milestones.coveragePercentage}%
            </div>
            <MilestoneProgressBar percentage={milestones.coveragePercentage} />
            <div className="font-mono text-[10px] text-ink font-bold flex items-center justify-center gap-1">
              <span>{milestones.unlockedSongCount} / {milestones.totalCatalogSongs}</span>
            </div>
            <div
              data-testid="milestone-coverage-cta"
              className="mt-2 inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-ink/5 group-hover:bg-ink group-hover:text-paper font-mono text-[9px] sm:text-[10px] font-bold text-ink transition-colors border border-ink/20 group-hover:border-ink"
            >
              <span aria-hidden="true">📖</span>
              <span>{t("ticketBook.viewChecklistCta", "查看圖鑑 ↗")}</span>
            </div>
          </button>
        ) : (
          <div
            data-testid="milestone-coverage"
            className="rounded-[4px] border border-ink/20 bg-paper/60 p-2.5 sm:p-3 text-center flex flex-col justify-between"
          >
            <div className="font-mono text-[10px] sm:text-[11px] font-bold text-ink uppercase">
              {t("ticketBook.coverage", "歌曲解鎖率")}
            </div>
            <div className="my-1 font-mono text-[18px] sm:text-[22px] font-black text-ink leading-none">
              {milestones.coveragePercentage}%
            </div>
            <MilestoneProgressBar percentage={milestones.coveragePercentage} />
            <div className="font-mono text-[10px] text-ink font-bold">
              {milestones.unlockedSongCount} / {milestones.totalCatalogSongs}
            </div>
          </div>
        )}
      </div>

      {/* Secondary Details: Top 3 Songs & History Milestones */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-line-soft">
        {/* Top 3 Live Songs */}
        <div data-testid="milestone-top-songs" className="rounded-[4px] border border-line-soft bg-paper/30 p-3">
          <button
            type="button"
            data-testid="toggle-top-songs-btn"
            onClick={() => setTopSongsOpen((prev) => !prev)}
            aria-expanded={topSongsOpen}
            className="w-full flex items-center justify-between mb-2 pb-1.5 border-b border-line-soft/60 cursor-pointer select-none text-left focus:outline-none"
          >
            <span className="font-mono text-[11px] font-bold text-ink uppercase flex items-center gap-1">
              <span>🔥</span>
              <span>{t("ticketBook.topSongs", "現場神曲 Top 3")}</span>
            </span>
            <span className="font-mono text-[11px] font-bold text-muted transition-transform select-none" aria-hidden="true">
              {topSongsOpen ? "▼" : "▶"}
            </span>
          </button>

          {topSongsOpen && (
            topSongs.length === 0 ? (
              <p className="m-0 text-center py-2 text-[11px] text-ink">--</p>
            ) : (
              <div className="space-y-1.5">
                {topSongs.map((song, idx) => {
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
                  return (
                    <div
                      key={song.songId}
                      data-testid={`milestone-top-song-${song.songId}`}
                      className="flex items-center justify-between gap-2 text-[12px] bg-card p-1.5 rounded border border-ink/15"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold" aria-hidden="true">
                          {medal}
                        </span>
                        <span className="font-bold text-ink truncate">{song.title}</span>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-ink">
                        {t("ticketBook.timesUnit", "{count} 次", { count: song.count })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* History: First & Latest Shows */}
        <div data-testid="milestone-shows-history" className="rounded-[4px] border border-line-soft bg-paper/30 p-3">
          <button
            type="button"
            data-testid="toggle-timeline-btn"
            onClick={() => setTimelineOpen((prev) => !prev)}
            aria-expanded={timelineOpen}
            className="w-full flex items-center justify-between mb-2 pb-1.5 border-b border-line-soft/60 cursor-pointer select-none text-left focus:outline-none"
          >
            <span className="font-mono text-[11px] font-bold text-ink uppercase flex items-center gap-1">
              <span>📅</span>
              <span>TIMELINE HIGHLIGHTS</span>
            </span>
            <span className="font-mono text-[11px] font-bold text-muted transition-transform select-none" aria-hidden="true">
              {timelineOpen ? "▼" : "▶"}
            </span>
          </button>

          {timelineOpen && (
            <div className="space-y-2">
              {/* First Show */}
              <div
                data-testid="milestone-first-show"
                className="bg-card p-2 rounded border border-ink/15 text-[11px]"
              >
                <div className="flex items-center justify-between text-ink font-mono font-bold mb-0.5 gap-1">
                  <span className="shrink-0">{t("ticketBook.firstShow", "最初參戰")}</span>
                  <span className="whitespace-nowrap shrink-0">{earliest?.date ? (earliest.show ? showDate(earliest.show, locale) : earliest.date) : "--"}</span>
                </div>
                <div className="font-bold text-ink truncate text-[12px]">
                  {earliest?.shortTitle || (earliest?.unit ? shortUnitTitle(earliest.unit) : earliest?.title) || "--"}
                </div>
                {earliest && (
                  <div className="text-ink text-[11px] truncate font-medium">
                    📍 {earliest.show ? formatShowVenueCity(earliest.show, t, locale) : earliest.venue || earliest.city}
                  </div>
                )}
              </div>

              {/* Latest Show */}
              <div
                data-testid="milestone-latest-show"
                className="bg-card p-2 rounded border border-ink/15 text-[11px]"
              >
                <div className="flex items-center justify-between text-ink font-mono font-bold mb-0.5 gap-1">
                  <span className="shrink-0">{t("ticketBook.latestShow", "最近參戰")}</span>
                  <span className="whitespace-nowrap shrink-0">{latest?.date ? (latest.show ? showDate(latest.show, locale) : latest.date) : "--"}</span>
                </div>
                <div className="font-bold text-ink truncate text-[12px]">
                  {latest?.shortTitle || (latest?.unit ? shortUnitTitle(latest.unit) : latest?.title) || "--"}
                </div>
                {latest && (
                  <div className="text-ink text-[11px] truncate font-medium">
                    📍 {latest.show ? formatShowVenueCity(latest.show, t, locale) : latest.venue || latest.city}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Personal Concert Footprint & Prefecture Conquest Map (ADR-0124) */}
      <TicketBookFootprintMap
        attendedShows={enrichedShows || milestones?.attendedShowsList || []}
        allVenues={allVenues}
        onSelectShow={onSelectShow}
        storage={storage}
      />
    </div>
  );
}
