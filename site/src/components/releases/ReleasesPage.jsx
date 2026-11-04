import { useState, useMemo, useEffect } from "react";
import liveReleasesData from "../../data/live-releases.json";
import discographyData from "../../data/discography.json";
import { useI18n } from "../../lib/i18n.jsx";
import {
  buildLiveReleaseIndex,
  formatReleaseTypeLabel,
  formatReleaseFormatLabel,
  formatCoverageLabel,
} from "../../lib/live-releases.js";
import {
  buildDiscographyIndex,
  formatDiscographyTypeLabel,
} from "../../lib/discography.js";
import { routeHash, parseRoute } from "../../lib/routes.js";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import { SLIP_ARTICLE, SLIP_TAPE } from "../../lib/constants.js";
import { TicketPerforationDivider, TicketBarcodeFooter } from "../slips/TicketCommon.jsx";
import { CoverLightboxModal } from "../slips/CoverLightboxModal.jsx";
import { MobileFloatingControls } from "../layout/MobileFloatingControls.jsx";
import { useTicketBook } from "../../lib/ticket-book.js";

/**
 * ReleasesPage Component (ADR-0142, ADR-0144)
 * Dedicated first-citizen view for official live releases and studio discography (#/releases).
 * Features dual-track segmented tabs, 5-pill sub-filters, structured tracklists,
 * and bidirectional deep-linking with auto-expansion and highlight animation.
 */
export function ReleasesPage({
  initialTab,
  initialTargetId,
  onReturnArchive,
  onReturnHome,
  onSelectTickets,
  onSelectJourney,
  onSelectRanking,
  storage,
} = {}) {
  const { t, locale } = useI18n();
  const { count: ticketCount } = useTicketBook({ storage });

  // Route query extraction fallback
  const parsedHash = useMemo(() => {
    if (typeof window === "undefined" || !window.location?.hash) return null;
    return parseRoute(window.location.hash);
  }, []);

  const defaultTab =
    initialTab ||
    (parsedHash?.kind === "releases" && parsedHash.tab === "discography"
      ? "discography"
      : "live");
  const targetId = initialTargetId || (parsedHash?.kind === "releases" ? parsedHash.id : null);

  // Live & Studio Indices
  const liveIndex = useMemo(() => {
    return buildLiveReleaseIndex(liveReleasesData);
  }, []);

  const discogIndex = useMemo(() => {
    return buildDiscographyIndex(discographyData);
  }, []);

  const [mainTab, setMainTab] = useState(defaultTab);
  const [liveFilterType, setLiveFilterType] = useState(() => {
    if (targetId) {
      const lr = liveIndex.getReleaseById(targetId);
      if (lr?.releaseType) return lr.releaseType;
    }
    return "standalone";
  });
  const [discogFilterType, setDiscogFilterType] = useState(() => {
    if (targetId) {
      const sr = discogIndex.getReleaseById(targetId);
      if (sr?.category) return sr.category;
    }
    return "physical_single";
  });
  const [lightboxRelease, setLightboxRelease] = useState(null);
  const [expandedReleaseIds, setExpandedReleaseIds] = useState(() => {
    return targetId ? new Set([targetId]) : new Set();
  });
  const [highlightedId, setHighlightedId] = useState(targetId || null);

  // Sync route target if changed
  useEffect(() => {
    if (!targetId) return;
    const sr = discogIndex.getReleaseById(targetId);
    if (sr?.category) setDiscogFilterType(sr.category);
    const lr = liveIndex.getReleaseById(targetId);
    if (lr?.releaseType) setLiveFilterType(lr.releaseType);
    setExpandedReleaseIds((prev) => new Set([...prev, targetId]));
    setHighlightedId(targetId);
    const timer = setTimeout(() => setHighlightedId(null), 1800);

    if (typeof document !== "undefined") {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    return () => clearTimeout(timer);
  }, [targetId, discogIndex, liveIndex]);

  // Listen to hashchange for in-page deep links & browser navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleHashChange = () => {
      const r = parseRoute(window.location.hash);
      if (r?.kind === "releases") {
        if (r.tab) setMainTab(r.tab);
        if (r.id) {
          const sr = discogIndex.getReleaseById(r.id);
          if (sr?.category) setDiscogFilterType(sr.category);
          const lr = liveIndex.getReleaseById(r.id);
          if (lr?.releaseType) setLiveFilterType(lr.releaseType);
          setExpandedReleaseIds((prev) => new Set([...prev, r.id]));
          setHighlightedId(r.id);
          setTimeout(() => setHighlightedId(null), 1800);
          const el = document.getElementById(r.id);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [discogIndex, liveIndex]);

  const allLiveReleases = useMemo(() => {
    return liveIndex.getAllReleases();
  }, [liveIndex]);

  const filteredLiveReleases = useMemo(() => {
    if (liveFilterType === "all") return allLiveReleases;
    return allLiveReleases.filter((r) => r.releaseType === liveFilterType);
  }, [allLiveReleases, liveFilterType]);

  const liveCountsByType = useMemo(() => {
    const counts = { all: allLiveReleases.length, standalone: 0, bonus_video: 0, digital_only: 0 };
    for (const r of allLiveReleases) {
      if (counts[r.releaseType] !== undefined) {
        counts[r.releaseType]++;
      }
    }
    return counts;
  }, [allLiveReleases]);

  const liveFilterTabs = [
    { id: "standalone", label: formatReleaseTypeLabel("standalone", locale), emoji: "🎬" },
    { id: "bonus_video", label: formatReleaseTypeLabel("bonus_video", locale), emoji: "🎁" },
    ...(liveCountsByType.digital_only > 0
      ? [{ id: "digital_only", label: formatReleaseTypeLabel("digital_only", locale), emoji: "🎧" }]
      : []),
  ];

  const allStudioReleases = useMemo(() => {
    return discogIndex.getAllReleases();
  }, [discogIndex]);

  const filteredStudioReleases = useMemo(() => {
    return discogIndex.getReleasesByCategory(discogFilterType);
  }, [discogIndex, discogFilterType]);

  const discogCounts = useMemo(() => {
    const counts = {
      all: allStudioReleases.length,
      physical_single: 0,
      digital_single: 0,
      collaboration_single: 0,
      ep: 0,
      album: 0,
    };
    for (const r of allStudioReleases) {
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      }
    }
    return counts;
  }, [allStudioReleases]);

  const discogFilterTabs = [
    { id: "physical_single", label: formatDiscographyTypeLabel("physical_single", locale), emoji: "💿" },
    { id: "digital_single", label: formatDiscographyTypeLabel("digital_single", locale), emoji: "🎧" },
    { id: "collaboration_single", label: formatDiscographyTypeLabel("collaboration_single", locale), emoji: "🤝" },
    { id: "ep", label: formatDiscographyTypeLabel("ep", locale), emoji: "📦" },
    { id: "album", label: formatDiscographyTypeLabel("album", locale), emoji: "📀" },
  ];

  const toggleExpandRelease = (id) => {
    setExpandedReleaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSwitchMainTab = (newTab) => {
    setMainTab(newTab);
    if (typeof window !== "undefined") {
      window.location.hash = routeHash.releases({ tab: newTab, lang: locale });
    }
  };

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

        {/* Dual-Track Segmented Tab Switcher (ADR-0144) */}
        <div className="flex items-center justify-center pt-2 pb-5 border-b border-line-soft">
          <div
            className="inline-flex p-1 rounded-[5px] bg-paper border border-ink/25 shadow-2xs gap-1"
            role="tablist"
            aria-label="Releases Track Switcher"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "live"}
              onClick={() => handleSwitchMainTab("live")}
              className={`rounded-[3px] px-3.5 py-1.5 font-mono text-[12px] sm:text-[13px] font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                mainTab === "live"
                  ? "bg-band text-band-ink border border-ink shadow-xs"
                  : "bg-transparent text-ink/75 hover:text-ink hover:bg-tape-tint/40 border border-transparent"
              }`}
            >
              <span aria-hidden="true">🎬</span>
              <span>{t("releases_tab_live", "現場影音")}</span>
              <span className="font-mono text-[10px] opacity-80 tabular-nums">({allLiveReleases.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "discography"}
              onClick={() => handleSwitchMainTab("discography")}
              className={`rounded-[3px] px-3.5 py-1.5 font-mono text-[12px] sm:text-[13px] font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                mainTab === "discography"
                  ? "bg-band text-band-ink border border-ink shadow-xs"
                  : "bg-transparent text-ink/75 hover:text-ink hover:bg-tape-tint/40 border border-transparent"
              }`}
            >
              <span aria-hidden="true">💿</span>
              <span>{t("releases_tab_discography", "錄音室作品")}</span>
              <span className="font-mono text-[10px] opacity-80 tabular-nums">({allStudioReleases.length})</span>
            </button>
          </div>
        </div>

        {/* Ticket Header Title Block */}
        <header className="flex flex-col items-center text-center py-4">
          <div className="mb-2.5 inline-flex items-center justify-center w-12 h-12 rounded-[4px] bg-band border-[1.5px] border-ink shadow-2xs">
            <span className="text-2xl" aria-hidden="true">
              {mainTab === "live" ? "🎬" : "💿"}
            </span>
          </div>

          <p className="m-0 font-mono text-[11px] sm:text-[12px] tracking-[0.2em] text-muted font-bold uppercase">
            {mainTab === "live"
              ? "CONCERT ARCHIVE // LIVE RELEASES"
              : "CONCERT ARCHIVE // STUDIO DISCOGRAPHY"}
          </p>

          <h1 className="m-0 mt-1.5 font-display text-[clamp(20px,4.5vw,36px)] font-black leading-tight tracking-tight text-ink">
            Official髭男dism{" "}
            <span className="font-bold text-band-ink">
              {mainTab === "live"
                ? t("live_discography_title", "現場影音發行")
                : t("studio_discography_title", "錄音室作品全集")}
            </span>
          </h1>

          <p className="mt-2 mb-0 text-[12px] sm:text-[14px] text-muted max-w-[560px] leading-relaxed">
            {mainTab === "live"
              ? t("live_discography_desc", "收錄 Official 髭男 dism 歷年官方發行之獨立現場影音（BD/DVD）與影音限定盤特典。")
              : t("studio_discography_desc", "收錄 Official 髭男 dism 歷年官方發行之實體單曲、數位單曲、EP 與正規專輯規格品番與曲目清單。")}
          </p>

          {/* Stats Badge */}
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <span
              data-testid="releases-stats-badge"
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/30 bg-tape px-3 py-1 font-mono text-[12px] sm:text-[13px] font-extrabold text-ink shadow-2xs"
            >
              <span aria-hidden="true">🎖️</span>
              <span>
                {mainTab === "live"
                  ? `${allLiveReleases.length} RELEASES ARCHIVED`
                  : `${allStudioReleases.length} RELEASES ARCHIVED`}
              </span>
            </span>
          </div>
        </header>

        {/* Perforation Divider */}
        <TicketPerforationDivider />

        {/* Sub-board Selector Tabs (Ticket Stub Tab Pills) */}
        {mainTab === "live" ? (
          <div
            className="my-5 flex flex-wrap items-center justify-center sm:justify-start gap-2 border-b border-line-soft pb-4"
            role="tablist"
            aria-label={t("live_discography_title", "現場影音發行")}
          >
            {liveFilterTabs.map((tab) => {
              const isActive = liveFilterType === tab.id;
              const count = liveCountsByType[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setLiveFilterType(tab.id)}
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
        ) : (
          <div
            className="my-5 flex flex-wrap items-center justify-center sm:justify-start gap-2 border-b border-line-soft pb-4"
            role="tablist"
            aria-label={t("studio_discography_title", "錄音室作品全集")}
          >
            {discogFilterTabs.map((tab) => {
              const isActive = discogFilterType === tab.id;
              const count = discogCounts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setDiscogFilterType(tab.id)}
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
        )}

        {/* ===================== TAB 1: LIVE RELEASES LIST ===================== */}
        {mainTab === "live" && (
          <div className="space-y-3.5 my-4">
            {filteredLiveReleases.map((rel) => {
              const typeLabel = formatReleaseTypeLabel(rel.releaseType, locale);
              const primaryRecording = rel.recordings?.[0];

              return (
                <div
                  key={rel.id}
                  id={rel.id}
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
                          href={routeHash.show(primaryRecording.showId)}
                          className="inline-flex items-center gap-1 rounded-[3px] border border-ink/30 bg-tape px-2.5 py-1 font-mono text-[11px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors no-underline cursor-pointer"
                          title={t("view_show_slip", "前往演出票根")}
                        >
                          <span>🎫 {t("view_show_slip", "前往演出票根")} ➔</span>
                        </a>
                      )}
                      {rel.streaming?.spotifyAlbumId && (
                        <a
                          href={`https://open.spotify.com/album/${rel.streaming.spotifyAlbumId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-[3px] border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-ink shadow-2xs hover:bg-band hover:border-band hover:text-band-ink transition-colors no-underline cursor-pointer"
                          title={t("slips.song.listenOnSpotify", "在 Spotify 聆聽")}
                        >
                          <span>🎧 Spotify ↗</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Cover Art + Title + Parent Release */}
                  <div className="pt-3 flex gap-3.5 sm:gap-4 items-start">
                    {/* Official Video / Live Cover Art (only render when coverUrl is present) */}
                    {rel.coverUrl && (
                      <button
                        type="button"
                        onClick={() => setLightboxRelease(rel)}
                        className="group/cover relative w-[72px] h-[72px] sm:w-[92px] sm:h-[92px] rounded-[3px] border border-ink/25 bg-paper shadow-2xs shrink-0 overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-band"
                        title={t("slips.song.viewJacket", "查看《{title}》唱片封面", { title: rel.title })}
                        aria-label={t("slips.song.viewJacket", "查看《{title}》唱片封面", { title: rel.title })}
                      >
                        <img
                          src={rel.coverUrl}
                          alt={rel.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <span
                          className="absolute inset-0 bg-ink/15 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center text-white drop-shadow-2xs font-mono text-xs font-bold"
                          aria-hidden="true"
                        >
                          🔍
                        </span>
                      </button>
                    )}

                    {/* Title & Parent Release Info */}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[17px] sm:text-[20px] font-black leading-snug text-ink tracking-tight">
                        {rel.title}
                      </h2>
                      {rel.parentRelease && (
                        <p className="mt-1 mb-0 font-mono text-[11px] sm:text-[12px] text-muted">
                          <span className="text-ink-muted">{t("bonus_included_in", "收錄於")}：</span>
                          <span className="font-bold text-ink">《{rel.parentRelease.title}》</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Formats Pills */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-line-soft/60">
                    <span className="font-mono text-[10px] text-muted mr-1">FORMATS:</span>
                    {rel.formats?.map((fmt) => (
                      <span
                        key={fmt}
                        className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-ink border border-line-soft"
                      >
                        {formatReleaseFormatLabel(fmt)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================== TAB 2: STUDIO DISCOGRAPHY LIST (ADR-0144) ===================== */}
        {mainTab === "discography" && (
          <div className="space-y-3.5 my-4">
            {filteredStudioReleases.map((rel) => {
              const typeLabel = formatDiscographyTypeLabel(rel.category, locale);
              const isExpanded = expandedReleaseIds.has(rel.id);
              const isHighlighted = highlightedId === rel.id;
              const tracksCount = rel.tracks?.length || 0;

              return (
                <div
                  key={rel.id}
                  id={rel.id}
                  data-testid={`discography-item-${rel.id}`}
                  className={`group relative rounded-[4px] border-[1.5px] bg-card p-3.5 sm:p-4 text-left transition-all ${
                    isHighlighted
                      ? "border-band ring-2 ring-band bg-band/5 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                      : "border-ink shadow-[2.5px_2.5px_0_rgba(0,0,0,0.08)] hover:shadow-[3px_3px_0_rgba(0,0,0,0.15)]"
                  }`}
                >
                  {/* Top Bar: Category badge, Release Date, Label, Oricon */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-ink border border-ink/20 shadow-2xs">
                        {typeLabel}
                      </span>
                      {rel.releaseDate && (
                        <span className="font-mono text-[11px] sm:text-[12px] font-black text-ink tracking-tight tabular-nums bg-paper px-2 py-0.5 rounded border border-ink/20">
                          📅 {rel.releaseDate}
                        </span>
                      )}
                      {rel.chartRankOricon && (
                        <span className="font-mono text-[10px] sm:text-[11px] font-extrabold text-ink bg-tape px-2 py-0.5 rounded border border-ink/20 shadow-2xs">
                          🏆 Oricon #{rel.chartRankOricon}
                        </span>
                      )}
                      {rel.label && (
                        <span className="font-mono text-[10px] text-muted px-1.5 py-0.5 rounded bg-paper/60 border border-line-soft">
                          {rel.label}
                        </span>
                      )}
                    </div>

                    {/* Track count badge */}
                    <span className="font-mono text-[11px] font-bold text-muted bg-paper px-2 py-0.5 rounded border border-line-soft">
                      {t("discography_tracks_count", "共 {count} 首收錄曲", { count: tracksCount })}
                    </span>
                  </div>

                  {/* Card Body: Cover Art + Title + Editions */}
                  <div className="pt-3 flex gap-3.5 sm:gap-4 items-start">
                    {/* Official Jacket Cover Art */}
                    <button
                      type="button"
                      onClick={() => setLightboxRelease(rel)}
                      className="group/cover relative w-[72px] h-[72px] sm:w-[92px] sm:h-[92px] rounded-[3px] border border-ink/25 bg-paper shadow-2xs shrink-0 overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-band"
                      title={t("slips.song.viewJacket", "查看《{title}》唱片封面", { title: rel.title })}
                      aria-label={t("slips.song.viewJacket", "查看《{title}》唱片封面", { title: rel.title })}
                    >
                      {rel.coverUrl ? (
                        <img
                          src={rel.coverUrl}
                          alt={rel.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted font-mono text-[10px]">
                          <span className="text-xl" aria-hidden="true">💿</span>
                          <span>VINYL</span>
                        </div>
                      )}
                      <span
                        className="absolute inset-0 bg-ink/15 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center text-white drop-shadow-2xs font-mono text-xs font-bold"
                        aria-hidden="true"
                      >
                        🔍
                      </span>
                    </button>

                    {/* Title & Editions Info */}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[18px] sm:text-[22px] font-black leading-snug text-ink tracking-tight">
                        {rel.title}
                      </h2>

                      {/* Editions capsules with catalog numbers */}
                      {rel.editions && rel.editions.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {rel.editions.map((ed, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 font-mono text-[10px] sm:text-[11px] text-ink font-semibold border border-line-soft"
                            >
                              <span className="font-bold">{ed.name}</span>
                              {ed.format && (
                                <span className="opacity-75 uppercase">[{ed.format.replace('_', '+')}]</span>
                              )}
                              {ed.catalogNumber && (
                                <span className="text-band-ink font-bold">{ed.catalogNumber}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bonus content notice if any */}
                      {rel.editions?.some((e) => e.bonusContent) && (
                        <p className="mt-1.5 mb-0 font-mono text-[10px] sm:text-[11px] text-muted">
                          🎁 {rel.editions.find((e) => e.bonusContent)?.bonusContent}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tracklist Toggle Accordion & Verified Spotify Action */}
                  <div className="mt-3.5 pt-2.5 border-t border-line-soft flex items-center justify-between flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpandRelease(rel.id)}
                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-ink/30 bg-paper px-2.5 py-1 font-mono text-[11px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? "▲" : "▼"}</span>
                      <span>
                        {isExpanded
                          ? t("discography_collapse_tracks", "收折曲目")
                          : t("discography_expand_tracks", "展開曲目")}
                      </span>
                    </button>

                    {rel.spotifyAlbumId && (
                      <a
                        href={`https://open.spotify.com/album/${rel.spotifyAlbumId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-[3px] border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-ink shadow-2xs hover:bg-band hover:border-band hover:text-band-ink transition-colors no-underline cursor-pointer"
                        title={t("slips.song.listenOnSpotify", "在 Spotify 聆聽")}
                      >
                        <span>🎧 Spotify ↗</span>
                      </a>
                    )}
                  </div>

                  {/* Expanded Tracklist Items (ADR-0144) */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-dashed border-line-soft">
                      <ol className="m-0 p-0 list-none space-y-1.5">
                        {rel.tracks.map((tr) => (
                          <li
                            key={tr.trackNumber}
                            className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-tape-tint/30 font-mono text-[12px] sm:text-[13px]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-muted tabular-nums shrink-0 w-6">
                                {String(tr.trackNumber).padStart(2, "0")}.
                              </span>
                              <span
                                className={`truncate ${
                                  tr.songId ? "font-bold text-ink" : "text-muted italic"
                                }`}
                              >
                                {tr.title}
                              </span>
                            </div>

                            {/* Ticket action link if song exists in live database */}
                            {tr.songId ? (
                              <a
                                href={routeHash.song(tr.songId)}
                                className="inline-flex items-center gap-1 rounded-[3px] border border-ink/25 bg-paper hover:bg-band hover:text-band-ink px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-ink shrink-0 transition-colors no-underline cursor-pointer"
                                title={t("discography_song_stub", "演出票根")}
                              >
                                <span>♪ {t("discography_song_stub", "演出票根")} ➔</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-muted opacity-60 shrink-0">
                                INSTRUMENTAL
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Barcode Footer */}
        <div className="mt-6">
          <TicketBarcodeFooter
            serial={
              mainTab === "live"
                ? `LIVE-RELEASES // COUNT-${allLiveReleases.length.toString().padStart(3, "0")}`
                : `STUDIO-DISCOGRAPHY // COUNT-${allStudioReleases.length.toString().padStart(3, "0")}`
            }
            label="OFFICIAL HIGEDAN DISM // ARCHIVAL RECORDINGS & RELEASES"
          />
        </div>
      </article>

      {/* Mobile Floating Action Dock (Matching TicketBookPage & RankingPage) */}
      <MobileFloatingControls
        onReturnArchive={onReturnArchive}
        onReturnHome={onReturnHome}
        onSelectTickets={onSelectTickets}
        onSelectJourney={onSelectJourney}
        onSelectRanking={onSelectRanking}
        ticketCount={ticketCount}
        activeView="releases"
      />

      {/* High-res Album Jacket Lightbox Modal (ADR-0143, ADR-0144) */}
      <CoverLightboxModal
        isOpen={!!lightboxRelease}
        onClose={() => setLightboxRelease(null)}
        title={lightboxRelease?.title || ""}
        alias=""
        album={lightboxRelease?.album || (lightboxRelease?.parentRelease?.title ? `《${lightboxRelease.parentRelease.title}》` : "")}
        provenance={
          lightboxRelease?.category
            ? `${formatDiscographyTypeLabel(lightboxRelease.category, locale)} · ${lightboxRelease.releaseDate || ""}`
            : lightboxRelease?.releaseType
            ? `${formatReleaseTypeLabel(lightboxRelease.releaseType, locale)} · ${lightboxRelease.releaseDate || ""}`
            : ""
        }
        releaseId={lightboxRelease?.category ? lightboxRelease?.id : undefined}
        coverUrl={lightboxRelease?.coverUrl}
        highResCoverUrl={lightboxRelease?.highResCoverUrl || lightboxRelease?.coverUrl}
        spotifyTrackUrl={
          lightboxRelease?.streaming?.spotifyAlbumId
            ? `https://open.spotify.com/album/${lightboxRelease.streaming.spotifyAlbumId}`
            : lightboxRelease?.spotifyAlbumId
            ? `https://open.spotify.com/album/${lightboxRelease.spotifyAlbumId}`
            : undefined
        }
      />
    </div>
  );
}

export default ReleasesPage;
