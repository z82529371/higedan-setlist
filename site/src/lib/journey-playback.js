/**
 * journey-playback.js — Pure sequential playback engine for the Tour Journey route (ADR-0124, DESIGN.md).
 *
 * Progress is a float in [0, legCount]: its integer part is the number of fully drawn legs,
 * its fraction is how far the current leg has been drawn. Zero DOM / timer dependencies.
 */

import {
  MAP_VIEWBOX,
  PORTRAIT_MAP_VIEWBOX,
  OVERSEAS_INSET_VIEWBOX,
  OKINAWA_INSET_VIEWBOX,
  PORTRAIT_OVERSEAS_INSET_VIEWBOX,
  PORTRAIT_OKINAWA_INSET_VIEWBOX,
} from "./japan-map-paths.js";

export const PLAYBACK_SPEEDS = [1, 2, 4];
export const DEFAULT_PLAYBACK_SPEED = 2;
export const DEFAULT_CAMERA_MODE = "overview";
export const BASE_LEGS_PER_SECOND = 1.5;

export const FOLLOW_CAM_WINDOW = {
  width: 280,
  height: 196,
};

function controlPoint(from, to, transitMode) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-4) return { x: from.x, y: from.y };

  // For ultra-short hops (e.g. intra-city venues in Matsue/Shimane), scale offset down smoothly
  // to avoid artificial circular loops and wild vehicle spinning.
  const arcFactor = transitMode === "flight" ? 0.24 : (dist < 30 ? 0.04 : 0.12);
  const offset = Math.min(85, dist * arcFactor);
  const nx = -dy / dist;
  const ny = dx / dist;
  return {
    x: Number(((from.x + to.x) / 2 + nx * offset).toFixed(1)),
    y: Number(((from.y + to.y) / 2 + ny * offset - (transitMode === "flight" ? 14 : 0)).toFixed(1)),
  };
}

/**
 * SVG quadratic path for one transit leg; empty string for missing / zero-length legs.
 */
export function buildTransitPath(from, to, transitMode) {
  if (!from || !to) return "";
  if (Math.hypot(to.x - from.x, to.y - from.y) < 1) return "";
  const c = controlPoint(from, to, transitMode);
  return `M${from.x},${from.y} Q${c.x},${c.y} ${to.x},${to.y}`;
}

/**
 * Point at fraction t (0..1) along a leg's quadratic curve.
 */
export function pointOnTransit(from, to, transitMode, t) {
  if (!from || !to) return null;
  const u = Math.min(1, Math.max(0, t));
  if (Math.hypot(to.x - from.x, to.y - from.y) < 1) return { x: from.x, y: from.y };
  const c = controlPoint(from, to, transitMode);
  const k = 1 - u;
  return {
    x: k * k * from.x + 2 * k * u * c.x + u * u * to.x,
    y: k * k * from.y + 2 * k * u * c.y + u * u * to.y,
  };
}

/**
 * Tangent heading angle (in degrees, -180..180) along the leg curve at fraction t.
 * Gives the steering angle for the 🚐 or ✈️ in third-person chase cam view.
 * For ultra-short intra-city hops (< 15 units), uses direct steady heading to eliminate spinning.
 */
export function tangentAngleOnTransit(from, to, transitMode, t) {
  if (!from || !to) return 0;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return 0;
  if (dist < 15) {
    return Number((Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(1));
  }
  const c = controlPoint(from, to, transitMode);
  const u = Math.min(1, Math.max(0, t));
  const tdx = 2 * (1 - u) * (c.x - from.x) + 2 * u * (to.x - c.x);
  const tdy = 2 * (1 - u) * (c.y - from.y) + 2 * u * (to.y - c.y);
  return Number((Math.atan2(tdy, tdx) * (180 / Math.PI)).toFixed(1));
}

/**
 * Computes the Heading-Up world rotation angle (in degrees) to keep the vehicle driving forward.
 */
export function computeHeadingUpRotation(vehicleAngle) {
  if (typeof vehicleAngle !== "number" || !Number.isFinite(vehicleAngle)) return 0;
  return Number((-(vehicleAngle + 90)).toFixed(1));
}

/**
 * Resolves the animation frame for a progress value over an ordered list of transitions.
 */
export function getPlaybackFrame(transitions, progress) {
  const total = transitions?.length || 0;
  const p = Math.min(total, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const completedLegs = Math.min(total, Math.floor(p));
  const isComplete = p >= total;
  const arrivedStopIndex = Math.min(completedLegs, total);
  return {
    progress: p,
    total,
    completedLegs,
    currentLeg: completedLegs < total ? transitions[completedLegs] : null,
    legT: isComplete ? 1 : Number((p - completedLegs).toFixed(6)),
    arrivedStopIndex,
    isComplete,
  };
}

/**
 * Advances progress by elapsed milliseconds at a given speed multiplier, clamped to the leg count.
 */
export function advanceProgress(progress, dtMs, speed, total) {
  return Math.min(total, progress + (dtMs / 1000) * BASE_LEGS_PER_SECOND * speed);
}

/**
 * Computes the follow-cam viewBox centered around the active vehicle or stop coordinate,
 * smoothly clamping within the canvas and seamlessly switching into insets (ADR-0124, ADR-0126).
 * Supports both landscape and portrait triptych layouts.
 *
 * @param {{ x: number, y: number, zone?: "main" | "overseas" | "okinawa" } | null} focusPoint
 * @param {object} [options]
 * @param {"follow" | "overview"} [options.cameraMode="follow"]
 * @param {boolean} [options.isComplete=false]
 * @param {"landscape" | "portrait"} [options.layout="landscape"]
 * @returns {string}
 */
export function computeFollowCamViewBox(focusPoint, options = {}) {
  const { cameraMode = "follow", isComplete = false, layout = "landscape" } = options;
  const isPortrait = layout === "portrait";
  const defaultBox = isPortrait ? PORTRAIT_MAP_VIEWBOX : MAP_VIEWBOX;

  if (cameraMode === "overview" || isComplete || !focusPoint) {
    return defaultBox.str;
  }
  if (focusPoint.zone === "overseas") {
    return isPortrait ? PORTRAIT_OVERSEAS_INSET_VIEWBOX : OVERSEAS_INSET_VIEWBOX;
  }
  if (focusPoint.zone === "okinawa") {
    return isPortrait ? PORTRAIT_OKINAWA_INSET_VIEWBOX : OKINAWA_INSET_VIEWBOX;
  }
  const w = FOLLOW_CAM_WINDOW.width;
  const h = FOLLOW_CAM_WINDOW.height;
  const cx = typeof focusPoint.x === "number" ? focusPoint.x : 400;
  const cy = typeof focusPoint.y === "number" ? focusPoint.y : (isPortrait ? 465 : 280);
  const vx = Math.round(Math.max(0, Math.min(defaultBox.width - w, cx - w / 2)));
  const vy = Math.round(Math.max(0, Math.min(defaultBox.height - h, cy - h / 2)));
  return `${vx} ${vy} ${w} ${h}`;
}
