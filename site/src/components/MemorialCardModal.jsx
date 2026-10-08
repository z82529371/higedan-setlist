import React, { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { songTitle, showDate } from "../lib/domain.js";

// Session-level memory for theme choice across shows
let sessionMemorialTheme = "vintage";

/**
 * MemorialCardModal
 * 專為 Official 髭男 dism 巡演設計的精良歌單紀念小卡預覽與下載視窗
 * - 支援「雙欄紀念海報 (推薦)」與「單欄長條票券」排版切換，保證收錄全曲 (M1 ~ M20+ 及 安可)
 * - 支援「復古手感紙質」、「經典純白卡」與「暗夜舞台黑金」三種風格切換
 * - 高速 2x 原寸 PNG 匯出，絕不裁切截斷
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
}) {
  const [theme, setTheme] = useState(sessionMemorialTheme); // 'vintage' | 'white' | 'noir'
  // 若曲目超過 10 首，預設使用雙欄海報版型，版面平衡且全曲一目了然
  const [layoutMode, setLayoutMode] = useState(main.length > 10 ? "poster" : "slip"); // 'poster' | 'slip'
  const [isExporting, setIsExporting] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const cardRef = useRef(null);

  const handleThemeChange = (newTheme) => {
    sessionMemorialTheme = newTheme;
    setTheme(newTheme);
  };

  if (!isOpen || !show) return null;

  const dateFormatted = showDate(show);
  const isTour = Boolean(unit?.isTour);
  const showOrderText = isTour && totalShows > 0
    ? `第 ${showIndex + 1} / ${totalShows} 場`
    : (unit?.type || "專場演出");

  const totalSongsCount = main.length + enc.length;

  const isVintage = theme === "vintage";
  const isWhite = theme === "white";
  const isNoir = theme === "noir";
  const isPoster = layoutMode === "poster";

  const cardBgColor = isVintage ? "#fcfaf2" : isWhite ? "#ffffff" : "#111319";

  // 雙欄排版拆分
  const halfMain = Math.ceil(main.length / 2);
  const col1Main = layoutMode === "poster" ? main.slice(0, halfMain) : main;
  const col2Main = layoutMode === "poster" ? main.slice(halfMain) : [];

  const handleDownload = async () => {
    const node = cardRef.current;
    if (!node || isExporting) return;
    setIsExporting(true);

    try {
      // 確保獲取無截斷的完整高度與寬度
      const actualWidth = Math.ceil(node.scrollWidth || node.offsetWidth || 560);
      const actualHeight = Math.ceil(node.scrollHeight || node.offsetHeight);

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        skipFonts: true,
        backgroundColor: cardBgColor,
        width: actualWidth,
        height: actualHeight,
        canvasWidth: actualWidth * 2,
        canvasHeight: actualHeight * 2,
        style: {
          transform: "none",
          margin: "0",
          maxHeight: "none",
          height: `${actualHeight}px`,
          overflow: "visible",
        },
      });

      const link = document.createElement("a");
      const datePart = (show.date || "").replace(/\./g, "-");
      const venuePart = (show.city || show.venue || "slip").replace(
        /[^\w\u4e00-\u9fa5\u3040-\u30ff]/g,
        "_"
      );
      link.download = `higedan-memorial-setlist-${datePart}-${venuePart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("下載紀念卡失敗:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = () => {
    const lines = [
      `Official 髭男 dism - ${unit?.title || ""}`,
      `📅 日期：${dateFormatted}`,
      `📍 場地：${show.venue}（${show.city}）`,
      `🎵 全曲收錄：共 ${totalSongsCount} 首（本篇 ${main.length} 首 · 安可 ${enc.length} 首）`,
      "",
      "【本篇 MAIN SET】",
      ...main.map((p) => {
        const it = p.item;
        const t = it.title ?? songTitle[it.songId] ?? it.note ?? "";
        const noteStr = it.note && it.songId ? ` (${it.note})` : "";
        return `${p.cue} ${t}${noteStr}`;
      }),
    ];

    if (enc.length > 0) {
      lines.push("", "【安可 ENCORE】");
      lines.push(
        ...enc.map((p) => {
          const it = p.item;
          const t = it.title ?? songTitle[it.songId] ?? it.note ?? "";
          const noteStr = it.note && it.songId ? ` (${it.note})` : "";
          return `${p.cue} ${t}${noteStr}`;
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

    return (
      <div
        key={idx}
        className="flex items-center justify-between gap-1.5 py-1 border-b border-current/10 last:border-b-0"
      >
        <div className="flex items-center gap-1.5 min-w-0">
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
          <span className="font-bold text-xs sm:text-[13px] truncate">
            {title}
          </span>
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
      aria-label="巡演歌單紀念小卡預覽"
    >
      <div
        className="relative w-full max-w-[680px] max-h-[94vh] flex flex-col rounded-2xl bg-[#1e212b] border border-[#374151] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3446] bg-[#171922] text-[#f3f4f6]">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">📸</span>
            <span className="font-bold text-sm tracking-wide">
              巡演歌單紀念小卡預覽
            </span>
            <span className="rounded bg-[#d49a00]/20 px-2 py-0.5 text-xs font-mono font-bold text-[#facc15] border border-[#d49a00]/40">
              全 {totalSongsCount} 首收錄
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#2d3446] transition-colors cursor-pointer text-lg leading-none"
            aria-label="關閉預覽"
          >
            ✕
          </button>
        </div>

        {/* Toolbar: Theme + Layout Switches */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#12131a] border-b border-[#2d3446] text-xs">
          {/* Theme Selector: 3 styles */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#9ca3af] font-mono">風格：</span>
            <button
              type="button"
              onClick={() => handleThemeChange("vintage")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                isVintage
                  ? "bg-[#e5d8b8] text-[#292524] shadow-xs"
                  : "bg-[#202432] text-[#9ca3af] hover:text-white"
              }`}
            >
              📄 復古手感紙
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
              ✉️ 經典純白卡
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
              🖤 暗夜舞台金
            </button>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[#9ca3af] font-mono">排版：</span>
            <button
              type="button"
              onClick={() => setLayoutMode("poster")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                isPoster
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "bg-[#202432] text-[#9ca3af] hover:text-white"
              }`}
              title="雙欄平衡排版：全曲同時展開，比例最協調"
            >
              📑 雙欄海報
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("slip")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                !isPoster
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "bg-[#202432] text-[#9ca3af] hover:text-white"
              }`}
              title="單欄長條票券：經典直式單據清單"
            >
              📜 單欄票券
            </button>
          </div>
        </div>

        {/* Card Preview Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 pb-8 sm:pb-12 flex justify-center items-start bg-[#0d0e14]/75">
          {/* ==================== COMMEMORATIVE CARD ==================== */}
          <div
            ref={cardRef}
            className={`rounded-xl transition-all duration-300 relative h-auto shrink-0 ${
              isPoster ? "w-[560px] max-w-full" : "w-[440px] max-w-full"
            } ${
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
              className={`h-2.5 w-full rounded-t-xl ${
                isVintage
                  ? "bg-[#d49a00]/70 border-b border-[#b38000]/30"
                  : isWhite
                  ? "bg-[#d19f00] border-b border-[#b38000]/30"
                  : "bg-gradient-to-r from-[#d49a00] via-[#f59e0b] to-[#d49a00]"
              }`}
            />

            <div className="p-4 sm:p-6 space-y-4">
              {/* Card Monogram Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-dashed border-current/20">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] tracking-[0.22em] font-extrabold uppercase opacity-65">
                    OFFICIAL HIGEDAN DISM
                  </span>
                  <span className="font-mono text-[9px] tracking-widest uppercase opacity-50">
                    LIVE PERFORMANCE MEMORIAL ARCHIVE
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
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
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isVintage
                        ? "bg-[#e7dec6] text-[#44403c]"
                        : isWhite
                        ? "bg-[#f3f4f6] text-[#4b5563]"
                        : "bg-[#252a36] text-[#9ca3af]"
                    }`}
                  >
                    全 {totalSongsCount} 首
                  </span>
                </div>
              </div>

              {/* Tour & Show Titles */}
              <div className="space-y-1">
                <h2
                  className={`text-lg sm:text-xl font-black tracking-tight leading-snug ${
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
                  <span className="opacity-40">/</span>
                  <span>{show.city}</span>
                  {show.opensAt && (
                    <>
                      <span className="opacity-40">/</span>
                      <span className="font-mono">開演 {show.opensAt}</span>
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

              {/* ================= SETLIST CONTENT ================= */}
              {isPoster ? (
                /* ========== 雙欄海報模式 (POSTER LAYOUT) ========== */
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] font-extrabold tracking-wider uppercase opacity-75">
                    <span>◆ MAIN SETLIST // 本篇演奏曲目</span>
                    <span className="text-[10px] tabular-nums">{main.length} SONGS</span>
                  </div>

                  {/* Two-Column Grid for Main Set */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
                    <div className="flex flex-col">
                      {col1Main.map((p, idx) => renderTrackRow(p, idx))}
                    </div>
                    <div className="flex flex-col">
                      {col2Main.map((p, idx) => renderTrackRow(p, halfMain + idx))}
                    </div>
                  </div>

                  {/* Encore Section */}
                  {enc.length > 0 && (
                    <div
                      className={`rounded-lg p-2.5 sm:p-3 space-y-1 border mt-2 ${
                        isVintage
                          ? "bg-[#f4eedf] border-[#ded4bf]"
                          : isWhite
                          ? "bg-[#f9fafb] border-[#e5e7eb]"
                          : "bg-[#181a23] border-[#2a2f3f]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] font-extrabold tracking-wider uppercase opacity-80">
                        <span className="text-[#d19f00]">◆ ENCORE // 安可曲目</span>
                        <span className="text-[10px] tabular-nums">{enc.length} SONGS</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
                        {enc.map((p, idx) => renderTrackRow(p, idx, true))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ========== 單欄票券模式 (SLIP LAYOUT) ========== */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px] font-extrabold tracking-wider uppercase opacity-75">
                      <span>◆ MAIN SETLIST // 本篇演奏曲目</span>
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
                        <span className="text-[#d19f00]">◆ ENCORE // 安可曲目</span>
                        <span className="text-[10px] tabular-nums">{enc.length} SONGS</span>
                      </div>
                      <div className="flex flex-col">
                        {enc.map((p, idx) => renderTrackRow(p, idx, true))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  <span className="text-[10px] leading-tight font-black">現場</span>
                  <span className="text-[7px] tracking-widest leading-none">ARCHIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="p-3 sm:p-4 bg-[#171922] border-t border-[#2d3446] flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs text-[#9ca3af] flex items-center gap-1.5 font-mono">
            <span>✨ 全 {totalSongsCount} 首完整收錄</span>
            <span className="opacity-40">·</span>
            <span>2x 高解析無損 PNG 匯出</span>
          </div>

          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-[#242936] text-[#e2e8f0] text-xs font-mono font-bold hover:bg-[#32394a] transition-all cursor-pointer"
            >
              {copiedText ? "✓ 已複製歌單" : "📋 複製歌單文字"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-[#d49a00] text-[#111319] text-xs font-bold hover:bg-[#eab308] shadow-md transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              <span>{isExporting ? "⏳ 圖片生成中..." : "💾 下載原寸圖片 (PNG)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
