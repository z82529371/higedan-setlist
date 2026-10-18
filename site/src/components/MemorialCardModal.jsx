import React, { useState, useRef, useEffect } from "react";
import { exportElementToPng } from "../lib/image-export.js";
import { songTitle, showDate, formatShowTime, songUnreleased } from "../lib/domain.js";
import { getKindArray, kindTabs } from "../lib/kind.js";
import { useI18n, DICTIONARIES, DEFAULT_LOCALE, resolveTranslation } from "../lib/i18n.jsx";

// Session-level memory for theme choice across shows
let sessionMemorialTheme = "vintage";


/**
 * Generates offscreen cache key with locale discriminator to prevent cross-language cache collisions
 */
export function getMemorialImageKey(showKey, theme, locale = "zh-TW") {
  return `${showKey}-${theme}-${locale}`;
}

export function formatShowOrderText(unit, showIndex, totalShows, locale = "zh-TW") {
  const isTour = Boolean(unit?.isTour);
  if (isTour && totalShows > 0) {
    const idx = showIndex + 1;
    if (locale === "en") return `Show ${idx} of ${totalShows}`;
    if (locale === "ja") return `第 ${idx} / ${totalShows} 公演`;
    if (locale === "ko") return `제 ${idx} / ${totalShows} 회`;
    return `第 ${idx} / ${totalShows} 場`;
  }
  const dict = DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
  const typeKey = unit?.type;
  if (typeKey && dict?.categories?.[typeKey]) {
    return dict.categories[typeKey];
  }
  return unit?.type || (dict?.categories?.["特別專場"] || "專場演出");
}

export function formatTicketSongCount(totalSongsCount, locale = "zh-TW") {
  if (locale === "en") return `${totalSongsCount} Songs`;
  if (locale === "ja") return `全 ${totalSongsCount} 曲`;
  if (locale === "ko") return `전 ${totalSongsCount} 곡`;
  return `全 ${totalSongsCount} 首`;
}

export function getMemorialSectionHeaders(locale = "zh-TW") {
  if (locale === "en") {
    return {
      main: "◆ MAIN SETLIST // MAIN SET",
      encore: "◆ ENCORE // ENCORE",
    };
  }
  if (locale === "ja") {
    return {
      main: "◆ MAIN SETLIST // 本編演奏曲目",
      encore: "◆ ENCORE // アンコール曲目",
    };
  }
  if (locale === "ko") {
    return {
      main: "◆ MAIN SETLIST // 본편 연주곡",
      encore: "◆ ENCORE // 앙코르곡",
    };
  }
  return {
    main: "◆ MAIN SETLIST // 本篇演奏曲目",
    encore: "◆ ENCORE // 安可曲目",
  };
}

export function getMemorialStampText(locale = "zh-TW") {
  if (locale === "en") return "LIVE";
  if (locale === "ko") return "라이브";
  return "現場";
}

/**
 * MemorialCardModal
 * 專為 Official 髭男 dism 巡演設計的精良歌單單欄紀念票券預覽視窗
 * - 經典「單欄長條票券」排版，保證收錄全曲 (M1 ~ M20+ 及 安可)
 * - 支援「復古手感紙質」、「經典純白卡」與「暗夜舞台黑金」三種風格切換
 * - 開窗即時 DOM 預覽零延遲，背景自動非同步產出 2x 高清真圖片覆蓋置頂
 * - 支援多國語言 (zh-TW, ja, en, ko) 本地化票券排版與專屬朱印風格印章
 * - 支援手機長按直接存入相簿（Photos）與電腦右鍵另存圖片，無生硬下載按鈕
 */
export function MemorialCardModal({
  isOpen,
  onClose,
  show,
  unit,
  main = [],
  enc = [],
  showIndex = 0,
  totalShows = 1,
  locale: propLocale,
}) {
  const { locale: ctxLocale } = useI18n();
  const locale = propLocale || ctxLocale || DEFAULT_LOCALE;

  const activeDict = DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
  const t = (key, fallback) => resolveTranslation(activeDict, key, fallback);

  const [theme, setTheme] = useState(sessionMemorialTheme); // 'vintage' | 'white' | 'noir'
  const [imageUrls, setImageUrls] = useState({}); // { [`${showId}-${theme}-${locale}`]: dataUrl }
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const cardRef = useRef(null);

  const handleThemeChange = (newTheme) => {
    sessionMemorialTheme = newTheme;
    setTheme(newTheme);
  };

  const isVintage = theme === "vintage";
  const isWhite = theme === "white";
  const isNoir = theme === "noir";

  const cardBgColor = isVintage ? "#fcfaf2" : isWhite ? "#ffffff" : "#111319";

  const showKey = show?.id || "show";
  const currentImageKey = getMemorialImageKey(showKey, theme, locale);
  const currentImageUrl = imageUrls[currentImageKey];

  useEffect(() => {
    if (!isOpen || !show || currentImageUrl) return;

    let isMounted = true;
    setIsGenerating(true);

    const generateImage = async () => {
      // 離屏排版計算前等待瀏覽器完成 DOM 渲染幀
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const node = cardRef.current;
      if (!node) {
        if (isMounted) setIsGenerating(false);
        return;
      }

      try {
        const dataUrl = await exportElementToPng(node, {
          width: 440,
          pixelRatio: 2,
          borderRadius: "16px",
          cardBackground: cardBgColor,
        });

        if (isMounted && dataUrl) {
          setImageUrls((prev) => ({
            ...prev,
            [currentImageKey]: dataUrl,
          }));
        }
      } catch (err) {
        console.error("生成紀念小卡圖片失敗:", err);
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    };

    generateImage();

    return () => {
      isMounted = false;
    };
  }, [isOpen, show, showKey, theme, locale, currentImageKey, cardBgColor, currentImageUrl]);

  if (!isOpen || !show) return null;

  const dateFormatted = showDate(show, locale);
  const showOrderText = formatShowOrderText(unit, showIndex, totalShows, locale);
  const totalSongsCount = main.length + enc.length;
  const songCountBadgeText = formatTicketSongCount(totalSongsCount, locale);
  const sectionHeaders = getMemorialSectionHeaders(locale);
  const stampText = getMemorialStampText(locale);
  const timeFormatted = formatShowTime(show, locale);

  const handleCopyText = () => {
    const locCity = show.city ? t("cities." + show.city, show.city) : "";
    const venueText = locCity ? `${show.venue} (${locCity})` : show.venue;
    const venueTextParen = locCity ? `${show.venue}（${locCity}）` : show.venue;
    const lines = [
      `Official 髭男 dism - ${unit?.title || ""}`,
      locale === "en"
        ? `📅 Date: ${dateFormatted}`
        : locale === "ja"
        ? `📅 日程：${dateFormatted}`
        : locale === "ko"
        ? `📅 일시: ${dateFormatted}`
        : `📅 日期：${dateFormatted}`,
      locale === "en"
        ? `📍 Venue: ${venueText}`
        : locale === "ja"
        ? `📍 会場：${venueTextParen}`
        : locale === "ko"
        ? `📍 공연장: ${venueText}`
        : `📍 場地：${venueTextParen}`,
    ];
    if (timeFormatted) {
      lines.push(
        locale === "en"
          ? `⏰ Time: ${timeFormatted}`
          : locale === "ja"
          ? `⏰ 時間：${timeFormatted}`
          : locale === "ko"
          ? `⏰ 시간: ${timeFormatted}`
          : `⏰ 時間：${timeFormatted}`
      );
    }
    lines.push(
      locale === "en"
        ? `🎵 Total ${totalSongsCount} Songs (Main ${main.length} · Encore ${enc.length})`
        : locale === "ja"
        ? `🎵 全曲収録：全 ${totalSongsCount} 曲（本編 ${main.length} 曲 · アンコール ${enc.length} 曲）`
        : locale === "ko"
        ? `🎵 전곡 수록: 총 ${totalSongsCount}곡 (본편 ${main.length}곡 · 앙코르 ${enc.length}곡)`
        : `🎵 全曲收錄：共 ${totalSongsCount} 首（本篇 ${main.length} 首 · 安可 ${enc.length} 首）`,
      "",
      locale === "en"
        ? "【MAIN SET】"
        : locale === "ja"
        ? "【本編 MAIN SET】"
        : locale === "ko"
        ? "【본편 MAIN SET】"
        : "【本篇 MAIN SET】",
      ...main.map((p) => {
        const it = p.item;
        const tTitle = it.title ?? songTitle[it.songId] ?? it.note ?? "";
        const noteStr = it.note && it.songId ? ` (${it.note})` : "";
        return `${p.cue} ${tTitle}${noteStr}`;
      })
    );

    if (enc.length > 0) {
      lines.push(
        "",
        locale === "en"
          ? "【ENCORE】"
          : locale === "ja"
          ? "【アンコール ENCORE】"
          : locale === "ko"
          ? "【앙코르 ENCORE】"
          : "【安可 ENCORE】",
        ...enc.map((p) => {
          const it = p.item;
          const tTitle = it.title ?? songTitle[it.songId] ?? it.note ?? "";
          const noteStr = it.note && it.songId ? ` (${it.note})` : "";
          return `${p.cue} ${tTitle}${noteStr}`;
        })
      );
    }
    lines.push("", "#Official髭男dism #ヒゲダン #LiveArchive");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines.join("\n")).then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      });
    }
  };

  const renderTrackRow = (p, idx, isEncore = false) => {
    const it = p.item;
    const title = it.title ?? songTitle[it.songId] ?? it.note ?? "Untitled";
    const isUnrel = Boolean(it.songId && songUnreleased.has(it.songId));
    const tabs = kindTabs(getKindArray(it.kind), isUnrel);

    return (
      <div
        key={idx}
        className="flex items-center justify-between gap-1.5 py-1 border-b border-current/10 last:border-b-0"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className={`font-mono text-xs font-bold w-6 shrink-0 tabular-nums ${
              isEncore
                ? "text-[#d19f00] font-extrabold w-7"
                : isVintage
                ? "text-[#78350f]"
                : isWhite
                ? "text-[#111827]"
                : "text-[#d49a00]"
            }`}
          >
            {p.cue}
          </span>
          <span className="font-bold text-[13px] truncate">
            {title}
          </span>
          {tabs.map((k) => (
            <span
              key={k}
              className={`font-mono text-[9px] px-1 py-0.2 rounded-[2px] font-bold shrink-0 leading-tight ${
                isNoir
                  ? "bg-tape-tint/50 text-white border border-line-soft"
                  : "bg-tape-tint/50 text-ink border border-line-soft"
              }`}
            >
              {t(`badges.${k}`, k)}
            </span>
          ))}
        </div>

        {it.note && (
          <span className="opacity-60 text-[10px] truncate max-w-[120px] font-mono shrink-0">
            {it.note}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("memorial.modalTitle", "巡演歌單紀念票券預覽")}
    >
      <div
        className="relative w-full max-w-[500px] max-h-[94vh] flex flex-col rounded-2xl bg-[#1e212b] border border-[#374151] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3446] bg-[#171922] text-[#f3f4f6]">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">📸</span>
            <span className="font-bold text-sm tracking-wide">
              {t("memorial.modalTitle", "巡演歌單紀念票券預覽")}
            </span>
            <span className="rounded bg-[#d49a00]/20 px-2 py-0.5 text-xs font-mono font-bold text-[#facc15] border border-[#d49a00]/40">
              {(t("memorial.songsRecorded") || "全 {count} 首收錄").replace("{count}", String(totalSongsCount))}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#2d3446] transition-colors cursor-pointer text-lg leading-none"
            aria-label={t("memorial.closePreview", "關閉預覽")}
          >
            ✕
          </button>
        </div>

        {/* Toolbar: Theme Switcher */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#12131a] border-b border-[#2d3446] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#9ca3af] font-mono">{t("memorial.styleLabel", "風格：")}</span>
            <button
              type="button"
              onClick={() => handleThemeChange("vintage")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                isVintage
                  ? "bg-[#e5d8b8] text-[#292524] shadow-xs"
                  : "bg-[#202432] text-[#9ca3af] hover:text-white"
              }`}
            >
              {t("memorial.themeVintage", "📄 復古手感紙")}
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("white")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                isWhite
                  ? "bg-white text-[#111827] shadow-xs"
                  : "bg-[#202432] text-[#9ca3af] hover:text-white"
              }`}
            >
              {t("memorial.themeWhite", "✉️ 經典純白卡")}
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("noir")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                isNoir
                  ? "bg-[#d49a00] text-[#111319] shadow-xs"
                  : "bg-[#202432] text-[#9ca3af] hover:text-white"
              }`}
            >
              {t("memorial.themeNoir", "🖤 暗夜舞台金")}
            </button>
          </div>
          <span className="font-mono text-[11px] text-[#9ca3af] opacity-80 hidden sm:inline">
            {t("memorial.ticketFormat", "📜 單欄長條票券")}
          </span>
        </div>

        {/* Card Preview Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 pb-8 sm:pb-12 flex justify-center items-start bg-[#0d0e14]/75">
          {/* Card Host Container with Seamless Double-Layer */}
          <div className="relative shrink-0 w-[440px] max-w-full">
            {/* ==================== COMMEMORATIVE CARD (SINGLE COLUMN TICKET) ==================== */}
            <div
              ref={cardRef}
              className={`rounded-2xl overflow-hidden transition-all duration-300 relative h-auto shrink-0 w-full ${
                isVintage
                  ? "bg-[#fcfaf2] text-[#1c1917] border-[2px] border-[#d6cebf] shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
                  : isWhite
                  ? "bg-white text-[#111827] border-[2px] border-[#d1d5db] shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
                  : "bg-[#111319] text-[#f4f4f5] border-[2px] border-[#2e3444] shadow-[0_16px_40px_rgba(0,0,0,0.7)]"
              }`}
              style={{
                backgroundColor: cardBgColor,
                minHeight: "fit-content",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", sans-serif',
              }}
            >
              {/* Top Golden / Tape Bar */}
              <div
                className={`h-2.5 w-full ${
                  isVintage
                    ? "bg-[#d49a00]/70 border-b border-[#b38000]/30"
                    : isWhite
                    ? "bg-[#d19f00] border-b border-[#b38000]/30"
                    : "bg-gradient-to-r from-[#d49a00] via-[#f59e0b] to-[#d49a00]"
                }`}
              />

              <div className="p-5 space-y-4">
                {/* Card Monogram Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-dashed border-current/20 gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-[10px] tracking-[0.2em] font-extrabold uppercase opacity-65 truncate">
                      OFFICIAL HIGEDAN DISM
                    </span>
                    <span className="font-mono text-[9px] tracking-wide uppercase opacity-50 truncate">
                      LIVE ARCHIVE
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border whitespace-nowrap shrink-0 ${
                        isVintage
                          ? "bg-[#f5ebd2] text-[#78350f] border-[#d6cebf]"
                          : isWhite
                          ? "bg-[#f3f4f6] text-[#1f2937] border-[#e5e7eb]"
                          : "bg-[#1c202d] text-[#fbbf24] border-[#374151]"
                      }`}
                    >
                      {showOrderText}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap shrink-0 ${
                        isVintage
                          ? "bg-[#e7dec6] text-[#44403c]"
                          : isWhite
                          ? "bg-[#f3f4f6] text-[#4b5563]"
                          : "bg-[#252a36] text-[#9ca3af]"
                      }`}
                    >
                      {songCountBadgeText}
                    </span>
                  </div>
                </div>

                {/* Tour & Show Titles */}
                <div className="space-y-1">
                  <h2
                    className={`text-xl font-black tracking-tight leading-snug ${
                      isVintage
                        ? "text-[#1c1917]"
                        : isWhite
                        ? "text-[#111827]"
                        : "text-[#ffffff]"
                    }`}
                  >
                    {unit?.title || "Live Performance"}
                  </h2>
                  <div
                    className={`text-xs font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5 ${
                      isVintage
                        ? "text-[#57534e]"
                        : isWhite
                        ? "text-[#4b5563]"
                        : "text-[#9ca3af]"
                    }`}
                  >
                    <span className="font-bold">📍 {show.venue}</span>
                    {show.city && (
                      <>
                        <span className="opacity-40">/</span>
                        <span>{t("cities." + show.city, show.city)}</span>
                      </>
                    )}
                    {timeFormatted && (
                      <>
                        <span className="opacity-40">/</span>
                        <span className="font-mono">⏰ {timeFormatted}</span>
                      </>
                    )}
                  </div>
                  <div className="font-mono text-xs font-bold text-[#d19f00] pt-0.5">
                    📅 {dateFormatted}
                  </div>
                </div>

                {/* Perforation Tear Line with Notches */}
                <div className="relative py-0.5">
                  <div className="border-b-2 border-dashed border-current/20" />
                </div>

                {/* ================= SETLIST CONTENT (SINGLE COLUMN SLIP) ================= */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px] font-extrabold tracking-wider uppercase opacity-75">
                      <span>{sectionHeaders.main}</span>
                      <span className="text-[10px] tabular-nums">{main.length} SONGS</span>
                    </div>
                    <div className="flex flex-col">
                      {main.map((p, idx) => renderTrackRow(p, idx))}
                    </div>
                  </div>

                  {/* Encore Section */}
                  {enc.length > 0 && (
                    <div
                      className={`rounded-lg p-3 space-y-1 border ${
                        isVintage
                          ? "bg-[#f4eedf] border-[#ded4bf]"
                          : isWhite
                          ? "bg-[#f9fafb] border-[#e5e7eb]"
                          : "bg-[#181a23] border-[#2a2f3f]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] font-extrabold tracking-wider uppercase opacity-80">
                        <span className="text-[#d19f00]">{sectionHeaders.encore}</span>
                        <span className="text-[10px] tabular-nums">{enc.length} SONGS</span>
                      </div>
                      <div className="flex flex-col">
                        {enc.map((p, idx) => renderTrackRow(p, idx, true))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Commemorative Footer Stamp & Barcode */}
                <div className="pt-3 border-t border-current/20 flex items-end justify-between gap-3">
                  <div className="space-y-1">
                    {/* Decorative Barcode */}
                    <div className="font-mono text-[11px] tracking-[0.2em] font-extrabold opacity-70 select-none">
                      ||| | |||| | ||| |||| | ||||| | |
                    </div>
                    <div className="font-mono text-[9px] opacity-60">
                      ARCHIVE ID: HGDN-{show.id}
                    </div>
                    <div className="text-[9px] opacity-50">
                      藤原聡 · 小笹大輔 · 楢﨑誠 · 松浦匡希
                    </div>
                  </div>

                  {/* Vermilion Stamp (朱印風格) */}
                  <div
                    className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center p-1 text-center font-bold shrink-0 select-none ${
                      isVintage
                        ? "border-[#b91c1c] text-[#b91c1c] rotate-[-8deg]"
                        : isWhite
                        ? "border-[#dc2626] text-[#dc2626] rotate-[-8deg]"
                        : "border-[#d49a00] text-[#d49a00] rotate-[-8deg]"
                    }`}
                  >
                    <span className="text-[8px] tracking-tighter leading-tight">HIGEDAN</span>
                    <span className="text-[10px] leading-tight font-black">{stampText}</span>
                    <span className="text-[7px] tracking-widest leading-none">ARCHIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seamless Real <img> overlay for native right-click / long-press saving */}
            {currentImageUrl && (
              <img
                src={currentImageUrl}
                alt={
                  locale === "en"
                    ? `Official HIGEDAN DISM Commemorative Ticket - ${unit?.title || ""} ${dateFormatted}`
                    : locale === "ja"
                    ? `Official髭男dism 記念チケット - ${unit?.title || ""} ${dateFormatted}`
                    : locale === "ko"
                    ? `Official HIGEDAN DISM 기념 티켓 - ${unit?.title || ""} ${dateFormatted}`
                    : `Official 髭男 dism 巡演歌單紀念票券 - ${unit?.title || ""} ${dateFormatted}`
                }
                className="absolute inset-0 w-full h-full rounded-2xl block object-top cursor-default z-10"
                style={{
                  WebkitTouchCallout: "default",
                  userSelect: "auto",
                  pointerEvents: "auto",
                }}
              />
            )}
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="p-3 sm:p-4 bg-[#171922] border-t border-[#2d3446] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-[#d49a00] bg-[#d49a00]/10 border border-[#d49a00]/30 px-3 py-1.5 rounded-lg font-mono">
            <span aria-hidden="true">{isGenerating ? "⏳" : "💡"}</span>
            <span className="font-bold">
              {isGenerating
                ? t("memorial.generating", "高清紀念卡生成中...")
                : t("memorial.saveHint", "手機長按小卡存入相簿 · 電腦點右鍵另存圖片")}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-lg bg-[#242936] text-[#e2e8f0] text-xs font-mono font-bold hover:bg-[#32394a] transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.98]"
            >
              <span>{copiedText ? t("memorial.copied", "✓ 已複製歌單") : t("memorial.copySetlist", "📋 複製歌單文字")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
