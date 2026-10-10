import { useState, useMemo, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { MemorialCardModal } from "./MemorialCardModal.jsx";
import {
  KIND_TAB,
  SETLIST_ITEM,
  CUE_NO,
  TRACK_NOTE,
  SLIP_ARTICLE,
  SLIP_TAPE,
} from "../lib/constants.js";
import {
  getKindArray,
  primaryKind,
  kindTabs,
  visibleBadges,
  slipClassFor,
  cueColorFor,
  songWeightFor,
  tabColorFor,
} from "../lib/kind.js";
import {
  songTitle,
  songUnreleased,
  showDate,
  getSongAlbum,
  songLiveFansId,
} from "../lib/domain.js";
import { trackKey, trackRoute, routeHash } from "../lib/track.js";
import { assignCues } from "../lib/resolve.js";

function getSourceLabel(url) {
  if (!url) return "來源紀錄";
  if (/higedan\.com/i.test(url)) return "官方網站 來源紀錄";
  if (/x\.com|twitter\.com/i.test(url)) return "X 來源紀錄";
  if (/livefans\.jp/i.test(url)) return "LiveFans 來源紀錄";
  if (/wikipedia\.org/i.test(url)) return "維基百科 來源紀錄";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `${host} 來源紀錄`;
  } catch {
    return "來源紀錄";
  }
}

const CATEGORY_ORDER = [
  "巡演專場",
  "特別專場",
  "聯合專場",
  "店家活動",
  "音樂祭",
  "學園祭",
  "電視演出",
  "線上直播",
];

const songFilterPillClass = (isActive) =>
  `appearance-none w-full flex items-center justify-center gap-1 rounded border-[1.5px] px-1.5 py-[5px] sm:px-2 text-[12px] font-semibold cursor-pointer whitespace-nowrap transition-colors motion-reduce:transition-none text-center focus-visible:outline-[2px] focus-visible:outline-pool focus-visible:outline-offset-2 ${
    isActive
      ? "bg-band text-band-ink border-band shadow-[1px_1px_0_#d5a200] font-bold"
      : "border-line bg-paper text-ink hover:bg-pool-wash hover:border-pool hover:text-pool"
  }`;

export function ShowSlip({ ud, showId, onSelectSong, onSelectShow, onSelectVenue }) {
  if (!ud) return null;
  const s = ud.unit.shows.find((x) => x.id === showId);
  if (!s) return null;

  const [showLegend, setShowLegend] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareShowId, setCompareShowId] = useState("");
  const [copied, setCopied] = useState(false);
  const [showMemorialModal, setShowMemorialModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const slipRef = useRef(null);

  const showList = ud.unit.shows || [];
  const currentIdx = showList.findIndex((x) => x.id === showId);
  const prevShow = currentIdx > 0 ? showList[currentIdx - 1] : null;
  const nextShow =
    currentIdx >= 0 && currentIdx < showList.length - 1
      ? showList[currentIdx + 1]
      : null;

  const items = ud.full.get(showId) || [];
  const rawMain = [];
  const rawEnc = [];
  for (const i of items) (i.encore ? rawEnc : rawMain).push(i);
  const main = assignCues(rawMain, "M");
  const enc = assignCues(rawEnc, "EN");

  const mainCount = main.filter((p) => p.item.songId || p.item.title).length;
  const encCount = enc.filter((p) => p.item.songId || p.item.title).length;
  const songCount = mainCount + encCount;

  // Album era breakdown in this show
  const albumBreakdown = useMemo(() => {
    const counts = new Map();
    for (const p of [...main, ...enc]) {
      const it = p.item;
      if (it.songId) {
        const alb = getSongAlbum({ id: it.songId });
        counts.set(alb, (counts.get(alb) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort(([, a], [, b]) => b - a);
  }, [main, enc]);

  // Setlist diff compared to the previous show in the tour
  const setlistDiff = useMemo(() => {
    if (!prevShow || !ud.isTour) return null;
    const prevItems = (ud.full.get(prevShow.id) || []).filter((i) => i.songId);
    const currItems = items.filter((i) => i.songId);

    const prevSongs = new Set(prevItems.map((i) => i.songId));
    const currSongs = new Set(currItems.map((i) => i.songId));

    const added = [...currSongs].filter((id) => !prevSongs.has(id));
    const removed = [...prevSongs].filter((id) => !currSongs.has(id));

    if (added.length === 0 && removed.length === 0) {
      return { identical: true, prevShow };
    }
    return {
      identical: false,
      added,
      removed,
      prevShow,
    };
  }, [prevShow, ud, items]);

  const defaultCompareId =
    prevShow?.id || (showList.find((x) => x.id !== showId)?.id ?? "");
  const activeCompareId = compareShowId || defaultCompareId;
  const targetCompareShow = showList.find((x) => x.id === activeCompareId);

  const customCompareDiff = useMemo(() => {
    if (!targetCompareShow || targetCompareShow.id === showId) return null;
    const otherItems = (ud.full.get(targetCompareShow.id) || []).filter(
      (i) => i.songId
    );
    const currItems = items.filter((i) => i.songId);

    const otherSongs = new Set(otherItems.map((i) => i.songId));
    const currSongs = new Set(currItems.map((i) => i.songId));

    const onlyThis = [...currSongs].filter((id) => !otherSongs.has(id));
    const onlyOther = [...otherSongs].filter((id) => !currSongs.has(id));
    const common = [...currSongs].filter((id) => otherSongs.has(id));

    return {
      otherShow: targetCompareShow,
      onlyThis,
      onlyOther,
      commonCount: common.length,
      isIdentical: onlyThis.length === 0 && onlyOther.length === 0,
    };
  }, [targetCompareShow, showId, items, ud]);

  const handleCopySetlist = () => {
    const lines = [];
    lines.push(`Official 髭男 dism - ${ud.unit.title}`);
    lines.push(`📅 日期：${showDate(s)}`);
    lines.push(`📍 場地：${s.venue}（${s.city}）`);
    if (s.opensAt) lines.push(`⏰ 開演：${s.opensAt}`);
    lines.push("");
    lines.push("【本篇】");
    main.forEach((p) => {
      const it = p.item;
      const t = it.title ?? songTitle[it.songId] ?? it.note ?? "";
      const noteStr = it.note && it.songId ? ` (${it.note})` : "";
      lines.push(`${p.cue} ${t}${noteStr}`);
    });
    if (enc.length > 0) {
      lines.push("");
      lines.push("【安可】");
      enc.forEach((p) => {
        const it = p.item;
        const t = it.title ?? songTitle[it.songId] ?? it.note ?? "";
        const noteStr = it.note && it.songId ? ` (${it.note})` : "";
        lines.push(`${p.cue} ${t}${noteStr}`);
      });
    }
    lines.push("");
    lines.push("#Official髭男dism #ヒゲダン #セットリスト");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines.join("\n")).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }).catch(() => {});
    }
  };

  const handleDownloadImage = async () => {
    if (!slipRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(slipRef.current, {
        pixelRatio: 2,
        skipFonts: true,
        filter: (node) => {
          if (node?.classList && node.classList.contains("slip-ignore-export")) {
            return false;
          }
          return true;
        },
      });
      const link = document.createElement("a");
      const datePart = (s.date || "").replace(/\./g, "-");
      const venuePart = (s.city || s.venue || "slip").replace(
        /[^\w\u4e00-\u9fa5\u3040-\u30ff]/g,
        "_"
      );
      link.download = `higedan-setlist-${datePart}-${venuePart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("下載單據圖片失敗:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const unrel = (i) => songUnreleased.has(i.songId);
  const primaryOf = (i) => primaryKind(getKindArray(i.kind), unrel(i));

  const cueColor = (i) => cueColorFor(primaryOf(i));

  const songWeight = (i) => songWeightFor(primaryOf(i));

  const cardClass = (i) => slipClassFor(primaryOf(i));

  const cardTabs = (i) => kindTabs(getKindArray(i.kind), unrel(i));

  const runKey = (i) => {
    if (!i.songId) return null;
    const prim = primaryOf(i);
    if (!prim) return null;
    const tabs = cardTabs(i);
    return `${prim}::${tabs.join(",")}`;
  };

  const groupRuns = (list) => {
    const runs = [];
    for (const p of list) {
      const key = runKey(p.item);
      const last = runs[runs.length - 1];
      if (key && last && last.key === key) last.items.push(p);
      else runs.push({ key, items: [p] });
    }
    return runs;
  };

  const renderRun = (g, prefix) => {
    const first = g.items[0].item;
    if (!first.songId && !first.title) {
      return (
        <li
          key={prefix}
          className={`${SETLIST_ITEM} text-[13px] text-muted [&_.cue-no]:text-line`}
        >
          <span className="cue-no min-w-[42px] text-right font-mono text-[12px] text-line">
            —
          </span>
          <span>{first.note ?? ""}</span>
        </li>
      );
    }
    const multi = g.key && g.items.length > 1;
    const slipClass = cardClass(first);
    const tabs = cardTabs(first);
    const songLine = (it) => {
      const title = it.title ?? songTitle[it.songId];
      if (!it.songId) {
        return <span className="font-medium text-ink">{title}</span>;
      }
      const link = trackRoute(it, songWeight(it));
      return (
        <a
          className={link.cls}
          href={link.hash}
          onClick={(e) => {
            e.preventDefault();
            onSelectSong(it.songId);
          }}
        >
          {title}
        </a>
      );
    };
    const tabBar =
      tabs.length > 0 ? (
        <span className="absolute left-[14px] top-[-11px] z-[1] flex gap-[6px]">
          {tabs.map((k) => (
            <span
              key={k}
              className={`px-2 py-0.5 font-mono text-[11px] font-semibold leading-[1.4] tracking-[0.16em] text-white ${tabColorFor(
                k
              )}`}
            >
              {KIND_TAB[k]}
            </span>
          ))}
        </span>
      ) : null;
    if (multi) {
      return (
        <li key={prefix} className={`${SETLIST_ITEM} ${slipClass}`}>
          {tabBar}
          <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
            {g.items.map((p) => (
              <span
                key={p.item.order}
                className="flex min-w-0 items-baseline gap-3"
              >
                <span className={`${CUE_NO} ${cueColor(p.item)}`}>{p.cue}</span>
                <span>
                  {songLine(p.item)}
                  {p.item.note && (
                    <span className={TRACK_NOTE}> {p.item.note}</span>
                  )}
                </span>
              </span>
            ))}
          </span>
        </li>
      );
    }
    return (
      <li key={prefix} className={`${SETLIST_ITEM} ${slipClass}`}>
        {tabBar}
        <span className={`${CUE_NO} ${cueColor(first)}`}>{g.items[0].cue}</span>
        <span>
          {songLine(first)}
          {first.note && <span className={TRACK_NOTE}> {first.note}</span>}
        </span>
      </li>
    );
  };

  return (
    <article
      ref={slipRef}
      className={SLIP_ARTICLE}
      aria-label="場次曲目清單"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-4 border-b-2 border-ink pb-4">
        {/* Monogram Stage Run Sheet Subtitle */}
        <div className="font-mono text-[10px] tracking-[0.22em] font-extrabold uppercase text-muted/70 pb-1.5 flex items-center justify-between">
          <span>OFFICIAL HIGEDAN DISM // STAGE SETLIST RUN SHEET</span>
          {ud.unit.isTour && showList.length > 0 && (
            <span className="text-band font-bold">TOUR SHOW {currentIdx + 1} / {showList.length}</span>
          )}
        </div>

        {/* Level 1: Artist branding & category badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-tape-soft/40 px-2 py-0.5 font-mono text-xs font-bold text-ink">
            {ud.unit.type}
          </span>
        </div>

        {/* Level 2: Tour / Event Name Headline */}
        <h2 className="mt-2.5 mb-3 font-display text-[22px] sm:text-[25px] font-black leading-tight text-ink tracking-tight text-pretty">
          {ud.unit.title}
        </h2>
        {/* Level 3: Specific Show Details Ticket Stub Box (Clean & Focused) */}
        <div className="border-y border-line-soft py-3 my-2">
          {/* Date & Time */}
          <div className="flex flex-wrap items-baseline justify-between gap-1 pb-1.5 font-mono text-[13px] text-muted border-b border-line-soft/80">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <span className="text-[13px] text-muted" aria-hidden="true">📅</span>
              {showDate(s)}
            </div>
            {(s.opensAt || s.startsAt) && (
              <span className="text-[12px] font-medium text-muted">
                <span aria-hidden="true">⏰</span>
                {s.opensAt && ` ${s.opensAt} 開場`}
                {s.opensAt && s.startsAt && " /"}
                {s.startsAt && ` ${s.startsAt} 開演`}
              </span>
            )}
          </div>

          {/* Venue & Song Count */}
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="m-0 font-display text-[20px] sm:text-[23px] font-black text-ink">
              {onSelectVenue && s.venue ? (
                <a
                  href={routeHash.venue(s.venue)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectVenue(s.venue);
                  }}
                  className="group inline-flex items-baseline gap-1 text-ink no-underline hover:text-pool transition-colors cursor-pointer"
                  title="查看此場地的全歷史演出檔案"
                >
                  <span className="group-hover:underline">{s.venue}</span>
                  <span className="text-[15px] font-normal text-muted group-hover:text-pool">
                    （{s.city}）
                  </span>
                  <span className="font-mono text-[11px] font-bold text-pool opacity-80 group-hover:opacity-100" aria-hidden="true">
                    🏛️ 檔案 →
                  </span>
                </a>
              ) : (
                <>
                  {s.venue}
                  <span className="ml-1.5 text-[15px] font-normal text-muted">
                    （{s.city}）
                  </span>
                </>
              )}
            </h3>
            <div className="font-mono text-[12px] font-bold text-muted tabular-nums">
              {songCount > 0 ? `共 ${songCount} 首（本篇 ${mainCount} · 安可 ${encCount}）` : "尚無曲目紀錄"}
            </div>
          </div>

          {/* Tour Stepper */}
          {showList.length > 1 && (
            <div className="mt-2.5 flex items-center justify-between border-t border-line-soft/80 pt-2 text-[12px] font-mono">
              {prevShow ? (
                <button
                  type="button"
                  onClick={() => onSelectShow(prevShow.id)}
                  className="group inline-flex items-center gap-1 font-semibold text-ink hover:text-pool cursor-pointer transition-colors min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 rounded active:bg-paper/80"
                  title={`上一場：${showDate(prevShow)} ${prevShow.city || prevShow.venue}`}
                >
                  <span aria-hidden="true" className="text-base sm:text-xs">←</span>
                  <span>上一場</span>
                  <span className="hidden sm:inline text-muted group-hover:text-pool">
                    ({prevShow.date.slice(5)} {prevShow.city || prevShow.venue})
                  </span>
                </button>
              ) : (
                <span className="text-muted/40 cursor-not-allowed min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 flex items-center">← 首場</span>
              )}

              <span className="text-muted tabular-nums font-bold text-[12px] flex items-center gap-1.5">
                <span>第 {currentIdx + 1} / {showList.length} 場</span>
                {currentIdx === 0 && (
                  <span className="rounded bg-tape-tint px-1.5 py-0.5 text-xs text-ink font-bold border border-ink/30">
                    首日
                  </span>
                )}
                {currentIdx === showList.length - 1 && (
                  <span className="rounded bg-band px-1.5 py-0.5 text-xs text-band-ink font-bold border border-ink/40">
                    千秋樂
                  </span>
                )}
              </span>

              {nextShow ? (
                <button
                  type="button"
                  onClick={() => onSelectShow(nextShow.id)}
                  className="group inline-flex items-center gap-1 font-semibold text-ink hover:text-pool cursor-pointer transition-colors min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 rounded active:bg-paper/80"
                  title={`下一場：${showDate(nextShow)} ${nextShow.city || nextShow.venue}`}
                >
                  <span className="hidden sm:inline text-muted group-hover:text-pool">
                    ({nextShow.date.slice(5)} {nextShow.city || nextShow.venue})
                  </span>
                  <span>下一場</span>
                  <span aria-hidden="true" className="text-base sm:text-xs">→</span>
                </button>
              ) : (
                <span className="text-muted/40 cursor-not-allowed min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 flex items-center">最終場 →</span>
              )}
            </div>
          )}
        </div>

        {/* Level 4: Action Toolbar (Two-Tier Clean Split: Primary Actions & Sources + Analysis Reel) */}
        <div className="mt-2.5 flex flex-col gap-2 border-t border-line-soft/80 pt-2.5 slip-ignore-export">
          {/* Row 1: Primary Export Actions & External Sources (Desktop: balanced ends, Mobile: stacked cleanly) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowMemorialModal(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded bg-band px-3 py-2 sm:py-1.5 text-[12px] sm:text-[11px] font-mono font-bold text-band-ink border border-ink/40 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer select-none"
                title="預覽並自訂下載本場巡演歌單紀念小卡"
              >
                <span aria-hidden="true">📸</span>
                <span>產生紀念小卡</span>
              </button>

              <button
                type="button"
                onClick={handleCopySetlist}
                className={`inline-flex items-center justify-center gap-1.5 rounded px-3 py-2 sm:py-1.5 text-[12px] sm:text-[11px] font-mono font-bold transition-all cursor-pointer select-none border active:scale-[0.98] ${
                  copied
                    ? "bg-band text-band-ink border-band shadow-xs"
                    : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                }`}
                title="複製標準歌單純文字"
              >
                <span>{copied ? "✓ 已複製" : "📋 複製歌單"}</span>
              </button>
            </div>

            {s.sourceUrls && s.sourceUrls.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                {s.sourceUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-bold text-ink hover:bg-band hover:border-band transition-colors no-underline"
                    title={`查看原始演出紀錄來源：${getSourceLabel(url)}`}
                  >
                    <span aria-hidden="true">🔗</span>
                    <span>{getSourceLabel(url)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Row 2: Secondary Analysis & Comparison Reel (Dedicated scrollable/wrapping reel) */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap border-t border-line-soft/60 pt-2">
            <button
              type="button"
              onClick={() => setShowLegend((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1 rounded bg-paper px-2.5 py-1.5 sm:py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
              aria-expanded={showLegend}
            >
              <span>{showLegend ? "▾ 記號圖例" : "▸ 記號圖例"}</span>
            </button>

            {setlistDiff && !setlistDiff.identical && (
              <button
                type="button"
                onClick={() => setShowDiff((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1 rounded bg-paper px-2.5 py-1.5 sm:py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
                aria-expanded={showDiff}
              >
                <span>{showDiff ? "▾ 曲目更換" : "▸ 曲目更換"}</span>
                <span className="text-request font-bold">
                  ({setlistDiff.added.length}首)
                </span>
              </button>
            )}

            {ud.isTour && albumBreakdown.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAnalysis((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1 rounded bg-paper px-2.5 py-1.5 sm:py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
                aria-expanded={showAnalysis}
              >
                <span>{showAnalysis ? "▾ 專輯分佈" : "▸ 專輯分佈"}</span>
              </button>
            )}

            {showList.length > 1 && (
              <button
                type="button"
                onClick={() => setShowCompare((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1 rounded bg-paper px-2.5 py-1.5 sm:py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
                aria-expanded={showCompare}
              >
                <span>{showCompare ? "▾ 雙場對比" : "▸ ⚖️ 雙場對比"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Legend Details */}
        {showLegend && (
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded bg-paper/70 p-2.5 text-[11px] font-mono border border-line-soft slip-ignore-export">
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-solo text-white text-[11px] font-bold">SOLO</span>
              <span className="text-ink">自彈自唱</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-request text-white text-[11px] font-bold">REQUEST</span>
              <span className="text-ink">現場點歌</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-unreleased text-white text-[11px] font-bold">UNRELEASED</span>
              <span className="text-ink">未發行曲</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-premiere text-white text-[11px] font-bold">PREMIERE</span>
              <span className="text-ink">新歌初披露</span>
            </div>
          </div>
        )}

        {/* Collapsible Setlist Diff Drawer */}
        {showDiff && setlistDiff && !setlistDiff.identical && (
          <div className="mt-2.5 border-t border-line-soft/80 pt-2 font-mono text-[11px] slip-ignore-export">
            <div className="text-ink font-bold mb-1 flex items-center gap-1">
              <span>🔄 與前一場（{prevShow.date.slice(5)} {prevShow.city || prevShow.venue}）曲目更換：</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {setlistDiff.added.length > 0 && (
                <span className="text-request font-semibold">
                  換入（＋）：{setlistDiff.added.map((id) => songTitle[id] || id).join("、")}
                </span>
              )}
              {setlistDiff.removed.length > 0 && (
                <span className="text-muted font-medium">
                  換出（－）：{setlistDiff.removed.map((id) => songTitle[id] || id).join("、")}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Album Era Breakdown Drawer */}
        {showAnalysis && albumBreakdown.length > 0 && (
          <div className="mt-2.5 border-t border-line-soft/80 pt-2 font-mono text-[11px] slip-ignore-export">
            <div className="text-muted font-bold mb-1.5 flex items-center gap-1">
              <span>💿 演出曲目專輯構成：</span>
              <span className="font-normal text-muted/70">（本篇 {mainCount} 首 · 安可 {encCount} 首）</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {albumBreakdown.map(([alb, count]) => (
                <span
                  key={alb}
                  className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 border border-line-soft text-ink"
                >
                  <span className="text-muted">{alb}</span>
                  <span className="font-bold">{count}首</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Tour Show Compare Drawer */}
        {showCompare && showList.length > 1 && (
          <div className="mt-2.5 border-t border-line-soft/80 pt-2 font-mono text-[11px] space-y-2 slip-ignore-export">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-ink flex items-center gap-1">
                <span>⚖️ 巡演任意雙場對比：</span>
              </span>
              <label className="flex items-center gap-1.5 text-muted">
                <span>對比目標：</span>
                <select
                  value={activeCompareId}
                  onChange={(e) => setCompareShowId(e.target.value)}
                  className="rounded border border-line-soft bg-paper px-2 py-0.5 font-mono text-[11px] font-semibold text-ink cursor-pointer focus-visible:outline-pool"
                >
                  {showList
                    .filter((x) => x.id !== showId)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.date.slice(5)} {x.city || x.venue}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            {customCompareDiff && (
              <div className="space-y-1">
                {customCompareDiff.isIdentical ? (
                  <p className="text-muted m-0">
                    ✓ 兩場合計 {customCompareDiff.commonCount} 首曲目完全一致。
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-bold text-request">
                        本場限定（＋{customCompareDiff.onlyThis.length} 首）：
                      </span>
                      {customCompareDiff.onlyThis.length > 0 ? (
                        <span className="text-ink">
                          {customCompareDiff.onlyThis
                            .map((id) => songTitle[id] || id)
                            .join("、")}
                        </span>
                      ) : (
                        <span className="text-muted">無</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-bold text-muted">
                        對比場限定（－{customCompareDiff.onlyOther.length} 首）：
                      </span>
                      {customCompareDiff.onlyOther.length > 0 ? (
                        <span className="text-muted">
                          {customCompareDiff.onlyOther
                            .map((id) => songTitle[id] || id)
                            .join("、")}
                        </span>
                      ) : (
                        <span className="text-muted">無</span>
                      )}
                    </div>
                    <div className="text-muted/80 text-[10px]">
                      共通演出曲目：{customCompareDiff.commonCount} 首
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="my-8 rounded-[3px] border border-dashed border-line bg-paper px-6 py-8 text-center">
          <p className="m-0 text-[16px] font-bold text-ink">🔍 歌單情報未明</p>
          <p className="m-0 mt-2 text-[13px] text-muted">
            本場演出目前尚無公開曲目紀錄
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted pb-1.5 mb-1 border-b border-line-soft">
              <span className="flex items-center gap-1.5 text-ink font-extrabold">
                <span className="text-band">◆</span> MAIN SETLIST // 本篇演奏曲目
              </span>
              <span className="tabular-nums text-xs font-mono">{mainCount} SONGS</span>
            </div>
            <ol className="m-0 list-none p-0 divide-y divide-line-soft/60">
              {groupRuns(main).map((g, idx) => renderRun(g, `m-${idx}`))}
            </ol>
          </div>
          {enc.length > 0 && (
            <div className="rounded-xl p-3.5 sm:p-4 border border-line-soft bg-paper/50 space-y-2 mt-4 shadow-xs">
              <div className="flex items-center justify-between font-mono text-xs font-extrabold uppercase tracking-wider text-band pb-1.5 border-b border-line-soft/70">
                <span className="flex items-center gap-1.5">
                  <span>◆</span> ENCORE // 安可曲目
                </span>
                <span className="tabular-nums text-xs text-muted font-mono">{encCount} SONGS</span>
              </div>
              <ol className="m-0 list-none p-0 divide-y divide-line-soft/40">
                {groupRuns(enc).map((g, idx) => renderRun(g, `e-${idx}`))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Bottom Show Navigation Footer */}
      {showList.length > 1 && (
        <div className="mt-7 pt-4 border-t border-line-soft grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[12px] slip-ignore-export">
          {prevShow ? (
            <button
              type="button"
              onClick={() => {
                onSelectShow(prevShow.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex min-h-[42px] sm:min-h-0 items-center justify-center sm:justify-start gap-1 rounded border border-line-soft bg-paper px-3 py-2 sm:py-1 text-ink hover:bg-band hover:border-band active:bg-band transition-colors cursor-pointer truncate"
            >
              <span className="truncate">← 上一場：{showDate(prevShow)} {prevShow.city || prevShow.venue}</span>
            </button>
          ) : <div className="hidden sm:block" />}
          {nextShow ? (
            <button
              type="button"
              onClick={() => {
                onSelectShow(nextShow.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex min-h-[42px] sm:min-h-0 items-center justify-center sm:justify-end gap-1 rounded border border-line-soft bg-paper px-3 py-2 sm:py-1 text-ink hover:bg-band hover:border-band active:bg-band transition-colors cursor-pointer font-bold truncate"
            >
              <span className="truncate">下一場：{showDate(nextShow)} {nextShow.city || nextShow.venue} →</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Soundboard Engineer Run Sheet Footer */}
      <div className="mt-8 border-t border-line-soft pt-3.5 flex flex-wrap items-center justify-between gap-3 text-muted font-mono text-[12px]">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-ink">OFFICIAL HIGEDAN DISM</span>
          <span className="opacity-40">|</span>
          <span>STAGE RUN SHEET ARCHIVE</span>
        </div>
        <div className="flex items-center gap-2 tabular-nums">
          <span>LOG REF: {showId.toUpperCase().slice(-8)}</span>
          <span className="opacity-40">|</span>
          <span className="font-extrabold tracking-tight text-ink/75" aria-hidden="true">||| | |||| | ||| ||</span>
        </div>
      </div>

      {/* Commemorative Setlist Card Preview Modal */}
      <MemorialCardModal
        isOpen={showMemorialModal}
        onClose={() => setShowMemorialModal(false)}
        show={s}
        unit={ud.unit}
        main={main}
        enc={enc}
        showIndex={currentIdx}
        totalShows={showList.length}
      />
    </article>
  );
}

export function SongSlip({ songId, trackShows, showById, unitData, onSelectShow, onSelectVenue }) {
  const [copied, setCopied] = useState(false);
  const [onlySpecial, setOnlySpecial] = useState(false);
  const [showYearBreakdown, setShowYearBreakdown] = useState(false);

  const appearances = useMemo(() => {
    return songId ? (trackShows.get(trackKey("song", songId)) ?? []) : [];
  }, [trackShows, songId]);

  // Chronologically sorted appearances for milestone calculation
  const sortedAppearances = useMemo(() => {
    return [...appearances].sort((a, b) => {
      const dateA = showById.get(a.showId)?.date ?? "";
      const dateB = showById.get(b.showId)?.date ?? "";
      return dateA.localeCompare(dateB);
    });
  }, [appearances, showById]);

  const firstApp = sortedAppearances[0] ?? null;
  const latestApp = sortedAppearances[sortedAppearances.length - 1] ?? null;
  const firstShow = firstApp ? showById.get(firstApp.showId) : null;
  const latestShow = latestApp ? showById.get(latestApp.showId) : null;

  // Year breakdown for performance frequency
  const yearBreakdown = useMemo(() => {
    const map = new Map();
    for (const app of appearances) {
      const d = showById.get(app.showId)?.date;
      if (d) {
        const yr = d.slice(0, 4);
        map.set(yr, (map.get(yr) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [appearances, showById]);

  // Concert placement / role analysis
  const liveRole = useMemo(() => {
    if (appearances.length === 0) return null;
    let encoreCount = 0;
    let orderSum = 0;
    let orderCount = 0;
    for (const app of appearances) {
      if (app.item?.encore) {
        encoreCount++;
      }
      if (typeof app.item?.order === "number") {
        orderSum += app.item.order;
        orderCount++;
      }
    }
    const encoreRate = Math.round((encoreCount / appearances.length) * 100);
    const avgOrder = orderCount > 0 ? Math.round(orderSum / orderCount) : null;

    let positionText = "";
    if (encoreRate >= 50) {
      positionText = "安可核心常客";
    } else if (avgOrder && avgOrder <= 4) {
      positionText = "開場熱血衝刺 (前段)";
    } else if (avgOrder && avgOrder >= 14) {
      positionText = "本篇高潮壓軸 (後段)";
    } else {
      positionText = "中段沉浸銜接 (中段)";
    }
    return {
      encoreRate,
      avgOrder,
      positionText,
    };
  }, [appearances]);

  // Rarity Tier & Dormancy
  const rarityTier = useMemo(() => {
    const total = appearances.length;
    if (total === 0) return null;
    let label = "";
    let cls = "";
    if (total >= 100) {
      label = "🔥 核心定番曲";
      cls = "text-request bg-request-wash border-request/40";
    } else if (total >= 40) {
      label = "⭐ 巡演主力曲";
      cls = "text-band-ink bg-tape-tint border-ink/30";
    } else if (total <= 3) {
      label = "💎 幻之限定曲";
      cls = "text-unreleased bg-unreleased-wash border-unreleased/40";
    } else if (total <= 12) {
      label = "✨ 珍稀選曲";
      cls = "text-solo bg-paper border-line-soft";
    } else {
      label = "🎵 活躍演出曲";
      cls = "text-ink bg-paper border-line-soft";
    }

    const latestYear = latestShow?.date ? parseInt(latestShow.date.slice(0, 4), 10) : null;
    const isDormant = latestYear && latestYear <= 2021 && total > 3;

    return { label, cls, isDormant };
  }, [appearances, latestShow]);

  // Special version statistics (satoshi-solo, request, premiere)
  const specialVersionCounts = useMemo(() => {
    let solo = 0;
    let request = 0;
    let premiere = 0;
    for (const app of appearances) {
      const kind = app.item?.kind ?? "";
      if (kind.includes("satoshi-solo")) solo++;
      if (kind.includes("request")) request++;
      if (kind.includes("premiere")) premiere++;
    }
    return {
      solo,
      request,
      premiere,
      total: solo + request + premiere,
    };
  }, [appearances]);

  const hasSpecials = specialVersionCounts.total > 0;

  const typeCounts = useMemo(() => {
    const counts = new Map();
    for (const app of appearances) {
      const t = app.unitType || "其他";
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return counts;
  }, [appearances]);

  const availableTypes = useMemo(() => {
    const types = CATEGORY_ORDER.filter((t) => typeCounts.has(t));
    for (const t of typeCounts.keys()) {
      if (!types.includes(t)) types.push(t);
    }
    return types;
  }, [typeCounts]);

  const [selectedType, setSelectedType] = useState(() => availableTypes[0] ?? "巡演專場");

  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(selectedType)) {
      setSelectedType(availableTypes[0]);
    }
  }, [availableTypes, selectedType]);

  const effectiveType = availableTypes.includes(selectedType)
    ? selectedType
    : availableTypes[0];

  const filteredAppearances = useMemo(() => {
    if (onlySpecial) {
      return appearances.filter((app) => {
        const kind = app.item?.kind ?? "";
        return (
          kind.includes("satoshi-solo") ||
          kind.includes("request") ||
          kind.includes("premiere")
        );
      });
    }
    if (!effectiveType) return appearances;
    return appearances.filter(
      (app) => (app.unitType || "其他") === effectiveType
    );
  }, [appearances, effectiveType, onlySpecial]);

  const COLLAPSIBLE_THRESHOLD = 3;

  const groupedByUnit = useMemo(() => {
    const groups = [];
    let current = null;
    for (const app of filteredAppearances) {
      if (!current || current.unitId !== app.unitId) {
        current = {
          unitId: app.unitId,
          unitTitle: app.unitTitle,
          unitType: app.unitType,
          items: [],
        };
        groups.push(current);
      }
      current.items.push(app);
    }
    return groups;
  }, [filteredAppearances]);

  const [collapsedMap, setCollapsedMap] = useState(() => new Map());

  useEffect(() => {
    const initial = new Map();
    groupedByUnit.forEach((g) => {
      if (g.items.length > COLLAPSIBLE_THRESHOLD) {
        initial.set(g.unitId, true);
      }
    });
    setCollapsedMap(initial);
  }, [songId, effectiveType, onlySpecial, groupedByUnit]);

  if (!songId) {
    return (
      <div className={SLIP_ARTICLE}>
        <span aria-hidden="true" className={SLIP_TAPE} />
        <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
          選一首歌曲，看它在全檔案庫哪幾場出現過。
        </p>
      </div>
    );
  }

  const toggleUnit = (unitId) => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      next.set(unitId, !next.get(unitId));
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) {
        if (g.items.length > COLLAPSIBLE_THRESHOLD) next.set(g.unitId, false);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) {
        if (g.items.length > COLLAPSIBLE_THRESHOLD) next.set(g.unitId, true);
      }
      return next;
    });
  };

  const hasCollapsible = groupedByUnit.some(
    (g) => g.items.length > COLLAPSIBLE_THRESHOLD
  );

  const albumName = getSongAlbum({ id: songId });
  const livefansId = songLiveFansId[songId];
  const youtubeUrl = `https://www.youtube.com/results?search_query=Official+髭男+dism+${encodeURIComponent(songTitle[songId] || songId)}+Live`;
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent("Official 髭男 dism " + (songTitle[songId] || songId))}`;
  const livefansUrl = livefansId ? `https://www.livefans.jp/songs/${livefansId}` : null;

  const handleCopyHistory = () => {
    const title = songTitle[songId] || songId;
    const lines = [
      `【Official 髭男 dism 演唱會檔案】`,
      `🎵 歌曲：《${title}》`,
      `💿 專輯：${albumName}`,
      `📊 演出統計：全檔案庫共出演 ${appearances.length} 場`,
    ];
    if (firstShow && firstApp) {
      lines.push(`🚩 初次演出：${showDate(firstShow)} ${firstApp.unitTitle}（${firstShow.venue}）`);
    }
    if (latestShow && latestApp) {
      lines.push(`🚩 最新演出：${showDate(latestShow)} ${latestApp.unitTitle}（${latestShow.venue}）`);
    }
    if (hasSpecials) {
      const parts = [];
      if (specialVersionCounts.solo) parts.push(`自彈自唱 ${specialVersionCounts.solo} 場`);
      if (specialVersionCounts.request) parts.push(`現場點歌 ${specialVersionCounts.request} 場`);
      if (specialVersionCounts.premiere) parts.push(`新歌首演 ${specialVersionCounts.premiere} 場`);
      lines.push(`✨ 特殊版本：${parts.join(" · ")}`);
    }
    lines.push(`🔗 來源：Official 髭男 dism 演唱會雙向檔案庫`);
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="歌曲全域出現場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-4 border-b-2 border-ink pb-4">
        {/* Level 1: Artist branding & Album badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-paper px-2 py-0.5 font-mono text-[11px] font-bold text-muted border border-line-soft">
              {albumName}
            </span>
            <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-tape-soft/40 px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
              SONG ARCHIVE
            </span>
          </div>
        </div>

        {/* Level 2: Song Title Headline */}
        <h2 className="mt-2.5 mb-2 font-display text-[26px] sm:text-[30px] font-black leading-tight text-ink tracking-tight text-pretty">
          {songTitle[songId] || songId}
          {songUnreleased.has(songId) && (
            <span className="ml-2 inline-block rounded border border-unreleased/40 bg-unreleased-wash px-2 py-0.5 font-mono text-[12px] font-semibold text-unreleased align-middle">
              未發行
            </span>
          )}
        </h2>

        {/* Level 3a: Song Identity Summary Bar (Clean, single cohesive line) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line-soft font-mono text-[12px] text-muted">
          <span className="font-bold text-ink">
            共出演 <span className="tabular-nums text-[14px] text-pool font-extrabold">{appearances.length}</span> 場
          </span>
          {rarityTier && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-bold border ${rarityTier.cls}`}>
              {rarityTier.label}
            </span>
          )}
          {rarityTier?.isDormant && (
            <span className="rounded bg-paper px-1.5 py-0.5 text-xs font-bold text-muted border border-line-soft">
              📦 近年封箱中
            </span>
          )}
          {hasSpecials && (
            <span className="rounded bg-tape/20 px-1.5 py-0.5 font-bold text-ink border border-ink/20 text-xs">
              ✨ 特殊版本 {specialVersionCounts.total}場
            </span>
          )}
          {liveRole && (
            <span className="inline-flex items-center gap-1 text-xs text-ink/80">
              <span>· 🎯 {liveRole.positionText}</span>
              {liveRole.avgOrder && <span>(平均M{liveRole.avgOrder})</span>}
              {liveRole.encoreRate > 0 && <span>· 安可率{liveRole.encoreRate}%</span>}
            </span>
          )}
        </div>

        {/* Level 3b: Action Toolbar (Separated clean row, no horizontal crowding) */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft/60 pt-2 font-mono text-[11px]">
          <button
            type="button"
            onClick={handleCopyHistory}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer select-none border ${
              copied
                ? "bg-band text-band-ink border-band shadow-xs"
                : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
            }`}
            title="複製這首歌曲的演出歷史摘要"
          >
            <span>{copied ? "✓ 已複製歷程" : "📋 複製歷程"}</span>
          </button>

          <div className="flex items-center gap-1.5">
            {yearBreakdown.length >= 3 && (
              <button
                type="button"
                onClick={() => setShowYearBreakdown((v) => !v)}
                className="inline-flex items-center gap-1 rounded bg-paper px-2.5 py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
                aria-expanded={showYearBreakdown}
              >
                <span>{showYearBreakdown ? "▾ 年度分佈" : "▸ 年度分佈"}</span>
              </button>
            )}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-ink hover:bg-band hover:border-band transition-colors no-underline"
              title="在 YouTube 搜尋現場 Live 影片"
            >
              <span>▶ YouTube</span>
            </a>
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-ink hover:bg-band hover:border-band transition-colors no-underline"
              title="在 Spotify 聆聽官方音源"
            >
              <span>🎧 Spotify</span>
            </a>
            {livefansUrl && (
              <a
                href={livefansUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-muted hover:text-ink hover:bg-band hover:border-band transition-colors no-underline"
                title="在 LiveFans 查看歌曲頁面"
              >
                <span>🎫 LiveFans</span>
              </a>
            )}
          </div>
        </div>

        {/* Level 4: Milestone Performance (Only when song has >= 2 shows & different show IDs) */}
        {sortedAppearances.length >= 2 && firstApp && latestApp && firstApp.showId !== latestApp.showId && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-t border-line-soft/80 pt-2.5 font-mono text-[12px]">
            {/* First Live */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span className="flex items-center gap-1 text-ink">
                  <span className="text-band font-bold" aria-hidden="true">★</span> 首次披露 / 首演場次
                </span>
                <span className="tabular-nums font-semibold">{firstShow ? showDate(firstShow) : "—"}</span>
              </div>
              {firstApp && firstShow ? (
                <a
                  href={routeHash.show(firstApp.showId)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectShow(firstApp.showId);
                  }}
                  className="group flex flex-col text-ink no-underline hover:text-pool transition-colors"
                >
                  <span
                    className="font-bold text-[13px] break-words line-clamp-2 leading-snug group-hover:underline"
                    title={firstApp.unitTitle}
                  >
                    {firstApp.unitTitle}
                  </span>
                  <span className="text-muted text-[12px] mt-0.5 truncate flex items-center gap-1">
                    <span>📍 {firstShow.venue}（{firstShow.city}）</span>
                    {onSelectVenue && firstShow.venue && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onSelectVenue(firstShow.venue);
                        }}
                        className="inline-flex items-center text-xs font-bold text-pool hover:underline cursor-pointer ml-1"
                        title={`查看「${firstShow.venue}」場地檔案`}
                      >
                        [場地 →]
                      </button>
                    )}
                  </span>
                </a>
              ) : (
                <span className="text-muted">暫無紀錄</span>
              )}
            </div>

            {/* Latest Live */}
            <div className="flex flex-col gap-0.5 sm:border-l sm:border-line-soft/80 sm:pl-4">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span className="flex items-center gap-1 text-ink">
                  <span className="text-band font-bold" aria-hidden="true">★</span> 最新出演場次
                </span>
                <span className="tabular-nums font-semibold">{latestShow ? showDate(latestShow) : "—"}</span>
              </div>
              {latestApp && latestShow ? (
                <a
                  href={routeHash.show(latestApp.showId)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectShow(latestApp.showId);
                  }}
                  className="group flex flex-col text-ink no-underline hover:text-pool transition-colors"
                >
                  <span
                    className="font-bold text-[13px] break-words line-clamp-2 leading-snug group-hover:underline"
                    title={latestApp.unitTitle}
                  >
                    {latestApp.unitTitle}
                  </span>
                  <span className="text-muted text-[12px] mt-0.5 truncate flex items-center gap-1">
                    <span>📍 {latestShow.venue}（{latestShow.city}）</span>
                    {onSelectVenue && latestShow.venue && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onSelectVenue(latestShow.venue);
                        }}
                        className="inline-flex items-center text-xs font-bold text-pool hover:underline cursor-pointer ml-1"
                        title={`查看「${latestShow.venue}」場地檔案`}
                      >
                        [場地 →]
                      </button>
                    )}
                  </span>
                </a>
              ) : (
                <span className="text-muted">暫無紀錄</span>
              )}
            </div>
          </div>
        )}

        {/* Level 5: Collapsible Year-by-Year Performance Frequency */}
        {showYearBreakdown && yearBreakdown.length >= 3 && (
          <div className="mt-2.5 border-t border-line-soft/80 pt-2 font-mono text-[11px]">
            <div className="flex items-center justify-between font-bold text-muted mb-1.5">
              <span className="flex items-center gap-1">
                <span aria-hidden="true">📅</span> 年度演出頻率分佈
              </span>
              <span className="tabular-nums">歷年涵蓋 {yearBreakdown.length} 個演出年份</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {yearBreakdown.map(([yr, count]) => (
                <span
                  key={yr}
                  className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-0.5 tabular-nums text-ink"
                >
                  <span className="text-muted">{yr}</span>
                  <span className="font-bold">{count}場</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs & Special Version Toggle */}
      <div className="my-2 space-y-2 border-b border-line-soft pb-2.5">
        <div
          role="tablist"
          aria-label="演出類型篩選"
          className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:flex md:flex-nowrap md:[&>*]:flex-1 gap-1.5"
        >
          {availableTypes.map((t) => {
            const count = typeCounts.get(t) || 0;
            const isActive = !onlySpecial && effectiveType === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={songFilterPillClass(isActive)}
                onClick={() => {
                  setOnlySpecial(false);
                  setSelectedType(t);
                }}
              >
                <span>{t}</span>
                <span className="font-mono text-[11px] tabular-nums opacity-85">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {hasSpecials && (
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                onlySpecial
                  ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                  : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
              }`}
              onClick={() => setOnlySpecial((prev) => !prev)}
            >
              <span>✨ 僅顯示特殊演出版本</span>
              <span className="tabular-nums">({specialVersionCounts.total}場)</span>
              {specialVersionCounts.solo > 0 && (
                <span className="opacity-75">· 彈唱{specialVersionCounts.solo}</span>
              )}
              {specialVersionCounts.request > 0 && (
                <span className="opacity-75">· 點歌{specialVersionCounts.request}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {hasCollapsible && (
        <div className="flex items-center justify-end gap-2 pt-1 font-mono text-[11px] text-muted">
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-muted transition-colors hover:text-ink hover:underline"
            onClick={expandAll}
          >
            全部展開
          </button>
          <span aria-hidden="true">・</span>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-muted transition-colors hover:text-ink hover:underline"
            onClick={collapseAll}
          >
            全部收合
          </button>
        </div>
      )}

      {groupedByUnit.length === 0 ? (
        <p className="m-0 px-1 py-6 text-center font-mono text-[13px] text-muted">
          此分類下無演出紀錄
        </p>
      ) : (
        <div className="space-y-4 pt-1">
          {groupedByUnit.map((g) => {
            const isCollapsible = g.items.length > COLLAPSIBLE_THRESHOLD;
            const isCollapsed = isCollapsible && (collapsedMap.get(g.unitId) ?? false);
            const targetUnit = unitData?.get(g.unitId)?.unit;
            const totalShowsInTour = targetUnit?.shows?.length ?? g.items.length;
            const isFullAttendance = totalShowsInTour > 1 && g.items.length === totalShowsInTour;
            const isRotation = totalShowsInTour > 2 && g.items.length < totalShowsInTour;

            return (
              <section key={g.unitId} className="flex flex-col">
                <div
                  className={`flex flex-col gap-2 rounded-[4px] border border-line-soft bg-paper/70 px-3.5 py-2.5 transition-colors ${
                    isCollapsible
                      ? "cursor-pointer hover:bg-line-soft/80 hover:border-ink/30 select-none"
                      : ""
                  }`}
                  onClick={isCollapsible ? () => toggleUnit(g.unitId) : undefined}
                  role={isCollapsible ? "button" : undefined}
                  tabIndex={isCollapsible ? 0 : undefined}
                  onKeyDown={
                    isCollapsible
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleUnit(g.unitId);
                          }
                        }
                      : undefined
                  }
                  aria-expanded={isCollapsible ? !isCollapsed : undefined}
                >
                  {/* Desktop: Single Row Layout with Title on Left, Counts & Attendance at Line-End */}
                  <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
                    <h3
                      className="m-0 min-w-0 flex-1 break-words font-display text-[15px] font-extrabold leading-snug text-ink text-pretty"
                      title={g.unitTitle}
                    >
                      {g.unitTitle}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted tabular-nums">
                      <span className="font-bold text-ink">共 {g.items.length} 場</span>
                      {totalShowsInTour > 1 && (
                        <>
                          {isFullAttendance && (
                            <span className="rounded bg-tape-tint px-1.5 py-0.5 text-xs font-bold text-ink border border-ink/20">
                              ★ 全勤 ({g.items.length}/{totalShowsInTour})
                            </span>
                          )}
                          {isRotation && (
                            <span className="rounded bg-paper px-1.5 py-0.5 text-xs font-medium text-pool border border-pool/30">
                              🔄 輪替 ({g.items.length}/{totalShowsInTour})
                            </span>
                          )}
                        </>
                      )}
                      {isCollapsible && (
                        <span className="rounded border border-line-soft bg-card px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink">
                          {isCollapsed ? "▼ 展開" : "▲ 收合"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile: Two-Tier Layout */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="m-0 min-w-0 flex-1 break-words font-display text-[14px] font-extrabold leading-snug text-ink text-pretty"
                        title={g.unitTitle}
                      >
                        {g.unitTitle}
                      </h3>
                      {isCollapsible && (
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-muted/80 text-[13px] font-bold pt-0.5"
                        >
                          {isCollapsed ? "▾" : "▴"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-line-soft/60 pt-1.5 font-mono text-[11px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink tabular-nums">共 {g.items.length} 場</span>
                        {totalShowsInTour > 1 && (
                          <>
                            {isFullAttendance && (
                              <span className="rounded bg-tape-tint px-1.5 py-0.5 text-xs font-bold text-ink border border-ink/20">
                                ★ 全勤 ({g.items.length}/{totalShowsInTour})
                              </span>
                            )}
                            {isRotation && (
                              <span className="rounded bg-paper px-1.5 py-0.5 text-xs font-medium text-pool border border-pool/30">
                                🔄 輪替 ({g.items.length}/{totalShowsInTour})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {isCollapsible && (
                        <span className="rounded border border-line-soft bg-card px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink">
                          {isCollapsed ? "▼ 展開清單" : "▲ 收合清單"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isCollapsed && (
                  <ul className="m-0 mt-1 list-none p-0">
                    {g.items.map(({ showId, item }) => {
                      const s = showById.get(showId);
                      const badges = visibleBadges(item.kind);
                      const hasMeta = badges.length > 0 || !!item.note;

                      return (
                        <li
                          key={showId}
                          className="border-b border-line-soft/80 px-2.5 py-2.5 last:border-b-0 hover:bg-paper/40 transition-colors"
                        >
                          <a
                            className="group flex flex-col text-ink no-underline transition-colors hover:text-request focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none"
                            href={routeHash.show(showId)}
                            onClick={(e) => {
                              e.preventDefault();
                              onSelectShow(showId);
                            }}
                          >
                            <div className="flex flex-wrap items-baseline gap-x-2 leading-snug">
                              <span className="shrink-0 font-mono text-[12px] font-semibold text-muted">
                                {showDate(s)}
                              </span>
                              <span className="show-link-venue text-[14px] font-bold text-ink group-hover:text-pool group-hover:underline">
                                {s.venue}
                              </span>
                              <span className="shrink-0 text-[13px] text-muted">
                                （{s.city}）
                              </span>
                            </div>
                            {hasMeta && (
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-0.5">
                                {badges.map(({ key, label, cls }) => (
                                  <span
                                    key={key}
                                    className={`inline-block rounded-[3px] border px-1.5 py-0.5 align-middle font-mono text-[11px] font-bold leading-none tracking-wide ${cls}`}
                                  >
                                    ♪ {label}
                                  </span>
                                ))}
                                {item.note && (
                                  <span className="font-mono text-[11px] text-muted font-medium">
                                    💬 {item.note}
                                  </span>
                                )}
                              </div>
                            )}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Soundboard Engineer Run Sheet Footer */}
      <div className="mt-8 border-t border-line-soft pt-3.5 flex flex-wrap items-center justify-between gap-3 text-muted font-mono text-[12px]">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-ink">OFFICIAL HIGEDAN DISM</span>
          <span className="opacity-40">|</span>
          <span>SONG PERFORMANCE ARCHIVE</span>
        </div>
        <div className="flex items-center gap-2 tabular-nums">
          <span>TRACK ID: {songId.toUpperCase()}</span>
          <span className="opacity-40">|</span>
          <span className="font-extrabold tracking-tight text-ink/75" aria-hidden="true">||| | |||| | ||| ||</span>
        </div>
      </div>
    </article>
  );
}

export function VenueSlip({ venueName, globalVenueShows, unitData, onSelectShow, onSelectSong }) {
  const [copied, setCopied] = useState(false);
  const [showYearBreakdown, setShowYearBreakdown] = useState(false);

  const venueShows = useMemo(() => {
    return globalVenueShows?.get(venueName) ?? [];
  }, [globalVenueShows, venueName]);

  // Chronologically sorted shows for milestones & career span
  const sortedShows = useMemo(() => {
    return [...venueShows].sort((a, b) => {
      const dateA = a.show?.date ?? "";
      const dateB = b.show?.date ?? "";
      return dateA.localeCompare(dateB);
    });
  }, [venueShows]);

  const firstApp = sortedShows[0] ?? null;
  const latestApp = sortedShows[sortedShows.length - 1] ?? null;
  const firstShow = firstApp?.show ?? null;
  const latestShow = latestApp?.show ?? null;

  const venueCity = firstShow?.city ?? "";
  const venuePref = firstShow?.prefecture ?? "";
  const venueRegion = firstShow?.region ?? "";

  // Venue Classification Tier & San'in / Arena Badge
  const venueTier = useMemo(() => {
    if (!venueName) return null;
    const nameLower = venueName.toLowerCase();
    const city = venueCity;
    const pref = venuePref;

    // 1. San'in Roots Sanctuary
    if (
      pref.includes("島根") ||
      pref.includes("鳥取") ||
      city.includes("松江") ||
      city.includes("米子") ||
      city.includes("出雲") ||
      nameLower.includes("canova") ||
      nameLower.includes("laughs") ||
      nameLower.includes("pianoman")
    ) {
      return {
        label: "🌱 山陰發跡聖地",
        cls: "text-band-ink bg-tape-tint border-ink/40 font-bold",
        desc: "樂團成軍發跡地與早期重要現場據點",
      };
    }

    // 2. Overseas
    if (
      venueRegion === "海外" ||
      city.includes("台北") ||
      city.includes("首爾") ||
      city.includes("曼谷") ||
      city.includes("新加坡") ||
      nameLower.includes("kspo") ||
      nameLower.includes("kintex") ||
      nameLower.includes("uob")
    ) {
      return {
        label: "✈️ 海外遠征巡演",
        cls: "text-pool bg-pool-wash border-pool/40 font-bold",
        desc: "世界巡演重要海外公演舞台",
      };
    }

    // 3. Arena & Dome
    if (
      nameLower.includes("arena") ||
      venueName.includes("アリーナ") ||
      venueName.includes("武道館") ||
      nameLower.includes("dome") ||
      venueName.includes("ドーム") ||
      venueName.includes("スーパーアリーナ") ||
      venueName.includes("城ホール") ||
      venueName.includes("代々木第一")
    ) {
      return {
        label: "🏟️ 巨蛋 / 競技場 (Arena & Dome)",
        cls: "text-request bg-request-wash border-request/40 font-bold",
        desc: "萬人級大型指標指標場館",
      };
    }

    // 4. Festivals / Outdoor
    const isFestival =
      venueShows.some((s) => s.unitType === "音樂節 / 拼盤") ||
      venueName.includes("公園") ||
      venueName.includes("フェス") ||
      venueName.includes("PARK");
    if (isFestival) {
      return {
        label: "🎪 音樂節 / 戶外舞台",
        cls: "text-solo bg-solo-wash border-solo/40 font-bold",
        desc: "大型音樂祭與特設野外舞台",
      };
    }

    // 5. Campus
    const isCampus =
      venueShows.some((s) => s.unitType === "校園演出") ||
      venueName.includes("大学") ||
      venueName.includes("専修") ||
      venueName.includes("講堂");
    if (isCampus) {
      return {
        label: "🏫 校園巡迴舞台",
        cls: "text-ink bg-paper border-line-soft font-bold",
        desc: "學園祭與校園文化演出",
      };
    }

    // 6. Standard Hall / Livehouse
    return {
      label: "🏠 Livehouse / 演奏廳 (Hall)",
      cls: "text-ink bg-paper border-line-soft font-bold",
      desc: "全國巡演專場公演舞台",
    };
  }, [venueName, venueCity, venuePref, venueRegion, venueShows]);

  // Career span years text
  const spanYearsText = useMemo(() => {
    if (!firstShow?.date || !latestShow?.date) return null;
    const y1 = firstShow.date.slice(0, 4);
    const y2 = latestShow.date.slice(0, 4);
    if (y1 === y2) return `${y1} 年`;
    const diff = parseInt(y2, 10) - parseInt(y1, 10);
    return `${y1} ～ ${y2}（跨越 ${diff + 1} 年足跡）`;
  }, [firstShow, latestShow]);

  // Year breakdown for performance frequency
  const yearBreakdown = useMemo(() => {
    const map = new Map();
    for (const app of venueShows) {
      const d = app.show?.date;
      if (d) {
        const yr = d.slice(0, 4);
        map.set(yr, (map.get(yr) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [venueShows]);

  // Top Songs performed at this venue
  const topSongs = useMemo(() => {
    if (!unitData || venueShows.length === 0) return [];
    const songCounts = new Map();
    for (const app of venueShows) {
      const ud = unitData.get(app.unitId);
      const items = ud?.full?.get(app.showId) || [];
      const seen = new Set();
      for (const it of items) {
        if (it.songId && !seen.has(it.songId)) {
          seen.add(it.songId);
          songCounts.set(it.songId, (songCounts.get(it.songId) || 0) + 1);
        }
      }
    }
    return Array.from(songCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, count]) => ({
        id,
        title: songTitle[id] || id,
        count,
      }));
  }, [venueShows, unitData]);

  // Category Counts & Available Types
  const typeCounts = useMemo(() => {
    const counts = new Map();
    for (const app of venueShows) {
      const t = app.unitType || "其他";
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return counts;
  }, [venueShows]);

  const availableTypes = useMemo(() => {
    const types = CATEGORY_ORDER.filter((t) => typeCounts.has(t));
    for (const t of typeCounts.keys()) {
      if (!types.includes(t)) types.push(t);
    }
    return types;
  }, [typeCounts]);

  const [selectedType, setSelectedType] = useState(() => availableTypes[0] ?? "巡演專場");

  useEffect(() => {
    if (availableTypes.length > 0) {
      setSelectedType(availableTypes[0]);
    }
  }, [venueName]);

  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(selectedType)) {
      setSelectedType(availableTypes[0]);
    }
  }, [availableTypes, selectedType]);

  const effectiveType = availableTypes.includes(selectedType)
    ? selectedType
    : availableTypes[0];

  const filteredVenueShows = useMemo(() => {
    if (!effectiveType) return venueShows;
    return venueShows.filter(
      (app) => (app.unitType || "其他") === effectiveType
    );
  }, [venueShows, effectiveType]);

  // Group by Unit
  const groupedByUnit = useMemo(() => {
    const groupMap = new Map();
    for (const app of filteredVenueShows) {
      if (!groupMap.has(app.unitId)) {
        groupMap.set(app.unitId, {
          unitId: app.unitId,
          unitTitle: app.unitTitle,
          unitType: app.unitType,
          earliestDate: app.show?.date ?? "9999-12-31",
          items: [],
        });
      }
      groupMap.get(app.unitId).items.push(app);
    }
    return Array.from(groupMap.values()).sort((a, b) =>
      b.earliestDate.localeCompare(a.earliestDate)
    );
  }, [filteredVenueShows]);

  const [collapsedMap, setCollapsedMap] = useState(() => new Map());

  useEffect(() => {
    const initial = new Map();
    groupedByUnit.forEach((g) => {
      if (g.items.length > 2) {
        initial.set(g.unitId, true);
      }
    });
    setCollapsedMap(initial);
  }, [venueName, effectiveType, groupedByUnit]);

  const toggleUnit = (unitId) => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      next.set(unitId, !next.get(unitId));
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) {
        if (g.items.length > 1) next.set(g.unitId, false);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) {
        if (g.items.length > 1) next.set(g.unitId, true);
      }
      return next;
    });
  };

  const hasCollapsible = groupedByUnit.some((g) => g.items.length > 1);

  const handleCopyVenueHistory = () => {
    const lines = [
      `【Official 髭男 dism @ ${venueName} 演出歷程】`,
      `📍 地點：${venuePref ? `${venuePref} · ` : ""}${venueCity}`,
      `🏛️ 累計演出：${venueShows.length} 場`,
    ];
    if (spanYearsText) {
      lines.push(`📅 年份跨度：${spanYearsText}`);
    }
    if (topSongs.length > 0) {
      lines.push(`🏆 常唱曲目：${topSongs.map((s) => `${s.title} (${s.count}次)`).join("、")}`);
    }
    lines.push("");
    lines.push("【歷史演出場次】");

    sortedShows.forEach((app) => {
      const d = app.show?.date ? showDate(app.show) : "";
      lines.push(`- ${d}｜${app.unitTitle}`);
    });

    lines.push("");
    lines.push("#Official髭男dism #ヒゲダン #聖地巡礼");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(lines.join("\n"))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2200);
        })
        .catch(() => {});
    }
  };

  if (!venueName) {
    return (
      <div className={SLIP_ARTICLE}>
        <span aria-hidden="true" className={SLIP_TAPE} />
        <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
          選一個場地，看在該場地舉行過哪些場次。
        </p>
      </div>
    );
  }

  const mapQuery = encodeURIComponent(
    `${venuePref ? venuePref + " " : ""}${venueCity ? venueCity + " " : ""}${venueName}`
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const livefansUrl = `https://www.livefans.jp/search?q=${encodeURIComponent(venueName)}`;

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="場地全域場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-4 border-b-2 border-ink pb-4">
        {/* Level 1: Artist branding & category badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-tape-soft/40 px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
              VENUE ARCHIVE
            </span>
          </div>
        </div>

        {/* Level 2: Venue Title Headline */}
        <h2 className="mt-2.5 mb-2 font-display text-[24px] sm:text-[27px] font-black leading-tight text-ink tracking-tight text-pretty">
          {venueName}{" "}
          {(venueCity || venuePref) && (
            <span className="text-[17px] font-medium text-muted">
              （{venuePref ? `${venuePref} · ` : ""}{venueCity}）
            </span>
          )}
        </h2>

        {/* Level 3a: Venue Identity Summary Bar (Clean, single cohesive line) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line-soft font-mono text-[12px] text-muted">
          <span className="font-bold text-ink">
            共舉辦過 <span className="tabular-nums text-[14px] text-pool font-extrabold">{venueShows.length}</span> 場演出
          </span>
          {venueTier && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-bold border ${venueTier.cls}`} title={venueTier.desc}>
              {venueTier.label}
            </span>
          )}
          {spanYearsText && (
            <span className="rounded bg-paper px-1.5 py-0.5 text-xs font-bold text-muted border border-line-soft">
              📅 {spanYearsText}
            </span>
          )}
        </div>

        {/* Level 3b: Action Toolbar (Separated clean row, no horizontal crowding) */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft/60 pt-2 font-mono text-[11px]">
          <button
            type="button"
            onClick={handleCopyVenueHistory}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer select-none border ${
              copied
                ? "bg-band text-band-ink border-band shadow-xs"
                : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
            }`}
            title="複製此場地的演出歷史紀錄"
          >
            <span>{copied ? "✓ 已複製歷程" : "📋 複製歷程"}</span>
          </button>

          <div className="flex items-center gap-1.5">
            {yearBreakdown.length >= 3 && (
              <button
                type="button"
                onClick={() => setShowYearBreakdown((v) => !v)}
                className="inline-flex items-center gap-1 rounded bg-paper px-2.5 py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
                aria-expanded={showYearBreakdown}
              >
                <span>{showYearBreakdown ? "▾ 年度分佈" : "▸ 年度分佈"}</span>
              </button>
            )}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-ink hover:bg-band hover:border-band transition-colors no-underline"
              title="在 Google 地圖查看場館位置"
            >
              <span>🗺️ Google Maps</span>
            </a>
            <a
              href={livefansUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-muted hover:text-ink hover:bg-band hover:border-band transition-colors no-underline"
              title="在 LiveFans 查看場館歷史演算法"
            >
              <span>🎫 LiveFans</span>
            </a>
          </div>
        </div>

        {/* Level 3.5: Top Songs Performed Here (Only when >= 4 shows & has real repeat songs) */}
        {topSongs.length > 0 && venueShows.length >= 4 && topSongs.some((s) => s.count >= 2) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-line-soft/60 pt-2 font-mono text-[11px]">
            <span className="font-bold text-muted flex items-center gap-1">
              <span>🏆 本場地常唱曲目：</span>
            </span>
            {topSongs.map((s) => (
              <a
                key={s.id}
                href={routeHash.song(s.id)}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectSong?.(s.id);
                }}
                className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 border border-line-soft text-ink hover:bg-tape-tint/40 hover:border-ink/60 transition-colors no-underline cursor-pointer"
                title={`查看歌曲《${s.title}》的全歷史演出紀錄`}
              >
                <span className="font-medium">{s.title}</span>
                <span className="font-bold text-pool tabular-nums">({s.count}次)</span>
              </a>
            ))}
          </div>
        )}

        {/* Level 4: Milestone Performance (Only when venue has >= 3 shows) */}
        {sortedShows.length >= 3 && firstApp && latestApp && firstApp.showId !== latestApp.showId && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-t border-line-soft/80 pt-2.5 font-mono text-[12px]">
            {/* First Live */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span className="flex items-center gap-1 text-ink">
                  <span className="text-band font-bold" aria-hidden="true">★</span> 首次登台 / 首演場次
                </span>
                <span className="tabular-nums font-semibold">{firstShow ? showDate(firstShow) : "—"}</span>
              </div>
              {firstApp && firstShow ? (
                <a
                  href={routeHash.show(firstApp.showId)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectShow(firstApp.showId);
                  }}
                  className="group flex flex-col text-ink no-underline hover:text-pool transition-colors"
                >
                  <span
                    className="font-bold text-[13px] break-words line-clamp-2 leading-snug group-hover:underline"
                    title={firstApp.unitTitle}
                  >
                    {firstApp.unitTitle}
                  </span>
                </a>
              ) : (
                <span className="text-muted">暫無紀錄</span>
              )}
            </div>

            {/* Latest Live */}
            <div className="flex flex-col gap-0.5 sm:border-l sm:border-line-soft/80 sm:pl-4">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span className="flex items-center gap-1 text-ink">
                  <span className="text-band font-bold" aria-hidden="true">★</span> 最新出演場次
                </span>
                <span className="tabular-nums font-semibold">{latestShow ? showDate(latestShow) : "—"}</span>
              </div>
              {latestApp && latestShow ? (
                <a
                  href={routeHash.show(latestApp.showId)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectShow(latestApp.showId);
                  }}
                  className="group flex flex-col text-ink no-underline hover:text-pool transition-colors"
                >
                  <span
                    className="font-bold text-[13px] break-words line-clamp-2 leading-snug group-hover:underline"
                    title={latestApp.unitTitle}
                  >
                    {latestApp.unitTitle}
                  </span>
                </a>
              ) : (
                <span className="text-muted">暫無紀錄</span>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Year-by-Year Performance Frequency Drawer */}
        {showYearBreakdown && yearBreakdown.length > 0 && (
          <div className="mt-3 border-t border-line-soft/80 pt-2.5 font-mono text-[11px]">
            <div className="text-muted font-bold mb-1.5 flex items-center gap-1">
              <span>📅 各年度演出頻率分佈：</span>
              <span className="font-normal text-muted/70">（跨越 {yearBreakdown.length} 個年份）</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {yearBreakdown.map(([yr, count]) => (
                <span
                  key={yr}
                  className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 border border-line-soft text-ink"
                >
                  <span className="text-muted font-semibold">{yr}年</span>
                  <span className="font-bold text-ink">{count}場</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      {availableTypes.length > 0 && (
        <div className="my-2 border-b border-line-soft pb-2.5">
          <div
            role="tablist"
            aria-label="演出類型篩選"
            className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:flex md:flex-nowrap md:[&>*]:flex-1 gap-1.5"
          >
            {availableTypes.map((t) => {
              const count = typeCounts.get(t) || 0;
              const isActive = effectiveType === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={songFilterPillClass(isActive)}
                  onClick={() => setSelectedType(t)}
                >
                  <span>{t}</span>
                  <span className="font-mono text-[11px] tabular-nums opacity-85">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasCollapsible && (
        <div className="flex items-center justify-end gap-2 pt-1 pb-2 font-mono text-[11px] text-muted">
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-muted transition-colors hover:text-ink hover:underline"
            onClick={expandAll}
          >
            全部展開
          </button>
          <span aria-hidden="true">・</span>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-muted transition-colors hover:text-ink hover:underline"
            onClick={collapseAll}
          >
            全部收合
          </button>
        </div>
      )}

      {groupedByUnit.length === 0 ? (
        <p className="m-0 px-1 py-6 text-center font-mono text-[13px] text-muted">
          {venueShows.length === 0 ? "此場地尚無演出紀錄" : "此分類下無演出紀錄"}
        </p>
      ) : (
        <div className="space-y-4 pt-1">
          {groupedByUnit.map((g) => {
            const isCollapsible = g.items.length > 1;
            const isCollapsed = isCollapsible && (collapsedMap.get(g.unitId) ?? false);

            return (
              <section key={g.unitId} className="flex flex-col">
                <div
                  className={`flex flex-col gap-2 rounded-[4px] border border-line-soft bg-paper/70 px-3.5 py-2.5 transition-colors ${
                    isCollapsible
                      ? "cursor-pointer hover:bg-line-soft/80 hover:border-ink/30 select-none"
                      : ""
                  }`}
                  onClick={isCollapsible ? () => toggleUnit(g.unitId) : undefined}
                  role={isCollapsible ? "button" : undefined}
                  tabIndex={isCollapsible ? 0 : undefined}
                  onKeyDown={
                    isCollapsible
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleUnit(g.unitId);
                          }
                        }
                      : undefined
                  }
                  aria-expanded={isCollapsible ? !isCollapsed : undefined}
                >
                  {/* Desktop: Single Row Layout with Title on Left, Counts at Line-End */}
                  <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
                    <h3
                      className="m-0 min-w-0 flex-1 break-words font-display text-[15px] font-extrabold leading-snug text-ink text-pretty"
                      title={g.unitTitle}
                    >
                      {g.unitTitle}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted tabular-nums">
                      <span className="font-bold text-ink">共 {g.items.length} 場</span>
                      {isCollapsible && (
                        <span className="rounded border border-line-soft bg-card px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink">
                          {isCollapsed ? "▼ 展開" : "▲ 收合"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile: Two-Tier Layout */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="m-0 min-w-0 flex-1 break-words font-display text-[14px] font-extrabold leading-snug text-ink text-pretty"
                        title={g.unitTitle}
                      >
                        {g.unitTitle}
                      </h3>
                      {isCollapsible && (
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-muted/80 text-[13px] font-bold pt-0.5"
                        >
                          {isCollapsed ? "▾" : "▴"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-line-soft/60 pt-1.5 font-mono text-[11px]">
                      <span className="font-bold text-ink tabular-nums">共 {g.items.length} 場</span>
                      {isCollapsible && (
                        <span className="rounded border border-line-soft bg-card px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink">
                          {isCollapsed ? "▼ 展開清單" : "▲ 收合清單"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isCollapsed && (
                  <ul className="m-0 mt-1 list-none p-0">
                    {g.items.map(({ showId, show }) => {
                      const ud = unitData?.get(g.unitId);
                      const fullItems = ud?.full?.get(showId) || [];
                      const songCount = fullItems.filter(
                        (i) => i.songId || i.title
                      ).length;

                      const hasSolo = fullItems.some((i) =>
                        getKindArray(i.kind).includes("satoshi-solo")
                      );
                      const hasRequest = fullItems.some((i) =>
                        getKindArray(i.kind).includes("request")
                      );
                      const hasPremiere = fullItems.some((i) =>
                        getKindArray(i.kind).includes("premiere")
                      );

                      return (
                        <li
                          key={showId}
                          className="border-b border-line-soft/80 px-2.5 py-2.5 last:border-b-0 hover:bg-paper/40 transition-colors"
                        >
                          <a
                            className="group flex items-center justify-between gap-3 text-ink no-underline transition-colors focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none"
                            href={routeHash.show(showId)}
                            onClick={(e) => {
                              e.preventDefault();
                              onSelectShow(showId);
                            }}
                          >
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex flex-wrap items-baseline gap-x-2.5 leading-snug">
                                <span className="font-mono text-[13px] font-bold text-ink group-hover:text-pool group-hover:underline">
                                  📅 {showDate(show)}
                                </span>
                                {show?.opensAt && (
                                  <span className="font-mono text-[11px] text-muted">
                                    ⏰ {show.opensAt} 開演
                                  </span>
                                )}
                              </div>
                              {(hasSolo || hasRequest || hasPremiere) && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {hasSolo && (
                                    <span className="inline-block rounded-[3px] border border-solo/30 bg-solo/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-solo leading-none">
                                      ♪ 自彈自唱
                                    </span>
                                  )}
                                  {hasRequest && (
                                    <span className="inline-block rounded-[3px] border border-request/30 bg-request/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-request leading-none">
                                      ♪ 現場點歌
                                    </span>
                                  )}
                                  {hasPremiere && (
                                    <span className="inline-block rounded-[3px] border border-premiere/30 bg-premiere/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-premiere leading-none">
                                      ♪ 新歌初演
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] tabular-nums">
                              <span className="rounded bg-paper px-2 py-0.5 font-semibold text-muted border border-line-soft">
                                {songCount > 0 ? `${songCount} 首曲目` : "尚無曲目"}
                              </span>
                              <span
                                className="font-bold text-pool opacity-80 group-hover:translate-x-0.5 transition-transform"
                                aria-hidden="true"
                              >
                                檢視歌單 →
                              </span>
                            </div>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Soundboard Engineer Run Sheet Footer */}
      <div className="mt-8 border-t border-line-soft pt-3.5 flex flex-wrap items-center justify-between gap-3 text-muted font-mono text-[12px]">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-ink">OFFICIAL HIGEDAN DISM</span>
          <span className="opacity-40">|</span>
          <span>VENUE PERFORMANCE ARCHIVE</span>
        </div>
        <div className="flex items-center gap-2 tabular-nums">
          <span>VENUE: {venueName.slice(0, 10).toUpperCase()}</span>
          <span className="opacity-40">|</span>
          <span className="font-extrabold tracking-tight text-ink/75" aria-hidden="true">||| | |||| | ||| ||</span>
        </div>
      </div>
    </article>
  );
}
