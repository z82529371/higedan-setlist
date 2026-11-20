import { queryTabClass } from "../../lib/constants.js";
import { useI18n } from "../../lib/i18n.jsx";
import { TicketIcon, MusicNoteIcon, VenuePinIcon } from "../common/ArchivalIcons.jsx";
import { BrandPageHeader } from "../common/BrandPageHeader.jsx";

export function ArchiveHeader({
  totalAllShows,
  allUsedSongs,
  allVenues,
  categoriesCount,
  tab,
  setTab,
  setQ,
  setIsFilterDrawerOpen,
}) {
  const { t } = useI18n();

  return (
    <>
      <header className="pb-0 pt-3.5 sm:pt-6">
        <BrandPageHeader
          align="left"
          subBrand="LIVE ARCHIVE"
          subtitle={t("header.archiveSubtitle")}
        />

        {/* Archival Spec Ledger Line (replaces KPI Pill Bar) */}
        <div className="mt-3 border-y border-ink/20 py-1.5 font-mono text-[11px] sm:text-[12px] text-ink/85 flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
          <span className="font-bold text-ink">{t("header.years")}</span>
          <span className="text-ink/30" aria-hidden="true">/</span>
          <span>
            <strong className="font-bold text-ink">{totalAllShows}</strong> {t("header.publicShows")}
          </span>
          <span className="text-ink/30" aria-hidden="true">/</span>
          <span>
            <strong className="font-bold text-ink">{categoriesCount}</strong> {t("header.performanceTypes")}
          </span>
          <span className="text-ink/30" aria-hidden="true">/</span>
          <span>
            <strong className="font-bold text-ink">{allUsedSongs.length}</strong> {t("header.originalSongs")}
          </span>
          <span className="text-ink/30" aria-hidden="true">/</span>
          <span>
            <strong className="font-bold text-ink">{allVenues.length}</strong> {t("header.historicVenues")}
          </span>
        </div>
      </header>

      {/* Top 3 Query Tabs (Desktop only: on small screens, tab switching is centralized in the FilterDrawer) */}
      <div
        className="hidden sm:grid mt-2.5 sm:mt-4 mb-3 w-full grid-cols-3 divide-x-[1.5px] divide-ink overflow-hidden rounded-[3px] border-[1.5px] border-ink bg-card shadow-[3px_3px_0_rgba(0,0,0,0.12)] dark:shadow-none"
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
          <TicketIcon className="w-4 h-4 shrink-0" />
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
          <MusicNoteIcon className="w-4 h-4 shrink-0" />
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
          <VenuePinIcon className="w-4 h-4 shrink-0" />
          <span>{t("nav.venues")}</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({allVenues.length})
          </span>
        </button>
      </div>
    </>
  );
}
