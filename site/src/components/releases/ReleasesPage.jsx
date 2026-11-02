import { useState, useMemo } from "react";
import liveReleasesData from "../../data/live-releases.json";
import { useI18n } from "../../lib/i18n.jsx";
import {
  buildLiveReleaseIndex,
  formatReleaseTypeLabel,
  formatReleaseFormatLabel,
  formatCoverageLabel,
} from "../../lib/live-releases.js";
import { routeHash } from "../../lib/routes.js";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import { SLIP_ARTICLE, SLIP_TAPE } from "../../lib/constants.js";
import { TicketPerforationDivider, TicketBarcodeFooter } from "../slips/TicketCommon.jsx";
import { MobileFloatingControls } from "../layout/MobileFloatingControls.jsx";
import { useTicketBook } from "../../lib/ticket-book.js";

/**
 * ReleasesPage Component (ADR-0142)
 * Dedicated first-citizen view for official live releases (#/releases).
 * Crafted with the exact ticket aesthetic, top bar, and cards as TicketBookPage and RankingPage.
 */
export function ReleasesPage({
  onReturnArchive,
  onReturnHome,
  onSelectTickets,
  onSelectJourney,
  onSelectRanking,
  storage,
} = {}) {
  const { t, locale } = useI18n();
  const { count: ticketCount } = useTicketBook({ storage });
  const [filterType, setFilterType] = useState("all");

  const releaseIndex = useMemo(() => {
    return buildLiveReleaseIndex(liveReleasesData);
  }, []);

  const allReleases = useMemo(() => {
    return releaseIndex.getAllReleases();
  }, [releaseIndex]);

  const filteredReleases = useMemo(() => {
    if (filterType === "all") return allReleases;
    return allReleases.filter((r) => r.releaseType === filterType);
  }, [allReleases, filterType]);

  const countsByType = useMemo(() => {
    const counts = { all: allReleases.length, standalone: 0, bonus_video: 0, digital_only: 0 };
    for (const r of allReleases) {
      if (counts[r.releaseType] !== undefined) {
        counts[r.releaseType]++;
      }
    }
    return counts;
  }, [allReleases]);

  const filterTabs = [
    { id: "all", label: t("all_categories", "全部型態"), emoji: "💿" },
    { id: "standalone", label: formatReleaseTypeLabel("standalone", locale), emoji: "🎬" },
    { id: "bonus_video", label: formatReleaseTypeLabel("bonus_video", locale), emoji: "🎁" },
    ...(countsByType.digital_only > 0
      ? [{ id: "digital_only", label: formatReleaseTypeLabel("digital_only", locale), emoji: "🎧" }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-[960px] px-3 sm:px-6 pt-3 pb-24 sm:py-8 select-none font-sans">
      {/* Top Navigation & Language Utility Bar (Desktop only, mobile uses floating controls) */}
      <div className="mb-4 sm:mb-6 hidden sm:flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onReturnArchive && (
            <button
              type="button"
              onClick={onReturnArchive}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-3 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("ranking.backToArchive", "返回檔案庫")}
            >
              <span aria-hidden="true">←</span>
              <span>{t("ranking.backToArchive", "返回檔案庫")}</span>
            </button>
          )}
          {onReturnHome && (
            <button
              type="button"
              onClick={onReturnHome}
              className="inline-flex items-center gap-1 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("ranking.backToHome", "返回首頁")}
            >
              <span aria-hidden="true">🏠</span>
            </button>
          )}
          {onSelectTickets && (
            <button
              type="button"
              onClick={onSelectTickets}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("ticketBook.title", "我的巡演票夾")}
            >
              <span aria-hidden="true">🎟️</span>
              <span>{t("nav.ticketBook", "票夾")}</span>
              {ticketCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-band text-band-ink font-mono font-bold text-[9px] min-w-[15px] h-[15px] px-1 border border-ink tabular-nums">
                  {ticketCount}
                </span>
              )}
            </button>
          )}
          {onSelectRanking && (
            <button
              type="button"
              onClick={onSelectRanking}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("ranking.title", "演出排行")}
            >
              <span aria-hidden="true">🏆</span>
              <span>{t("ranking.title", "演出排行")}</span>
            </button>
          )}
          {onSelectJourney && (
            <button
              type="button"
              onClick={onSelectJourney}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-card px-2.5 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
              title={t("nav.journeyTitle", "全生涯巡演足跡")}
            >
              <span aria-hidden="true">🚐</span>
              <span>{t("nav.journey", "巡演足跡")}</span>
            </button>
          )}
        </div>
        <LanguageSwitcher />
      </div>

      {/* Main Ticket Receipt Card */}
      <article className={SLIP_ARTICLE}>
        {/* Washi Masking Tape Top Pin */}
        <div className={SLIP_TAPE} aria-hidden="true" />

        {/* Ticket Header Title Block */}
        <header className="flex flex-col items-center text-center pb-4">
          <div className="mb-2.5 inline-flex items-center justify-center w-12 h-12 rounded-[4px] bg-band border-[1.5px] border-ink shadow-2xs">
            <span className="text-2xl" aria-hidden="true">💿</span>
          </div>

          <p className="m-0 font-mono text-[11px] sm:text-[12px] tracking-[0.2em] text-muted font-bold uppercase">
            CONCERT ARCHIVE // LIVE RELEASES
          </p>

          <h1 className="m-0 mt-1.5 font-display text-[clamp(20px,4.5vw,36px)] font-black leading-tight tracking-tight text-ink">
            Official髭男dism <span className="font-bold text-band-ink">{t("live_discography_title", "現場影音發行")}</span>
          </h1>

          <p className="mt-2 mb-0 text-[12px] sm:text-[14px] text-muted max-w-[560px] leading-relaxed">
            {t("live_discography_desc", "收錄 Official 髭男 dism 歷年官方發行之獨立現場影音（BD/DVD）與影音限定盤特典。")}
          </p>

          {/* Stats Badge */}
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <span
              data-testid="releases-stats-badge"
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-tape px-3 py-1 font-mono text-[12px] sm:text-[13px] font-extrabold text-ink shadow-2xs"
            >
              <span aria-hidden="true">🎖️</span>
              <span>{allReleases.length} RELEASES ARCHIVED</span>
            </span>
          </div>
        </header>

        {/* Perforation Divider */}
        <TicketPerforationDivider />

        {/* Sub-board Selector Tabs (Ticket Stub Tab Pills) */}
        <div
          className="my-5 flex flex-wrap items-center justify-center sm:justify-start gap-2 border-b border-line-soft pb-4"
          role="tablist"
          aria-label={t("live_discography_title", "現場影音發行")}
        >
          {filterTabs.map((tab) => {
            const isActive = filterType === tab.id;
            const count = countsByType[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilterType(tab.id)}
                className={`rounded-[3px] px-3.5 py-1.5 font-mono text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  isActive
                    ? "bg-band text-band-ink border-[1.5px] border-ink shadow-xs"
                    : "bg-paper text-ink border border-ink/30 hover:bg-tape-tint/50"
                }`}
              >
                <span aria-hidden="true">{tab.emoji}</span>
                <span>{tab.label}</span>
                <span className="font-mono text-[10px] opacity-75 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Releases List (Authentic Ticket Stub Cards matching TicketBookPage) */}
        <div className="space-y-3.5 my-4">
          {filteredReleases.map((rel) => {
            const typeLabel = formatReleaseTypeLabel(rel.releaseType, locale);
            const primaryRecording = rel.recordings?.[0];

            return (
              <div
                key={rel.id}
                data-testid={`release-item-${rel.id}`}
                className="group relative rounded-[4px] border-[1.5px] border-ink bg-card p-3.5 sm:p-4 shadow-[2.5px_2.5px_0_rgba(0,0,0,0.08)] hover:shadow-[3px_3px_0_rgba(0,0,0,0.15)] transition-shadow text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line-soft pb-2.5">
                  {/* Left: Type badge, Coverage badge, Date, and Catalog pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-ink border border-ink/20 shadow-2xs">
                      {typeLabel}
                    </span>
                    {primaryRecording?.coverage && (
                      <span
                        data-testid="release-card-coverage-badge"
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold border shadow-2xs ${
                          primaryRecording.coverage === "full"
                            ? "bg-tape-tint text-ink border-tape-line"
                            : "bg-paper text-ink-muted border-ink/20"
                        }`}
                      >
                        {formatCoverageLabel(primaryRecording.coverage, locale)}
                      </span>
                    )}
                    {rel.releaseDate && (
                      <span className="font-mono text-[11px] sm:text-[12px] font-black text-ink tracking-tight tabular-nums bg-paper px-2 py-0.5 rounded border border-ink/20">
                        📅 {rel.releaseDate}
                      </span>
                    )}
                    {rel.catalogNumbers?.map((cat) => (
                      <span
                        key={cat}
                        className="font-mono text-[10px] text-muted px-1.5 py-0.5 rounded bg-paper/60 border border-line-soft"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Right Actions: View Show Slip & Spotify */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                    {primaryRecording?.showId && (
                      <a
                        href={routeHash.show(primaryRecording.showId, { lang: locale })}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-ink hover:text-band-ink underline underline-offset-2 cursor-pointer touch-stamp"
                        title={t("view_show_slip", "查看演出票根")}
                      >
                        <span aria-hidden="true">🎫</span>
                        <span>{t("view_show_slip", "查看演出票根")}</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    )}
                    {rel.streaming?.spotifyAlbumId && (
                      <>
                        <span className="text-line-soft select-none" aria-hidden="true">|</span>
                        <a
                          href={`https://open.spotify.com/album/${rel.streaming.spotifyAlbumId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-ink hover:text-band-ink underline underline-offset-2 cursor-pointer touch-stamp"
                          title="Spotify Live"
                        >
                          <span aria-hidden="true">🟢</span>
                          <span>Spotify ↗</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="pt-2.5">
                  <h2 className="font-display text-[15px] sm:text-[18px] font-black text-ink leading-snug mb-1">
                    {rel.title}
                  </h2>

                  {rel.parentRelease && (
                    <p className="text-[12px] text-muted font-medium mb-2">
                      <span className="font-bold text-ink">{t("bonus_included_in", "收錄於")}：</span>
                      {rel.parentRelease.title}
                    </p>
                  )}

                  {/* Formats Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {rel.formats?.map((fmt) => (
                      <span
                        key={fmt}
                        className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-paper border border-ink/20 text-ink shadow-2xs"
                      >
                        {formatReleaseFormatLabel(fmt)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ticket Barcode Footer */}
        <TicketBarcodeFooter
          serial="HIGEDAN-LIVE-RELEASES-ARCHIVE"
          label={t("live_discography_title", "現場發行典藏館")}
        />
      </article>

      {/* Mobile Floating Action Controls */}
      <MobileFloatingControls
        tab="releases"
        onReturnHome={onReturnHome}
        onReturnArchive={onReturnArchive}
        onSelectTickets={onSelectTickets}
        onSelectRanking={onSelectRanking}
        onSelectJourney={onSelectJourney}
        storage={storage}
      />
    </div>
  );
}

export default ReleasesPage;
