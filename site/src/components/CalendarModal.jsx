import React, { useState, useMemo, useEffect } from "react";
import { getUnitTypeLabel, shortUnitTitle } from "../lib/domain.js";

/**
 * CalendarModal
 * 專為 Official 髭男 dism 歷史演出設計的日曆懸浮視窗 (ADR-0096)
 * - 依年份 (2012–2026) 與月份自由瀏覽
 * - 智能空月份跳過：步進按鈕 (◀ / ▶) 直接跳過無演出月份；年份切換時月份選單僅列出該年有演出的月份
 * - 嚴格約束：只有當天有公開演出的日期才可點選，無演出日期禁選置灰
 * - 單日單場點選直接跳轉；單日多場展開快選選單
 */
export default function CalendarModal({
  isOpen,
  onClose,
  allUnits,
  onSelectShow,
}) {
  // Compute date map: "YYYY-MM-DD" -> array of { show, unit }, plus ordered active months list
  const {
    dateShowsMap,
    availableYears,
    activeMonthsList,
    monthsByYear,
  } = useMemo(() => {
    const map = new Map();
    const yearsSet = new Set();
    const monthsSet = new Set();
    const yearToMonths = new Map();

    for (const unit of allUnits || []) {
      for (const show of unit.shows || []) {
        if (!show.date) continue;
        const d = show.date.replace(/\./g, "-");
        if (!map.has(d)) map.set(d, []);
        map.get(d).push({
          show,
          unit,
        });

        const ym = d.substring(0, 7);
        monthsSet.add(ym);

        const [yStr, mStr] = ym.split("-");
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);
        if (!isNaN(y) && !isNaN(m)) {
          yearsSet.add(y);
          if (!yearToMonths.has(y)) yearToMonths.set(y, new Set());
          yearToMonths.get(y).add(m);
        }
      }
    }

    const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
    const sortedMonths = Array.from(monthsSet).sort(); // chronological "2012-07" ... "2026-09"

    const monthsByYearMap = new Map();
    for (const [y, mSet] of yearToMonths.entries()) {
      monthsByYearMap.set(y, Array.from(mSet).sort((a, b) => a - b));
    }

    return {
      dateShowsMap: map,
      availableYears: sortedYears,
      activeMonthsList: sortedMonths,
      monthsByYear: monthsByYearMap,
    };
  }, [allUnits]);

  // Current year & month in view (Default: latest active year with shows, e.g. 2024-09)
  const [currentYear, setCurrentYear] = useState(2024);
  const [currentMonth, setCurrentMonth] = useState(9); // 1-12
  const [selectedDayShows, setSelectedDayShows] = useState(null); // for multi-show popup: { date, shows: [...] }

  // Current YYYY-MM key
  const currentYM = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const currentMonthIdx = activeMonthsList.indexOf(currentYM);

  // Available active months in the selected year
  const activeMonthsInYear = monthsByYear.get(currentYear) || [];

  // Reset multi-show picker on month/year change or open
  useEffect(() => {
    setSelectedDayShows(null);
  }, [currentYear, currentMonth, isOpen]);

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (selectedDayShows) {
          setSelectedDayShows(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedDayShows, onClose]);

  if (!isOpen) return null;

  // Calendar math for currentYear & currentMonth (1-indexed)
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0: Sun, 1: Mon...

  // Stepper: directly navigate to previous/next active month with shows (skipping empty months)
  const canGoPrev = currentMonthIdx > 0;
  const canGoNext = currentMonthIdx >= 0 && currentMonthIdx < activeMonthsList.length - 1;

  const prevMonth = () => {
    setSelectedDayShows(null);
    if (canGoPrev) {
      const prevYM = activeMonthsList[currentMonthIdx - 1];
      const [y, m] = prevYM.split("-").map(Number);
      setCurrentYear(y);
      setCurrentMonth(m);
    }
  };

  const nextMonth = () => {
    setSelectedDayShows(null);
    if (canGoNext) {
      const nextYM = activeMonthsList[currentMonthIdx + 1];
      const [y, m] = nextYM.split("-").map(Number);
      setCurrentYear(y);
      setCurrentMonth(m);
    }
  };

  const handleYearChange = (newYear) => {
    setCurrentYear(newYear);
    setSelectedDayShows(null);
    const monthsInNewYear = monthsByYear.get(newYear) || [];
    if (monthsInNewYear.length > 0) {
      // If currentMonth exists in new year, keep it; otherwise pick closest or first
      if (monthsInNewYear.includes(currentMonth)) {
        // keep currentMonth
      } else {
        setCurrentMonth(monthsInNewYear[0]);
      }
    }
  };

  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
    setSelectedDayShows(null);
  };

  const handleDayClick = (dateStr, showsList) => {
    if (!showsList || showsList.length === 0) return;
    if (showsList.length === 1) {
      onSelectShow(showsList[0].show.id);
      onClose();
    } else {
      // Multiple shows on the same day (e.g. Free live 1部 & 2部)
      setSelectedDayShows({ date: dateStr, shows: showsList });
    }
  };

  // Month total shows count
  let monthShowsCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dateShowsMap.has(dStr)) {
      monthShowsCount += dateShowsMap.get(dStr).length;
    }
  }

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="演出日曆"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[440px] rounded-2xl border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-lg text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title + Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-line-soft">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">📅</span>
            <div>
              <h3 className="m-0 text-[16px] font-bold tracking-tight text-ink">
                歷史演出日曆
              </h3>
              <p className="m-0 text-[11px] font-mono text-muted">
                僅點選標示之有場次日期
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-paper border border-line-soft text-muted hover:text-ink hover:bg-tape-tint active:scale-95 cursor-pointer font-bold text-sm transition-transform"
            aria-label="關閉日曆"
          >
            ✕
          </button>
        </div>

        {/* Year & Month Controller (Skipping Empty Months ADR-0096) */}
        <div className="my-3 flex items-center justify-between gap-1.5 px-0.5 sm:px-1">
          {/* Year selector */}
          <select
            value={currentYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
            className="rounded-[4px] border border-ink/25 bg-paper px-2 py-1 text-[13px] font-bold text-ink focus:border-pool focus:outline-none cursor-pointer"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y} 年
              </option>
            ))}
          </select>

          {/* Month Stepper & Selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-ink/20 bg-paper hover:bg-tape-tint disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-mono font-bold text-xs"
              title="上一個有演出的月份"
            >
              ◀
            </button>

            {/* Month select dropdown: Only lists active months in currentYear */}
            <select
              value={currentMonth}
              onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
              className="rounded-[4px] border border-ink/25 bg-paper px-2 py-1 font-mono text-[13px] font-black text-center text-ink focus:border-pool focus:outline-none cursor-pointer"
            >
              {activeMonthsInYear.map((m) => (
                <option key={m} value={m}>
                  {m} 月
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext}
              className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-ink/20 bg-paper hover:bg-tape-tint disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-mono font-bold text-xs"
              title="下一個有演出的月份"
            >
              ▶
            </button>
          </div>

          {/* Month show count pill */}
          <span className="font-mono text-[11px] text-muted rounded-[3px] bg-paper px-2 py-1 border border-line-soft/60 shrink-0">
            {monthShowsCount} 場
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl border border-line-soft bg-paper/60 p-2 sm:p-2.5">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-muted pb-1 mb-1 border-b border-line-soft/60">
            {weekdays.map((w, idx) => (
              <div
                key={w}
                className={idx === 0 ? "text-coral" : idx === 6 ? "text-pool" : ""}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 sm:h-10" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayShows = dateShowsMap.get(dateStr);
              const hasShows = Boolean(dayShows && dayShows.length > 0);

              if (hasShows) {
                const count = dayShows.length;
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleDayClick(dateStr, dayShows)}
                    className="relative flex flex-col items-center justify-center h-9 sm:h-10 rounded-lg border-[1.5px] border-band-ink/60 bg-band hover:bg-band-ink hover:text-band active:scale-95 text-ink font-bold cursor-pointer transition-all shadow-2xs group"
                    title={`${dateStr}（${count}場演出）點擊跳轉`}
                  >
                    <span className="font-mono text-[12px] sm:text-[13px] leading-none">
                      {day}
                    </span>
                    <span className="text-[9px] font-mono leading-none mt-0.5 opacity-90">
                      {count > 1 ? `${count}場` : "●"}
                    </span>
                  </button>
                );
              }

              // No show: disabled, dimmed, non-clickable
              return (
                <div
                  key={`day-${day}`}
                  className="flex items-center justify-center h-9 sm:h-10 rounded-lg text-muted/35 font-mono text-[11px] sm:text-[12px] cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Guidance / Tip */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted px-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-band border border-ink/40" />
            <span>黃色標記＝有演出（可點選）</span>
          </div>
          <span>全庫 520+ 歷史場次</span>
        </div>

        {/* Multi-show Picker Popover overlay (when a date has >= 2 shows) */}
        {selectedDayShows && (
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-3 bg-ink/40 backdrop-blur-xs rounded-2xl animate-fade-in">
            <div className="rounded-xl border-[1.5px] border-ink bg-card p-3 shadow-lg flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-line-soft pb-2">
                <span className="font-mono text-xs font-bold text-ink">
                  📅 {selectedDayShows.date} 共 {selectedDayShows.shows.length} 場演出
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDayShows(null)}
                  className="text-xs text-muted hover:text-ink cursor-pointer font-bold px-1.5 py-0.5"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
                {selectedDayShows.shows.map(({ show, unit }) => (
                  <button
                    key={show.id}
                    type="button"
                    onClick={() => {
                      onSelectShow(show.id);
                      onClose();
                    }}
                    className="flex flex-col text-left p-2 rounded-lg border border-line-soft bg-paper hover:bg-band hover:text-band-ink transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="truncate">{shortUnitTitle(unit) || unit.title}</span>
                      <span className="shrink-0 font-mono text-[10px] opacity-75">
                        {getUnitTypeLabel(unit)}
                      </span>
                    </div>
                    <span className="text-[12px] font-semibold text-ink mt-0.5 truncate">
                      {show.title || show.venue || "演出場次"}
                    </span>
                    <span className="font-mono text-[10px] text-muted truncate">
                      📍 {show.city} {show.venue}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
