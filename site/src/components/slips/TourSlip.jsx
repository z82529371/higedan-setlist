import { useMemo } from "react";
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
} from "../../lib/domain.js";
import { routeHash } from "../../lib/track.js";
import {
  TicketPerforationDivider,
  TicketBarcodeFooter,
} from "./TicketCommon.jsx";

export function TourSlip({
  tourUnitData,
  ud,
  tourData,
  onSelectSong,
}) {
  const targetData = tourUnitData || ud || tourData;

  const statsResult = useMemo(() => {
    return computeTourStatistics(targetData);
  }, [targetData]);

  if (!statsResult || !statsResult.tour) return null;

  const {
    tour,
    totalShows,
    consensusTracks,
    stats,
  } = statsResult;

  const mainTracks = consensusTracks.filter((t) => !t.encore);
  const encTracks = consensusTracks.filter((t) => t.encore);

  const formatSerial = () => {
    const rawDate = (stats.dateStart || "").replace(/-/g, "");
    const rawId = (tour.id || "TOUR").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
    return `SN: TOUR-${rawDate || "2024"}-${rawId || "MASTER"}`;
  };

  const renderTrackItem = (track, cue) => {
    const isClickable = !!(onSelectSong && track.songId);

    return (
      <li
        key={track.order || track.songId || track.title}
        className={`${SETLIST_ITEM} flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors`}
      >
        <div className="flex min-w-0 items-baseline gap-2.5 sm:gap-3 flex-1">
          <span className={CUE_NO}>{cue}</span>
          <div className="min-w-0 flex-1">
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
              <div className="mt-0.5 flex flex-wrap gap-1">
                {track.variations.map((note, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded bg-tape-soft/30 px-1.5 py-0.2 text-[10px] font-mono text-ink/80 border border-ink/20"
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Frequency Tier Badge & Appearances Rate */}
        <div className="flex shrink-0 items-center justify-end gap-2 pl-9 sm:pl-0">
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono select-none ${track.badgeClass}`}
            title={`此巡演共登場 ${track.count} 場（全 ${track.totalShows} 場 · 出賽率 ${track.percentage}%）`}
          >
            <span>{track.tierBadgeLabel}</span>
          </span>

          <span className="font-mono text-[11px] text-muted tabular-nums whitespace-nowrap">
            {track.count} / {totalShows} 場
          </span>
        </div>
      </li>
    );
  };

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
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-[#8a5a0a] text-[#f8f7f4] font-bold border border-[#8a5a0a]/50">
                ★ 核心全勤：{stats.coreCount} 首 (100%)
              </span>
              {stats.regularCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-paper text-ink font-bold border border-line">
                  ● 高頻常駐：{stats.regularCount} 首 (≥70%)
                </span>
              )}
              {stats.rotatingCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-amber-100 text-amber-900 font-bold border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800">
                  ▲ 雙日輪替：{stats.rotatingCount} 首 (30-70%)
                </span>
              )}
              {stats.surpriseCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-indigo-100 text-indigo-900 font-bold border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-800">
                  ◆ 限定突襲：{stats.surpriseCount} 首 (&lt;30%)
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-paper text-muted border border-line-soft">
                總演出曲目：{stats.uniqueSongsCount} 首
              </span>
            </div>
          </div>
        </div>
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

      {/* Soundboard Barcode Footer */}
      <TicketBarcodeFooter
        serial={formatSerial()}
        label="OFFICIAL HIGEDAN DISM // TOUR CONSENSUS MASTER SHEET"
      />
    </article>
  );
}
