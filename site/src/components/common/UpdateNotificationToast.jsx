import { useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { subscribeUpdateAvailable, applyServiceWorkerUpdate } from "../../lib/pwa.js";

/**
 * UpdateNotificationToast — Non-intrusive ticket-aesthetic PWA update notification banner (ADR-0137).
 *
 * Appears when a new Service Worker is waiting to activate.
 * Allows user to reload immediately while preserving URL route hash,
 * or dismiss the prompt for the current session.
 */
export function UpdateNotificationToast({ forceShow = false, onUpdate, onDismiss }) {
  const { t } = useI18n();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeUpdateAvailable(() => {
      setHasUpdate(true);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if ((!hasUpdate && !forceShow) || isDismissed) {
    return null;
  }

  const handleUpdate = () => {
    setIsUpdating(true);
    if (typeof onUpdate === "function") {
      onUpdate();
    } else {
      applyServiceWorkerUpdate();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof onDismiss === "function") {
      onDismiss();
    }
  };

  return (
    <aside
      data-testid="pwa-update-toast"
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex max-w-[calc(100vw-2rem)] sm:max-w-lg items-center gap-3 rounded-xl border-2 border-band bg-ink px-4 py-3 text-paper shadow-xl"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-base select-none shrink-0" aria-hidden="true">
          ✨
        </span>
        <p className="text-xs sm:text-sm font-medium tracking-tight text-paper truncate">
          {t("pwa.updateAvailable", "巡演歌單與功能已有新版本")}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          data-testid="pwa-update-refresh-btn"
          onClick={handleUpdate}
          disabled={isUpdating}
          className="inline-flex items-center justify-center rounded-lg bg-band px-3 py-1.5 text-xs font-bold text-band-ink shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer transition-all"
        >
          {isUpdating ? t("pwa.updating", "更新中...") : t("pwa.updateNow", "立即更新")}
        </button>
        <button
          type="button"
          data-testid="pwa-update-dismiss-btn"
          onClick={handleDismiss}
          aria-label={t("pwa.dismissAria", "關閉版本更新提醒")}
          className="inline-flex items-center justify-center rounded-lg border border-line/40 px-2.5 py-1.5 text-xs font-medium text-paper/80 hover:text-paper hover:bg-card/20 active:scale-95 cursor-pointer transition-all"
        >
          {t("pwa.dismiss", "稍後")}
        </button>
      </div>
    </aside>
  );
}

export default UpdateNotificationToast;
