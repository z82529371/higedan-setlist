import { PLAYBACK_SPEEDS } from "../lib/journey-playback.js";
import { useI18n } from "../lib/i18n.jsx";

/**
 * Reusable playback bar for the sequential Tour Journey animation (ADR-0124, DESIGN.md).
 * Purely presentational: all timer / progress logic lives in `useJourneyPlayback`.
 */
export function JourneyPlaybackControls({ playback, stops = [] }) {
  const { t, localizeVenue } = useI18n();
  const {
    progress,
    total,
    isPlaying,
    speed,
    cameraMode = "follow",
    frame,
    toggle,
    scrub,
    setSpeed,
    toggleCameraMode,
  } = playback;

  const arrivedIndex = Math.min(frame.arrivedStopIndex ?? frame.completedLegs, Math.max(0, stops.length - 1));
  const currentStop = stops[arrivedIndex] || null;
  const actionLabel = isPlaying
    ? t("venueMap.playbackPause")
    : frame.isComplete
      ? t("venueMap.playbackReplay")
      : t("venueMap.playbackPlay");
  const actionIcon = isPlaying ? "⏸" : frame.isComplete ? "↻" : "▶";
  const locked = total <= 0;

  return (
    <div
      data-testid="journey-playback-controls"
      data-playing={isPlaying ? "true" : "false"}
      className="space-y-2 rounded-[3px] border border-ink/40 bg-paper px-3 py-2.5 shadow-xs dark:shadow-none"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="journey-playback-toggle"
          aria-label={actionLabel}
          aria-pressed={isPlaying}
          disabled={locked}
          onClick={toggle}
          className={`inline-flex items-center gap-1.5 rounded-[3px] border border-ink bg-band px-3 py-1.5 font-mono text-[12px] font-extrabold text-band-ink shadow-xs dark:shadow-none transition-colors ${
            locked ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-card"
          }`}
        >
          <span aria-hidden="true">{actionIcon}</span>
          <span>{actionLabel}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] font-bold tracking-wide text-muted tabular-nums">
            {t("venueMap.playbackStopLabel", null, {
              n: arrivedIndex + 1,
              total: Math.max(1, stops.length),
            })}
          </div>
          {currentStop && (
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] font-extrabold text-ink">
              <span className="font-mono whitespace-nowrap shrink-0 tabular-nums">{currentStop.date}</span>
              <span aria-hidden="true" className="shrink-0">
                ·
              </span>
              <span className="truncate">{localizeVenue(currentStop.venue)}</span>
            </div>
          )}
        </div>

        <div role="group" aria-label={t("venueMap.playbackSpeedAria")} className="flex items-center gap-1">
          {PLAYBACK_SPEEDS.map((rate) => (
            <button
              key={rate}
              type="button"
              data-testid={`journey-playback-speed-${rate}`}
              data-speed={rate}
              aria-pressed={speed === rate}
              onClick={() => setSpeed(rate)}
              className={`rounded-[3px] border px-2 py-1 font-mono text-[11px] font-extrabold tabular-nums transition-colors cursor-pointer ${
                speed === rate
                  ? "border-ink bg-band text-band-ink shadow-2xs dark:shadow-none"
                  : "border-ink/40 bg-paper text-ink hover:bg-card"
              }`}
            >
              {rate}×
            </button>
          ))}
        </div>

        {toggleCameraMode && (
          <button
            type="button"
            data-testid="journey-playback-camera-toggle"
            data-camera-mode={cameraMode}
            aria-label={t("venueMap.playbackCameraAria")}
            aria-pressed={cameraMode === "follow"}
            onClick={toggleCameraMode}
            className="rounded-[3px] border border-ink/40 bg-paper px-2.5 py-1 font-mono text-[11px] font-extrabold text-ink transition-colors hover:bg-card cursor-pointer shadow-2xs dark:shadow-none"
          >
            {cameraMode === "follow"
              ? t("venueMap.playbackCameraFollow")
              : t("venueMap.playbackCameraOverview")}
          </button>
        )}
      </div>

      <input
        type="range"
        data-testid="journey-playback-scrub"
        aria-label={t("venueMap.playbackScrubAria")}
        aria-valuetext={
          currentStop ? `${currentStop.date} ${localizeVenue(currentStop.venue)}` : undefined
        }
        min="0"
        max={Math.max(0, total)}
        step="0.01"
        value={progress}
        disabled={total <= 0}
        onChange={(event) => scrub(event.target.value)}
        className={`w-full accent-band ${total <= 0 ? "cursor-not-allowed" : "cursor-pointer"}`}
      />

      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-muted">
        <span className="truncate">
          {stops[0]?.date || ""} → {stops.at(-1)?.date || ""}
        </span>
        <span className="shrink-0 tabular-nums">
          {Math.round((total > 0 ? progress / total : 0) * 100)}%
        </span>
      </div>
    </div>
  );
}
