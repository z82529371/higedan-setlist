/**
 * ticket-book.js — Concert Ticket Book & Attendance Tracking Domain Service
 *
 * Implements the single source of truth for concert attendance records stored in
 * localStorage under the versioned key `hg_ticket_book_v1` (Issue #33 / #34, ADR-0114).
 *
 * Invariants:
 * 1. Safe in SSR / headless Node.js environments via getSafeStorage fallback.
 * 2. Atomic state writes and cross-component reactive notification via `hg:ticket-book-updated`.
 * 3. Conforms to TicketBookStoragePayload (v1) and TicketBookShowEntry specifications.
 * 4. Transparently migrates any legacy `hg_passport_v1` data upon read.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSafeStorage, MemoryStorageAdapter, SafeStorage } from "./storage.js";

export { getSafeStorage, MemoryStorageAdapter, SafeStorage };

export const TICKET_BOOK_STORAGE_KEY = "hg_ticket_book_v1";
export const LEGACY_PASSPORT_STORAGE_KEY = "hg_passport_v1";
export const TICKET_BOOK_SCHEMA_VERSION = 1;
export const TICKET_BOOK_EVENT_UPDATED = "hg:ticket-book-updated";

/**
 * Creates a clean, empty ticket book payload conforming to v1 schema.
 */
export function createEmptyTicketBook() {
  return {
    version: TICKET_BOOK_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    attendedShows: {},
  };
}

/**
 * Reads and parses the ticket book payload from safe storage.
 * Gracefully self-heals corrupted or empty payloads.
 * Automatically migrates legacy hg_passport_v1 payload if found.
 */
export function loadTicketBook(storage = getSafeStorage()) {
  try {
    let raw = storage.getItem(TICKET_BOOK_STORAGE_KEY);
    let isMigrated = false;

    // Check legacy migration
    if (!raw) {
      const legacyRaw = storage.getItem(LEGACY_PASSPORT_STORAGE_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
        isMigrated = true;
      }
    }

    if (!raw) return createEmptyTicketBook();

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== TICKET_BOOK_SCHEMA_VERSION ||
      !parsed.attendedShows ||
      typeof parsed.attendedShows !== "object" ||
      Array.isArray(parsed.attendedShows)
    ) {
      return createEmptyTicketBook();
    }

    if (isMigrated) {
      try {
        storage.setItem(TICKET_BOOK_STORAGE_KEY, JSON.stringify(parsed));
        storage.removeItem(LEGACY_PASSPORT_STORAGE_KEY);
      } catch {
        // SafeStorage fallback
      }
    }

    return parsed;
  } catch {
    return createEmptyTicketBook();
  }
}

/**
 * Atomically writes the ticket book payload to safe storage and dispatches
 * an event so all mounted components react immediately.
 */
export function saveTicketBook(payload, storage = getSafeStorage()) {
  if (!payload || typeof payload !== "object") return;
  payload.updatedAt = new Date().toISOString();

  try {
    storage.setItem(TICKET_BOOK_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Handled by SafeStorage fallback
  }

  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent(TICKET_BOOK_EVENT_UPDATED, {
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
  const payload = loadTicketBook(storage);
  return Boolean(payload.attendedShows?.[String(showKey)]);
}

/**
 * Returns the attendance entry for a given show, or null if not attended.
 */
export function getAttendedShow(showKey, storage = getSafeStorage()) {
  if (!showKey) return null;
  const payload = loadTicketBook(storage);
  return payload.attendedShows?.[String(showKey)] || null;
}

/**
 * Returns all attended show entries as a flat array.
 */
export function getAllAttendedShows(storage = getSafeStorage()) {
  const payload = loadTicketBook(storage);
  return Object.values(payload.attendedShows || {});
}

/**
 * Records attendance for a show with optional metadata (seat, notes, stampId).
 */
export function recordAttendance(showKey, showMeta = {}, storage = getSafeStorage()) {
  if (!showKey) {
    return { attended: false, entry: null, payload: loadTicketBook(storage) };
  }

  const payload = loadTicketBook(storage);
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
  saveTicketBook(payload, storage);

  return { attended: true, entry, payload };
}

/**
 * Removes attendance record for a show.
 */
export function removeAttendance(showKey, storage = getSafeStorage()) {
  if (!showKey) {
    return { attended: false, payload: loadTicketBook(storage) };
  }

  const payload = loadTicketBook(storage);
  const key = String(showKey);
  if (payload.attendedShows[key]) {
    delete payload.attendedShows[key];
    saveTicketBook(payload, storage);
  }

  return { attended: false, payload };
}

/**
 * Toggles attendance state for a show.
 */
export function toggleAttendance(showKey, showMeta = {}, storage = getSafeStorage()) {
  if (!showKey) {
    return { attended: false, entry: null, payload: loadTicketBook(storage) };
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
export function useTicketBookAttendance(showKey, showMeta = null, options = {}) {
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
      window.addEventListener(TICKET_BOOK_EVENT_UPDATED, syncState);
      window.addEventListener("storage", syncState);
      return () => {
        window.removeEventListener(TICKET_BOOK_EVENT_UPDATED, syncState);
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
 * React hook providing the entire ticket book state, total attended count,
 * attended shows array, and atomic removal with cross-component reactivity.
 */
export function useTicketBook(options = {}) {
  const storage = options.storage || getSafeStorage(options.env);
  const [payload, setPayload] = useState(() => loadTicketBook(storage));

  useEffect(() => {
    const syncState = () => {
      setPayload(loadTicketBook(storage));
    };

    syncState();

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener(TICKET_BOOK_EVENT_UPDATED, syncState);
      window.addEventListener("storage", syncState);
      return () => {
        window.removeEventListener(TICKET_BOOK_EVENT_UPDATED, syncState);
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
