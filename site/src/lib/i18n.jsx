import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  normalizeLocale,
  parseRoute,
} from "./routes.js";
import { dictZhTw } from "./locales/zh-TW.js";
import { dictJa } from "./locales/ja.js";
import { dictEn } from "./locales/en.js";
import { dictKo } from "./locales/ko.js";

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };

export const DICTIONARIES = {
  "zh-TW": dictZhTw,
  ja: dictJa,
  en: dictEn,
  ko: dictKo,
};

const I18nContext = createContext(null);

export function resolveInitialLocale(env) {
  const win = env?.window !== undefined ? env.window : (typeof window !== "undefined" ? window : null);
  const storage = env?.localStorage !== undefined ? env.localStorage : (typeof localStorage !== "undefined" ? localStorage : null);
  const nav = env?.navigator !== undefined ? env.navigator : (typeof navigator !== "undefined" ? navigator : null);

  // 1. Explicit URL hash query parameter
  if (win?.location?.hash) {
    const parsed = parseRoute(win.location.hash);
    if (parsed?.lang && SUPPORTED_LOCALES.includes(parsed.lang)) {
      return parsed.lang;
    }
  }

  // 2. Persisted user preference in localStorage
  if (storage) {
    try {
      const saved = storage.getItem("hg_locale");
      if (saved && SUPPORTED_LOCALES.includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
  }

  // 3. Browser language
  if (nav?.language) {
    const detected = normalizeLocale(nav.language);
    if (detected && SUPPORTED_LOCALES.includes(detected)) {
      return detected;
    }
  }

  // 4. Default fallback
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children, initialLocale }) {
  const [locale, setLocaleState] = useState(() => initialLocale || resolveInitialLocale());

  const setLocale = useCallback((nextLocale) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale)) return;
    setLocaleState(nextLocale);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("hg_locale", nextLocale);
      }
    } catch {
      // Ignore storage errors
    }

    // Bidirectional sync with URL hash query param
    if (typeof window !== "undefined") {
      const currentHash = window.location.hash || "#/";
      const [path, query] = currentHash.split("?");
      const params = new URLSearchParams(query || "");
      if (nextLocale === DEFAULT_LOCALE) {
        params.delete("lang");
      } else {
        params.set("lang", nextLocale);
      }
      const qs = params.toString();
      const newHash = qs ? `${path}?${qs}` : path;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
    }
  }, []);

  // Listen for external hash changes to synchronize language
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHashChange = () => {
      const r = parseRoute(window.location.hash);
      if (r?.lang && r.lang !== locale && SUPPORTED_LOCALES.includes(r.lang)) {
        setLocaleState(r.lang);
        try {
          localStorage.setItem("hg_locale", r.lang);
        } catch {
          // Ignore storage errors
        }
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [locale]);

  const dict = useMemo(() => DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE], [locale]);

  const t = useCallback(
    (key, fallback) => {
      if (!key || typeof key !== "string") return fallback ?? "";
      const keys = key.split(".");
      let cur = dict;
      for (const k of keys) {
        if (!cur || typeof cur !== "object") return fallback ?? key;
        cur = cur[k];
      }
      return cur !== undefined ? cur : (fallback ?? key);
    },
    [dict]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dict,
      supportedLocales: SUPPORTED_LOCALES,
    }),
    [locale, setLocale, t, dict]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Graceful fallback for isolated tests / SSR components rendered without provider
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key, fallback) => fallback ?? key,
      dict: dictZhTw,
      supportedLocales: SUPPORTED_LOCALES,
    };
  }
  return ctx;
}
