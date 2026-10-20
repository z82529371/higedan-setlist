import { useI18n } from "../../lib/i18n.jsx";
import { showDate, formatShowVenueCity } from "../../lib/domain.js";

export function PassportMilestoneDashboard({ milestones, onOpenSummaryCard }) {
  const { t, locale } = useI18n();

  if (!milestones) return null;

  const topSongs = milestones.topSongs || [];
  const earliest = milestones.earliestShow;
  const latest = milestones.latestShow;

  return (
    <div
      data-testid="passport-milestones-dashboard"
      className="mb-6 rounded-[6px] border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-[2.5px_2.5px_0_rgba(0,0,0,0.08)]"
    >
      {/* Header bar: Title & Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-soft pb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            🏆
          </span>
          <div>
            <h2 className="m-0 font-display text-[15px] sm:text-[16px] font-bold text-ink leading-tight">
              {t("passport.milestonesTitle", "生涯里程碑")}
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
            title={t("passport.generateCard", "產生生涯總結小卡")}
          >
            <span aria-hidden="true">🎫</span>
            <span>{t("passport.generateCard", "產生生涯總結小卡")}</span>
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
            {t("passport.totalShows", "總場次")}
          </div>
          <div className="my-1 font-mono text-[18px] sm:text-[22px] font-black text-ink leading-none">
            {milestones.totalShows}
          </div>
          <div className="font-mono text-[10px] text-ink font-bold">
            {t("passport.showsUnit", "{count} 場", { count: milestones.totalShows })}
          </div>
        </div>

        {/* Total Tours */}
        <div
          data-testid="milestone-total-tours"
          className="rounded-[4px] border border-ink/20 bg-paper/60 p-2.5 sm:p-3 text-center flex flex-col justify-between"
        >
          <div className="font-mono text-[10px] sm:text-[11px] font-bold text-ink uppercase">
            {t("passport.totalTours", "巡演數")}
          </div>
          <div className="my-1 font-mono text-[18px] sm:text-[22px] font-black text-ink leading-none">
            {milestones.totalTours}
          </div>
          <div className="font-mono text-[10px] text-ink font-bold">
            {t("passport.toursUnit", "{count} 巡演", { count: milestones.totalTours })}
          </div>
        </div>

        {/* Total Cities */}
        <div
          data-testid="milestone-total-cities"
          className="rounded-[4px] border border-ink/20 bg-paper/60 p-2.5 sm:p-3 text-center flex flex-col justify-between"
        >
          <div className="font-mono text-[10px] sm:text-[11px] font-bold text-ink uppercase">
            {t("passport.totalCities", "足跡城市")}
          </div>
          <div className="my-1 font-mono text-[18px] sm:text-[22px] font-black text-ink leading-none">
            {milestones.totalCities}
          </div>
          <div className="font-mono text-[10px] text-ink font-bold">
            {t("passport.citiesUnit", "{count} 城市", { count: milestones.totalCities })}
          </div>
        </div>

        {/* Song Repertoire Coverage */}
        <div
          data-testid="milestone-coverage"
          className="rounded-[4px] border border-ink/20 bg-paper/60 p-2.5 sm:p-3 text-center flex flex-col justify-between"
        >
          <div className="font-mono text-[10px] sm:text-[11px] font-bold text-ink uppercase">
            {t("passport.coverage", "歌曲解鎖率")}
          </div>
          <div className="my-1 font-mono text-[18px] sm:text-[22px] font-black text-ink leading-none">
            {milestones.coveragePercentage}%
          </div>
          <div className="font-mono text-[10px] text-ink font-bold">
            {milestones.unlockedSongCount} / {milestones.totalCatalogSongs}
          </div>
        </div>
      </div>

      {/* Secondary Details: Top 3 Songs & History Milestones */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-line-soft">
        {/* Top 3 Live Songs */}
        <div data-testid="milestone-top-songs" className="rounded-[4px] border border-line-soft bg-paper/30 p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-line-soft/60">
            <span className="font-mono text-[11px] font-bold text-ink uppercase flex items-center gap-1">
              <span>🔥</span>
              <span>{t("passport.topSongs", "現場神曲 Top 3")}</span>
            </span>
          </div>

          {topSongs.length === 0 ? (
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
                      {t("passport.timesUnit", "{count} 次", { count: song.count })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* History: First & Latest Shows */}
        <div data-testid="milestone-shows-history" className="rounded-[4px] border border-line-soft bg-paper/30 p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-line-soft/60">
            <span className="font-mono text-[11px] font-bold text-ink uppercase flex items-center gap-1">
              <span>📅</span>
              <span>TIMELINE HIGHLIGHTS</span>
            </span>
          </div>

          <div className="space-y-2">
            {/* First Show */}
            <div
              data-testid="milestone-first-show"
              className="bg-card p-2 rounded border border-ink/15 text-[11px]"
            >
              <div className="flex items-center justify-between text-ink font-mono font-bold mb-0.5">
                <span>{t("passport.firstShow", "最初參戰")}</span>
                <span>{earliest?.date ? (earliest.show ? showDate(earliest.show, locale) : earliest.date) : "--"}</span>
              </div>
              <div className="font-bold text-ink truncate text-[12px]">
                {earliest?.title || "--"}
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
              <div className="flex items-center justify-between text-ink font-mono font-bold mb-0.5">
                <span>{t("passport.latestShow", "最近參戰")}</span>
                <span>{latest?.date ? (latest.show ? showDate(latest.show, locale) : latest.date) : "--"}</span>
              </div>
              <div className="font-bold text-ink truncate text-[12px]">
                {latest?.title || "--"}
              </div>
              {latest && (
                <div className="text-ink text-[11px] truncate font-medium">
                  📍 {latest.show ? formatShowVenueCity(latest.show, t, locale) : latest.venue || latest.city}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
