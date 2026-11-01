import React, { useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import {
  getSongSpotify,
  buildSpotifyEmbedUrl,
  buildSpotifyTrackUrl,
} from "../../lib/song-spotify.js";
import { songTitle } from "../../lib/domain.js";

/**
 * SpotifyAudioStage
 * 歌曲票根專屬官方串流音源舞台 (In-place Spotify Stage, ADR-0138)
 * - 緊湊型票根內嵌：零彈窗、零遮罩、高純度靜態 SPA 架構
 * - 錄音室 vs 現場雙軌切換：支援錄音室原曲與多場巡演現場音源無縫切換
 * - 行動端排版自適應：小尺寸螢幕標題不縮略（不被 ... 吃掉），控制列與軌道切換流暢折行
 * - 可收合機制：支援摺疊收合（僅保留簡潔標題列）以節省行動裝置垂直空間
 * - 雙向場次票根聯動：當前播放現場時，底部直通該場次 ShowSlip
 * - 外跳官方 Spotify：右上角一鍵直達官方 App / 網頁版收聽無損音訊
 */
export function SpotifyAudioStage({
  songId,
  onSelectShow,
  initialTrack,
  spotifyOverride,
  titleOverride,
  collapsed: controlledCollapsed,
  onToggleCollapse,
}) {
  const { t } = useI18n();
  const spotify = spotifyOverride || getSongSpotify(songId);

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const [activeTrack, setActiveTrack] = useState(() => {
    return initialTrack || spotify.defaultTrack || "studio";
  });

  const [selectedLiveIndex, setSelectedLiveIndex] = useState(0);

  // Reset active track and live index whenever songId or initialTrack changes
  useEffect(() => {
    setActiveTrack(initialTrack || spotify.defaultTrack || "studio");
    setSelectedLiveIndex(0);
    setInternalCollapsed(false);
  }, [songId, initialTrack, spotify.defaultTrack]);

  if (!spotify.hasSpotify) return null;

  const currentLive =
    spotify.lives && spotify.lives.length > 0
      ? spotify.lives[selectedLiveIndex] || spotify.lives[0]
      : spotify.live;

  const currentTrackId =
    activeTrack === "live" && spotify.hasLive
      ? currentLive?.trackId
      : spotify.trackId || currentLive?.trackId;

  if (!currentTrackId) return null;

  const embedUrl = buildSpotifyEmbedUrl(currentTrackId);
  const trackUrl = buildSpotifyTrackUrl(currentTrackId);
  const title = songTitle[songId] || songId;

  const handleTrackChange = (track) => {
    if (track !== activeTrack) {
      setActiveTrack(track);
    }
  };

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(next);
    } else {
      setInternalCollapsed(next);
    }
  };

  const handleShowClick = () => {
    if (currentLive?.showId && onSelectShow) {
      onSelectShow(currentLive.showId);
    }
  };

  const stageTitle = titleOverride || t("songExtra.spotifyStageAria", "Spotify 官方音源舞台");

  return (
    <div
      id="song-spotify-stage"
      data-testid="song-spotify-stage"
      className="my-2.5 sm:my-3 rounded-[3px] border border-line-soft bg-card overflow-hidden shadow-2xs select-none"
    >
      {/* Stage Top Bar (Responsive multi-row wrapping on small screens; title never truncated) */}
      <div
        className={`flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 px-3 py-1.5 bg-paper font-mono text-[11px] ${
          isCollapsed ? "" : "border-b border-line-soft"
        }`}
      >
        {/* Left: Stage Title & Indicator Dot */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className="inline-block h-2 w-2 rounded-full border border-ink bg-tape shrink-0"
            aria-hidden="true"
          />
          <span
            className="font-bold text-ink uppercase tracking-wider truncate shrink"
            title={stageTitle}
          >
            {stageTitle}
          </span>
        </div>

        {/* Right: Outbound Direct Link & Collapse/Expand Toggle */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto order-2 sm:order-3">
          <a
            href={trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-line-soft bg-paper hover:bg-band hover:border-band hover:text-band-ink text-ink font-bold transition-colors cursor-pointer shrink-0 no-underline min-h-[26px]"
            title={t("songExtra.openInSpotify", "前往 Spotify")}
          >
            <span>Spotify ↗</span>
          </a>
          <button
            type="button"
            onClick={handleToggleCollapse}
            aria-expanded={!isCollapsed}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-line-soft bg-paper hover:bg-tape-tint/50 text-ink font-bold transition-colors cursor-pointer shrink-0 select-none min-h-[26px]"
            title={
              isCollapsed
                ? t("songExtra.expandStage", "展開 ▾")
                : t("songExtra.collapseStage", "收合 ▴")
            }
          >
            <span>
              {isCollapsed
                ? t("songExtra.expandStage", "展開 ▾")
                : t("songExtra.collapseStage", "收合 ▴")}
            </span>
          </button>
        </div>

        {/* Dual Track Switcher (Row 2 on mobile, inline on desktop; hidden when collapsed) */}
        {!isCollapsed && spotify.hasLive && spotify.hasStudio && (
          <div className="w-full sm:w-auto order-3 sm:order-2 flex items-center rounded bg-black/[0.04] dark:bg-white/[0.05] p-0.5 font-bold">
            <button
              type="button"
              onClick={() => handleTrackChange("studio")}
              className={`flex-1 sm:flex-initial px-2 py-0.5 rounded transition-colors cursor-pointer min-h-[26px] flex items-center justify-center gap-1 ${
                activeTrack === "studio"
                  ? "bg-band text-band-ink font-extrabold shadow-2xs"
                  : "text-muted hover:text-ink hover:bg-tape/30"
              }`}
              aria-pressed={activeTrack === "studio"}
            >
              <span>{t("songExtra.spotifyStudioTab", "🎧 錄音室原曲")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTrackChange("live")}
              className={`flex-1 sm:flex-initial px-2 py-0.5 rounded transition-colors cursor-pointer min-h-[26px] flex items-center justify-center gap-1 ${
                activeTrack === "live"
                  ? "bg-band text-band-ink font-extrabold shadow-2xs"
                  : "text-muted hover:text-ink hover:bg-tape/30"
              }`}
              aria-pressed={activeTrack === "live"}
            >
              <span>{t("songExtra.spotifyLiveTab", "🎪 現場 Live")}</span>
              {spotify.lives.length > 1 && (
                <span className="font-mono text-[9px] opacity-80">
                  ({spotify.lives.length})
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* When collapsed, hide player body and sub-bars */}
      {!isCollapsed && (
        <>
          {/* Multi-Live Selector (When live track is active and multiple lives exist) */}
          {activeTrack === "live" && spotify.hasMultipleLives && (
            <div
              data-testid="song-spotify-live-selector"
              className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-paper/60 border-b border-line-soft/80 text-[11px] font-mono"
            >
              <span className="text-muted shrink-0 text-[10px]">
                {t("songExtra.spotifyLiveVersions", "現場版本：")}
              </span>
              <div className="flex flex-wrap gap-1">
                {spotify.lives.map((l, idx) => {
                  const isSelected = idx === selectedLiveIndex;
                  return (
                    <button
                      key={l.trackId || idx}
                      type="button"
                      onClick={() => setSelectedLiveIndex(idx)}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-[10px] font-bold ${
                        isSelected
                          ? "bg-band text-band-ink shadow-2xs border border-band"
                          : "bg-paper text-ink border border-line-soft hover:bg-tape/30 hover:border-ink/60"
                      }`}
                      aria-pressed={isSelected}
                      title={l.title || l.shortTitle}
                    >
                      <span>📍 {l.shortTitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compact Embed Audio Player (Standard 152px exact height, zero scrollbar, ADR-0138) */}
          <div className="relative h-[152px] bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden">
            <iframe
              src={embedUrl}
              width="100%"
              height="152"
              scrolling="no"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full h-[152px] block bg-transparent border-0 outline-none"
              title={`${title} - Spotify`}
            />
          </div>

          {/* Stage Bottom Bar: Bidirectional Show Link */}
          {activeTrack === "live" && currentLive?.showId ? (
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 px-3 py-1.5 bg-paper border-t border-line-soft font-mono text-[11px]">
              <span className="text-muted truncate">
                📍 {currentLive.title || currentLive.shortTitle}
              </span>
              {onSelectShow && (
                <button
                  type="button"
                  onClick={handleShowClick}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-tape/30 hover:bg-band hover:text-band-ink text-ink font-bold transition-colors cursor-pointer shrink-0 border border-line-soft ml-auto sm:ml-0"
                  title={t("songExtra.viewShowSlipTitle", "前往查看此場次的完整曲目清單與開演資訊")}
                >
                  <span>{t("songExtra.viewShowSlip", "前往該場次票根 →")}</span>
                </button>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
