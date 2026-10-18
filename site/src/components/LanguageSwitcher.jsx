import { useState, useRef, useEffect } from "react";
import { useI18n } from "../lib/i18n.jsx";

export const LOCALE_LABELS = {
  "zh-TW": "繁中",
  ja: "日本語",
  en: "EN",
  ko: "한국어",
};

export function LanguageSwitcher({ className = "", menuPosition = "down", fab = false }) {
  const { locale, setLocale, supportedLocales } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const onOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const hasDisplayClass = /(?:^|\s)(?:[a-z0-9-]+:)?(?:hidden|block|inline-block|inline|flex|inline-flex|grid)(?:\s|$)/.test(className);
  const displayClass = hasDisplayClass ? "" : "inline-block";
  const rootClass = ["relative", displayClass, "text-left select-none font-mono", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={containerRef}
      className={rootClass}
      data-testid="language-switcher"
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={
          fab
            ? "flex h-11 w-11 items-center justify-center rounded-full border-[2px] border-ink bg-paper text-ink shadow-[2.5px_2.5px_0_#000] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all text-base touch-stamp focus-visible:outline-2 focus-visible:outline-band-ink"
            : "inline-flex items-center gap-1.5 px-2.5 py-1 min-h-[36px] sm:min-h-[38px] rounded-[4px] border-[1.5px] border-ink/30 bg-card text-ink hover:border-ink hover:bg-tape-tint/50 text-xs font-bold shadow-2xs transition-colors cursor-pointer touch-stamp focus-visible:outline-2 focus-visible:outline-band-ink"
        }
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`切換語系 / Switch Language / 言語切替 / 언어 선택（${LOCALE_LABELS[locale] || locale}）`}
      >
        <span aria-hidden="true" className={fab ? "text-lg" : "text-sm"}>🌐</span>
        {!fab && (
          <>
            <span>{LOCALE_LABELS[locale] || locale}</span>
            <span aria-hidden="true" className="text-[10px] opacity-70">▾</span>
          </>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Language selection"
          className={
            menuPosition === "up"
              ? "absolute bottom-full mb-2 right-0 w-28 rounded-[4px] border-[1.5px] border-ink bg-card shadow-md py-1 z-50 divide-y divide-line-soft/60"
              : "absolute right-0 mt-1 w-28 rounded-[4px] border-[1.5px] border-ink bg-card shadow-md py-1 z-50 divide-y divide-line-soft/60"
          }
        >
          {supportedLocales.map((code) => {
            const isCur = code === locale;
            return (
              <button
                key={code}
                role="menuitem"
                type="button"
                aria-current={isCur ? "true" : undefined}
                onClick={() => {
                  setLocale(code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  isCur
                    ? "bg-band text-band-ink font-extrabold"
                    : "text-ink hover:bg-tape-tint/40 font-medium"
                }`}
              >
                <span>{LOCALE_LABELS[code] || code}</span>
                {isCur && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
