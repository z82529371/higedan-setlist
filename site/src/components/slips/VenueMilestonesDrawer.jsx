import { showDate } from "../../lib/domain.js";
import { routeHash } from "../../lib/track.js";
import { useI18n } from "../../lib/i18n.jsx";

export function VenueMilestonesDrawer({
  showMoreTools,
  showYearBreakdown,
  setShowYearBreakdown,
  yearBreakdown,
  livefansUrl,
  topSongs,
  venueShows,
  sortedShows,
  firstApp,
  latestApp,
  firstShow,
  latestShow,
  onSelectShow,
  onSelectSong,
}) {
  const { locale, t } = useI18n();

  if (!showMoreTools) return null;

  return (
    <div className="mt-1 flex flex-col gap-2.5 border-t border-line-soft/60 pt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {yearBreakdown.length >= 3 && (
          <button
            type="button"
            onClick={() => setShowYearBreakdown((v) => !v)}
            className="inline-flex items-center gap-1 rounded bg-paper px-2.5 py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
            aria-expanded={showYearBreakdown}
          >
            <span>{showYearBreakdown ? "▾ " + t("slips.common.yearDistribution", "年度分佈") : "▸ " + t("slips.common.yearDistribution", "年度分佈")}</span>
          </button>
        )}
        <a
          href={livefansUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-muted hover:text-ink hover:bg-band hover:border-band transition-colors no-underline"
          title={t("venueExtra.livefansTitle", "在 LiveFans 查看場館歷史")}
        >
          <span>🎫 LiveFans</span>
        </a>
      </div>

      {/* Level 3.5: Top Songs Performed Here (Only when >= 4 shows & has real repeat songs) */}
      {topSongs.length > 0 && venueShows.length >= 4 && topSongs.some((s) => s.count >= 2) && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 border-t border-line-soft/60 pt-2 font-mono text-[11px]">
          <span className="font-bold text-muted flex items-center gap-1">
            <span>{t("slips.venue.frequentTracks", "🏆 本場地常唱曲目：")}</span>
          </span>
          {topSongs.map((s) => (
            <a
              key={s.id}
              href={routeHash.song(s.id, locale)}
              onClick={(e) => {
                e.preventDefault();
                onSelectSong?.(s.id);
              }}
              className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 border border-line-soft text-ink hover:bg-tape-tint/40 hover:border-ink/60 transition-colors no-underline cursor-pointer"
              title={t("venueExtra.viewSongHistory", "查看歌曲《{title}》的全歷史演出紀錄", { title: s.title })}
            >
              <span className="font-medium">{s.title}</span>
              <span className="font-bold text-pool tabular-nums">{t("venueExtra.timesSuffix", "({count}次)", { count: s.count })}</span>
            </a>
          ))}
        </div>
      )}

      {/* Level 4: Milestone Performance (Only when venue has >= 3 shows) */}
      {sortedShows.length >= 3 && firstApp && latestApp && firstApp.showId !== latestApp.showId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-t border-line-soft/80 pt-2.5 font-mono text-[12px]">
          {/* First Live */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-xs font-bold text-muted">
              <span className="flex items-center gap-1 text-ink">
                <span className="text-band font-bold" aria-hidden="true">★</span> {t("slips.venue.debutShow", "首次登台 / 首演場次")}
              </span>
              <span className="tabular-nums font-semibold">{firstShow ? showDate(firstShow, locale) : "—"}</span>
            </div>
            {firstApp && firstShow ? (
              <a
                href={routeHash.show(firstApp.showId, locale)}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectShow(firstApp.showId);
                }}
                className="group flex flex-col text-ink no-underline hover:text-pool transition-colors"
              >
                <span
                  className="font-bold text-[13px] break-words line-clamp-2 leading-snug group-hover:underline"
                  title={firstApp.unitTitle}
                >
                  {firstApp.unitTitle}
                </span>
              </a>
            ) : (
              <span className="text-muted">{t("venueExtra.noRecord", "暫無紀錄")}</span>
            )}
          </div>

          {/* Latest Live */}
          <div className="flex flex-col gap-0.5 sm:border-l sm:border-line-soft/80 sm:pl-4">
            <div className="flex items-center justify-between text-xs font-bold text-muted">
              <span className="flex items-center gap-1 text-ink">
                <span className="text-band font-bold" aria-hidden="true">★</span> {t("slips.latestPerformed", "最新出演場次")}
              </span>
              <span className="tabular-nums font-semibold">{latestShow ? showDate(latestShow, locale) : "—"}</span>
            </div>
            {latestApp && latestShow ? (
              <a
                href={routeHash.show(latestApp.showId, locale)}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectShow(latestApp.showId);
                }}
                className="group flex flex-col text-ink no-underline hover:text-pool transition-colors"
              >
                <span
                  className="font-bold text-[13px] break-words line-clamp-2 leading-snug group-hover:underline"
                  title={latestApp.unitTitle}
                >
                  {latestApp.unitTitle}
                </span>
              </a>
            ) : (
              <span className="text-muted">{t("venueExtra.noRecord", "暫無紀錄")}</span>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Year-by-Year Performance Frequency Drawer */}
      {showYearBreakdown && yearBreakdown.length > 0 && (
        <div className="mt-1 border-t border-line-soft/80 pt-2 font-mono text-[11px]">
          <div className="text-muted font-bold mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span>{t("slips.venue.yearlyFreqDistribution", "📅 各年度演出頻率分佈：")}</span>
            </span>
            <span className="font-normal text-muted/70">{t("slips.venue.spanningYears", "（跨越 {years} 個年份）", { years: yearBreakdown.length })}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {yearBreakdown.map(([yr, count]) => (
              <span
                key={yr}
                className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 border border-line-soft text-ink tabular-nums"
              >
                <span className="text-muted font-semibold">{yr}</span>
                <span className="font-bold text-ink">{count} {t("navigators.showsUnit", "場")}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
