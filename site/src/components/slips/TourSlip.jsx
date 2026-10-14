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

function getVariationBadgeClass(note) {
  if (!note) return "bg-tape-soft/30 text-ink/80 border-ink/20";
  if (note.includes("弾き語り") || note.includes("ソロ") || note.includes("solo")) {
    return "bg-[#f2fbf8] text-[#0e7a66] border-[#0e7a66]/30 dark:bg-[#0e7a66]/20 dark:text-[#5eead4] dark:border-[#0e7a66]/50";
  }
  if (note.includes("リクエスト") || note.includes("request")) {
    return "bg-[#fbe9e6] text-[#d9261c] border-[#d9261c]/30 dark:bg-[#d9261c]/20 dark:text-[#fca5a5] dark:border-[#d9261c]/50";
  }
  if (note.includes("新曲") || note.includes("初") || note.includes("premiere")) {
    return "bg-[#fffdf5] text-[#8a5a0a] border-[#8a5a0a]/30 dark:bg-[#8a5a0a]/20 dark:text-[#fde68a] dark:border-[#8a5a0a]/50";
  }
  return "bg-tape-soft/30 text-ink/80 border-ink/20";
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
    surpriseTracks,
    interludes,
    stats,
  } = statsResult;

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
            <div className="inline-flex flex-wrap gap-1 align-middle">
              {track.variations.map((note, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-mono border ${getVariationBadgeClass(
                    note
                  )}`}
                >
                  {note}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFrequencyPill = (track) => (
    <div className="flex shrink-0 items-center justify-end gap-2 pl-7 sm:pl-0">
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
  );

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

      {/* Soundboard Barcode Footer */}
      <TicketBarcodeFooter
        serial={formatSerial()}
        label="OFFICIAL HIGEDAN DISM // TOUR CONSENSUS MASTER SHEET"
      />
    </article>
  );
}
