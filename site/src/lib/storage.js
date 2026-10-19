/**
 * storage.js — Resilient Storage Abstraction & Safari Private / SSR Fallback
 *
 * Provides a resilient Web Storage abstraction (getSafeStorage) adhering to the
 * Storage interface contract (getItem, setItem, removeItem, clear, key, length).
 *
 * Invariants:
 * 1. Safe in SSR / headless Node.js environments (where window / localStorage are undefined).
 * 2. Gracefully degrades to an in-memory storage adapter (MemoryStorageAdapter) when
 *    localStorage is disabled, throws SecurityError (e.g. Safari Private Browsing in older iOS),
 *    or throws QuotaExceededError upon write.
 * 3. Supports explicit dependency injection via env parameter for headless test isolation.
 */

export class MemoryStorageAdapter {
  constructor() {
    this._data = new Map();
  }

  get length() {
    return this._data.size;
  }

  getItem(key) {
    const k = String(key);
    return this._data.has(k) ? this._data.get(k) : null;
  }

  setItem(key, value) {
    this._data.set(String(key), String(value));
  }

  removeItem(key) {
    this._data.delete(String(key));
  }

  clear() {
    this._data.clear();
  }

  key(index) {
    const idx = Number(index);
    if (isNaN(idx) || idx < 0 || idx >= this._data.size) return null;
    return Array.from(this._data.keys())[idx] ?? null;
  }
}

let defaultMemoryStorage = null;

function getSharedMemoryStorage() {
  if (!defaultMemoryStorage) {
    defaultMemoryStorage = new MemoryStorageAdapter();
  }
  return defaultMemoryStorage;
}

export class SafeStorage {
  constructor(backend, fallback = null) {
    this.backend = backend;
    this.fallback = fallback || getSharedMemoryStorage();
    this.isDegraded = false;
  }

  _degradeAndCopy() {
    if (this.isDegraded) return;
    this.isDegraded = true;
    try {
      const len = this.backend.length ?? 0;
      for (let i = 0; i < len; i++) {
        const k = this.backend.key(i);
        if (k !== null && k !== undefined) {
          const val = this.backend.getItem(k);
          if (val !== null) {
            this.fallback.setItem(k, val);
          }
        }
      }
    } catch {
      // Ignore errors during copy
    }
  }

  _safe(fn) {
    if (this.isDegraded) return fn(this.fallback);
    try {
      return fn(this.backend);
    } catch {
      this._degradeAndCopy();
      return fn(this.fallback);
    }
  }

  get length() {
    return this._safe((s) => s.length ?? 0);
  }

  getItem(key) {
    return this._safe((s) => s.getItem(key));
  }

  setItem(key, value) {
    return this._safe((s) => s.setItem(key, value));
  }

  removeItem(key) {
    return this._safe((s) => s.removeItem(key));
  }

  clear() {
    return this._safe((s) => s.clear());
  }

  key(index) {
    return this._safe((s) => s.key(index));
  }
}

let activeSafeStorageSingleton = null;

export function resetDefaultSafeStorage() {
  defaultMemoryStorage = new MemoryStorageAdapter();
  activeSafeStorageSingleton = null;
}

export function getSafeStorage(env) {
  if (!env && activeSafeStorageSingleton) {
    return activeSafeStorageSingleton;
  }

  let candidate = null;

  if (env) {
    candidate = env.storage || env.localStorage || null;
  } else if (typeof window !== "undefined" && window.localStorage) {
    try {
      candidate = window.localStorage;
    } catch {
      candidate = null;
    }
  } else if (typeof localStorage !== "undefined") {
    try {
      candidate = localStorage;
    } catch {
      candidate = null;
    }
  }

  if (candidate) {
    try {
      const probeKey = "__hg_probe__";
      candidate.setItem(probeKey, "1");
      candidate.removeItem(probeKey);
      const safe = new SafeStorage(candidate, getSharedMemoryStorage());
      if (!env) {
        activeSafeStorageSingleton = safe;
      }
      return safe;
    } catch {
      // Candidate exists but fails write/read probe (Safari Private mode or disabled)
    }
  }

  const memory = getSharedMemoryStorage();
  if (!env) {
    activeSafeStorageSingleton = memory;
  }
  return memory;
}
