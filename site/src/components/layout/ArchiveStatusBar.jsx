import { trackKey } from "../../lib/track.js";
import { useI18n } from "../../lib/i18n.jsx";
import { useTicketBook } from "../../lib/ticket-book.js";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import {
  TicketIcon,
  ChartBarsIcon,
  RouteIcon,
  DiscIcon,
  HomeIcon,
  ArchiveBoxIcon,
  MusicNoteIcon,
  VenuePinIcon,
} from "../common/ArchivalIcons.jsx";

export function ArchiveStatusBar({
  viewMode = "archive",
  tab,
  current,
  selSong,
  currentSongObj,
  selVenue,
  currentVenueObj,
  trackShows,
  slipRef,
  handleReturnArchive,
  handleReturnHome,
  handleSelectTickets,
  handleSelectRanking,
  handleSelectJourney,
  handleSelectReleases,
  storage,
}) {
  const { t } = useI18n();
  const { count: ticketCount } = useTicketBook({ storage });

  const navBtnClass = (isActive) =>
    `hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] font-bold border transition-colors cursor-pointer touch-stamp text-[10px] sm:text-[11px] shrink-0 ${
      isActive
        ? "bg-band-ink text-band border-band-ink"
        : "bg-band-ink/10 hover:bg-band-ink/20 text-band-ink border-band-ink/30"
    }`;

  return (
    <div
      data-testid="archive-status-bar"
      className="sticky top-0 z-40 w-full bg-band border-b border-ink/20 shadow-xs select-none"
      onClick={() => {
        if (slipRef?.current) {
          slipRef.current.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      role="button"
      tabIndex={0}
      title={t("statusBar.backToTopTitle", "點擊滾動回單據頂部")}
      aria-label={t("statusBar.backToTopAria", "當前狀態導航列，點擊回單據頂部")}
    >
      <div className="w-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 py-1 sm:py-2 font-mono text-[10px] sm:text-[12px] tracking-wider sm:tracking-[0.14em] text-band-ink whitespace-nowrap cursor-pointer">
        {/* Left: Dynamic Context Title */}
        <div className="truncate min-w-0 flex-1 overflow-hidden font-bold flex items-center gap-1.5">
          {viewMode === "landing" && <span>Official髭男dism // LIVE ARCHIVE</span>}
          {viewMode === "tickets" && <span>{t("ticketBook.title", "個人巡演票夾")}</span>}
          {viewMode === "journey" && <span>{t("nav.journeyTitle", "全生涯巡演足跡")}</span>}
          {viewMode === "ranking" && <span>{t("ranking.title", "演出排行")}</span>}
          {viewMode === "releases" && <span>{t("nav.releasesTitle", "官方現場影音發行")}</span>}
          {viewMode === "archive" && tab === "show" && <span>{current?.unit.title ?? ""}</span>}
          {viewMode === "archive" && tab === "song" && (
            <span className="inline-flex items-center gap-1 truncate">
              <MusicNoteIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {currentSongObj?.title || selSong}
                {currentSongObj?.unreleased
                  ? t("statusBar.unreleasedSuffix", "（未發行）")
                  : currentSongObj?.album
                  ? `（${currentSongObj.album}）`
                  : ""}
              </span>
            </span>
          )}
          {viewMode === "archive" && tab === "venue" && (
            <span className="inline-flex items-center gap-1 truncate">
              <VenuePinIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {selVenue}
                {currentVenueObj?.city ? `（${t("cities." + currentVenueObj.city, currentVenueObj.city)}）` : ""}
              </span>
            </span>
          )}
        </div>

        {/* Right: Dynamic Summary Metadata + Global Nav Buttons */}
        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 font-bold opacity-90 sm:opacity-100">
          {viewMode === "archive" && tab === "show" && (
            <>
              <span className="hidden sm:inline opacity-45">●</span>
              <span className="hidden sm:inline">
                {t("statusBar.showSummary", "{shows} 場 · {songs} 首歌曲", { shows: current?.shows.length ?? 0, songs: current?.songShows.size ?? 0 })}
              </span>
              <span className="sm:hidden">{t("statusBar.showSummaryMobile", "{shows} 場", { shows: current?.shows.length ?? 0 })}</span>
              <span className="hidden sm:inline opacity-35 select-none shrink-0">|</span>
            </>
          )}
          {viewMode === "archive" && tab === "song" && (
            <>
              <span className="hidden sm:inline opacity-45">●</span>
              <span className="hidden sm:inline">
                {t("statusBar.songTotal", "累計演唱 {count} 場", { count: (trackShows.get(trackKey("song", selSong)) ?? []).length })}
              </span>
              <span className="sm:hidden">
                {t("statusBar.songTotalMobile", "累計 {count} 場", { count: (trackShows.get(trackKey("song", selSong)) ?? []).length })}
              </span>
              <span className="opacity-45">●</span>
              <span>{t("statusBar.songArchive", "歌曲檔案")}</span>
              <span className="hidden sm:inline opacity-35 select-none shrink-0">|</span>
            </>
          )}
          {viewMode === "archive" && tab === "venue" && (
            <>
              <span className="hidden sm:inline opacity-45">●</span>
              <span className="hidden sm:inline">
                {t("statusBar.venueTotal", "累計舉辦 {count} 場", { count: currentVenueObj?.shows?.length ?? 0 })}
              </span>
              <span className="sm:hidden">
                {t("statusBar.venueTotalMobile", "累計 {count} 場", { count: currentVenueObj?.shows?.length ?? 0 })}
              </span>
              <span className="opacity-45">●</span>
              <span>{t("statusBar.venueArchive", "場地檔案")}</span>
              <span className="hidden sm:inline opacity-35 select-none shrink-0">|</span>
            </>
          )}

          {/* Archive Mode Button (Desktop, shown on landing/special pages) */}
          {viewMode !== "archive" && handleReturnArchive && (
            <button
              type="button"
              data-testid="status-bar-archive-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleReturnArchive();
              }}
              className={navBtnClass(false)}
              title={t("ticketBook.backToArchive", "檔案庫")}
              aria-label={t("ticketBook.backToArchive", "檔案庫")}
            >
              <ArchiveBoxIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t("nav.archive", "檔案庫")}</span>
            </button>
          )}

          {/* Ticket Book Action Button (Desktop) */}
          {handleSelectTickets && (
            <button
              type="button"
              data-testid="status-bar-ticket-book-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectTickets();
              }}
              className={navBtnClass(viewMode === "tickets")}
              title={t("ticketBook.title", "我的巡演票夾")}
              aria-label={t("ticketBook.title", "我的巡演票夾")}
            >
              <TicketIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t("nav.ticketBook", "票夾")}</span>
              {ticketCount > 0 && (
                <span
                  data-testid="status-bar-ticket-badge-count"
                  className={`inline-flex items-center justify-center rounded-[2px] font-mono font-bold text-[9px] min-w-[15px] h-[15px] px-1 border tabular-nums ${
                    viewMode === "tickets"
                      ? "bg-band text-band-ink border-band"
                      : "bg-band-ink text-band border-band-ink/30"
                  }`}
                >
                  {ticketCount}
                </span>
              )}
            </button>
          )}

          {/* Leaderboard Action Button (Desktop) */}
          {handleSelectRanking && (
            <button
              type="button"
              data-testid="status-bar-ranking-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRanking();
              }}
              className={navBtnClass(viewMode === "ranking")}
              title={t("ranking.title", "演出排行")}
              aria-label={t("ranking.title", "演出排行")}
            >
              <ChartBarsIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t("nav.ranking", "排行")}</span>
            </button>
          )}

          {/* Career Journey Action Button (Desktop) */}
          {handleSelectJourney && (
            <button
              type="button"
              data-testid="status-bar-journey-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectJourney();
              }}
              className={navBtnClass(viewMode === "journey")}
              title={t("nav.journeyTitle", "全生涯長征路線")}
              aria-label={t("nav.journeyTitle", "全生涯長征路線")}
            >
              <RouteIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t("nav.journey", "巡演長征")}</span>
            </button>
          )}

          {/* Live Releases Action Button (Desktop) */}
          {handleSelectReleases && (
            <button
              type="button"
              data-testid="status-bar-releases-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectReleases();
              }}
              className={navBtnClass(viewMode === "releases")}
              title={t("nav.releasesTitle", "官方現場影音發行")}
              aria-label={t("nav.releasesTitle", "官方現場影音發行")}
            >
              <DiscIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t("nav.releases", "作品")}</span>
            </button>
          )}

          {/* Home Action Button (Desktop) */}
          {handleReturnHome && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReturnHome();
              }}
              className={navBtnClass(viewMode === "landing")}
              title={t("statusBar.backHomeTitle", "返回首頁")}
              aria-label={t("statusBar.backHomeAria", "返回首頁")}
            >
              <HomeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t("statusBar.home", "首頁")}</span>
            </button>
          )}

          {/* Desktop Language Switcher (Mobile uses bottom-right floating stamp) */}
          <div onClick={(e) => e.stopPropagation()} className="hidden sm:block shrink-0">
            <LanguageSwitcher compact />
          </div>
        </div>
      </div>
    </div>
  );
}
