import { useMemo } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import {
  JAPAN_8_REGIONS,
  OVERSEAS_TARGET_KEY,
  SANIN_SANCTUARY_PREFECTURES,
} from "../../lib/venue-map.js";

/**
 * RegionalPrefecturePicker — Interactive Regional & Prefecture Text Quick Jump (ADR-0141).
 *
 * Provides a 2-tier structured navigator (8 Regions + Overseas Segmented Tabs ➔
 * Prefecture Capsules) directly beneath the SVG map canvas in macro overview.
 * Supports bi-directional hover mirroring, click spotlight zoom, unvisited 4-prefecture
 * history preservation, and mobile drawer horizontal blowout prevention.
 */
export function RegionalPrefecturePicker({
  mapStats,
  hoveredPref = null,
  onHoverPrefecture,
  onSelectPrefecture,
  activeRegion = "kanto",
  onSelectRegion,
  className = "",
}) {
  const { t } = useI18n();

  const activeRegionObj = useMemo(() => {
    return JAPAN_8_REGIONS.find((r) => r.id === activeRegion) || JAPAN_8_REGIONS[0];
  }, [activeRegion]);

  const candidatePrefectures = useMemo(() => {
    const byPref = mapStats?.byPrefecture || {};

    // List all prefectures belonging to the active region
    const list = activeRegionObj.prefectures.map((pref) => {
      const stat = byPref[pref];
      const showCount = stat?.showCount || 0;
      const venueCount = stat?.venueCount || 0;
      return {
        name: pref,
        showCount,
        venueCount,
        isSanin: SANIN_SANCTUARY_PREFECTURES.has(pref),
        isOverseas: Boolean(activeRegionObj.isOverseas),
        isUnvisited: showCount === 0,
      };
    });

    // Visited sorted by showCount DESC, then unvisited placed at the end
    return list.sort((a, b) => {
      if (a.isUnvisited !== b.isUnvisited) {
        return a.isUnvisited ? 1 : -1;
      }
      return b.showCount - a.showCount || a.name.localeCompare(b.name);
    });
  }, [mapStats, activeRegionObj]);

  return (
    <div
      data-testid="regional-prefecture-picker"
      className={`rounded-[4px] border border-line-soft bg-paper/90 p-2.5 sm:p-3 shadow-xs space-y-2.5 ${className}`}
    >
      {/* Header bar: Title & Nationwide Conquest Badge */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-line-soft/80 pb-2">
        <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <span aria-hidden="true">🏛️</span>
          <span>{t("venueMap.quickPickerTitle", "分區都道府縣快速導覽")}</span>
        </span>
        {mapStats && (
          <span className="font-mono text-[11px] text-muted tabular-nums">
            🇯🇵 {mapStats.visitedJapanPrefectureCount}/{mapStats.totalJapanPrefectures} (
            {mapStats.completionPercent}%) · {t("venueMap.overseasBadge", null, { count: mapStats.overseasCountryCount })}
          </span>
        )}
      </div>

      {/* Tier 1: 8 Regions + Overseas Segmented Tabs (Horizontal Scrollbar-free on mobile) */}
      <div
        data-testid="region-tabs-bar"
        className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 scrollbar-none"
      >
        {JAPAN_8_REGIONS.map((reg) => {
          const isSelected = activeRegion === reg.id;
          const label = reg.isSanin
            ? t("regions.chugokuSanin", "🌱 中國 (山陰)")
            : reg.isOverseas
            ? t("regions.overseas", "✈️ 海外")
            : t(reg.labelKey, reg.defaultLabel);

          return (
            <button
              key={reg.id}
              type="button"
              data-testid={`region-tab-${reg.id}`}
              onClick={() => onSelectRegion && onSelectRegion(reg.id)}
              className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] sm:text-[12px] font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-band text-band-ink border border-ink/40 shadow-2xs"
                  : "bg-card text-ink border border-line-soft hover:bg-tape-tint/70 hover:border-ink/40"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tier 2: Prefecture Capsules Grid */}
      <div
        data-testid="pref-capsules-grid"
        className="flex flex-wrap gap-1.5 sm:gap-2 max-h-[160px] sm:max-h-[220px] overflow-y-auto pt-0.5 scrollbar-thin"
      >
        {candidatePrefectures.map((item) => {
          const pref = item.name;
          const isHovered = hoveredPref === pref || (item.isOverseas && hoveredPref === OVERSEAS_TARGET_KEY);
          const localizedName = t(`prefectures.${pref}`, pref);

          if (item.isUnvisited) {
            return (
              <div
                key={pref}
                data-testid={`pref-capsule-${pref}`}
                title={t("venueMap.unvisitedNotice", null, { pref: localizedName })}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] border border-dashed border-ink/30 bg-paper/40 text-muted opacity-75 cursor-not-allowed select-none"
              >
                <span>{localizedName}</span>
                <span className="text-[10px] rounded bg-ink/10 px-1.5 py-0.2 font-bold tabular-nums">
                  {t("venueMap.unvisitedTag", "未踏破")}
                </span>
              </div>
            );
          }

          return (
            <button
              key={pref}
              type="button"
              data-testid={`pref-capsule-${pref}`}
              onMouseEnter={() => onHoverPrefecture && onHoverPrefecture(item.isOverseas ? OVERSEAS_TARGET_KEY : pref)}
              onMouseLeave={() => onHoverPrefecture && onHoverPrefecture(null)}
              onClick={() => onSelectPrefecture && onSelectPrefecture(item.isOverseas ? OVERSEAS_TARGET_KEY : pref)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] sm:text-[12px] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                isHovered
                  ? "bg-band text-band-ink font-bold border border-ink/60 shadow-xs ring-1 ring-band"
                  : "bg-card text-ink border border-line-soft hover:bg-tape-tint/70 hover:border-ink/50"
              }`}
            >
              <span>
                {item.isSanin && !pref.startsWith("🌱") ? "🌱 " : ""}
                {localizedName}
              </span>
              <span className="rounded-full bg-ink/10 px-1.5 py-0.2 text-[10px] font-bold tabular-nums">
                {item.showCount}
                <span className="text-[9px] opacity-75 ml-0.5">{t("venueMap.showsUnit", "場")}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RegionalPrefecturePicker;
