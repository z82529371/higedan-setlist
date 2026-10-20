import { useState, useMemo } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { useTicketBook } from "../../lib/ticket-book.js";
import { showDate, formatShowTime, formatShowVenueCity, shortUnitTitle } from "../../lib/domain.js";
import { routeHash } from "../../lib/routes.js";
import { TicketPerforationDivider, TicketBarcodeFooter } from "../slips/TicketCommon.jsx";
import { computeTicketBookMilestones } from "../../lib/ticket-book-milestones.js";
import { TicketBookMilestoneDashboard } from "./TicketBookMilestoneDashboard.jsx";
import { MilestoneCardModal } from "./MilestoneCardModal.jsx";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import { SLIP_ARTICLE, SLIP_TAPE } from "../../lib/constants.js";

export function TicketBookPage({
  unitData,
  showById,
  unitIdByShowId,
  allUsedSongs,
  storage,
  onSelectShow,
  onReturnArchive,
  onReturnHome,
  initialYear = "all",
  initialKeyword = "",
}) {
  const { t, locale } = useI18n();
  const { count, attendedShows, remove } = useTicketBook({ storage });

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const milestones = useMemo(() => {
    return computeTicketBookMilestones({
      attendedShows,
      unitData,
      showById,
      unitIdByShowId,
      allUsedSongs,
    });
  }, [attendedShows, unitData, showById, unitIdByShowId, allUsedSongs]);

  // Correlate attended shows with static catalog data (show.date takes precedence over attendedAt)
  const enrichedShows = useMemo(() => {
    return (attendedShows || [])
      .map((entry) => {
        const show = showById?.get(entry.showKey) || null;
        const unitId = unitIdByShowId?.get(entry.showKey) || null;
        const unit = unitId && unitData ? unitData.get(unitId)?.unit : null;

        const effectiveDate = show?.date || entry.attendedAt || "9999-99-99";
        const yearMatch = effectiveDate.match(/^(\d{4})/);
        const effectiveYear = yearMatch ? yearMatch[1] : null;

        return {
          entry,
          show,
          unit,
          date: effectiveDate,
          year: effectiveYear,
          title: unit?.title || show?.title || entry.showKey,
          shortTitle: unit ? shortUnitTitle(unit) : show?.title || entry.showKey,
          venue: show?.venue?.name || show?.venue || "",
          city: show?.venue?.city || show?.city || "",
          prefecture: show?.venue?.prefecture || show?.prefecture || "",
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [attendedShows, showById, unitIdByShowId, unitData]);

  // Extract list of unique years from attended shows
  const availableYears = useMemo(() => {
    const years = new Set(
      enrichedShows
        .map((s) => s.year)
        .filter((y) => y && y !== "9999")
    );
    return Array.from(years).sort().reverse();
  }, [enrichedShows]);

  // Apply Year and Keyword filters (including localized venue and city names)
  const filteredShows = useMemo(() => {
    let list = enrichedShows;
    if (selectedYear !== "all") {
      list = list.filter((item) => item.year === selectedYear);
    }
    const q = searchKeyword.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const locVenue = item.show ? formatShowVenueCity(item.show, t, locale).toLowerCase() : "";
        return (
          item.title?.toLowerCase().includes(q) ||
          item.shortTitle?.toLowerCase().includes(q) ||
          item.venue?.toLowerCase().includes(q) ||
          item.city?.toLowerCase().includes(q) ||
          locVenue.includes(q) ||
          item.date?.includes(q) ||
          item.entry.notes?.toLowerCase().includes(q) ||
          item.entry.seat?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [enrichedShows, selectedYear, searchKeyword, t, locale]);

  const handleResetFilters = () => {
    setSelectedYear("all");
    setSearchKeyword("");
  };

  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6 py-4 sm:py-8">
      {/* Top Navigation & Language Utility Bar */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onReturnArchive && (
            <button
              type="button"
              onClick={onReturnArchive}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-3 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("ticketBook.backToArchive", "返回檔案庫")}
            >
              <span aria-hidden="true">←</span>
              <span>{t("ticketBook.backToArchive", "返回檔案庫")}</span>
            </button>
          )}
          {onReturnHome && (
            <button
              type="button"
              onClick={onReturnHome}
              className="inline-flex items-center gap-1 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("ticketBook.backToHome", "返回首頁")}
            >
              <span aria-hidden="true">🏠</span>
            </button>
          )}
        </div>
        <LanguageSwitcher />
      </div>

      {/* Main Ticket Receipt Card */}
      <article className={SLIP_ARTICLE}>
        {/* Washi Masking Tape Top Pin */}
        <div className={SLIP_TAPE} aria-hidden="true" />

        {/* Ticket Book Header Title Block */}
        <header className="flex flex-col items-center text-center pb-4">
          <div className="mb-2.5 inline-flex items-center justify-center w-12 h-12 rounded-[4px] bg-band border-[1.5px] border-ink shadow-2xs">
            <span className="text-2xl" aria-hidden="true">🛂</span>
          </div>

          <p className="m-0 font-mono text-[11px] sm:text-[12px] tracking-[0.2em] text-muted font-bold uppercase">
            CONCERT TICKET BOOK // ATTENDANCE ARCHIVE
          </p>

          <h1 className="m-0 mt-1.5 font-display text-[clamp(20px,4.5vw,36px)] font-black leading-tight tracking-tight text-ink">
            Official髭男dism <span className="font-bold text-band-ink">{t("ticketBook.title", "我的巡演護照")}</span>
          </h1>

          <p className="mt-2 mb-0 text-[12px] sm:text-[14px] text-muted max-w-[560px] leading-relaxed">
            {t("ticketBook.subtitle", "記錄你的每場參戰軌跡，珍藏專屬於你的現場回憶")}
          </p>

          {/* Stats Badge */}
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <span
              data-testid="ticket-book-total-badge"
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-tape px-3 py-1 font-mono text-[12px] sm:text-[13px] font-extrabold text-ink shadow-2xs"
            >
              <span aria-hidden="true">🎫</span>
              <span>{t("ticketBook.totalAttended", "累計參戰 {count} 場", { count })}</span>
            </span>
          </div>
        </header>

        {/* Perforation Divider */}
        <TicketPerforationDivider />

        {/* Dynamic Career Milestones Dashboard (Issue #37) */}
        <div className="mt-4 sm:mt-6">
          <TicketBookMilestoneDashboard
            milestones={milestones}
            onOpenSummaryCard={() => setIsSummaryModalOpen(true)}
          />
        </div>

        {/* Case 1: Empty State (0 shows attended) */}
        {attendedShows.length === 0 ? (
          <div
            data-testid="ticket-book-empty-state"
            className="my-6 sm:my-8 flex flex-col items-center text-center p-6 sm:p-10 rounded-[6px] border-[1.5px] border-dashed border-ink/30 bg-paper/60"
          >
            <div className="w-14 h-14 rounded-full bg-tape/40 border border-ink/20 flex items-center justify-center text-3xl mb-3 shadow-2xs">
              <span aria-hidden="true">🎟️</span>
            </div>
            <h2 className="m-0 font-display text-[17px] sm:text-[19px] font-bold text-ink">
              {t("ticketBook.emptyTitle", "尚未登錄任何參戰紀錄")}
            </h2>
            <p className="mt-2.5 mb-5 text-[13px] sm:text-[14px] text-muted max-w-[480px] leading-relaxed">
              {t("ticketBook.emptyDesc", "在任何場次的演出票根（ShowSlip）點擊「我參加過」，即可將現場回憶登錄至巡演護照中！")}
            </p>
            {(onReturnArchive || onReturnHome) && (
              <button
                type="button"
                data-testid="ticket-book-explore-cta"
                onClick={onReturnArchive || onReturnHome}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[4px] bg-band text-band-ink font-bold text-[13px] sm:text-[14px] border-[1.5px] border-ink shadow-xs hover:brightness-105 transition-colors cursor-pointer touch-stamp"
              >
                <span>{t("ticketBook.exploreCta", "開始探索演出場次")}</span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        ) : (
          /* Case 2: Filter Toolbar & Attended Shows Timeline */
          <div className="space-y-5">
            {/* Filter & Live Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-paper/60 p-2.5 sm:p-3 rounded-[6px] border border-line-soft">
              {/* Year Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="ticket-book-year-select" className="shrink-0 font-mono text-[11px] font-bold text-muted uppercase">
                  📅
                </label>
                <select
                  id="ticket-book-year-select"
                  data-testid="ticket-book-year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="rounded border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[12px] font-bold text-ink shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-band"
                >
                  <option value="all">{t("ticketBook.filterAllYears", "全部年份")}</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Keyword Search Input */}
              <div className="relative flex-1 max-w-full sm:max-w-[340px]">
                <input
                  type="text"
                  data-testid="ticket-book-search-input"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder={t("ticketBook.searchPlaceholder", "搜尋巡演、場館或城市關鍵字...")}
                  className="w-full rounded border border-ink/30 bg-card px-3 py-1.5 text-[12px] text-ink placeholder:text-muted/60 shadow-2xs focus:outline-none focus:ring-1 focus:ring-band"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink font-bold text-xs"
                    aria-label={t("ticketBook.clearFilter", "清除篩選")}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Results Status */}
            <div className="flex items-center justify-between text-[11px] font-mono text-muted px-1">
              <span>{t("ticketBook.timeline", "參戰時間軸")}</span>
              <span>
                {filteredShows.length} / {count}
              </span>
            </div>

            {/* Zero Filter Matches State */}
            {filteredShows.length === 0 ? (
              <div
                data-testid="ticket-book-no-match"
                className="my-8 py-8 px-4 text-center rounded-[4px] border border-dashed border-line-soft bg-paper/30"
              >
                <p className="font-bold text-[14px] text-ink m-0">
                  {t("ticketBook.noFilterMatch", "無符合條件的參戰場次")}
                </p>
                <p className="text-[12px] text-muted mt-1 mb-3">
                  {t("ticketBook.noFilterMatchDesc", "嘗試更換搜尋關鍵字或年份篩選。")}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1 rounded bg-card border border-ink/30 font-mono text-[11px] font-bold text-ink shadow-2xs hover:bg-tape-tint cursor-pointer transition-colors"
                >
                  {t("ticketBook.clearFilter", "清除篩選")}
                </button>
              </div>
            ) : (
              /* Timeline Items */
              <div className="space-y-3.5 relative">
                {/* Timeline vertical track border */}
                <div className="absolute left-[13px] sm:left-[17px] top-4 bottom-4 w-[2px] bg-line-soft -z-0 hidden sm:block" />

                {filteredShows.map((item) => {
                  const showKey = item.entry.showKey;
                  const formattedDate = item.show ? showDate(item.show, locale) : item.date;
                  const timeLabel = item.show ? formatShowTime(item.show, locale) : null;
                  const placeLabel = item.show ? formatShowVenueCity(item.show, t, locale) : item.venue;

                  return (
                    <div
                      key={showKey}
                      data-testid={`timeline-item-${showKey}`}
                      className="group relative rounded-[4px] border-[1.5px] border-ink bg-card p-3.5 sm:p-4 shadow-[2.5px_2.5px_0_rgba(0,0,0,0.08)] hover:shadow-[3px_3px_0_rgba(0,0,0,0.15)] transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-line-soft pb-2.5">
                        {/* Date & Tour Type Header */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[12px] sm:text-[13px] font-black text-ink tracking-tight tabular-nums bg-paper px-2 py-0.5 rounded border border-ink/20">
                            📅 {formattedDate}
                          </span>
                          {timeLabel && (
                            <span className="font-mono text-[11px] text-muted">
                              {timeLabel}
                            </span>
                          )}
                          {item.unit?.type && (
                            <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-ink border border-ink/15 uppercase">
                              {t(`categories.${item.unit.type}`, item.unit.type)}
                            </span>
                          )}
                        </div>

                        {/* Quick Jump Action (Mobile/Desktop) */}
                        <a
                          href={routeHash.show(showKey, { lang: locale })}
                          data-testid={`view-ticket-btn-${showKey}`}
                          onClick={(e) => {
                            if (onSelectShow) {
                              e.preventDefault();
                              onSelectShow(showKey);
                            }
                          }}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-ink hover:text-band-ink underline underline-offset-2 cursor-pointer self-start sm:self-auto touch-stamp"
                          title={t("ticketBook.viewShowSlip", "查看票根")}
                        >
                          <span aria-hidden="true">🎫</span>
                          <span>{t("ticketBook.viewShowSlip", "查看票根")}</span>
                          <span aria-hidden="true">→</span>
                        </a>
                      </div>

                      {/* Tour & Show Title */}
                      <div className="pt-2.5">
                        <h3 className="m-0 font-display text-[15px] sm:text-[16px] font-bold text-ink leading-snug">
                          {item.title}
                        </h3>

                        {/* Venue & City */}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] sm:text-[13px] text-muted">
                          <span aria-hidden="true">📍</span>
                          <span className="font-medium text-ink">{placeLabel}</span>
                          {item.prefecture && (
                            <span className="text-[11px] text-muted">
                              ({t(`prefectures.${item.prefecture}`, item.prefecture)})
                            </span>
                          )}
                        </div>

                        {/* Optional Seat Info */}
                        {item.entry.seat && (
                          <div className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-ink bg-paper px-2 py-0.5 rounded border border-ink/20">
                            <span aria-hidden="true">💺</span>
                            <span>{item.entry.seat}</span>
                          </div>
                        )}

                        {/* Optional Notes */}
                        {item.entry.notes && (
                          <div className="mt-2 rounded bg-paper/70 p-2 border-l-[3px] border-band text-[12px] text-ink font-sans leading-relaxed">
                            <span className="text-muted text-[11px] mr-1">💬</span>
                            {item.entry.notes}
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Row: Remove check-in button */}
                      <div className="mt-3 pt-2.5 border-t border-line-soft flex items-center justify-end">
                        <button
                          type="button"
                          data-testid={`remove-btn-${showKey}`}
                          onClick={() => remove(showKey)}
                          className="inline-flex items-center gap-1 rounded bg-paper hover:bg-request/10 px-2.5 py-1 font-mono text-[10px] sm:text-[11px] font-bold text-muted hover:text-request border border-line-soft hover:border-request/30 transition-colors cursor-pointer"
                          title={t("ticketBook.removeAttended", "移除打卡")}
                          aria-label={t("ticketBook.removeAttended", "移除打卡")}
                        >
                          <span aria-hidden="true">🗑️</span>
                          <span>{t("ticketBook.removeAttended", "移除打卡")}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Vintage Barcode Footer */}
        <TicketBarcodeFooter
          serial="TICKET BOOK // ATTENDANCE ARCHIVE"
          label={t("ticketBook.title", "我的巡演護照")}
        />
      </article>

      {/* Career Milestones Summary Card Modal (Issue #37) */}
      <MilestoneCardModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        milestones={milestones}
      />
    </div>
  );
}
