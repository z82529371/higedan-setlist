import { queryTabClass } from "../../lib/constants.js";
import { useI18n } from "../../lib/i18n.jsx";
import { useTicketBook } from "../../lib/ticket-book.js";
import LanguageSwitcher from "../LanguageSwitcher.jsx";

export function ArchiveHeader({
  totalAllShows,
  allUsedSongs,
  allVenues,
  categoriesCount,
  tab,
  setTab,
  setQ,
  setIsFilterDrawerOpen,
  onSelectTickets,
  storage,
}) {
  const { t } = useI18n();
  const { count: ticketCount } = useTicketBook({ storage });

  return (
    <>
      <header className="pb-0 pt-3.5 sm:pt-6">
        <div className="flex items-center justify-between gap-2">
          <p className="m-0 font-mono text-[11px] sm:text-[12px] tracking-[0.2em] text-muted font-bold uppercase truncate">
            {t("header.livePerformanceArchive")}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="header-ticket-book-btn"
              onClick={onSelectTickets}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1 text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer touch-stamp"
              title={t("ticketBook.title", "我的巡演票夾")}
              aria-label={t("ticketBook.title", "我的巡演票夾")}
            >
              <span aria-hidden="true">🎟️</span>
              <span className="hidden xs:inline">{t("nav.ticketBook", "票夾")}</span>
              <span
                data-testid="ticket-badge-count"
                className="inline-flex items-center justify-center rounded-full bg-tape text-ink font-mono font-bold text-[10px] min-w-[18px] h-[18px] px-1 border border-ink/30 tabular-nums shadow-2xs"
              >
                {ticketCount}
              </span>
            </button>
            <LanguageSwitcher className="hidden sm:inline-block shrink-0" />
          </div>
        </div>
        <h1 className="m-0 mt-1.5 font-display text-[clamp(17px,4.5vw,44px)] font-extrabold leading-tight tracking-tight">
          Official髭男dism <span className="font-bold text-band-ink">{t("header.brandTitle")}</span>
        </h1>
        <p className="mt-2 mb-0 text-[12px] sm:text-[14px] text-muted leading-relaxed">
          {t("header.archiveSubtitle")}
        </p>
        <div className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto sm:flex-wrap font-mono text-[11px] sm:text-[12px] text-ink scrollbar-none">
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">📅</span> {t("header.years")}
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">🎫</span> {totalAllShows} {t("header.publicShows")}
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">🎭</span> {categoriesCount} {t("header.performanceTypes")}
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">🎵</span> {allUsedSongs.length} {t("header.originalSongs")}
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-paper px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">📍</span> {allVenues.length} {t("header.historicVenues")}
          </span>
        </div>
      </header>

      {/* Top 3 Query Tabs */}
      <div
        className="mt-2.5 sm:mt-4 mb-3 grid w-full grid-cols-3 divide-x-[1.5px] divide-ink overflow-hidden rounded-[4px] border-[1.5px] border-ink bg-card shadow-sm"
        role="group"
        aria-label={t("nav.directionLabel")}
      >
        <button
          type="button"
          className={`${queryTabClass(tab === "show")} border-r-[1.5px] border-ink relative`}
          onClick={() => {
            setTab("show");
            setQ("");
            setIsFilterDrawerOpen(false);
          }}
          aria-pressed={tab === "show"}
        >
          <span aria-hidden="true">🎫</span>
          <span>{t("nav.shows")}</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({totalAllShows})
          </span>
        </button>

        <button
          type="button"
          className={`${queryTabClass(tab === "song")} border-r-[1.5px] border-ink relative`}
          onClick={() => {
            setTab("song");
            setQ("");
            setIsFilterDrawerOpen(false);
          }}
          aria-pressed={tab === "song"}
        >
          <span aria-hidden="true">🎵</span>
          <span>{t("nav.songs")}</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({allUsedSongs.length})
          </span>
        </button>

        <button
          type="button"
          className={`${queryTabClass(tab === "venue")} relative`}
          onClick={() => {
            setTab("venue");
            setQ("");
            setIsFilterDrawerOpen(false);
          }}
          aria-pressed={tab === "venue"}
        >
          <span aria-hidden="true">🏛️</span>
          <span>{t("nav.venues")}</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({allVenues.length})
          </span>
        </button>
      </div>
    </>
  );
}
