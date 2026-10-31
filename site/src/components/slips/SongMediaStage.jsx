import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import {
  getSongMedia,
  buildYouTubeEmbedUrl,
  buildYouTubeWatchUrl,
} from "../../lib/song-media.js";
import { songTitle } from "../../lib/domain.js";

/**
 * SongMediaStage
 * 歌曲票根專屬現場/官方影音內嵌舞台 (In-place Video Stage, ADR-0135)
 * - 原生票根內嵌：零彈窗、零遮罩、完全杜絕 Chromium/Windows Direct Composition 破圖
 * - 行動端排版最佳化：針對小螢幕（<420px 及 <640px）自適應折行與大點擊熱區（>=32px）
 * - 自動調節 50% 音量：透過 postMessage 在開播時自動調節播放器音量至 50%
 * - 邊聽邊看雙重體驗：歌迷可在聆聽現場演出的同時向下滑動瀏覽歷年巡演開演紀錄
 */
export function SongMediaStage({
  songId,
  onSelectShow,
  initialTrack,
  mediaOverride,
}) {
  const { t } = useI18n();
  const iframeRef = useRef(null);
  const media = mediaOverride || getSongMedia(songId);

  const [activeTrack, setActiveTrack] = useState(() => {
    return initialTrack || media.defaultTrack || "live";
  });

  const [selectedLiveIndex, setSelectedLiveIndex] = useState(0);
  const [selectedMvIndex, setSelectedMvIndex] = useState(0);
  const [userSwitched, setUserSwitched] = useState(false);

  // Reset active track and live/mv index whenever songId or initialTrack changes
  useEffect(() => {
    setActiveTrack(initialTrack || media.defaultTrack || "live");
    setSelectedLiveIndex(0);
    setSelectedMvIndex(0);
    setUserSwitched(false);
  }, [songId, initialTrack, media.defaultTrack]);

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
  }, []);

  const currentLive =
    media.lives && media.lives.length > 0
      ? media.lives[selectedLiveIndex] || media.lives[0]
      : media.live;

  const currentMv =
    media.mvs && media.mvs.length > 0
      ? media.mvs[selectedMvIndex] || media.mvs[0]
      : media.mv;

  const currentVideo =
    activeTrack === "live" && media.hasLive
      ? currentLive
      : media.hasMv
        ? currentMv
        : currentLive;

  // Initial load uses autoplay=0 (false) to avoid unprompted sound; user tab switch uses autoplay=1 (true)
  const embedUrl = currentVideo
    ? buildYouTubeEmbedUrl(
        currentVideo.youtubeId,
        currentVideo.start,
        userSwitched,
        currentVideo.end
      )
    : "";
  const watchUrl = currentVideo
    ? buildYouTubeWatchUrl(currentVideo.youtubeId, currentVideo.start)
    : "";

  // Auto-regulate volume when activeTrack, selectedLiveIndex, selectedMvIndex, or embedUrl changes
  useEffect(() => {
    if (!embedUrl) return;
    const t1 = setTimeout(dispatchVolume, 400);
    const t2 = setTimeout(dispatchVolume, 1000);
    const t3 = setTimeout(dispatchVolume, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [embedUrl, activeTrack, selectedLiveIndex, selectedMvIndex]);

  if (!media.hasMedia || !currentVideo) return null;

  const title = songTitle[songId] || songId;
  const isLive = activeTrack === "live" && media.hasLive;
  const isMv = activeTrack === "mv" && media.hasMv;

  const handleTrackChange = (track) => {
    if (track !== activeTrack) {
      setUserSwitched(true);
      setActiveTrack(track);
    }
  };

  const handleShowClick = () => {
    if (currentLive?.showId && onSelectShow) {
      onSelectShow(currentLive.showId);
    }
  };

  const getMvTabLabel = (mv) => {
    if (!mv) return t("songExtra.mvTab", "🎬 官方 MV");
    if (mv.subType === "lyric") return t("songExtra.mvLyricTab", "📝 歌詞版 MV");
    if (mv.subType === "short") return t("songExtra.mvShortTab", "🎬 短版 MV");
    if (mv.subType === "film") return t("songExtra.mvFilmTab", "🎥 特報微電影");
    if (mv.isExcerpt) return t("songExtra.mvExcerptTab", "🎬 官方 MV（精華）");
    return t("songExtra.mvTab", "🎬 官方 MV");
  };

  return (
    <div
      id="song-media-stage"
      data-testid="song-media-stage"
      className="my-3 rounded-[3px] border border-line-soft bg-card overflow-hidden shadow-2xs select-none"
    >
      {/* Stage Top Bar (Responsive for mobile & small screens) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 bg-paper border-b border-line-soft font-mono text-[11px]">
        {/* Left: Stage Title & Dual Track Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape shrink-0" aria-hidden="true" />
          <span className="font-bold text-ink uppercase tracking-wider shrink-0">
            {t("songExtra.mediaModalAria", "官方影音舞台")}
          </span>

          {media.hasLive && media.hasMv ? (
            <div className="inline-flex items-center rounded bg-black/[0.04] dark:bg-white/[0.05] p-0.5 font-bold ml-1">
              <button
                type="button"
                onClick={() => handleTrackChange("live")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer min-h-[30px] flex items-center gap-1 ${
                  activeTrack === "live"
                    ? "bg-band text-band-ink font-extrabold shadow-2xs"
                    : "text-muted hover:text-ink hover:bg-tape/30"
                }`}
                aria-pressed={activeTrack === "live"}
              >
                <span>
                  {currentLive?.isExcerpt
                    ? t("songExtra.liveExcerptTab", "🎪 現場精華")
                    : t("songExtra.liveTab", "🎪 現場 Live")}
                </span>
                {currentLive?.isExcerpt && currentLive.durationSeconds > 0 && (
                  <span className="font-mono text-[9px] opacity-80">
                    ({currentLive.durationSeconds}s)
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleTrackChange("mv")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer min-h-[30px] flex items-center gap-1 ${
                  activeTrack === "mv"
                    ? "bg-band text-band-ink font-extrabold shadow-2xs"
                    : "text-muted hover:text-ink hover:bg-tape/30"
                }`}
                aria-pressed={activeTrack === "mv"}
              >
                <span>
                  {getMvTabLabel(currentMv)}
                </span>
                {currentMv?.isExcerpt && currentMv.durationSeconds > 0 && (
                  <span className="font-mono text-[9px] opacity-80">
                    ({currentMv.durationSeconds}s)
                  </span>
                )}
              </button>
            </div>
          ) : media.hasLive ? (
            <span className="shrink-0 rounded bg-band/15 text-band-ink border border-band/30 px-2 py-0.5 text-[10px] font-bold ml-1">
              {currentLive?.isExcerpt
                ? t("songExtra.liveExcerptTab", "🎪 現場精華")
                : t("songExtra.liveTab", "🎪 現場 Live")}
            </span>
          ) : media.hasMv ? (
            <span className="shrink-0 rounded bg-black/[0.04] dark:bg-white/[0.05] text-muted border border-line-soft px-2 py-0.5 text-[10px] font-bold ml-1">
              {getMvTabLabel(currentMv)}
            </span>
          ) : null}
        </div>

        {/* Right: External YouTube Link */}
        {watchUrl && (
          <div className="flex items-center justify-end shrink-0 self-end sm:self-auto">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-bold text-ink hover:bg-band hover:border-band hover:text-band-ink transition-colors no-underline min-h-[30px]"
            >
              <span>↗</span>
              <span className="hidden min-[420px]:inline">{t("songExtra.openInYouTube", "在 YouTube 開啟原始影片")}</span>
              <span className="min-[420px]:hidden">YouTube ↗</span>
            </a>
          </div>
        )}
      </div>

      {/* Multiple Live Performances Selector Sub-bar */}
      {isLive && media.hasMultipleLives && (
        <div
          data-testid="song-media-live-selector"
          className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-paper/70 border-b border-line-soft font-mono text-[11px]"
        >
          <span className="text-muted text-[10px] font-bold uppercase tracking-wider shrink-0 mr-1">
            {t("songExtra.liveVersions", "場次版本：")}
          </span>
          {media.lives.map((l, idx) => {
            const isActive = idx === selectedLiveIndex;
            return (
              <button
                key={l.youtubeId + idx}
                type="button"
                onClick={() => {
                  if (idx !== selectedLiveIndex) {
                    setUserSwitched(true);
                    setSelectedLiveIndex(idx);
                  }
                }}
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer min-h-[28px] ${
                  isActive
                    ? "bg-band text-band-ink shadow-2xs font-extrabold"
                    : "bg-paper text-muted hover:text-ink hover:bg-tape/30 border border-line-soft/80"
                }`}
                aria-pressed={isActive}
              >
                <span>📍</span>
                <span>{l.shortTitle || l.title}</span>
                {l.isExcerpt && l.durationSeconds > 0 && (
                  <span className="text-[9px] opacity-80">({l.durationSeconds}s)</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Multiple MV Versions Selector Sub-bar */}
      {isMv && media.hasMultipleMvs && (
        <div
          data-testid="song-media-mv-selector"
          className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-paper/70 border-b border-line-soft font-mono text-[11px]"
        >
          <span className="text-muted text-[10px] font-bold uppercase tracking-wider shrink-0 mr-1">
            {t("songExtra.mvVersions", "MV 版本：")}
          </span>
          {media.mvs.map((m, idx) => {
            const isActive = idx === selectedMvIndex;
            const badgeIcon =
              m.subType === "anime"
                ? "🎨"
                : m.subType === "film"
                  ? "🎥"
                  : m.subType === "lyric"
                    ? "📝"
                    : m.subType === "short"
                      ? "🎬"
                      : "🎬";
            return (
              <button
                key={m.youtubeId + idx}
                type="button"
                onClick={() => {
                  if (idx !== selectedMvIndex) {
                    setUserSwitched(true);
                    setSelectedMvIndex(idx);
                  }
                }}
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer min-h-[28px] ${
                  isActive
                    ? "bg-band text-band-ink shadow-2xs font-extrabold"
                    : "bg-paper text-muted hover:text-ink hover:bg-tape/30 border border-line-soft/80"
                }`}
                aria-pressed={isActive}
              >
                <span>{badgeIcon}</span>
                <span>{m.shortTitle || m.title}</span>
                {m.isExcerpt && m.durationSeconds > 0 && (
                  <span className="text-[9px] opacity-80">({m.durationSeconds}s)</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 16:9 Video Embed Container */}
      <div className="relative aspect-video w-full bg-black overflow-hidden">
        {embedUrl ? (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            onLoad={handleIframeLoad}
            title={`${title} - ${isLive ? t("songExtra.liveVideo", "現場演出") : t("songExtra.musicVideo", "官方 MV")}`}
            className="absolute inset-0 h-full w-full border-0 outline-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : null}
      </div>

      {/* Stage Bottom Bar (Link to Show Slip or Video Information) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 bg-paper font-mono text-[11px] border-t border-line-soft">
        {isLive && currentLive?.showId ? (
          <button
            type="button"
            onClick={handleShowClick}
            className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-1.5 rounded border border-line-soft bg-tape/30 px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-band hover:text-band-ink transition-colors cursor-pointer text-left min-h-[32px]"
            title={t("songExtra.viewShowSlipTitle", "前往查看此場次的完整曲目清單與開演資訊")}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="shrink-0">📍</span>
              <span className="truncate">
                {currentLive.title || t("songExtra.livePerformance", "現場演出紀錄")}
              </span>
              {currentLive.isExcerpt && currentLive.timeRangeText && (
                <span className="shrink-0 rounded bg-band/20 text-band-ink px-1.5 py-0.5 text-[10px] font-bold">
                  ⏱️ {currentLive.timeRangeText}
                </span>
              )}
            </div>
            <span className="shrink-0 font-extrabold underline underline-offset-2 ml-2">
              {t("songExtra.viewShowSlip", "前往該場次票根 →")}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 py-1 min-w-0">
            <span className="text-muted text-[11px] truncate">
              {currentVideo?.title ||
                (isLive
                  ? t("songExtra.officialLiveVideo", "官方現場演出")
                  : t("songExtra.officialMusicVideo", "官方音樂錄影帶"))}
            </span>
            {currentVideo?.isExcerpt && currentVideo.timeRangeText && (
              <span className="shrink-0 rounded bg-tape/40 text-ink px-1.5 py-0.5 text-[10px] font-bold">
                ⏱️ {currentVideo.timeRangeText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
