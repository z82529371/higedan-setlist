import { useState, useMemo } from "react";
import {
  SETLIST_ITEM,
  CUE_NO,
  SETLIST_SONG,
  SLIP_ARTICLE,
  SLIP_TAPE,
} from "../../lib/constants.js";
import {
  getUnitTypeLabel,
  computeTourStatistics,
  FREQUENCY_TIER_CONFIG,
} from "../../lib/domain.js";
import { routeHash } from "../../lib/track.js";
import {
  TicketPerforationDivider,
  TicketBarcodeFooter,
  DualModeCapsuleToggle,
} from "./TicketCommon.jsx";

export function parseTrackVariation(rawNote) {
  if (!rawNote) return null;
  const s = rawNote.trim();

  // Extract excerpt notes: (サビのみ), (ワンコーラス), (1番のみ), etc.
  let excerpt = null;
  let clean = s;
  const exMatch = clean.match(
    /(?:[（(]?(サビのみ|ワンコーラス(?:のみ)?|1コーラス(?:のみ)?|1番のみ(?:。弾き語り合唱)?|1サビまで|2サビで[^）)]+)[）)]?)/
  );
  if (exMatch) {
    excerpt = exMatch[1];
    clean = clean.replace(exMatch[0], "").replace(/^[、,・\s/／]+|[、,・\s/／]+$/g, "").trim();
  }

  const tags = [];
  if (clean.includes("リクエスト") || clean.includes("request")) {
    tags.push({
      type: "request",
      label: "點歌",
      dotClass: "bg-request",
      borderClass: "border-request/50",
    });
    clean = clean
      .replace(/(?:観客|会場)?リクエスト(?:曲|コーナー(?:（ツアー唯一）)?)?/, "")
      .replace(/^[、,・\s/／]+|[、,・\s/／]+$/g, "")
      .trim();
  }
  if (clean.includes("弾き語り") || clean.includes("ソロ") || clean.includes("solo")) {
    tags.push({
      type: "solo",
      label: "自彈自唱",
      dotClass: "bg-solo",
      borderClass: "border-solo/50",
    });
    clean = clean
      .replace(
        /(?:聡ピアノ|藤原聡\/|キーボード|着席)?(?:弾き語り|ソロ|solo)(?:STADIUM ver\.|合唱|ver\.?)?/,
        ""
      )
      .replace(/^[、,・\s/／]+|[、,・\s/／]+$/g, "")
      .trim();
  }
  if (
    clean.includes("新曲") ||
    clean.includes("初披露") ||
    clean.includes("初解禁") ||
    clean.includes("未発表曲") ||
    clean.includes("premiere")
  ) {
    tags.push({
      type: "premiere",
      label: "新歌",
      dotClass: "bg-premiere",
      borderClass: "border-premiere/50",
    });
    clean = clean
      .replace(/(?:フル)?初披露|初解禁|新曲|未発表曲|premiere/i, "")
      .replace(/^[、,・\s/／]+|[、,・\s/／]+$/g, "")
      .trim();
  }

  // Any remaining meaningful text is a version/arrangement note
  clean = clean.replace(/^[、,・\s/／()（）]+|[、,・\s/／()（）]+$/g, "").trim();
  let versionNote = null;
  if (clean && clean !== "ver" && clean !== "ver.") {
    versionNote = clean;
  }

  return { tags, versionNote, excerpt, original: rawNote };
}

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
  onSelectTour,
  initialItineraryExpanded = false,
  showSubMode = "tour",
  onToggleSubMode,
}) {
  const targetData = tourUnitData || ud || tourData;

  const statsResult = useMemo(() => {
    return computeTourStatistics(targetData);
  }, [targetData]);

  const [expandedTourId, setExpandedTourId] = useState(
    initialItineraryExpanded ? (statsResult?.tour?.id ?? null) : null
  );

  if (!statsResult || !statsResult.tour) return null;

  const {
    tour,
    totalShows,
    consensusTracks,
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
              href={routeHash.song(track.songId)}
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

          {track.variations && track.variations.length > 0 && (
            <div className="inline-flex flex-wrap items-center gap-1.5 align-middle">
              {track.variations.map((note, idx) => {
                const parsed = parseTrackVariation(note);
                if (!parsed) return null;
                return (
                  <span key={idx} className="inline-flex flex-wrap items-center gap-1">
                    {parsed.tags.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-card text-ink border ${t.borderClass} shadow-2xs select-none`}
                        title={parsed.original}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${t.dotClass} mr-1`}
                          aria-hidden="true"
                        />
                        <span>{t.label}</span>
                      </span>
                    ))}
                    {parsed.versionNote && (
                      <span
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-card text-ink border border-line shadow-2xs select-none"
                        title={parsed.original}
                      >
                        <span>{parsed.versionNote}</span>
                      </span>
                    )}
                    {parsed.excerpt && (
                      <span
                        className="font-mono text-[11px] text-muted font-medium select-none"
                        title={`演奏規格：${parsed.excerpt}`}
                      >
                        ({parsed.excerpt})
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFrequencyPill = (track) => {
    const tierConfig =
      FREQUENCY_TIER_CONFIG[track.tier] || FREQUENCY_TIER_CONFIG.surprise;
    return (
      <div className="flex shrink-0 items-center justify-end gap-2 pl-7 sm:pl-0">
        <span
          className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-mono select-none ${track.badgeClass}`}
          title={`此巡演共登場 ${track.count} 場（全 ${track.totalShows} 場 · 出賽率 ${track.percentage}%）`}
        >
          <span className={tierConfig.markerClass} aria-hidden="true">
            {tierConfig.marker}
          </span>
          <span>{track.tierBadgeLabel}</span>
        </span>

        <span className="font-mono text-[11px] text-muted tabular-nums whitespace-nowrap">
          {track.count} / {totalShows} 場
        </span>
      </div>
    );
  };

  const renderTrackItem = (track, cue) => (
    <li
      key={track.order || track.songId || track.title}
      className={`${SETLIST_ITEM} flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors`}
    >
      <div className="flex min-w-0 items-baseline gap-2.5 sm:gap-3 flex-1">
        <span className={CUE_NO}>{cue}</span>
        {renderTrackTitleAndBadges(track)}
      </div>
      {renderFrequencyPill(track)}
    </li>
  );

  const renderSurpriseTrackItem = (track) => (
    <li
      key={track.songId || track.title}
      className={`${SETLIST_ITEM} flex-col gap-2 py-3 px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
        <div className="flex min-w-0 items-baseline gap-2.5 sm:gap-3 flex-1">
          <span className={`${CUE_NO} text-muted font-bold select-none`}>◆</span>
          {renderTrackTitleAndBadges(track)}
        </div>
        {renderFrequencyPill(track)}
      </div>

      {track.shows && track.shows.length > 0 && (
        <div className="pl-7 flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-muted select-none">
            演出場次：
          </span>
          {track.shows.map((s) => (
            <a
              key={s.id}
              href={routeHash.show(s.id)}
              onClick={(e) => {
                if (onSelectShow) {
                  e.preventDefault();
                  onSelectShow(s.id);
                }
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono border border-line-soft bg-paper hover:border-ink hover:text-ink text-muted transition-colors"
              title={`${s.date} ${s.venue}${s.city ? `（${s.city}）` : ""}`}
            >
              <span>🎫</span>
              <span>{formatShowBadgeLabel(s)}</span>
            </a>
          ))}
        </div>
      )}
    </li>
  );

  return (
    <article
      className={`${SLIP_ARTICLE} max-w-[960px] mx-auto`}
      aria-label="巡演總覽大票"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />

      {/* Header Container */}
      <div className="relative rounded-t-[2px] bg-black/[0.025] dark:bg-white/[0.025] -mx-[26px] max-sm:-mx-4 -mt-[46px] max-sm:-mt-[42px] px-[26px] max-sm:px-4 pt-[46px] max-sm:pt-[42px] pb-4">
        {/* Monogram Stage Run Sheet Subtitle */}
        <div className="font-mono text-[10px] tracking-[0.22em] font-extrabold uppercase text-muted/70 pb-1.5 flex items-center justify-between">
          <span>OFFICIAL HIGEDAN DISM // TOUR CONSENSUS MASTER SHEET</span>
          <span className="text-band font-bold">ALL ACCESS TOUR OVERVIEW</span>
        </div>

        {/* Level 1: Artist branding & Category badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-band/15 px-2 py-0.5 font-mono text-xs font-bold text-band-ink">
            {getUnitTypeLabel(tour)}
          </span>
        </div>

        {/* Level 2: Tour Full Headline */}
        <h2 className="mt-2.5 mb-3 font-display text-[22px] sm:text-[26px] font-black leading-tight text-ink tracking-tight text-pretty">
          {tour.title}
        </h2>

        {/* Level 3: Tour Metadata Stub Box */}
        <div className="border-y border-line-soft py-3 my-2 space-y-2.5">
          {/* Date range & Scale */}
          <div className="flex flex-wrap items-baseline justify-between gap-1 pb-1.5 font-mono text-[13px] text-muted border-b border-line-soft/80">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <span className="text-[13px] text-muted" aria-hidden="true">📅</span>
              <span>
                {stats.dateStart} ～ {stats.dateEnd}
              </span>
            </div>
            <div className="flex items-center gap-2 font-bold text-ink tabular-nums">
              <span className="inline-flex items-center gap-1 rounded bg-tape-tint/70 px-2 py-0.5 text-xs text-ink border border-ink/30">
                全 {totalShows} 場次
              </span>
              {stats.prefecturesCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 text-xs text-muted border border-line-soft">
                  {stats.prefecturesCount} 都道府縣 · {stats.citiesCount} 城市
                </span>
              )}
            </div>
          </div>

          {/* Frequency Hierarchy Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-muted font-bold shrink-0">
              <span aria-hidden="true">📊</span> 出賽概況：
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 ${FREQUENCY_TIER_CONFIG.core.badgeClass}`}
              >
                <span className={FREQUENCY_TIER_CONFIG.core.markerClass} aria-hidden="true">
                  {FREQUENCY_TIER_CONFIG.core.marker}
                </span>
                <span>核心全勤：{stats.coreCount} 首 (100%)</span>
              </span>
              {stats.regularCount > 0 && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 ${FREQUENCY_TIER_CONFIG.regular.badgeClass}`}
                >
                  <span className={FREQUENCY_TIER_CONFIG.regular.markerClass} aria-hidden="true">
                    {FREQUENCY_TIER_CONFIG.regular.marker}
                  </span>
                  <span>巡演定番：{stats.regularCount} 首 (≥70%)</span>
                </span>
              )}
              {stats.rotatingCount > 0 && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 ${FREQUENCY_TIER_CONFIG.rotating.badgeClass}`}
                >
                  <span className={FREQUENCY_TIER_CONFIG.rotating.markerClass} aria-hidden="true">
                    {FREQUENCY_TIER_CONFIG.rotating.marker}
                  </span>
                  <span>雙日輪替：{stats.rotatingCount} 首 (30-70%)</span>
                </span>
              )}
              {stats.surpriseCount > 0 && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 ${FREQUENCY_TIER_CONFIG.surprise.badgeClass}`}
                >
                  <span className={FREQUENCY_TIER_CONFIG.surprise.markerClass} aria-hidden="true">
                    {FREQUENCY_TIER_CONFIG.surprise.marker}
                  </span>
                  <span>限定突襲：{stats.surpriseCount} 首 (&lt;30%)</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-paper text-muted border border-line-soft">
                總演出曲目：{stats.uniqueSongsCount} 首
              </span>
            </div>
          </div>
        </div>

        {/* Dual-Mode Capsule Toggle */}
        <DualModeCapsuleToggle
          isTour={true}
          mode={showSubMode}
          unitId={tour?.id}
          showId={tour?.shows?.[0]?.id}
          onToggleMode={onToggleSubMode}
          onSelectTour={onSelectTour}
          onSelectShow={onSelectShow}
        />
      </div>

      {/* Ticket Perforation Divider */}
      <TicketPerforationDivider />

      {/* Consensus Template Setlist */}
      {consensusTracks.length === 0 ? (
        <div className="my-8 rounded-[3px] border border-dashed border-line bg-paper px-6 py-8 text-center">
          <p className="m-0 text-[16px] font-bold text-ink">🔍 母單情報未明</p>
          <p className="m-0 mt-2 text-[13px] text-muted">
            此巡演目前尚無標準母單模板紀錄
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Setlist */}
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted pb-1.5 mb-1 border-b border-line-soft">
              <span className="flex items-center gap-1.5 text-ink font-extrabold">
                <span className="text-band">◆</span> CONSENSUS TEMPLATE // 巡演標準母單
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
              <div className="flex items-center justify-between font-mono text-xs font-extrabold uppercase tracking-wider text-band pb-1.5 border-b border-line-soft/70">
                <span className="flex items-center gap-1.5">
                  <span>◆</span> ENCORE // 安可共識母單
                </span>
                <span className="tabular-nums text-xs text-muted font-mono">{encTracks.length} SONGS</span>
              </div>
              <ol className="m-0 list-none p-0 divide-y divide-line-soft/40">
                {encTracks.map((t, idx) => renderTrackItem(t, `EN${idx + 1}`))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Surprise Inserts Section */}
      {surpriseTracks && surpriseTracks.length > 0 && (
        <div className="rounded-[3px] p-3.5 sm:p-4 border border-line-soft bg-paper/60 space-y-3 mt-6">
          <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted pb-1.5 mb-1 border-b border-line-soft">
            <span className="flex items-center gap-1.5 text-ink font-extrabold">
              <span className="text-band">◆</span> SURPRISE INSERTS // 巡演限定突襲曲
            </span>
            <span className="tabular-nums text-xs text-muted font-mono">
              {surpriseTracks.length} SONGS (&lt;30%)
            </span>
          </div>

          <p className="text-[12px] text-muted m-0">
            未收錄於巡演共識母單但於特定場次驚喜登場之稀有曲目（出賽率 &lt; 30%）：
          </p>

          <ol className="m-0 list-none p-0 divide-y divide-line-soft/50">
            {surpriseTracks.map((track) => renderSurpriseTrackItem(track))}
          </ol>
        </div>
      )}

      {/* Special Interludes Section */}
      {interludes && interludes.length > 0 && (
        <div className="rounded-[3px] p-3.5 sm:p-4 border border-line-soft bg-paper/40 space-y-2 mt-4">
          <div className="flex items-center justify-between font-mono text-xs font-extrabold uppercase tracking-wider text-muted pb-1.5 border-b border-line-soft">
            <span className="flex items-center gap-1.5 text-ink font-bold">
              <span className="font-mono text-line">—</span>
              <span>INTERLUDES // 特別彈唱與過場（不計入正式曲目）</span>
            </span>
            <span className="tabular-nums text-xs text-muted font-mono">
              {interludes.length} EVENTS
            </span>
          </div>

          <ol className="m-0 list-none p-0 divide-y divide-line-soft/40">
            {interludes.map((it, idx) => (
              <li
                key={`${it.showId}-${idx}`}
                className={`${SETLIST_ITEM} flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-[13px] text-muted`}
              >
                <div className="flex min-w-0 items-baseline gap-2.5 sm:gap-3 flex-1">
                  <span className={`${CUE_NO} text-line select-none font-mono`}>—</span>
                  <span className="font-medium text-ink">
                    {it.item.note || it.item.title || "特別過場"}
                  </span>
                </div>
                <div className="pl-7 sm:pl-0 shrink-0">
                  <a
                    href={routeHash.show(it.showId)}
                    onClick={(e) => {
                      if (onSelectShow) {
                        e.preventDefault();
                        onSelectShow(it.showId);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono border border-line-soft bg-paper hover:border-ink hover:text-ink text-muted transition-colors"
                    title={`${it.show?.date || ""} ${it.show?.venue || ""}`}
                  >
                    <span>🎫</span>
                    <span>{it.show ? formatShowBadgeLabel(it.show) : it.showId}</span>
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Chronological Tour Itinerary Timeline */}
      {itinerary && itinerary.length > 0 && (
        <div className="rounded-[3px] p-3.5 sm:p-4 border border-line-soft bg-paper/50 space-y-3 mt-6">
          <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted pb-1.5 mb-1 border-b border-line-soft">
            <span className="flex items-center gap-1.5 text-ink font-extrabold">
              <span className="text-band">◆</span> TOUR ITINERARY // 全國巡演日程足跡
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
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5 px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors rounded-[2px]"
              >
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <span className="shrink-0 font-mono text-xs font-bold text-muted w-7 text-right">
                    #{String(stop.index).padStart(2, "0")}
                  </span>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-ink">
                        {stop.weekday ? `${stop.date}（${stop.weekday}）` : stop.date}
                      </span>
                      {stop.isFirst && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-tape-tint text-ink border border-ink/30">
                          初日
                        </span>
                      )}
                      {stop.isFinal && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-band/15 text-band-ink border border-band/50">
                          千秋樂
                        </span>
                      )}
                      {stop.city && (
                        <span className="text-muted text-[11px]">
                          [{stop.city}]
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-baseline gap-2 text-xs">
                      <span className="font-medium text-ink break-words">
                        {stop.venue}
                      </span>
                      {stop.time && (
                        <span className="font-mono text-[11px] text-muted whitespace-nowrap">
                          ⏰ {stop.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pl-9 sm:pl-0 flex items-center justify-end">
                  <a
                    href={routeHash.show(stop.id)}
                    onClick={(e) => {
                      if (onSelectShow) {
                        e.preventDefault();
                        onSelectShow(stop.id);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-xs font-mono font-bold border border-line-soft bg-paper hover:border-ink hover:text-ink text-muted transition-colors"
                    title={`查看 ${stop.date} ${stop.venue} 單場演出票根`}
                  >
                    <span>🎫</span>
                    <span>查看票根</span>
                  </a>
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
                className="inline-flex items-center justify-center gap-2 rounded-[3px] px-4 py-2 text-xs font-mono font-bold border border-line bg-paper hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-ink transition-colors cursor-pointer w-full sm:w-auto"
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
