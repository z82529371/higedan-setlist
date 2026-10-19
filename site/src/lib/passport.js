/**
 * passport.js — Concert Passport & Attendance Tracking Domain Service
 *
 * Implements the single source of truth for concert attendance records stored in
 * localStorage under the versioned key `hg_passport_v1` (Issue #33 / #34).
 *
 * Invariants:
 * 1. Safe in SSR / headless Node.js environments via getSafeStorage fallback.
 * 2. Atomic state writes and cross-component reactive notification via `hg:passport-updated`.
 * 3. Conforms to PassportStoragePayload (v1) and PassportShowEntry specifications.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSafeStorage, MemoryStorageAdapter, SafeStorage } from "./storage.js";

export { getSafeStorage, MemoryStorageAdapter, SafeStorage };

export const PASSPORT_STORAGE_KEY = "hg_passport_v1";
export const PASSPORT_SCHEMA_VERSION = 1;
export const PASSPORT_EVENT_UPDATED = "hg:passport-updated";

/**
 * Creates a clean, empty passport payload conforming to v1 schema.
 */
export function createEmptyPassport() {
  return {
    version: PASSPORT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    attendedShows: {},
  };
}

/**
 * Reads and parses the passport payload from safe storage.
 * Gracefully self-heals corrupted or empty payloads.
 */
export function loadPassport(storage = getSafeStorage()) {
  try {
    const raw = storage.getItem(PASSPORT_STORAGE_KEY);
    if (!raw) return createEmptyPassport();

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== PASSPORT_SCHEMA_VERSION ||
      !parsed.attendedShows ||
      typeof parsed.attendedShows !== "object" ||
      Array.isArray(parsed.attendedShows)
    ) {
      return createEmptyPassport();
    }

    return parsed;
  } catch {
    return createEmptyPassport();
  }
}

/**
 * Atomically writes the passport payload to safe storage and dispatches
 * an event so all mounted components react immediately.
 */
export function savePassport(payload, storage = getSafeStorage()) {
  if (!payload || typeof payload !== "object") return;
  payload.updatedAt = new Date().toISOString();

  try {
    storage.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Handled by SafeStorage fallback
  }

  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent(PASSPORT_EVENT_UPDATED, {
          detail: { payload },
        })
      );
    } catch {
      // Ignore in environments without CustomEvent
    }
  }
}

/**
 * Returns whether a given show has been marked as attended.
 */
export function isAttended(showKey, storage = getSafeStorage()) {
  if (!showKey) return false;
  const payload = loadPassport(storage);
  return Boolean(payload.attendedShows?.[String(showKey)]);
}

/**
 * Returns the attendance entry for a given show, or null if not attended.
 */
export function getAttendedShow(showKey, storage = getSafeStorage()) {
  if (!showKey) return null;
  const payload = loadPassport(storage);
  return payload.attendedShows?.[String(showKey)] || null;
}

/**
 * Returns all attended show entries as a flat array.
 */
export function getAllAttendedShows(storage = getSafeStorage()) {
  const payload = loadPassport(storage);
  return Object.values(payload.attendedShows || {});
}

/**
 * Records attendance for a show with optional metadata (seat, notes, stampId).
 */
export function recordAttendance(showKey, showMeta = {}, storage = getSafeStorage()) {
  if (!showKey) {
    return { attended: false, entry: null, payload: loadPassport(storage) };
  }

  const payload = loadPassport(storage);
  const key = String(showKey);
  const existing = payload.attendedShows[key] || {};
  const nowIso = new Date().toISOString();

  const entry = {
    showKey: key,
    attendedAt:
      showMeta.date ||
      showMeta.attendedAt ||
      existing.attendedAt ||
      nowIso.slice(0, 10),
    seat: (showMeta.seat !== undefined ? String(showMeta.seat) : existing.seat || "").slice(0, 50),
    notes: (showMeta.notes !== undefined ? String(showMeta.notes) : existing.notes || "").slice(0, 300),
    stampId: showMeta.stampId || existing.stampId || "default",
    includeSeat:
      showMeta.includeSeat !== undefined
        ? Boolean(showMeta.includeSeat)
        : existing.includeSeat !== undefined
        ? Boolean(existing.includeSeat)
        : true,
    includeNotes:
      showMeta.includeNotes !== undefined
        ? Boolean(showMeta.includeNotes)
        : existing.includeNotes !== undefined
        ? Boolean(existing.includeNotes)
        : true,
    favorite: Boolean(showMeta.favorite !== undefined ? showMeta.favorite : existing.favorite),
    updatedAt: nowIso,
    isOrphaned: Boolean(
      showMeta.isOrphaned !== undefined ? showMeta.isOrphaned : existing.isOrphaned
    ),
  };

  payload.attendedShows[key] = entry;
  savePassport(payload, storage);

  return { attended: true, entry, payload };
}

/**
 * Removes attendance record for a show.
 */
export function removeAttendance(showKey, storage = getSafeStorage()) {
  if (!showKey) {
    return { attended: false, payload: loadPassport(storage) };
  }

  const payload = loadPassport(storage);
  const key = String(showKey);
  if (payload.attendedShows[key]) {
    delete payload.attendedShows[key];
    savePassport(payload, storage);
  }

  return { attended: false, payload };
}

/**
 * Toggles attendance state for a show.
 */
export function toggleAttendance(showKey, showMeta = {}, storage = getSafeStorage()) {
  if (!showKey) {
    return { attended: false, entry: null, payload: loadPassport(storage) };
  }

  if (isAttended(showKey, storage)) {
    const res = removeAttendance(showKey, storage);
    return { attended: false, entry: null, payload: res.payload };
  } else {
    return recordAttendance(showKey, showMeta, storage);
  }
}

/**
 * React hook for checking and toggling attendance for a single show.
 * Supports reactive synchronization across multiple components.
 */
export function usePassportAttendance(showKey, showMeta = null, options = {}) {
  const storage = options.storage || getSafeStorage(options.env);
  const [prevKey, setPrevKey] = useState(showKey);
  const [entry, setEntry] = useState(() => (showKey ? getAttendedShow(showKey, storage) : null));

  // Sync state synchronously if showKey changes without unmounting ShowSlip
  if (prevKey !== showKey) {
    setPrevKey(showKey);
    setEntry(showKey ? getAttendedShow(showKey, storage) : null);
  }

  const attended = Boolean(entry);

  useEffect(() => {
    if (!showKey) return;

    const syncState = () => {
      const currentEntry = getAttendedShow(showKey, storage);
      setEntry(currentEntry);
    };

    syncState();

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener(PASSPORT_EVENT_UPDATED, syncState);
      window.addEventListener("storage", syncState);
      return () => {
        window.removeEventListener(PASSPORT_EVENT_UPDATED, syncState);
        window.removeEventListener("storage", syncState);
      };
    }
  }, [showKey, storage]);

  const toggle = useCallback(() => {
    if (!showKey) return false;
    const res = toggleAttendance(showKey, showMeta, storage);
    setEntry(res.entry || null);
    return res.attended;
  }, [showKey, showMeta, storage]);

  const checkIn = useCallback(
    (meta = {}) => {
      if (!showKey) return null;
      const merged = { ...showMeta, ...meta };
      const res = recordAttendance(showKey, merged, storage);
      setEntry(res.entry);
      return res.entry;
    },
    [showKey, showMeta, storage]
  );

  const checkOut = useCallback(() => {
    if (!showKey) return;
    removeAttendance(showKey, storage);
    setEntry(null);
  }, [showKey, storage]);

  return {
    attended,
    entry,
    toggle,
    checkIn,
    checkOut,
  };
}

/**
 * React hook providing the entire passport state, total attended count,
 * attended shows array, and atomic removal with cross-component reactivity.
 */
export function usePassport(options = {}) {
  const storage = options.storage || getSafeStorage(options.env);
  const [payload, setPayload] = useState(() => loadPassport(storage));

  useEffect(() => {
    const syncState = () => {
      setPayload(loadPassport(storage));
    };

    syncState();

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener(PASSPORT_EVENT_UPDATED, syncState);
      window.addEventListener("storage", syncState);
      return () => {
        window.removeEventListener(PASSPORT_EVENT_UPDATED, syncState);
        window.removeEventListener("storage", syncState);
      };
    }
  }, [storage]);

  const count = Object.keys(payload.attendedShows || {}).length;
  const attendedShows = useMemo(
    () => Object.values(payload.attendedShows || {}),
    [payload]
  );

  const remove = useCallback(
    (showKey) => {
      if (!showKey) return;
      const res = removeAttendance(showKey, storage);
      setPayload(res.payload);
      return res;
    },
    [storage]
  );

  return {
    payload,
    count,
    attendedShows,
    remove,
  };
}
