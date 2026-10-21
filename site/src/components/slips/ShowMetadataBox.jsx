import { useState } from "react";
import { showDate, formatShowTime, formatShowSongBreakdown, formatShowPlace } from "../../lib/domain.js";
import { routeHash } from "../../lib/track.js";
import { useI18n } from "../../lib/i18n.jsx";
import { LeadDropModal } from "./LeadDropModal.jsx";

export function ShowMetadataBox({
  s,
  songCount,
  mainCount,
  encCount,
  onSelectVenue,
  showList = [],
  currentIdx = -1,
  prevShow,
  nextShow,
  onSelectShow,
  unitTitle = "",
  onOpenLeadModal,
}) {
  const { locale, t, localizeVenue } = useI18n();
  const [internalTimeModalOpen, setInternalTimeModalOpen] = useState(false);
  const timeFormatted = formatShowTime(s, locale);
  const isTimeMissing = !timeFormatted && songCount > 0;

  const handleOpenTimeModal = () => {
    if (onOpenLeadModal) {
      onOpenLeadModal("time");
    } else {
      setInternalTimeModalOpen(true);
    }
  };

  return (
    <div className="border-y border-line-soft py-3 my-2">
      {/* Date & Time */}
      <div className="flex flex-wrap items-baseline justify-between gap-1 pb-1.5 font-mono text-[13px] text-muted border-b border-line-soft/80">
        <div className="flex items-center gap-1.5 font-bold text-ink">
          <span className="text-[13px] text-muted" aria-hidden="true">📅</span>
          {showDate(s, locale)}
        </div>
        {timeFormatted ? (
          <span className="text-[12px] font-medium text-muted">
            <span aria-hidden="true">⏰ </span>
            {timeFormatted}
          </span>
        ) : isTimeMissing ? (
          <button
            type="button"
            onClick={handleOpenTimeModal}
            data-testid="report-time-btn"
            title={t("slips.quest.reportTimeTitle", "開啟情報投遞視窗，提供本場演出的開場與開演時間線索")}
            className="inline-flex items-center gap-1 rounded border border-dashed border-ink/40 bg-card text-ink px-2 py-0.5 font-mono text-[11px] font-bold hover:bg-tape-tint hover:border-ink transition-colors cursor-pointer touch-stamp"
          >
            <span aria-hidden="true">⏰ </span>
            <span>{t("slips.quest.reportTime", "提供開演時間")}</span>
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>

      {/* Venue & Metadata Box */}
      {/* Desktop: sm 以上尺寸維持單行流暢配置（若極端窄則自動折至次行行頭） */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-2 sm:gap-y-1 mt-2">
        <h3 className="m-0 font-display text-[21px] lg:text-[23px] font-black text-ink min-w-0">
          {onSelectVenue && s.venue ? (
            <a
              href={routeHash.venue(s.venue, locale)}
              onClick={(e) => {
                e.preventDefault();
                onSelectVenue(s.venue);
              }}
              className="group inline text-ink no-underline hover:text-pool transition-colors cursor-pointer"
              title={t("showExtra.venueFileTitle", "查看此場地的全歷史演出檔案")}
            >
              <span className="group-hover:underline">{localizeVenue(s.venue)}</span>
              {s.city && (
                <span className="ml-1.5 text-[15px] font-normal text-muted group-hover:text-pool whitespace-nowrap">
                  （{t("cities." + s.city, s.city)}）
                </span>
              )}
              <span
                className="ml-2 inline-flex items-center gap-0.5 rounded border border-pool/30 bg-pool/5 px-1.5 py-0.5 font-mono text-[11px] font-bold text-pool align-middle whitespace-nowrap group-hover:bg-pool group-hover:text-white transition-colors"
                aria-hidden="true"
              >
                <span>🏛️ {t("showExtra.venueFileLabel", "檔案")}</span>
                <span>→</span>
              </span>
            </a>
          ) : (
            <>
              <span>{localizeVenue(s.venue)}</span>
              {s.city && (
                <span className="ml-1.5 text-[15px] font-normal text-muted whitespace-nowrap">
                  （{t("cities." + s.city, s.city)}）
                </span>
              )}
            </>
          )}
        </h3>
        <div className="shrink-0 font-mono text-[12px] font-bold text-muted tabular-nums">
          {formatShowSongBreakdown(songCount, mainCount, encCount, locale) ||
            t("slips.noSongsRecorded", "尚無曲目紀錄")}
        </div>
      </div>

      {/* Mobile: 小尺寸專用分行配置（第一行完整場地名，第二行 (長野) 放行頭、檔案放行尾） */}
      <div className="sm:hidden mt-2.5 space-y-1.5">
        <h3 className="m-0 font-display text-[18px] font-black leading-snug text-ink text-pretty">
          {onSelectVenue && s.venue ? (
            <a
              href={routeHash.venue(s.venue, locale)}
              onClick={(e) => {
                e.preventDefault();
                onSelectVenue(s.venue);
              }}
              className="text-ink hover:text-pool hover:underline transition-colors cursor-pointer"
              title={t("showExtra.venueFileTitle", "查看此場地的全歷史演出檔案")}
            >
              {localizeVenue(s.venue)}
            </a>
          ) : (
            localizeVenue(s.venue)
          )}
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 font-mono text-[12px]">
          <div className="flex flex-wrap items-baseline gap-x-2 text-muted min-w-0">
            {s.city && (
              <span className="font-bold text-ink whitespace-nowrap">
                （{t("cities." + s.city, s.city)}）
              </span>
            )}
            <span className="tabular-nums">
              {formatShowSongBreakdown(songCount, mainCount, encCount, locale) ||
                t("slips.noSongsRecorded", "尚無曲目紀錄")}
            </span>
          </div>

          {onSelectVenue && s.venue && (
            <a
              href={routeHash.venue(s.venue, locale)}
              onClick={(e) => {
                e.preventDefault();
                onSelectVenue(s.venue);
              }}
              className="inline-flex items-center gap-1 rounded border border-pool/30 bg-pool/5 px-2 py-0.5 font-mono text-[11px] font-bold text-pool whitespace-nowrap hover:bg-pool hover:text-white transition-colors cursor-pointer"
              title={t("showExtra.venueFileTitle", "查看此場地的全歷史演出檔案")}
            >
              <span>🏛️ {t("showExtra.venueFileLabel", "檔案")}</span>
              <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>

      {/* Tour Stepper */}
      {showList.length > 1 && (
        <div className="mt-2.5 flex items-center justify-between border-t border-line-soft/80 pt-2 text-[12px] font-mono">
          {prevShow ? (
            <button
              type="button"
              onClick={() => onSelectShow(prevShow.id)}
              className="group inline-flex items-center gap-1 font-semibold text-ink hover:text-pool cursor-pointer transition-colors min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 rounded touch-stamp"
              title={t("showExtra.prevTitle", `上一場：${showDate(prevShow, locale)} ${formatShowPlace(prevShow, t)}`, { date: showDate(prevShow, locale), place: formatShowPlace(prevShow, t) })}
            >
              <span aria-hidden="true" className="text-base sm:text-xs">←</span>
              <span>{t("actions.prev", "上一場")}</span>
              <span className="hidden sm:inline text-muted group-hover:text-pool">
                ({prevShow.date.slice(5)} {formatShowPlace(prevShow, t)})
              </span>
            </button>
          ) : (
            <span className="text-muted/40 cursor-not-allowed min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 flex items-center">← {t("slips.tourOpener", "首日")}</span>
          )}

          <span className="text-muted tabular-nums font-bold text-[12px] flex items-center gap-1.5">
            <span>
              {locale === "en"
                ? `Show ${currentIdx + 1} of ${showList.length}`
                : locale === "ja"
                ? `第 ${currentIdx + 1} / ${showList.length} 公演`
                : locale === "ko"
                ? `제 ${currentIdx + 1} / ${showList.length} 회`
                : `第 ${currentIdx + 1} / ${showList.length} 場`}
            </span>
            {currentIdx === 0 && (
              <span className="rounded bg-tape-tint px-1.5 py-0.5 text-xs text-ink font-bold border border-ink/30">
                {t("slips.tourOpener", "首日")}
              </span>
            )}
            {currentIdx === showList.length - 1 && (
              <span className="rounded bg-band px-1.5 py-0.5 text-xs text-band-ink font-bold border border-ink/40">
                {t("slips.tourFinale", "千秋樂")}
              </span>
            )}
          </span>

          {nextShow ? (
            <button
              type="button"
              onClick={() => onSelectShow(nextShow.id)}
              className="group inline-flex items-center gap-1 font-semibold text-ink hover:text-pool cursor-pointer transition-colors min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 rounded touch-stamp"
              title={t("showExtra.nextTitle", `下一場：${showDate(nextShow, locale)} ${formatShowPlace(nextShow, t)}`, { date: showDate(nextShow, locale), place: formatShowPlace(nextShow, t) })}
            >
              <span className="hidden sm:inline text-muted group-hover:text-pool">
                ({nextShow.date.slice(5)} {formatShowPlace(nextShow, t)})
              </span>
              <span>{t("actions.next", "下一場")}</span>
              <span aria-hidden="true" className="text-base sm:text-xs">→</span>
            </button>
          ) : (
            <span className="text-muted/40 cursor-not-allowed min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 flex items-center">{t("slips.tourFinale", "千秋樂")} →</span>
          )}
        </div>
      )}

      {/* Standalone fallback modal support when rendered outside ShowSlip */}
      {!onOpenLeadModal && (
        <LeadDropModal
          isOpen={internalTimeModalOpen}
          onClose={() => setInternalTimeModalOpen(false)}
          show={s}
          unitTitle={unitTitle}
          questType="time"
        />
      )}
    </div>
  );
}
