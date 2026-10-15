import { useState, useMemo, useRef } from "react";
import { MemorialCardModal } from "../MemorialCardModal.jsx";
import { KIND_TAB, SETLIST_ITEM, CUE_NO, TRACK_NOTE, SLIP_ARTICLE, SLIP_TAPE } from "../../lib/constants.js";
import { getKindArray, primaryKind, kindTabs, slipClassFor, cueColorFor, songWeightFor, tabColorFor } from "../../lib/kind.js";
import { songTitle, songUnreleased, showDate, getSongAlbum, formatShowTime, formatShowSongBreakdown } from "../../lib/domain.js";
import { trackRoute, routeHash } from "../../lib/track.js";
import { assignCues } from "../../lib/resolve.js";
import { getSourceLabel, TicketPerforationDivider, TicketBarcodeFooter } from "./TicketCommon.jsx";
import { ShowSlipPanels } from "./ShowSlipPanels.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export function ShowSlip({
  ud,
  showId,
  onSelectSong,
  onSelectShow,
  onSelectVenue,
}) {
  const { t, locale } = useI18n();
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
  const [showMoreTools, setShowMoreTools] = useState(false);
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

  const mainCount = main.filter((p) => p.cue !== null).length;
  const encCount = enc.filter((p) => p.cue !== null).length;
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
    lines.push(
      locale === "en"
        ? `📅 Date: ${showDate(s, locale)}`
        : locale === "ja"
        ? `📅 日程：${showDate(s, locale)}`
        : locale === "ko"
        ? `📅 일시: ${showDate(s, locale)}`
        : `📅 日期：${showDate(s, locale)}`
    );
    lines.push(
      locale === "en"
        ? `📍 Venue: ${s.venue} (${s.city})`
        : locale === "ja"
        ? `📍 会場：${s.venue}（${s.city}）`
        : locale === "ko"
        ? `📍 공연장: ${s.venue} (${s.city})`
        : `📍 場地：${s.venue}（${s.city}）`
    );
    const timeStr = formatShowTime(s, locale);
    if (timeStr) {
      lines.push(
        locale === "en"
          ? `⏰ Time: ${timeStr}`
          : locale === "ja"
          ? `⏰ 時間：${timeStr}`
          : locale === "ko"
          ? `⏰ 시간: ${timeStr}`
          : `⏰ 時間：${timeStr}`
      );
    }
    lines.push("");
    lines.push(
      locale === "en"
        ? "【MAIN SET】"
        : locale === "ja"
        ? "【本編】"
        : locale === "ko"
        ? "【본편】"
        : "【本篇】"
    );
    main.forEach((p) => {
      const it = p.item;
      const t = it.title ?? songTitle[it.songId] ?? it.note ?? "";
      const noteStr = it.note && it.songId ? ` (${it.note})` : "";
      lines.push(`${p.cue} ${t}${noteStr}`);
    });
    if (enc.length > 0) {
      lines.push("");
      lines.push(
        locale === "en"
          ? "【ENCORE】"
          : locale === "ja"
          ? "【アンコール】"
          : locale === "ko"
          ? "【앙코르】"
          : "【安可】"
      );
      enc.forEach((p) => {
        const it = p.item;
        const t = it.title ?? songTitle[it.songId] ?? it.note ?? "";
        const noteStr = it.note && it.songId ? ` (${it.note})` : "";
        lines.push(`${p.cue} ${t}${noteStr}`);
      });
    }
    lines.push("");
    lines.push(
      locale === "en"
        ? "#OfficialHigedanDism #Higedan #Setlist #LiveArchive"
        : locale === "ko"
        ? "#Official히게단dism #히게단 #셋리스트"
        : "#Official髭男dism #ヒゲダン #セットリスト"
    );

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines.join("\n")).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }).catch(() => {});
    }
  };

  const unrel = (i) => songUnreleased.has(i.songId);
  const primaryOf = (i) => primaryKind(getKindArray(i.kind), unrel(i));

  const cueColor = (i) => {
    if (!i.songId && (i.title?.includes("未詳") || i.title?.includes("不明"))) {
      return "text-muted/60 font-normal";
    }
    return cueColorFor(primaryOf(i));
  };

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
    if (first.type === "interlude" || (!first.songId && !first.title)) {
      return (
        <li
          key={prefix}
          className={`${SETLIST_ITEM} text-[13px] text-muted [&_.cue-no]:text-line`}
        >
          <span className="cue-no min-w-[42px] text-right font-mono text-[12px] text-line">
            —
          </span>
          <span>{first.note || first.title || ""}</span>
        </li>
      );
    }
    const multi = g.key && g.items.length > 1;
    const slipClass = cardClass(first);
    const tabs = cardTabs(first);
    const songLine = (it) => {
      const title = it.title ?? songTitle[it.songId];
      if (!it.songId) {
        const isUnknown = title?.includes("未詳") || title?.includes("不明");
        return (
          <span className={isUnknown ? "font-normal italic text-muted" : "font-medium text-ink"}>
            {title}
          </span>
        );
      }
      const link = trackRoute(it, songWeight(it), locale);
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
              {t(`badges.${k}`, KIND_TAB[k])}
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
      aria-label={t("showExtra.setlistAria", "場次曲目清單")}
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="relative rounded-t-[2px] bg-black/[0.025] dark:bg-white/[0.025] -mx-[26px] max-sm:-mx-4 -mt-[46px] max-sm:-mt-[42px] px-[26px] max-sm:px-4 pt-[46px] max-sm:pt-[42px] pb-3">

        {/* Monogram Stage Run Sheet Subtitle */}
        <div className="font-mono text-[10px] tracking-[0.22em] font-extrabold uppercase text-muted/70 pb-1.5 flex items-center justify-between">
          <span>{t("slips.stageSetlistRunSheet", "OFFICIAL HIGEDAN DISM // STAGE SETLIST RUN SHEET")}</span>
          {ud.unit.isTour && showList.length > 0 && (
            <span className="text-band font-bold">
              {locale === "en"
                ? `TOUR SHOW ${currentIdx + 1} / ${showList.length}`
                : locale === "ja"
                ? `第 ${currentIdx + 1} / ${showList.length} 公演`
                : locale === "ko"
                ? `제 ${currentIdx + 1} / ${showList.length} 회`
                : `第 ${currentIdx + 1} / ${showList.length} 場`}
            </span>
          )}
        </div>

        {/* Level 1: Artist branding & category badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-band/15 px-2 py-0.5 font-mono text-xs font-bold text-band-ink">
            {t(`categories.${ud.unit.type}`, ud.unit.type)}
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
              {showDate(s, locale)}
            </div>
            {formatShowTime(s, locale) && (
              <span className="text-[12px] font-medium text-muted">
                <span aria-hidden="true">⏰ </span>
                {formatShowTime(s, locale)}
              </span>
            )}
          </div>

          {/* Venue & Metadata Box */}
          {/* Desktop: sm 以上尺寸維持單行流暢配置（若極端窄則自動折至次行行頭） */}
          <div className="hidden sm:flex sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-2 sm:gap-y-1 mt-2">
            <h3 className="m-0 font-display text-[21px] lg:text-[23px] font-black text-ink min-w-0">
              {onSelectVenue && s.venue ? (
                <a
                  href={routeHash.venue(s.venue, locale)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectVenue(s.venue);
                  }}
                  className="group inline text-ink no-underline hover:text-pool transition-colors cursor-pointer"
                  title={t("showExtra.venueFileTitle", "查看此場地的全歷史演出檔案")}
                >
                  <span className="group-hover:underline">{s.venue}</span>
                  {s.city && (
                    <span className="ml-1.5 text-[15px] font-normal text-muted group-hover:text-pool whitespace-nowrap">
                      （{s.city}）
                    </span>
                  )}
                  <span
                    className="ml-2 inline-flex items-center gap-0.5 rounded border border-pool/30 bg-pool/5 px-1.5 py-0.5 font-mono text-[11px] font-bold text-pool align-middle whitespace-nowrap group-hover:bg-pool group-hover:text-white transition-colors"
                    aria-hidden="true"
                  >
                    <span>🏛️ {t("showExtra.venueFileLabel", "檔案")}</span>
                    <span>→</span>
                  </span>
                </a>
              ) : (
                <>
                  <span>{s.venue}</span>
                  {s.city && (
                    <span className="ml-1.5 text-[15px] font-normal text-muted whitespace-nowrap">
                      （{s.city}）
                    </span>
                  )}
                </>
              )}
            </h3>
            <div className="shrink-0 font-mono text-[12px] font-bold text-muted tabular-nums">
              {formatShowSongBreakdown(songCount, mainCount, encCount, locale) ||
                t("slips.noSongsRecorded", "尚無曲目紀錄")}
            </div>
          </div>

          {/* Mobile: 小尺寸專用分行配置（第一行完整場地名，第二行 (長野) 放行頭、檔案放行尾） */}
          <div className="sm:hidden mt-2.5 space-y-1.5">
            <h3 className="m-0 font-display text-[18px] font-black leading-snug text-ink text-pretty">
              {onSelectVenue && s.venue ? (
                <a
                  href={routeHash.venue(s.venue, locale)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectVenue(s.venue);
                  }}
                  className="text-ink hover:text-pool hover:underline transition-colors cursor-pointer"
                  title={t("showExtra.venueFileTitle", "查看此場地的全歷史演出檔案")}
                >
                  {s.venue}
                </a>
              ) : (
                s.venue
              )}
            </h3>

            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 font-mono text-[12px]">
              <div className="flex flex-wrap items-baseline gap-x-2 text-muted min-w-0">
                {s.city && (
                  <span className="font-bold text-ink whitespace-nowrap">
                    （{s.city}）
                  </span>
                )}
                <span className="tabular-nums">
                  {formatShowSongBreakdown(songCount, mainCount, encCount, locale) ||
                    t("slips.noSongsRecorded", "尚無曲目紀錄")}
                </span>
              </div>

              {onSelectVenue && s.venue && (
                <a
                  href={routeHash.venue(s.venue, locale)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectVenue(s.venue);
                  }}
                  className="inline-flex items-center gap-1 rounded border border-pool/30 bg-pool/5 px-2 py-0.5 font-mono text-[11px] font-bold text-pool whitespace-nowrap hover:bg-pool hover:text-white transition-colors cursor-pointer"
                  title={t("showExtra.venueFileTitle", "查看此場地的全歷史演出檔案")}
                >
                  <span>🏛️ {t("showExtra.venueFileLabel", "檔案")}</span>
                  <span aria-hidden="true">→</span>
                </a>
              )}
            </div>
          </div>

          {/* Tour Stepper */}
          {showList.length > 1 && (
            <div className="mt-2.5 flex items-center justify-between border-t border-line-soft/80 pt-2 text-[12px] font-mono">
              {prevShow ? (
                <button
                  type="button"
                  onClick={() => onSelectShow(prevShow.id)}
                  className="group inline-flex items-center gap-1 font-semibold text-ink hover:text-pool cursor-pointer transition-colors min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 rounded touch-stamp"
                  title={t("showExtra.prevTitle", `上一場：${showDate(prevShow, locale)} ${prevShow.city || prevShow.venue}`, { date: showDate(prevShow, locale), place: prevShow.city || prevShow.venue })}
                >
                  <span aria-hidden="true" className="text-base sm:text-xs">←</span>
                  <span>{t("actions.prev", "上一場")}</span>
                  <span className="hidden sm:inline text-muted group-hover:text-pool">
                    ({prevShow.date.slice(5)} {prevShow.city || prevShow.venue})
                  </span>
                </button>
              ) : (
                <span className="text-muted/40 cursor-not-allowed min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 flex items-center">← {t("slips.tourOpener", "首日")}</span>
              )}

              <span className="text-muted tabular-nums font-bold text-[12px] flex items-center gap-1.5">
                <span>
                  {locale === "en"
                    ? `Show ${currentIdx + 1} of ${showList.length}`
                    : locale === "ja"
                    ? `第 ${currentIdx + 1} / ${showList.length} 公演`
                    : locale === "ko"
                    ? `제 ${currentIdx + 1} / ${showList.length} 회`
                    : `第 ${currentIdx + 1} / ${showList.length} 場`}
                </span>
                {currentIdx === 0 && (
                  <span className="rounded bg-tape-tint px-1.5 py-0.5 text-xs text-ink font-bold border border-ink/30">
                    {t("slips.tourOpener", "首日")}
                  </span>
                )}
                {currentIdx === showList.length - 1 && (
                  <span className="rounded bg-band px-1.5 py-0.5 text-xs text-band-ink font-bold border border-ink/40">
                    {t("slips.tourFinale", "千秋樂")}
                  </span>
                )}
              </span>

              {nextShow ? (
                <button
                  type="button"
                  onClick={() => onSelectShow(nextShow.id)}
                  className="group inline-flex items-center gap-1 font-semibold text-ink hover:text-pool cursor-pointer transition-colors min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 rounded touch-stamp"
                  title={t("showExtra.nextTitle", `下一場：${showDate(nextShow, locale)} ${nextShow.city || nextShow.venue}`, { date: showDate(nextShow, locale), place: nextShow.city || nextShow.venue })}
                >
                  <span className="hidden sm:inline text-muted group-hover:text-pool">
                    ({nextShow.date.slice(5)} {nextShow.city || nextShow.venue})
                  </span>
                  <span>{t("actions.next", "下一場")}</span>
                  <span aria-hidden="true" className="text-base sm:text-xs">→</span>
                </button>
              ) : (
                <span className="text-muted/40 cursor-not-allowed min-h-[38px] px-2 py-1 sm:min-h-0 sm:p-0 flex items-center">{t("slips.tourFinale", "千秋樂")} →</span>
              )}
            </div>
          )}
        </div>

        {/* Level 4: Action Toolbar (Two-Tier Clean Split: Primary Actions & Sources + Analysis Reel) */}
        <div className="mt-2.5 flex flex-col gap-2 border-t border-line-soft/80 pt-2.5 slip-ignore-export">
          {/* Row 1: Primary Export Actions & Collapsible Tools Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMemorialModal(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded bg-band px-3 py-1.5 text-[11px] font-mono font-bold text-band-ink border border-ink/40 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer select-none"
                title={t("showExtra.previewMemorialTitle", "預覽並自訂儲存本場巡演歌單紀念小卡")}
              >
                <span aria-hidden="true">📸</span>
                <span>{t("slips.generateMemorialCard", "產生紀念小卡")}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySetlist}
                className={`inline-flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-mono font-bold transition-all cursor-pointer select-none border active:scale-[0.98] ${
                  copied
                    ? "bg-band text-band-ink border-band shadow-xs"
                    : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                }`}
                title={t("showExtra.copyPlainTitle", "複製標準歌單純文字")}
              >
                <span>{copied ? t("slips.copied", "✓ 已複製") : t("slips.copySetlist", "📋 複製歌單")}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowMoreTools((v) => !v)}
              className="inline-flex items-center justify-center gap-1 rounded bg-paper hover:bg-tape-tint/50 px-2.5 py-1.5 text-[11px] font-mono font-bold text-ink border border-line-soft hover:border-ink/60 transition-colors cursor-pointer select-none"
              aria-expanded={showMoreTools}
              title={t("showExtra.expandToolsTitle", "展開更多工具（雙場曲目比對、專輯分佈、圖例與資料來源）")}
            >
              <span>{showMoreTools ? t("slips.panels.collapseTools", "收合工具 ▴") : t("slips.panels.moreTools", "🛠️ 更多工具 ▾")}</span>
            </button>
          </div>

          {/* Row 2: Secondary Analysis & Comparison Reel (Collapsible) */}
          {showMoreTools && (
            <div className="mt-1 flex flex-col gap-2 border-t border-line-soft/60 pt-2">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
            <button
              type="button"
              onClick={() => setShowLegend((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1 rounded bg-paper px-2.5 py-1.5 sm:py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
              aria-expanded={showLegend}
            >
              <span>{showLegend ? "▾ " + t("slips.panels.badgeLegend", "記號圖例") : "▸ " + t("slips.panels.badgeLegend", "記號圖例")}</span>
            </button>

            {setlistDiff && !setlistDiff.identical && (
              <button
                type="button"
                onClick={() => setShowDiff((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1 rounded bg-paper px-2.5 py-1.5 sm:py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
                aria-expanded={showDiff}
              >
                <span>{showDiff ? "▾ " + t("slips.panels.trackDiff", "曲目更換") : "▸ " + t("slips.panels.trackDiff", "曲目更換")}</span>
                <span className="text-request font-bold">
                  ({setlistDiff.added.length}{t("slips.panels.songUnit", "首")})
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
                <span>{showAnalysis ? "▾ " + t("slips.panels.albumBreakdown", "專輯分佈") : "▸ " + t("slips.panels.albumBreakdown", "專輯分佈")}</span>
              </button>
            )}

            {showList.length > 1 && (
              <button
                type="button"
                onClick={() => setShowCompare((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1 rounded bg-paper px-2.5 py-1.5 sm:py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
                aria-expanded={showCompare}
              >
                <span>{showCompare ? "▾ " + t("slips.panels.showComparison", "雙場對比") : "▸ ⚖️ " + t("slips.panels.showComparison", "雙場對比")}</span>
              </button>
            )}
          </div>

          {/* Provenance Data Sources (Show-Level Verified Sources) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-line-soft/60 text-[11px] font-mono">
            <span className="text-muted font-bold flex items-center gap-1 shrink-0">
              <span aria-hidden="true">🔍</span> {t("slips.panels.verifiedSources", "資料考證來源：")}
            </span>
            {s.sourceUrls && s.sourceUrls.length > 0 ? (
              s.sourceUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-paper text-ink border border-line-soft hover:border-ink hover:bg-band hover:text-band-ink transition-colors font-bold cursor-pointer"
                  title={t("showExtra.sourceOpenTitle", `開啟一手來源：${url}`, { url })}
                >
                  <span>🔗 {getSourceLabel(url, t)}</span>
                  <span className="text-[10px] opacity-60" aria-hidden="true">↗</span>
                </a>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-paper text-muted border border-line-soft font-medium">
                {t("slips.panels.livefansVerified", "LiveFans 公開檔案庫查證")}
              </span>
            )}
          </div>

        <ShowSlipPanels
          showLegend={showLegend}
          showDiff={showDiff}
          setlistDiff={setlistDiff}
          prevShow={prevShow}
          showAnalysis={showAnalysis}
          albumBreakdown={albumBreakdown}
          mainCount={mainCount}
          encCount={encCount}
          showCompare={showCompare}
          showList={showList}
          showId={showId}
          activeCompareId={activeCompareId}
          setCompareShowId={setCompareShowId}
          customCompareDiff={customCompareDiff}
        />
          </div>
        )}
      </div>
    </div>

    <TicketPerforationDivider />

      {items.length === 0 ? (
        <div className="my-8 rounded-[3px] border border-dashed border-line bg-paper px-6 py-8 text-center">
          <p className="m-0 text-[16px] font-bold text-ink">🔍 {t("slips.setlistInfoUnknown", "歌單情報未明")}</p>
          <p className="m-0 mt-2 text-[13px] text-muted">
            {t("slips.noPublicSetlist", "本場演出目前尚無公開曲目紀錄")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted pb-1.5 mb-1 border-b border-line-soft">
              <span className="flex items-center gap-1.5 text-ink font-extrabold">
                <span className="text-band">◆</span> {t("slips.mainSetlist", "MAIN SETLIST // 本篇演奏曲目")}
              </span>
              <span className="tabular-nums text-xs font-mono">{mainCount} SONGS</span>
            </div>
            <ol className="m-0 list-none p-0 divide-y divide-line-soft/60">
              {groupRuns(main).map((g, idx) => renderRun(g, `m-${idx}`))}
            </ol>
          </div>
          {enc.length > 0 && (
            <div className="rounded-[3px] p-3.5 sm:p-4 border border-line-soft bg-paper/50 space-y-2 mt-4">
              <div className="flex items-center justify-between font-mono text-xs font-extrabold uppercase tracking-wider text-band pb-1.5 border-b border-line-soft/70">
                <span className="flex items-center gap-1.5">
                  <span>◆</span> {t("slips.encore", "ENCORE // 安可曲目")}
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
              <span className="truncate">← {t("actions.prev", "上一場")}：{showDate(prevShow, locale)} {prevShow.city || prevShow.venue}</span>
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
              <span className="truncate">{t("actions.next", "下一場")}：{showDate(nextShow, locale)} {nextShow.city || nextShow.venue} →</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Soundboard Engineer Run Sheet Footer */}
      <TicketBarcodeFooter
        serial={`SN: HG-${(s.date || "").replace(/-/g, "")}-${showId.slice(-4).toUpperCase()}`}
        label="OFFICIAL HIGEDAN DISM // STAGE SETLIST RUN SHEET"
      />

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
