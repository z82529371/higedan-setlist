import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../lib/i18n.jsx";
import {
  getSongMedia,
  buildYouTubeEmbedUrl,
  buildYouTubeWatchUrl,
} from "../../lib/song-media.js";
import { songTitle } from "../../lib/domain.js";

/**
 * SongMediaModal (Cinema Mode)
 * 官方歌曲影音與現場雙軌聯動沈浸播放彈窗 (ADR-0135)
 * - 徹底杜絕 GPU 破圖：移除 backdrop-filter 避免硬體加速影片產生黑框與黑線
 * - createPortal 根掛載：穿透至 document.body，完全脫離票根 DOM 容器之相對堆疊環境
 * - 自動 50% 音量：透過 postMessage 在開播時自動調節播放器音量至 50%
 * - 延遲載入 (Lazy Mount) 與即時卸載 (Instant Unmount) 確保零背景雜音
 */
export function SongMediaModal({
  isOpen,
  onClose,
  songId,
  onSelectShow,
  initialTrack,
  mediaOverride,
}) {
  const { t } = useI18n();
  const iframeRef = useRef(null);
  const media = mediaOverride || getSongMedia(songId);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTrack, setActiveTrack] = useState(() => {
    return initialTrack || media.defaultTrack || "live";
  });

  // Reset active track whenever modal opens or songId changes
  useEffect(() => {
    if (isOpen) {
      setActiveTrack(initialTrack || media.defaultTrack || "live");
    }
  }, [isOpen, songId, initialTrack, media.defaultTrack]);

  // Body scroll lock while modal is open
  useEffect(() => {
    if (!isOpen || typeof document === "undefined" || !document.body) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Safe volume dispatch (Sets volume to 50% via YouTube IFrame HTML5 PostMessage)
  const dispatchVolume = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "setVolume",
            args: [50],
          }),
          "*"
        );
      } catch {}
    }
  };

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "listening" }),
          "*"
        );
      } catch {}
    }
    dispatchVolume();
  };

  // Listen for YouTube player state notifications to enforce 50% volume
  useEffect(() => {
    if (!isOpen) return;
    const handleMessage = (e) => {
      if (typeof e.data !== "string") return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === "onReady" || data.info?.playerState !== undefined) {
          dispatchVolume();
        }
      } catch {}
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen]);

  const currentVideo =
    activeTrack === "live" && media.hasLive
      ? media.live
      : media.hasMv
        ? media.mv
        : media.live;

  const embedUrl = currentVideo
    ? buildYouTubeEmbedUrl(currentVideo.youtubeId, currentVideo.start)
    : "";
  const watchUrl = currentVideo
    ? buildYouTubeWatchUrl(currentVideo.youtubeId, currentVideo.start)
    : "";

  // Auto-regulate volume to 50% when player begins
  useEffect(() => {
    if (!isOpen || !embedUrl) return;
    const t1 = setTimeout(dispatchVolume, 400);
    const t2 = setTimeout(dispatchVolume, 1000);
    const t3 = setTimeout(dispatchVolume, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, embedUrl, activeTrack]);

  if (!isOpen || !media.hasMedia) return null;

  const title = songTitle[songId] || songId;
  const isLive = activeTrack === "live" && media.hasLive;

  const handleShowClick = () => {
    if (media.live?.showId && onSelectShow) {
      onClose();
      onSelectShow(media.live.showId);
    }
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black select-none"
      style={{
        isolation: "isolate",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("songExtra.mediaModalAria", "官方影音播放器")}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[820px] flex flex-col rounded-lg bg-card shadow-xs overflow-hidden text-ink"
        style={{
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cinema Header Bar (Clean, Borderless & Seamless) */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-paper px-3.5 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape shrink-0" aria-hidden="true" />
            <h3 className="font-display text-[15px] sm:text-[17px] font-black text-ink truncate leading-tight">
              {title}
            </h3>
            <span className="hidden sm:inline-block rounded bg-black/[0.04] dark:bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted border border-line-soft/40 shrink-0">
              Official 髭男 dism
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Dual Track Tabs (when both Live and MV exist) */}
            {media.hasLive && media.hasMv && (
              <div className="flex items-center rounded bg-black/[0.04] dark:bg-white/[0.05] p-0.5 font-mono text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTrack("live")}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    activeTrack === "live"
                      ? "bg-band text-band-ink shadow-2xs font-extrabold"
                      : "text-muted hover:text-ink hover:bg-tape/30"
                  }`}
                  aria-pressed={activeTrack === "live"}
                >
                  {t("songExtra.liveTab", "🎪 現場 Live")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTrack("mv")}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    activeTrack === "mv"
                      ? "bg-band text-band-ink shadow-2xs font-extrabold"
                      : "text-muted hover:text-ink hover:bg-tape/30"
                  }`}
                  aria-pressed={activeTrack === "mv"}
                >
                  {t("songExtra.mvTab", "🎬 官方 MV")}
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted hover:text-ink hover:bg-tape/30 font-mono text-[13px] font-bold transition-colors cursor-pointer"
              title={t("songExtra.closePlayer", "關閉播放器")}
              aria-label={t("songExtra.closePlayer", "關閉播放器")}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video Player Container (Seamless 16:9 Cinema Stage, zero border) */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          {embedUrl ? (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              onLoad={handleIframeLoad}
              title={`${title} - ${isLive ? t("songExtra.liveVideo", "現場演出") : t("songExtra.musicVideo", "官方 MV")}`}
              className="absolute inset-0 h-full w-full border-0 outline-none"
              style={{
                transform: "translateZ(0)",
                WebkitTransform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-sm text-paper">
              {t("songExtra.noVideoAvailable", "暫無可播放影片")}
            </div>
          )}
        </div>

        {/* Cinema Footer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-paper px-3.5 py-2 font-mono text-[11px]">
          {/* Left: Show linkage or Video Description */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isLive && media.live?.showId ? (
              <button
                type="button"
                onClick={handleShowClick}
                className="inline-flex items-center gap-1 rounded border border-line-soft bg-tape/30 px-2 py-0.5 text-[11px] font-bold text-ink hover:bg-band hover:text-band-ink transition-colors cursor-pointer text-left truncate"
                title={t("songExtra.viewShowSlipTitle", "前往查看此場次的完整曲目清單與開演資訊")}
              >
                <span>📍</span>
                <span className="truncate">
                  {media.live.title || t("songExtra.livePerformance", "現場演出紀錄")}
                </span>
                <span className="shrink-0 font-extrabold underline underline-offset-2">
                  {t("songExtra.viewShowSlip", "前往該場次票根 →")}
                </span>
              </button>
            ) : (
              <span className="text-muted text-[11px] truncate">
                {currentVideo?.title ||
                  (isLive
                    ? t("songExtra.officialLiveVideo", "官方現場演出")
                    : t("songExtra.officialMusicVideo", "官方音樂錄影帶"))}
              </span>
            )}
          </div>

          {/* Right: External link */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {watchUrl && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-0.5 font-mono text-[11px] font-bold text-ink hover:bg-band hover:border-band hover:text-band-ink transition-colors no-underline"
              >
                <span>↗</span>
                <span>{t("songExtra.openInYouTube", "在 YouTube 開啟原始影片")}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (mounted && typeof document !== "undefined" && document.body?.nodeType === 1) {
    return createPortal(modalNode, document.body);
  }
  return modalNode;
}
