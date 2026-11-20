import { useI18n } from "../../lib/i18n.jsx";
import { useTicketBook } from "../../lib/ticket-book.js";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import {
  TicketIcon,
  MusicNoteIcon,
  VenuePinIcon,
  RouteIcon,
  ChartBarsIcon,
  DiscIcon,
  SearchIcon,
  HomeIcon,
  ArchiveBoxIcon,
  FilterIcon,
} from "../common/ArchivalIcons.jsx";

const STAMP_BTN_SQUARE =
  "inline-flex items-center justify-center w-10 h-10 rounded-[3px] bg-paper text-ink font-bold border-[1.5px] border-ink shadow-[2px_2px_0_#000] dark:shadow-none cursor-pointer hover:bg-tape-tint touch-stamp transition-colors";
const STAMP_BTN_PILL =
  "inline-flex items-center gap-1.5 px-3 h-10 rounded-[3px] bg-paper text-ink font-bold border-[1.5px] border-ink shadow-[2px_2px_0_#000] dark:shadow-none text-[12px] cursor-pointer hover:bg-tape-tint touch-stamp transition-colors";

export function MobileFloatingControls({
  tab,
  onOpenSearch,
  onOpenDrawer,
  onReturnHome,
  onSelectTickets,
  onSelectRanking,
  onSelectJourney,
  onSelectReleases,
  onReturnArchive,
  storage,
}) {
  const { t } = useI18n();
  const { count: ticketCount } = useTicketBook({ storage });

  const isStandalonePage = tab === "journey" || tab === "ranking" || tab === "releases";

  return (
    <>
      {/* Mobile Floating Stamp Controls (Right) */}
      <div className="fixed bottom-5 right-4 z-40 sm:hidden flex flex-col items-end gap-2 select-none">
        {tab === "journey" ? (
          <>
            <button
              type="button"
              data-testid="mobile-journey-filter-fab"
              onClick={onOpenDrawer}
              className={STAMP_BTN_SQUARE}
              title={t("mobile.filter", "篩選")}
              aria-label={t("mobile.filter", "篩選")}
            >
              <FilterIcon className="w-4 h-4" />
            </button>
            <LanguageSwitcher fab menuPosition="up" />
          </>
        ) : tab === "ranking" || tab === "releases" ? (
          <LanguageSwitcher fab menuPosition="up" />
        ) : (
          <>
            <LanguageSwitcher fab menuPosition="up" />

            <button
              type="button"
              onClick={onOpenSearch}
              className={STAMP_BTN_SQUARE}
              aria-label={t("mobile.openSearchAria", "開啟全域搜尋")}
            >
              <SearchIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenDrawer}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-[3px] border-[1.5px] border-ink bg-band text-band-ink shadow-[3px_3px_0_#000] dark:shadow-none font-display text-[13px] font-black cursor-pointer hover:brightness-105 touch-stamp transition-colors"
              aria-label={t("mobile.openFilterAria", "開啟篩選抽屜")}
            >
              {tab === "show" ? (
                <TicketIcon className="w-4 h-4 shrink-0" />
              ) : tab === "song" ? (
                <MusicNoteIcon className="w-4 h-4 shrink-0" />
              ) : (
                <VenuePinIcon className="w-4 h-4 shrink-0" />
              )}
              <span>{t("mobile.filter", "篩選")}</span>
            </button>
          </>
        )}
      </div>

      {/* Mobile Floating Stamp Dock (Left) */}
      <div className="fixed bottom-5 left-4 z-30 sm:hidden flex flex-col items-start gap-2 select-none">
        {isStandalonePage ? (
          <>
            {onReturnArchive && (
              <button
                type="button"
                data-testid={tab === "ranking" ? "mobile-ranking-back-archive-fab" : "mobile-archive-fab"}
                onClick={onReturnArchive}
                className={STAMP_BTN_PILL}
                title={t("ticketBook.backToArchive", "返回檔案庫")}
                aria-label={t("ticketBook.backToArchive", "返回檔案庫")}
              >
                <span aria-hidden="true" className="font-mono">←</span>
                <span>{t("ticketBook.backToArchive", "返回檔案庫")}</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              {onReturnHome && (
                <button
                  type="button"
                  data-testid={tab === "ranking" ? "mobile-ranking-back-home-fab" : undefined}
                  onClick={onReturnHome}
                  className={STAMP_BTN_PILL}
                  aria-label={t("mobile.backHomeAria", "回到首頁門面")}
                  title={t("mobile.backHomeTitle", "回到首頁門面")}
                >
                  <HomeIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("mobile.home", "首頁")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className={STAMP_BTN_SQUARE}
                aria-label={t("mobile.backTopAria", "回到頁首")}
                title={t("mobile.backTopTitle", "回到頁首")}
              >
                <span aria-hidden="true" className="font-mono text-[12px]">▲</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {onReturnArchive && (
              <button
                type="button"
                data-testid="mobile-archive-fab"
                onClick={onReturnArchive}
                className={STAMP_BTN_SQUARE}
                aria-label={t("ticketBook.backToArchive", "返回檔案庫")}
                title={t("ticketBook.backToArchive", "返回檔案庫")}
              >
                <ArchiveBoxIcon className="w-4 h-4" />
              </button>
            )}

            {onSelectRanking && (
              <button
                type="button"
                data-testid="mobile-ranking-fab"
                onClick={onSelectRanking}
                className={STAMP_BTN_SQUARE}
                aria-label={t("ranking.title", "演出排行")}
                title={t("ranking.title", "演出排行")}
              >
                <ChartBarsIcon className="w-4 h-4" />
              </button>
            )}

            {onSelectJourney && (
              <button
                type="button"
                data-testid="mobile-journey-fab"
                onClick={onSelectJourney}
                className={STAMP_BTN_SQUARE}
                aria-label={t("nav.journeyTitle", "全生涯巡演足跡")}
                title={t("nav.journeyTitle", "全生涯巡演足跡")}
              >
                <RouteIcon className="w-4 h-4" />
              </button>
            )}

            {onSelectReleases && (
              <button
                type="button"
                data-testid="mobile-releases-fab"
                onClick={onSelectReleases}
                className={STAMP_BTN_SQUARE}
                aria-label={t("nav.releasesTitle", "官方現場影音發行")}
                title={t("nav.releasesTitle", "官方現場影音發行")}
              >
                <DiscIcon className="w-4 h-4" />
              </button>
            )}

            {onSelectTickets && (
              <button
                type="button"
                data-testid="mobile-ticket-book-fab"
                onClick={onSelectTickets}
                className={`relative ${STAMP_BTN_SQUARE}`}
                aria-label={t("ticketBook.title", "我的巡演票夾")}
                title={t("ticketBook.title", "我的巡演票夾")}
              >
                <TicketIcon className="w-4 h-4" />
                {ticketCount > 0 && (
                  <span
                    data-testid="mobile-ticket-badge-count"
                    className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-[2px] bg-tape text-ink font-mono font-bold text-[10px] min-w-[18px] h-[18px] px-1 border border-ink tabular-nums"
                  >
                    {ticketCount}
                  </span>
                )}
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReturnHome}
                className={STAMP_BTN_PILL}
                aria-label={t("mobile.backHomeAria", "回到首頁門面")}
                title={t("mobile.backHomeTitle", "回到首頁門面")}
              >
                <HomeIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{t("mobile.home", "首頁")}</span>
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className={STAMP_BTN_SQUARE}
                aria-label={t("mobile.backTopAria", "回到頁首")}
                title={t("mobile.backTopTitle", "回到頁首")}
              >
                <span aria-hidden="true" className="font-mono text-[12px]">▲</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default MobileFloatingControls;
