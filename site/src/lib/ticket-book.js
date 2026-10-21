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
    holderName: "",
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

    if (typeof parsed.holderName !== "string") {
      parsed.holderName = "";
    }

    return parsed;
  } catch {
    return createEmptyTicketBook();
  }
}

/**
 * Returns the global ticket holder name / ID from storage.
 */
export function getTicketBookHolderName(storage = getSafeStorage()) {
  const payload = loadTicketBook(storage);
  return payload.holderName || "";
}

/**
 * Updates the global ticket holder name / ID in storage and notifies components.
 */
export function setTicketBookHolderName(name, storage = getSafeStorage()) {
  const payload = loadTicketBook(storage);
  payload.holderName = String(name || "").trim().slice(0, 40);
  saveTicketBook(payload, storage);
  return payload.holderName;
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

/**
 * Generates a standardized backup envelope payload for export.
 * Adheres to Issue #38 / #42 envelope specification.
 */
export function exportTicketBookBackup(storage = getSafeStorage()) {
  const payload = loadTicketBook(storage);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `higedan-ticket-book-backup-${ts}.json`;

  return {
    schema: "hg_ticket_book_backup_v1",
    version: TICKET_BOOK_SCHEMA_VERSION,
    app: "official-higedan-dism-setlist-archive",
    exportedAt: now.toISOString(),
    filename,
    holderName: payload.holderName || "",
    attendedShows: payload.attendedShows || {},
  };
}

/**
 * Encodes a ticket book payload into a URL-safe Base64 transfer code.
 */
export function encodeTicketBookTransferCode(payload) {
  if (!payload || typeof payload !== "object") return "";
  try {
    const jsonStr = JSON.stringify(payload);
    let b64 = "";
    if (typeof globalThis !== "undefined" && globalThis.Buffer) {
      b64 = globalThis.Buffer.from(jsonStr, "utf-8").toString("base64");
    } else if (typeof btoa !== "undefined") {
      b64 = btoa(unescape(encodeURIComponent(jsonStr)));
    }
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

/**
 * Decodes a URL-safe Base64 transfer code back to an object.
 */
export function decodeTicketBookTransferCode(code) {
  if (!code || typeof code !== "string") return null;
  const trimmed = code.trim();
  if (!trimmed) return null;

  try {
    let normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) {
      normalized += "=";
    }
    let jsonStr = "";
    if (typeof globalThis !== "undefined" && globalThis.Buffer) {
      jsonStr = globalThis.Buffer.from(normalized, "base64").toString("utf-8");
    } else if (typeof atob !== "undefined") {
      jsonStr = decodeURIComponent(escape(atob(normalized)));
    }
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Strip control chars (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F) but preserve \t (0x09), \n (0x0A), \r (0x0D)
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Helper to clean control characters and normalize Unicode to NFC.
 */
function sanitizeString(str) {
  if (typeof str !== "string") return "";
  const nfc = str.normalize("NFC");
  return nfc.replace(CONTROL_CHARS_REGEX, "");
}

/**
 * Checks for prototype pollution keys in object hierarchies.
 */
function hasProtoPollution(obj) {
  if (!obj || typeof obj !== "object") return false;
  for (const key of Object.keys(obj)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return true;
    }
    if (obj[key] && typeof obj[key] === "object") {
      if (hasProtoPollution(obj[key])) return true;
    }
  }
  return false;
}

/**
 * 6-Tier Defensive Validator and Diff Calculator for Ticket Book Backups.
 *
 * Tier 1: Strict JSON / Object validation
 * Tier 2: Prototype pollution defense (__proto__, constructor, prototype)
 * Tier 3: String control character cleaning and Unicode NFC normalization
 * Tier 4: Seat string bounding (<= 50 chars)
 * Tier 5: Notes string bounding (<= 300 chars)
 * Tier 6: Orphan show preservation (flags shows not found in archive)
 */
export function parseAndValidateTicketBookBackup(input, currentPayload = null, knownShowKeys = []) {
  if (!input) return { valid: false, error: "EMPTY_INPUT" };

  let parsed = input;

  if (typeof input === "string") {
    // Preliminary text check for prototype pollution
    if (
      input.includes('"__proto__"') ||
      input.includes('"constructor"') ||
      input.includes('"prototype"')
    ) {
      return { valid: false, error: "INVALID_STRUCTURE" };
    }

    try {
      parsed = JSON.parse(input);
    } catch {
      return { valid: false, error: "INVALID_JSON" };
    }
  }

  // Tier 1: Must be an object, not array, not null
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { valid: false, error: "INVALID_STRUCTURE" };
  }

  // Tier 2: Prototype pollution check
  if (hasProtoPollution(parsed)) {
    return { valid: false, error: "INVALID_STRUCTURE" };
  }

  // Extract attended shows map (support either envelope format or direct payload)
  const rawAttended = parsed.attendedShows;
  if (!rawAttended || typeof rawAttended !== "object" || Array.isArray(rawAttended)) {
    return { valid: false, error: "INVALID_STRUCTURE" };
  }

  const knownSet = new Set(Array.isArray(knownShowKeys) ? knownShowKeys.map(String) : []);
  const cleanAttended = {};

  for (const [key, rawEntry] of Object.entries(rawAttended)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) continue;

    const rawKey = rawEntry.showKey !== undefined ? String(rawEntry.showKey) : String(key);
    const cleanKey = sanitizeString(rawKey);
    if (!cleanKey) continue;

    const isKnown = knownSet.size === 0 || knownSet.has(cleanKey);

    // Tier 3, 4, 5, 6
    const entry = {
      showKey: cleanKey,
      attendedAt: sanitizeString(String(rawEntry.attendedAt || "")).slice(0, 10),
      seat: sanitizeString(String(rawEntry.seat || "")).slice(0, 50),
      notes: sanitizeString(String(rawEntry.notes || "")).slice(0, 300),
      stampId: sanitizeString(String(rawEntry.stampId || "default")).slice(0, 30),
      includeSeat: rawEntry.includeSeat !== undefined ? Boolean(rawEntry.includeSeat) : true,
      includeNotes: rawEntry.includeNotes !== undefined ? Boolean(rawEntry.includeNotes) : true,
      favorite: Boolean(rawEntry.favorite),
      updatedAt: rawEntry.updatedAt || new Date().toISOString(),
      isOrphaned: !isKnown || Boolean(rawEntry.isOrphaned),
    };

    cleanAttended[cleanKey] = entry;
  }

  // Diff calculation
  const currentAttended = (currentPayload && currentPayload.attendedShows) || {};
  let newShowsCount = 0;
  let updatedShowsCount = 0;
  const newShows = [];
  const updatedShows = [];

  for (const k of Object.keys(cleanAttended)) {
    if (currentAttended[k]) {
      updatedShowsCount++;
      updatedShows.push(k);
    } else {
      newShowsCount++;
      newShows.push(k);
    }
  }

  return {
    valid: true,
    parsedPayload: {
      holderName: sanitizeString(String(parsed.holderName || "")).slice(0, 40),
      attendedShows: cleanAttended,
    },
    diff: {
      newShowsCount,
      updatedShowsCount,
      totalIncomingShows: Object.keys(cleanAttended).length,
      newShows,
      updatedShows,
    },
  };
}

/**
 * Imports a validated ticket book payload in merge or overwrite mode.
 */
export function importTicketBookBackup(parsedPayload, options = {}, storage = getSafeStorage()) {
  if (!parsedPayload || !parsedPayload.attendedShows) {
    return { success: false, error: "INVALID_PAYLOAD" };
  }

  const mode = options.mode || "merge";
  const payload = loadTicketBook(storage);

  if (parsedPayload.holderName) {
    payload.holderName = parsedPayload.holderName;
  }

  if (mode === "overwrite") {
    payload.attendedShows = { ...parsedPayload.attendedShows };
  } else {
    // Merge mode: add new shows, update fields on existing shows
    for (const [key, incomingEntry] of Object.entries(parsedPayload.attendedShows)) {
      const existing = payload.attendedShows[key];
      if (!existing) {
        payload.attendedShows[key] = { ...incomingEntry };
      } else {
        payload.attendedShows[key] = {
          ...existing,
          ...incomingEntry,
          seat: incomingEntry.seat || existing.seat,
          notes: incomingEntry.notes || existing.notes,
          stampId: incomingEntry.stampId || existing.stampId,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  saveTicketBook(payload, storage);
  return { success: true, payload };
}
