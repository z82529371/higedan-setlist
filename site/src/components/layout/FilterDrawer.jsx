import { useI18n } from "../../lib/i18n.jsx";

export function FilterDrawer({
  isOpen,
  tab,
  onClose,
  onCommit,
  confirmButtonLabel,
  renderShowNavigator,
  renderSongNavigator,
  renderVenueNavigator,
}) {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/60 backdrop-blur-xs sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t("navigators.drawer.drawerAria", "篩選抽屜")}
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[85vh] w-full rounded-t-[14px] border-t-[2px] border-x-[2px] border-ink bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Drag Handle Bar */}
        <div className="flex justify-center pt-2 pb-1" aria-hidden="true">
          <div className="h-1.5 w-12 rounded-full bg-line-soft" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-2 bg-paper/50">
          <div className="flex items-center gap-1.5 font-display text-[14px] font-black">
            <span aria-hidden="true">
              {tab === "show" ? "🏷️" : tab === "song" ? "🎵" : "🏛️"}
            </span>
            <span>
              {tab === "show"
                ? t("navigators.drawer.showFilterTitle", "篩選演出場次")
                : tab === "song"
                ? t("navigators.drawer.songFilterTitle", "挑選歌曲演出檔案")
                : t("navigators.drawer.venueFilterTitle", "挑選場地歷史紀錄")}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-paper border border-line-soft text-muted hover:text-ink hover:bg-tape-tint cursor-pointer font-bold"
            aria-label={t("navigators.drawer.closeAria", "關閉抽屜")}
          >
            ✕
          </button>
        </div>

        {/* Sheet Body (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {tab === "show" && renderShowNavigator(true)}
          {tab === "song" && renderSongNavigator(true)}
          {tab === "venue" && renderVenueNavigator(true)}
        </div>

        {/* Bottom Sticky Action Bar (Staged Commit: Cancel + Confirm Apply) */}
        <div className="border-t border-line-soft bg-paper p-3 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 rounded bg-card py-2.5 font-mono text-[13px] font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer active:scale-[0.98]"
          >
            {t("navigators.drawer.cancel", "取消")}
          </button>
          <button
            type="button"
            onClick={onCommit}
            className="flex-1 rounded bg-band py-2.5 px-3 font-display text-[13px] font-black text-band-ink border border-ink/40 shadow-xs hover:brightness-105 transition-all cursor-pointer active:scale-[0.98] truncate"
          >
            {confirmButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
