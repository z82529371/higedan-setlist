import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CAMERA_MODE,
  DEFAULT_PLAYBACK_SPEED,
  PLAYBACK_SPEEDS,
  advanceProgress,
  getPlaybackFrame,
} from "./journey-playback.js";

// Guard against tab-restore / stalled frames teleporting the cursor across many legs at once.
const MAX_FRAME_MS = 250;

const EMPTY_TRANSITIONS = [];

/**
 * Playback state machine for the sequential Tour Journey animation (ADR-0124, DESIGN.md).
 * Shared by the career journey map and (later) the tour slip player: it owns progress,
 * play/pause and speed, and never touches the DOM.
 *
 * Every new journey auto-plays from the origin at DEFAULT_PLAYBACK_SPEED. Playback is
 * intentionally independent of `prefers-reduced-motion`: the route is opt-in map content
 * with its own pause control, so users can stop it whenever they want.
 */
export function useJourneyPlayback(transitions = EMPTY_TRANSITIONS) {
  const total = transitions.length;
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(DEFAULT_PLAYBACK_SPEED);
  const [cameraMode, setCameraMode] = useState(DEFAULT_CAMERA_MODE);
  const isPlaying = playing && total > 0;

  // A new journey (year / tour filter, TV toggle) restarts at the origin and plays itself.
  useEffect(() => {
    setProgress(0);
    setPlaying(transitions.length > 0);
  }, [transitions]);

  // A hidden tab freezes the clock; returning to the page stays paused until the user resumes.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") setPlaying(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") return;

    let handle = 0;
    let last = 0;
    const step = (timestamp) => {
      const elapsed = last ? Math.min(MAX_FRAME_MS, timestamp - last) : 0;
      last = timestamp;
      setProgress((prev) => advanceProgress(prev, elapsed, speed, total));
      handle = window.requestAnimationFrame(step);
    };
    handle = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(handle);
  }, [isPlaying, speed, total]);

  const frame = useMemo(() => getPlaybackFrame(transitions, progress), [transitions, progress]);

  // Stop at the final stop instead of looping; the transport offers a manual replay.
  useEffect(() => {
    if (frame.isComplete && playing) setPlaying(false);
  }, [frame.isComplete, playing]);

  const toggle = () => {
    if (total <= 0) return;
    if (isPlaying) {
      setPlaying(false);
      return;
    }
    if (frame.isComplete) setProgress(0);
    setPlaying(true);
  };

  const scrub = (value) => {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    setPlaying(false);
    setProgress(Math.min(total, Math.max(0, next)));
  };

  const changeSpeed = (next) => {
    if (PLAYBACK_SPEEDS.includes(next)) setSpeed(next);
  };

  const toggleCameraMode = () => {
    setCameraMode((prev) => (prev === "follow" ? "overview" : "follow"));
  };

  return {
    progress,
    frame,
    total,
    isPlaying,
    speed,
    cameraMode,
    toggle,
    scrub,
    setSpeed: changeSpeed,
    setCameraMode,
    toggleCameraMode,
  };
}
