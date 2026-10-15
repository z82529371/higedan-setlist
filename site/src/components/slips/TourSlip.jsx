import { useState, useMemo } from "react";
import {
  SETLIST_ITEM,
  SETLIST_SONG,
  SLIP_ARTICLE,
  SLIP_TAPE,
} from "../../lib/constants.js";
import {
  getUnitTypeLabel,
  computeTourStatistics,
  FREQUENCY_TIER_CONFIG,
  showDate,
  formatShowTime,
} from "../../lib/domain.js";
import { routeHash } from "../../lib/track.js";
import {
  TicketPerforationDivider,
  TicketBarcodeFooter,
} from "./TicketCommon.jsx";
import { useI18n } from "../../lib/i18n.jsx";

function formatShowBadgeLabel(show) {
  if (!show) return "";
  const dateStr = show.date ? show.date.slice(5).replace("-", "/") : "";
  const place = show.city || show.venue || "";
  if (place && dateStr) return `${place} ${dateStr}`;
  return place || dateStr || show.id || "";
}

export function TourSlip({
  tourUnitData,
  ud,
  tourData,
  onSelectSong,
  onSelectShow,
  initialItineraryExpanded = false,
}) {
  const { t, locale } = useI18n();
  const targetData = tourUnitData || ud || tourData;

  const statsResult = useMemo(() => {
    return computeTourStatistics(targetData);
  }, [targetData]);

  const [expandedTourId, setExpandedTourId] = useState(
    initialItineraryExpanded ? (statsResult?.tour?.id ?? null) : null
  );

  const [isEncoreCollapsed, setIsEncoreCollapsed] = useState(false);
  const [isRotatingCollapsed, setIsRotatingCollapsed] = useState(false);
  const [isSurpriseCollapsed, setIsSurpriseCollapsed] = useState(false);
  const [isInterludesCollapsed, setIsInterludesCollapsed] = useState(false);

  if (!statsResult || !statsResult.tour) return null;

  const {
    tour,
    totalShows,
    consensusTracks,
    nonTemplateRotatingTracks = [],
    surpriseTracks,
    interludes,
    itinerary = [],
    stats,
  } = statsResult;

  const isItineraryExpanded = expandedTourId === tour.id;
  const ITINERARY_COLLAPSE_THRESHOLD = 10;
  const isLongTour = itinerary.length > ITINERARY_COLLAPSE_THRESHOLD;
  const displayedItinerary =
    !isLongTour || isItineraryExpanded
      ? itinerary
      : itinerary.slice(0, ITINERARY_COLLAPSE_THRESHOLD);

  const mainTracks = consensusTracks.filter((t) => !t.encore);
  const encTracks = consensusTracks.filter((t) => t.encore);

  const formatSerial = () => {
    const rawDate = (stats.dateStart || "").replace(/-/g, "");
    const rawId = (tour.id || "TOUR").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
    return `SN: TOUR-${rawDate || "2024"}-${rawId || "MASTER"}`;
  };

  const renderTrackTitleAndBadges = (track) => {
    const isClickable = !!(onSelectSong && track.songId);

    return (
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          {isClickable ? (
            <a
              href={routeHash.song(track.songId, locale)}
              onClick={(e) => {
                e.preventDefault();
                onSelectSong(track.songId);
              }}
              className={SETLIST_SONG}
              title={`查看歌曲檔案：《${track.title}》`}
            >
              <span className="font-bold text-[14px] sm:text-[15px]">{track.title}</span>
            </a>
          ) : (
            <span className="font-bold text-[14px] sm:text-[15px] text-ink">{track.title}</span>
          )}

          {track.badges && track.badges.length > 0 && (
            <div className="inline-flex flex-wrap items-center gap-1.5 align-middle">
              {track.badges.map((b) => (
                <span
                  key={b.type}
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-card text-ink border ${b.borderClass} shadow-2xs select-none`}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${b.dotClass} mr-1`}
                    aria-hidden="true"
                  />
                  <span>{t(`badges.${b.type === "solo" ? "satoshi-solo" : b.type}`, b.label)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFrequencyPill = (track) => {
    const tierConfig =
      FREQUENCY_TIER_CONFIG[track.tier] || FREQUENCY_TIER_CONFIG.surprise;
    const tierLabel = t(`tiers.${track.tier}`, track.tierLabel);
    const tierBadgeLabel =
      track.tier === "core"
        ? (locale === "en" ? "Core 100%" : `${tierLabel} 100%`)
        : `${tierLabel} ${track.percentage}%`;

    return (
      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 ml-auto">
        <span
          className={`inline-flex items-center gap-1 sm:gap-1.5 rounded px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-mono select-none ${track.badgeClass}`}
          title={`此巡演共登場 ${track.count} 場（全 ${track.totalShows} 場 · 登場率 ${track.percentage}%）`}
        >
          <span className={tierConfig.markerClass} aria-hidden="true">
            {tierConfig.marker}
          </span>
          <span>{tierBadgeLabel}</span>
        </span>

        <span className="font-mono text-[10px] sm:text-[11px] text-muted tabular-nums whitespace-nowrap">
          {track.count} / {totalShows} {t("navigators.showsUnit", "場")}
        </span>
      </div>
    );
  };

  const renderTrackItem = (track, cue) => (
    <li
      key={track.order || track.songId || track.title}
      className={`${SETLIST_ITEM} flex-wrap sm:flex-nowrap items-baseline sm:items-center justify-between gap-x-2 gap-y-1.5 py-2.5 px-1 sm:px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors`}
    >
      <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2.5 flex-1">
        <span className="min-w-[28px] sm:min-w-[36px] text-right font-mono text-[12px] font-semibold text-muted tabular-nums shrink-0">{cue}</span>
        {renderTrackTitleAndBadges(track)}
      </div>
      {renderFrequencyPill(track)}
    </li>
  );

  const renderSurpriseTrackItem = (track) => (
    <li
      key={track.songId || track.title}
      className={`${SETLIST_ITEM} flex-col gap-2 py-3 px-1 sm:px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors`}
    >
      <div className="flex flex-wrap sm:flex-nowrap items-baseline sm:items-center justify-between gap-x-2 gap-y-1.5 w-full">
        <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2.5 flex-1">
          <span className="min-w-[28px] sm:min-w-[36px] text-right font-mono text-[12px] font-bold text-muted tabular-nums select-none shrink-0">◆</span>
          {renderTrackTitleAndBadges(track)}
        </div>
        {renderFrequencyPill(track)}
      </div>

      {track.shows && track.shows.length > 0 && (
        <div className="pl-1 sm:pl-2 flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-muted select-none">
            演出場次：
          </span>
          {track.shows.map((s) => (
            <a
              key={s.id}
              href={routeHash.show(s.id, locale)}
              onClick={(e) => {
                if (onSelectShow) {
                  e.preventDefault();
                  onSelectShow(s.id);
                }
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono border border-line-soft bg-paper hover:border-ink hover:text-ink text-muted transition-colors touch-stamp"
              title={`${s.date} ${s.venue}${s.city ? `（${s.city}）` : ""}`}
            >
              <span>🎫</span>
              <span>{formatShowBadgeLabel(s)}</span>
              {s.cue && (
                <span className="font-bold text-ink ml-0.5">({s.cue})</span>
              )}
            </a>
          ))}
        </div>
      )}
    </li>
  );

  return (
    <article
      className={`${SLIP_ARTICLE} max-w-[960px] mx-auto`}
      aria-label="巡演總覽"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />

      {/* Header Container */}
      <div className="relative rounded-t-[2px] bg-black/[0.025] dark:bg-white/[0.025] -mx-[26px] max-sm:-mx-4 -mt-[46px] max-sm:-mt-[42px] px-[26px] max-sm:px-4 pt-[46px] max-sm:pt-[42px] pb-4">
        {/* Monogram Stage Run Sheet Subtitle */}
        <div className="font-mono text-[9.5px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.22em] font-extrabold uppercase text-muted/70 pb-1.5 flex flex-wrap items-center justify-between gap-1">
          <span className="truncate">{t("slips.tourConsensusMasterSheet", "OFFICIAL HIGEDAN DISM // TOUR CONSENSUS MASTER SHEET")}</span>
          <span className="text-band font-bold shrink-0">{t("slips.allAccessTourOverview", "ALL ACCESS TOUR OVERVIEW")}</span>
        </div>

        {/* Level 1: Artist branding & Category badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-band/15 px-2 py-0.5 font-mono text-xs font-bold text-band-ink">
            {t(`categories.${getUnitTypeLabel(tour)}`, getUnitTypeLabel(tour))}
          </span>
        </div>

        {/* Level 2: Tour Full Headline */}
        <h2 className="mt-2 mb-2.5 sm:mt-2.5 sm:mb-3 font-display text-[20px] sm:text-[26px] font-black leading-tight text-ink tracking-tight text-pretty">
          {tour.title}
        </h2>

        {/* Level 3: Tour Metadata Stub Box */}
        <div className="border-y border-line-soft py-2.5 sm:py-3 my-2 space-y-2 sm:space-y-2.5">
          {/* Date range & Scale */}
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pb-1.5 font-mono text-[12px] sm:text-[13px] text-muted border-b border-line-soft/80">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <span className="text-[12px] sm:text-[13px] text-muted" aria-hidden="true">📅</span>
              <span>
                {stats.dateStart} ～ {stats.dateEnd}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-ink tabular-nums">
              <span className="inline-flex items-center gap-1 rounded bg-tape-tint/70 px-2 py-0.5 text-[11px] sm:text-xs text-ink border border-ink/30">
                {t("slips.totalShows", `全 ${totalShows} 場次`).replace("{count}", totalShows)}
              </span>
              {stats.prefecturesCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-paper px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs text-muted border border-line-soft">
                  {stats.prefecturesCount} 都道府縣 · {stats.citiesCount} 城市
                </span>
              )}
            </div>
          </div>

          {/* Frequency Hierarchy Pills Bar */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 font-mono text-[10.5px] sm:text-[11px]">
            <div className="flex items-center gap-1 text-muted font-bold shrink-0">
              <span aria-hidden="true">📊</span> 登場曲目統計：
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("consensus-template-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`inline-flex items-center gap-1 sm:gap-1.5 rounded px-1.5 sm:px-2 py-0.5 cursor-pointer hover:border-ink transition-colors touch-stamp ${FREQUENCY_TIER_CONFIG.core.badgeClass}`}
                title="點擊跳轉至巡演定番歌單"
              >
                <span className={FREQUENCY_TIER_CONFIG.core.markerClass} aria-hidden="true">
                  {FREQUENCY_TIER_CONFIG.core.marker}
                </span>
                <span>{t("tiers.core", "核心全勤")}：{stats.coreCount} {t("navigators.songsUnit", "首")}</span>
              </button>
              {stats.regularCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("consensus-template-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 rounded px-1.5 sm:px-2 py-0.5 cursor-pointer hover:border-ink transition-colors touch-stamp ${FREQUENCY_TIER_CONFIG.regular.badgeClass}`}
                  title="點擊跳轉至巡演定番歌單"
                >
                  <span className={FREQUENCY_TIER_CONFIG.regular.markerClass} aria-hidden="true">
                    {FREQUENCY_TIER_CONFIG.regular.marker}
                  </span>
                  <span>{t("tiers.regular", "巡演定番")}：{stats.regularCount} {t("navigators.songsUnit", "首")}</span>
                </button>
              )}
              {stats.rotatingCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const el =
                      document.getElementById("rotating-tracks-section") ||
                      document.getElementById("consensus-template-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 rounded px-1.5 sm:px-2 py-0.5 cursor-pointer hover:border-ink transition-colors touch-stamp ${FREQUENCY_TIER_CONFIG.rotating.badgeClass}`}
                  title="點擊跳轉至雙日輪替曲目"
                >
                  <span className={FREQUENCY_TIER_CONFIG.rotating.markerClass} aria-hidden="true">
                    {FREQUENCY_TIER_CONFIG.rotating.marker}
                  </span>
                  <span>{t("tiers.rotating", "雙日輪替")}：{stats.rotatingCount} {t("navigators.songsUnit", "首")}</span>
                </button>
              )}
              {stats.surpriseCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("surprise-inserts-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 rounded px-1.5 sm:px-2 py-0.5 cursor-pointer hover:border-ink transition-colors touch-stamp ${FREQUENCY_TIER_CONFIG.surprise.badgeClass}`}
                  title="點擊跳轉至巡演場次限定曲專區"
                >
                  <span className={FREQUENCY_TIER_CONFIG.surprise.markerClass} aria-hidden="true">
                    {FREQUENCY_TIER_CONFIG.surprise.marker}
                  </span>
                  <span>{t("tiers.surprise", "場次限定")}：{stats.surpriseCount} {t("navigators.songsUnit", "首")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("tour-itinerary-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-1 rounded px-1.5 sm:px-2 py-0.5 bg-paper text-muted border border-line-soft cursor-pointer hover:border-ink hover:text-ink transition-colors touch-stamp"
                title="點擊跳轉至全國巡演日程足跡"
              >
                <span>總演出曲目：{stats.uniqueSongsCount} {t("navigators.songsUnit", "首")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Perforation Divider */}
      <TicketPerforationDivider />

      {/* Consensus Template Setlist */}
      {consensusTracks.length === 0 ? (
        <div
          id="consensus-template-section"
          className="my-8 rounded-[3px] border border-dashed border-line bg-paper px-6 py-8 text-center"
        >
          <p className="m-0 text-[16px] font-bold text-ink">🔍 歌單情報未明</p>
          <p className="m-0 mt-2 text-[13px] text-muted">
            此巡演目前尚無定番歌單紀錄
          </p>
        </div>
      ) : (
        <div id="consensus-template-section" className="space-y-6">
          {/* Main Setlist */}
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted pb-1.5 mb-1 border-b border-line-soft">
              <span className="flex items-center gap-1.5 text-ink font-extrabold">
                <span className="text-band">◆</span> {t("slips.consensusTemplate", "CONSENSUS TEMPLATE // 巡演定番歌單")}
              </span>
              <span className="tabular-nums text-xs font-mono">{mainTracks.length} SONGS</span>
            </div>
            <ol className="m-0 list-none p-0 divide-y divide-line-soft/60">
              {mainTracks.map((t, idx) => renderTrackItem(t, `M${idx + 1}`))}
            </ol>
          </div>

          {/* Encore Setlist */}
          {encTracks.length > 0 && (
            <div className="rounded-[3px] p-3.5 sm:p-4 border border-line-soft bg-paper/50 space-y-2 mt-4">
              <button
                type="button"
                onClick={() => setIsEncoreCollapsed((prev) => !prev)}
                className="w-full flex items-center justify-between font-mono text-xs font-extrabold uppercase tracking-wider text-band pb-1.5 border-b border-line-soft/70 cursor-pointer select-none text-left touch-stamp rounded-sm"
                aria-expanded={!isEncoreCollapsed}
              >
                <span className="flex items-center gap-1.5">
                  <span>◆</span> {t("slips.encoreTemplate", "ENCORE // 安可定番歌單")}
                </span>
                <span className="flex items-center gap-1.5 tabular-nums text-xs text-muted font-mono">
                  <span>{encTracks.length} SONGS</span>
                  <span>{isEncoreCollapsed ? "▸" : "▾"}</span>
                </span>
              </button>
              {!isEncoreCollapsed && (
                <ol className="m-0 list-none p-0 divide-y divide-line-soft/40">
                  {encTracks.map((t, idx) => renderTrackItem(t, `EN${idx + 1}`))}
                </ol>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rotating Tracks Section (Non-Template A/B Alternate Songs) */}
      {nonTemplateRotatingTracks && nonTemplateRotatingTracks.length > 0 && (
        <div
          id="rotating-tracks-section"
          className="rounded-[3px] p-3.5 sm:p-4 border border-line-soft bg-paper/50 space-y-3 mt-6"
        >
          <button
            type="button"
            onClick={() => setIsRotatingCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted pb-1.5 mb-1 border-b border-line-soft cursor-pointer select-none text-left touch-stamp rounded-sm"
            aria-expanded={!isRotatingCollapsed}
          >
            <span className="flex items-center gap-1.5 text-ink font-extrabold">
              <span className="text-amber-600 dark:text-amber-400">▲</span> {t("slips.rotatingTracks", "ROTATING TRACKS // 雙日輪替曲目")}
            </span>
            <span className="flex items-center gap-1.5 tabular-nums text-xs text-muted font-mono">
              <span>{nonTemplateRotatingTracks.length} SONGS (30-70%)</span>
              <span>{isRotatingCollapsed ? "▸" : "▾"}</span>
            </span>
          </button>

          {!isRotatingCollapsed && (
            <>
              <p className="text-[12px] text-muted m-0">
                巡演期間於不同場次（如 Day 2）常態切換登場之雙日輪替曲目：
              </p>

              <ol className="m-0 list-none p-0 divide-y divide-line-soft/50">
                {nonTemplateRotatingTracks.map((track) => renderTrackItem(track, "▲"))}
              </ol>
            </>
          )}
        </div>
      )}

      {/* Surprise Inserts Section */}
      {surpriseTracks && surpriseTracks.length > 0 && (
        <div
          id="surprise-inserts-section"
          className="rounded-[3px] p-3.5 sm:p-4 border border-line-soft bg-paper/60 space-y-3 mt-6"
        >
          <button
            type="button"
            onClick={() => setIsSurpriseCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted pb-1.5 mb-1 border-b border-line-soft cursor-pointer select-none text-left touch-stamp rounded-sm"
            aria-expanded={!isSurpriseCollapsed}
          >
            <span className="flex items-center gap-1.5 text-ink font-extrabold">
              <span className="text-band">◆</span> {t("slips.specialInserts", "SPECIAL INSERTS // 巡演場次限定曲")}
            </span>
            <span className="flex items-center gap-1.5 tabular-nums text-xs text-muted font-mono">
              <span>{surpriseTracks.length} SONGS</span>
              <span>{isSurpriseCollapsed ? "▸" : "▾"}</span>
            </span>
          </button>

          {!isSurpriseCollapsed && (
            <>
              <p className="text-[12px] text-muted m-0">
                未收錄於巡演定番歌單但於特定場次驚喜登場之限定曲目：
              </p>

              <ol className="m-0 list-none p-0 divide-y divide-line-soft/50">
                {surpriseTracks.map((track) => renderSurpriseTrackItem(track))}
              </ol>
            </>
          )}
        </div>
      )}

      {/* Special Interludes Section */}
      {interludes && interludes.length > 0 && (
        <div className="rounded-[3px] p-3.5 sm:p-4 border border-line-soft bg-paper/40 space-y-2 mt-4">
          <button
            type="button"
            onClick={() => setIsInterludesCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-between font-mono text-xs font-extrabold uppercase tracking-wider text-muted pb-1.5 border-b border-line-soft cursor-pointer select-none text-left touch-stamp rounded-sm"
            aria-expanded={!isInterludesCollapsed}
          >
            <span className="flex items-center gap-1.5 text-ink font-bold">
              <span className="font-mono text-line">—</span>
              <span>{t("slips.interludes", "INTERLUDES // 特別彈唱與過場（不計入正式曲目）")}</span>
            </span>
            <span className="flex items-center gap-1.5 tabular-nums text-xs text-muted font-mono">
              <span>{interludes.length} EVENTS</span>
              <span>{isInterludesCollapsed ? "▸" : "▾"}</span>
            </span>
          </button>

          {!isInterludesCollapsed && (
            <ol className="m-0 list-none p-0 divide-y divide-line-soft/40">
              {interludes.map((it, idx) => (
                <li
                  key={`${it.showId}-${idx}`}
                  className={`${SETLIST_ITEM} flex-wrap items-baseline sm:items-center justify-between gap-x-2 gap-y-1 py-2 px-1 sm:px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-[13px] text-muted`}
                >
                  <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2.5 flex-1">
                    <span className="min-w-[28px] sm:min-w-[36px] text-right text-line select-none font-mono text-[12px] tabular-nums shrink-0">—</span>
                    <span className="font-medium text-ink">
                      {it.item.note || it.item.title || "特別過場"}
                    </span>
                  </div>
                  <div className="shrink-0 ml-auto">
                    <a
                      href={routeHash.show(it.showId, locale)}
                      onClick={(e) => {
                        if (onSelectShow) {
                          e.preventDefault();
                          onSelectShow(it.showId);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono border border-line-soft bg-paper hover:border-ink hover:text-ink text-muted transition-colors touch-stamp"
                      title={`${it.show?.date || ""} ${it.show?.venue || ""}`}
                    >
                      <span>🎫</span>
                      <span>{it.show ? formatShowBadgeLabel(it.show) : it.showId}</span>
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Chronological Tour Itinerary Timeline */}
      {itinerary && itinerary.length > 0 && (
        <div
          id="tour-itinerary-section"
          className="rounded-[3px] p-3.5 sm:p-4 border border-line-soft bg-paper/50 space-y-3 mt-6"
        >
          <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted pb-1.5 mb-1 border-b border-line-soft">
            <span className="flex items-center gap-1.5 text-ink font-extrabold">
              <span className="text-band">◆</span> {t("slips.tourItinerary", "TOUR ITINERARY // 全國巡演日程足跡")}
            </span>
            <span className="tabular-nums text-xs text-muted font-mono">
              {itinerary.length} STOPS
            </span>
          </div>

          <p className="text-[12px] text-muted m-0">
            按時序排列之巡迴站點、演出場館、所在城市與開演時刻（點擊直達該場單場票根）：
          </p>

          <ol className="m-0 list-none p-0 divide-y divide-line-soft/50">
            {displayedItinerary.map((stop) => (
              <li
                key={stop.id}
                onClick={() => {
                  if (onSelectShow) {
                    onSelectShow(stop.id);
                  }
                }}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5 px-1 sm:px-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors rounded-[2px] cursor-pointer touch-stamp"
              >
                <div className="flex items-start sm:items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0">
                  <span className="shrink-0 font-mono text-xs font-bold text-muted w-6 sm:w-7 text-right">
                    #{String(stop.index).padStart(2, "0")}
                  </span>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-xs">
                      <span className="font-bold text-ink group-hover:text-band-ink transition-colors">
                        {showDate(stop, locale)}
                      </span>
                      {stop.isFirst && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-tape-tint text-ink border border-ink/30">
                          {t("slips.tourOpener", "初日")}
                        </span>
                      )}
                      {stop.isFinal && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-band/15 text-band-ink border border-band/50">
                          {t("slips.tourFinale", "千秋樂")}
                        </span>
                      )}
                      {stop.city && (
                        <span className="text-muted text-[11px]">
                          [{stop.city}]
                        </span>
                      )}
                      <div className="ml-auto shrink-0 flex items-center">
                        <a
                          href={routeHash.show(stop.id, locale)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectShow) {
                              e.preventDefault();
                              onSelectShow(stop.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 sm:gap-1.5 rounded-[3px] px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-mono font-bold border border-line-soft bg-paper group-hover:border-ink group-hover:text-ink text-muted transition-colors cursor-pointer touch-stamp"
                          title={`查看 ${stop.date} ${stop.venue} 單場演出票根`}
                        >
                          <span>🎫</span>
                          <span className="hidden sm:inline">{t("slips.viewTicket", "查看票根")}</span>
                          <span className="sm:hidden font-mono" aria-hidden="true">→</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                      <span className="font-medium text-ink break-words group-hover:underline">
                        {stop.venue}
                      </span>
                      {(formatShowTime(stop, locale) || stop.time) && (
                        <span className="font-mono text-[11px] text-muted whitespace-nowrap">
                          ⏰ {formatShowTime(stop, locale) || stop.time}
                        </span>
                      )}
                    </div>

                    {stop.totalSongs > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[11px]">
                        {stop.isStandard ? (
                          <span className="inline-flex items-center gap-1 text-muted">
                            <span className="text-[9px] text-line-soft select-none">●</span>
                            <span>{t("slips.standardSet", "定番歌單場")}</span>
                            <span className="text-muted/60 select-none">·</span>
                            <span>{t("slips.totalSongs", `全 ${stop.totalSongs} 首`).replace("{count}", stop.totalSongs)}</span>
                          </span>
                        ) : stop.isRotating ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <span className="text-[9px] select-none">▲</span>
                            <span>{t("slips.rotatingSet", "輪替歌單場")}</span>
                            <span className="text-muted/60 select-none">·</span>
                            <span className="text-muted tabular-nums">{t("slips.totalSongs", `全 ${stop.totalSongs} 首`).replace("{count}", stop.totalSongs)}</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {stop.hasRotatingInserts && (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium mr-1">
                                <span className="text-[9px] select-none">▲</span>
                                <span>{t("slips.rotatingSet", "輪替歌單場")}</span>
                                <span className="text-muted/60 select-none">·</span>
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-ink font-semibold">
                              <span className="text-band select-none">◆</span>
                              <span>{t("slips.specialBadge", "限定：")}</span>
                            </span>
                            {stop.surpriseHighlights.map((h, hIdx) => (
                              <span
                                key={`${stop.id}-${h.songId || h.title}-${hIdx}`}
                                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-card text-ink font-bold border border-line shadow-2xs"
                              >
                                <span>{h.title}</span>
                                <span className="text-muted font-normal">
                                  ({h.cue}{h.tagLabel ? ` ${h.tagLabel}` : ""})
                                </span>
                              </span>
                            ))}
                            <span className="text-muted/60 select-none">·</span>
                            <span className="text-muted tabular-nums">{t("slips.totalSongs", `全 ${stop.totalSongs} 首`).replace("{count}", stop.totalSongs)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {isLongTour && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  setExpandedTourId(isItineraryExpanded ? null : tour.id)
                }
                className="inline-flex items-center justify-center gap-2 rounded-[3px] px-4 py-2 text-xs font-mono font-bold border border-line bg-paper hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-ink transition-colors cursor-pointer w-full sm:w-auto touch-stamp"
                aria-expanded={isItineraryExpanded}
              >
                <span>
                  {isItineraryExpanded
                    ? "▲ 收合巡演日程（僅顯示前 10 場）"
                    : `▼ 展開全部日程（全 ${itinerary.length} 場 · 尚有 ${
                        itinerary.length - ITINERARY_COLLAPSE_THRESHOLD
                      } 場）`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Soundboard Barcode Footer */}
      <TicketBarcodeFooter
        serial={formatSerial()}
        label="OFFICIAL HIGEDAN DISM // TOUR CONSENSUS MASTER SHEET"
      />
    </article>
  );
}
