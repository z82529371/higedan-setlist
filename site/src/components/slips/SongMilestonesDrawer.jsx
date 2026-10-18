import { showDate } from "../../lib/domain.js";
import { routeHash } from "../../lib/track.js";
import { useI18n } from "../../lib/i18n.jsx";

export function SongMilestonesDrawer({
  showMoreTools,
  showYearBreakdown,
  setShowYearBreakdown,
  yearBreakdown,
  livefansUrl,
  sortedAppearances,
  firstApp,
  latestApp,
  firstShow,
  latestShow,
  onSelectShow,
  onSelectVenue,
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
        {livefansUrl && (
          <a
            href={livefansUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-muted hover:text-ink hover:bg-band hover:border-band transition-colors no-underline"
            title={t("songExtra.livefansTitle", "在 LiveFans 查看歌曲頁面")}
          >
            <span>🎫 LiveFans</span>
          </a>
        )}
      </div>

      {/* Level 5: Collapsible Year-by-Year Performance Frequency */}
      {showYearBreakdown && yearBreakdown.length >= 3 && (
        <div className="mt-1 border-t border-line-soft/80 pt-2 font-mono text-[11px]">
          <div className="flex items-center justify-between font-bold text-muted mb-1.5">
            <span className="flex items-center gap-1">
              <span aria-hidden="true">📅</span> {t("slips.common.yearlyFreqDistribution", "年度演出頻率分佈")}
            </span>
            <span className="tabular-nums">{t("slips.song.yearsCovered", "歷年涵蓋 {count} 個演出年份", { count: yearBreakdown.length })}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {yearBreakdown.map(([yr, count]) => (
              <span
                key={yr}
                className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-0.5 tabular-nums text-ink"
              >
                <span className="text-muted">{yr}</span>
                <span className="font-bold">{count} {t("navigators.showsUnit", "場")}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Level 4: Milestone Performance (Only when song has >= 2 shows & different show IDs) */}
      {sortedAppearances.length >= 2 && firstApp && latestApp && firstApp.showId !== latestApp.showId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-t border-line-soft/80 pt-2.5 font-mono text-[12px]">
          {/* First Live */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-xs font-bold text-muted">
              <span className="flex items-center gap-1 text-ink">
                <span className="text-band font-bold" aria-hidden="true">★</span> {t("slips.firstPerformed", "初次演出")}
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
                <span className="text-muted text-[12px] mt-0.5 truncate flex items-center gap-1">
                  <span>📍 {firstShow.venue}（{firstShow.city}）</span>
                  {onSelectVenue && firstShow.venue && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onSelectVenue(firstShow.venue);
                      }}
                      className="inline-flex items-center text-xs font-bold text-pool hover:underline cursor-pointer ml-1"
                      title={t("songExtra.viewVenueFile", "查看「{venue}」場地檔案", { venue: firstShow.venue })}
                    >
                      {t("songExtra.venueLinkSuffix", "[場地 →]")}
                    </button>
                  )}
                </span>
              </a>
            ) : (
              <span className="text-muted">{t("songExtra.noRecord", "暫無紀錄")}</span>
            )}
          </div>

          {/* Latest Live */}
          <div className="flex flex-col gap-0.5 sm:border-l sm:border-line-soft/80 sm:pl-4">
            <div className="flex items-center justify-between text-xs font-bold text-muted">
              <span className="flex items-center gap-1 text-ink">
                <span className="text-band font-bold" aria-hidden="true">★</span> {t("slips.latestPerformed", "最新演出")}
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
                <span className="text-muted text-[12px] mt-0.5 truncate flex items-center gap-1">
                  <span>📍 {latestShow.venue}（{latestShow.city}）</span>
                  {onSelectVenue && latestShow.venue && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onSelectVenue(latestShow.venue);
                      }}
                      className="inline-flex items-center text-xs font-bold text-pool hover:underline cursor-pointer ml-1"
                      title={t("songExtra.viewVenueFile", "查看「{venue}」場地檔案", { venue: latestShow.venue })}
                    >
                      {t("songExtra.venueLinkSuffix", "[場地 →]")}
                    </button>
                  )}
                </span>
              </a>
            ) : (
              <span className="text-muted">{t("songExtra.noRecord", "暫無紀錄")}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
