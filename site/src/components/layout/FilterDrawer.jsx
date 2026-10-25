import { useI18n } from "../../lib/i18n.jsx";

export function FilterDrawer({
  isOpen,
  tab,
  draftTab,
  onSelectTab,
  onClose,
  onCommit,
  confirmButtonLabel,
  renderShowNavigator,
  renderSongNavigator,
  renderVenueNavigator,
}) {
  const { t } = useI18n();
  if (!isOpen) return null;

  const currentTab = draftTab || tab;

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

        {/* Sheet Header: Compact Segmented Tab Row + Close Button (ADR-0126) */}
        <div className="flex items-center justify-between border-b border-line-soft px-3 py-2 bg-paper/50 gap-2">
          {/* Segmented Tab Controls: [ 🎫 場次 | 🎵 歌曲 | 🏛️ 場地 ] */}
          <div
            className="grid flex-1 grid-cols-3 divide-x-[1.5px] divide-ink overflow-hidden rounded-[4px] border-[1.5px] border-ink bg-card shadow-2xs font-display text-[12px] font-black"
            role="tablist"
            aria-label={t("nav.directionLabel", "查詢維度切換")}
          >
            <button
              type="button"
              role="tab"
              data-testid="drawer-tab-show"
              aria-selected={currentTab === "show"}
              onClick={() => onSelectTab?.("show")}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 cursor-pointer transition-colors ${
                currentTab === "show"
                  ? "bg-band text-band-ink font-black"
                  : "bg-card text-muted hover:text-ink hover:bg-tape-tint/40"
              }`}
            >
              <span aria-hidden="true">🎫</span>
              <span>{t("nav.shows", "場次")}</span>
            </button>
            <button
              type="button"
              role="tab"
              data-testid="drawer-tab-song"
              aria-selected={currentTab === "song"}
              onClick={() => onSelectTab?.("song")}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 cursor-pointer transition-colors border-l-[1.5px] border-ink ${
                currentTab === "song"
                  ? "bg-band text-band-ink font-black"
                  : "bg-card text-muted hover:text-ink hover:bg-tape-tint/40"
              }`}
            >
              <span aria-hidden="true">🎵</span>
              <span>{t("nav.songs", "歌曲")}</span>
            </button>
            <button
              type="button"
              role="tab"
              data-testid="drawer-tab-venue"
              aria-selected={currentTab === "venue"}
              onClick={() => onSelectTab?.("venue")}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 cursor-pointer transition-colors border-l-[1.5px] border-ink ${
                currentTab === "venue"
                  ? "bg-band text-band-ink font-black"
                  : "bg-card text-muted hover:text-ink hover:bg-tape-tint/40"
              }`}
            >
              <span aria-hidden="true">🏛️</span>
              <span>{t("nav.venues", "場地")}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper border border-line-soft text-muted hover:text-ink hover:bg-tape-tint cursor-pointer font-bold"
            aria-label={t("navigators.drawer.closeAria", "關閉抽屜")}
          >
            ✕
          </button>
        </div>

        {/* Sheet Body (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {currentTab === "show" && renderShowNavigator(true)}
          {currentTab === "song" && renderSongNavigator(true)}
          {currentTab === "venue" && renderVenueNavigator(true)}
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
