import { useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { RouteIcon } from "../common/ArchivalIcons.jsx";

export function JourneyFilterDrawer({
  isOpen,
  onClose,
  onApply,
  tourOptions = [],
  careerYears = [],
  currentTourId = "ALL",
  currentYear = "ALL",
}) {
  const { t } = useI18n();

  // Draft state: changes are only committed when user taps "確認套用"
  const [draftTourId, setDraftTourId] = useState(currentTourId);
  const [draftYear, setDraftYear] = useState(currentYear);

  // Sync draft state whenever drawer opens with current values
  useEffect(() => {
    if (isOpen) {
      setDraftTourId(currentTourId);
      setDraftYear(currentYear);
    }
  }, [isOpen, currentTourId, currentYear]);

  if (!isOpen) return null;

  const handleCommit = () => {
    onApply({
      tourId: draftTourId,
      year: draftYear,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/65 sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t("venueMap.filterDrawerAria", "巡演篩選抽屜")}
      data-testid="journey-filter-drawer"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 max-h-[85vh] w-full rounded-t-[3px] border-t-[2px] border-x-[2px] border-ink bg-card shadow-[0_-6px_0_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Drag Handle Bar */}
        <div className="flex justify-center pt-2 pb-1" aria-hidden="true">
          <div className="h-1 w-10 rounded-[2px] bg-line-soft" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-2.5 bg-paper/50">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-ink shrink-0" />
            <span className="font-display text-[14px] font-black text-ink">
              {t("venueMap.journeyFilterTitle", "巡演足跡篩選")}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-paper border border-ink/40 text-muted hover:text-ink hover:bg-tape-tint cursor-pointer touch-stamp font-bold"
            aria-label={t("navigators.drawer.closeAria", "關閉抽屜")}
          >
            ✕
          </button>
        </div>

        {/* Sheet Body (Scrollable options) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 1. Tour Selection */}
          <div className="space-y-1.5">
            <label
              htmlFor="drawer-journey-tour-select"
              className="block font-mono text-[11px] font-bold text-muted uppercase tracking-wider"
            >
              {t("venueMap.filterByTour")}:
            </label>
            <select
              id="drawer-journey-tour-select"
              data-testid="drawer-journey-tour-select"
              value={draftTourId}
              onChange={(e) => {
                setDraftTourId(e.target.value);
                if (e.target.value !== "ALL") setDraftYear("ALL");
              }}
              className="w-full rounded-[4px] border border-ink/40 bg-paper px-3 py-2 font-mono text-[13px] font-bold text-ink"
            >
              <option value="ALL">{t("venueMap.allToursOption")}</option>
              {tourOptions.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Year Selection */}
          <div className="space-y-1.5">
            <label
              htmlFor="drawer-journey-year-select"
              className="block font-mono text-[11px] font-bold text-muted uppercase tracking-wider"
            >
              {t("venueMap.filterByYear")}:
            </label>
            <select
              id="drawer-journey-year-select"
              data-testid="drawer-journey-year-select"
              value={draftTourId !== "ALL" ? "ALL" : draftYear}
              disabled={draftTourId !== "ALL"}
              onChange={(e) => {
                setDraftTourId("ALL");
                setDraftYear(e.target.value);
              }}
              className="w-full rounded-[4px] border border-ink/40 bg-paper px-3 py-2 font-mono text-[13px] font-bold text-ink disabled:opacity-50"
            >
              <option value="ALL">{t("venueMap.filterAllYears")}</option>
              {careerYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom Action Bar: Cancel + Confirm Apply */}
        <div className="border-t border-line-soft bg-paper p-3 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 rounded-[3px] bg-card py-2.5 font-mono text-[13px] font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer touch-stamp"
          >
            {t("navigators.drawer.cancel", "取消")}
          </button>
          <button
            type="button"
            data-testid="journey-drawer-confirm-btn"
            onClick={handleCommit}
            className="flex-1 rounded-[3px] bg-band py-2.5 px-3 font-display text-[13px] font-black text-band-ink border border-ink/40 hover:brightness-105 transition-colors cursor-pointer touch-stamp truncate"
          >
            {t("navigators.drawer.confirm", "確認套用")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JourneyFilterDrawer;
