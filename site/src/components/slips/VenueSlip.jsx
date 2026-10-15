import { useState, useMemo, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { SLIP_ARTICLE, SLIP_TAPE } from "../../lib/constants.js";
import { getKindArray } from "../../lib/kind.js";
import { songTitle, showDate, formatShowTime } from "../../lib/domain.js";
import { routeHash } from "../../lib/track.js";
import { CATEGORY_ORDER, songFilterPillClass, TicketPerforationDivider, TicketBarcodeFooter } from "./TicketCommon.jsx";

export function VenueSlip({ venueName, globalVenueShows, unitData, onSelectShow, onSelectSong }) {
  const { locale, t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showYearBreakdown, setShowYearBreakdown] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  const venueShows = useMemo(() => {
    return globalVenueShows?.get(venueName) ?? [];
  }, [globalVenueShows, venueName]);

  // Chronologically sorted shows for milestones & career span
  const sortedShows = useMemo(() => {
    return [...venueShows].sort((a, b) => {
      const dateA = a.show?.date ?? "";
      const dateB = b.show?.date ?? "";
      return dateA.localeCompare(dateB);
    });
  }, [venueShows]);

  const firstApp = sortedShows[0] ?? null;
  const latestApp = sortedShows[sortedShows.length - 1] ?? null;
  const firstShow = firstApp?.show ?? null;
  const latestShow = latestApp?.show ?? null;

  const venueCity = firstShow?.city ?? "";
  const venuePref = firstShow?.prefecture ?? "";
  const venueRegion = firstShow?.region ?? "";

  // Venue Classification Tier & San'in / Arena Badge
  const venueTier = useMemo(() => {
    if (!venueName) return null;
    const nameLower = venueName.toLowerCase();
    const city = venueCity;
    const pref = venuePref;

    // 1. San'in Roots Sanctuary
    if (
      pref.includes("島根") ||
      pref.includes("鳥取") ||
      city.includes("松江") ||
      city.includes("米子") ||
      city.includes("出雲") ||
      nameLower.includes("canova") ||
      nameLower.includes("laughs") ||
      nameLower.includes("pianoman")
    ) {
      return {
        label: t("slips.saninSanctuary", "🌱 山陰發跡聖地"),
        cls: "text-band-ink bg-tape-tint border-ink/40 font-bold",
        desc: "樂團成軍發跡地與早期重要現場據點",
      };
    }

    // 2. Overseas
    if (
      venueRegion === "海外" ||
      city.includes("台北") ||
      city.includes("首爾") ||
      city.includes("曼谷") ||
      city.includes("新加坡") ||
      nameLower.includes("kspo") ||
      nameLower.includes("kintex") ||
      nameLower.includes("uob")
    ) {
      return {
        label: t("slips.overseasTour", "✈️ 海外遠征巡演"),
        cls: "text-pool bg-pool-wash border-pool/40 font-bold",
        desc: "世界巡演重要海外公演舞台",
      };
    }

    // 3. Arena & Dome
    if (
      nameLower.includes("arena") ||
      venueName.includes("アリーナ") ||
      venueName.includes("武道館") ||
      nameLower.includes("dome") ||
      venueName.includes("ドーム") ||
      venueName.includes("スーパーアリーナ") ||
      venueName.includes("城ホール") ||
      venueName.includes("代々木第一")
    ) {
      return {
        label: t("slips.arenaDome", "🏟️ 巨蛋 / 競技場 (Arena & Dome)"),
        cls: "text-request bg-request-wash border-request/40 font-bold",
        desc: "萬人級大型指標指標場館",
      };
    }

    // 4. Festivals / Outdoor
    const isFestival =
      venueShows.some((s) => s.unitType === "音樂節 / 拼盤") ||
      venueName.includes("公園") ||
      venueName.includes("フェス") ||
      venueName.includes("PARK");
    if (isFestival) {
      return {
        label: "🎪 音樂節 / 戶外舞台",
        cls: "text-solo bg-solo-wash border-solo/40 font-bold",
        desc: "大型音樂祭與特設野外舞台",
      };
    }

    // 5. Campus
    const isCampus =
      venueShows.some((s) => s.unitType === "校園演出") ||
      venueName.includes("大学") ||
      venueName.includes("専修") ||
      venueName.includes("講堂");
    if (isCampus) {
      return {
        label: "🏫 校園巡迴舞台",
        cls: "text-ink bg-paper border-line-soft font-bold",
        desc: "學園祭與校園文化演出",
      };
    }

    // 6. Standard Hall / Livehouse
    return {
      label: "🏠 Livehouse / 演奏廳 (Hall)",
      cls: "text-ink bg-paper border-line-soft font-bold",
      desc: "全國巡演專場公演舞台",
    };
  }, [venueName, venueCity, venuePref, venueRegion, venueShows, t]);

  // Career span years text
  const spanYearsText = useMemo(() => {
    if (!firstShow?.date || !latestShow?.date) return null;
    const y1 = firstShow.date.slice(0, 4);
    const y2 = latestShow.date.slice(0, 4);
    if (y1 === y2) return `${y1} 年`;
    const diff = parseInt(y2, 10) - parseInt(y1, 10);
    return `${y1} ～ ${y2}（跨越 ${diff + 1} 年足跡）`;
  }, [firstShow, latestShow]);

  // Year breakdown for performance frequency
  const yearBreakdown = useMemo(() => {
    const map = new Map();
    for (const app of venueShows) {
      const d = app.show?.date;
      if (d) {
        const yr = d.slice(0, 4);
        map.set(yr, (map.get(yr) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [venueShows]);

  // Top Songs performed at this venue
  const topSongs = useMemo(() => {
    if (!unitData || venueShows.length === 0) return [];
    const songCounts = new Map();
    for (const app of venueShows) {
      const ud = unitData.get(app.unitId);
      const items = ud?.full?.get(app.showId) || [];
      const seen = new Set();
      for (const it of items) {
        if (it.songId && !seen.has(it.songId)) {
          seen.add(it.songId);
          songCounts.set(it.songId, (songCounts.get(it.songId) || 0) + 1);
        }
      }
    }
    return Array.from(songCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, count]) => ({
        id,
        title: songTitle[id] || id,
        count,
      }));
  }, [venueShows, unitData]);

  // Category Counts & Available Types
  const typeCounts = useMemo(() => {
    const counts = new Map();
    for (const app of venueShows) {
      const t = app.unitType || "其他";
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return counts;
  }, [venueShows]);

  const availableTypes = useMemo(() => {
    const types = CATEGORY_ORDER.filter((t) => typeCounts.has(t));
    for (const t of typeCounts.keys()) {
      if (!types.includes(t)) types.push(t);
    }
    return types;
  }, [typeCounts]);

  const [selectedType, setSelectedType] = useState(() => availableTypes[0] ?? "巡演專場");

  useEffect(() => {
    if (availableTypes.length > 0) {
      setSelectedType(availableTypes[0]);
    }
  }, [venueName]);

  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(selectedType)) {
      setSelectedType(availableTypes[0]);
    }
  }, [availableTypes, selectedType]);

  const effectiveType = availableTypes.includes(selectedType)
    ? selectedType
    : availableTypes[0];

  const filteredVenueShows = useMemo(() => {
    if (!effectiveType) return venueShows;
    return venueShows.filter(
      (app) => (app.unitType || "其他") === effectiveType
    );
  }, [venueShows, effectiveType]);

  // Group by Unit
  const groupedByUnit = useMemo(() => {
    const groupMap = new Map();
    for (const app of filteredVenueShows) {
      if (!groupMap.has(app.unitId)) {
        groupMap.set(app.unitId, {
          unitId: app.unitId,
          unitTitle: app.unitTitle,
          unitType: app.unitType,
          earliestDate: app.show?.date ?? "9999-12-31",
          items: [],
        });
      }
      groupMap.get(app.unitId).items.push(app);
    }
    return Array.from(groupMap.values()).sort((a, b) =>
      b.earliestDate.localeCompare(a.earliestDate)
    );
  }, [filteredVenueShows]);

  const [collapsedMap, setCollapsedMap] = useState(() => new Map());

  useEffect(() => {
    const initial = new Map();
    groupedByUnit.forEach((g) => {
      if (g.items.length > 2) {
        initial.set(g.unitId, true);
      }
    });
    setCollapsedMap(initial);
  }, [venueName, effectiveType, groupedByUnit]);

  const toggleUnit = (unitId) => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      next.set(unitId, !next.get(unitId));
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) {
        if (g.items.length > 1) next.set(g.unitId, false);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) {
        if (g.items.length > 1) next.set(g.unitId, true);
      }
      return next;
    });
  };

  const hasCollapsible = groupedByUnit.some((g) => g.items.length > 1);

  const handleCopyVenueHistory = () => {
    const lines = [
      `【Official 髭男 dism @ ${venueName} 演出歷程】`,
      `📍 地點：${venuePref ? `${venuePref} · ` : ""}${venueCity}`,
      `🏛️ 累計演出：${venueShows.length} 場`,
    ];
    if (spanYearsText) {
      lines.push(`📅 年份跨度：${spanYearsText}`);
    }
    if (topSongs.length > 0) {
      lines.push(`🏆 常唱曲目：${topSongs.map((s) => `${s.title} (${s.count}次)`).join("、")}`);
    }
    lines.push("");
    lines.push("【歷史演出場次】");

    sortedShows.forEach((app) => {
      const d = app.show?.date ? showDate(app.show) : "";
      lines.push(`- ${d}｜${app.unitTitle}`);
    });

    lines.push("");
    lines.push("#Official髭男dism #ヒゲダン #聖地巡礼");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(lines.join("\n"))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2200);
        })
        .catch(() => {});
    }
  };

  if (!venueName) {
    return (
      <div className={SLIP_ARTICLE}>
        <span aria-hidden="true" className={SLIP_TAPE} />
        <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
          選一個場地，看在該場地舉行過哪些場次。
        </p>
      </div>
    );
  }

  const mapQuery = encodeURIComponent(
    `${venuePref ? venuePref + " " : ""}${venueCity ? venueCity + " " : ""}${venueName}`
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const livefansUrl = `https://www.livefans.jp/search?q=${encodeURIComponent(venueName)}`;

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="場地全域場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="relative rounded-t-[2px] bg-black/[0.025] dark:bg-white/[0.025] -mx-[26px] max-sm:-mx-4 -mt-[46px] max-sm:-mt-[42px] px-[26px] max-sm:px-4 pt-[46px] max-sm:pt-[42px] pb-3">
        {/* Level 1: Artist branding & category badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-band/15 px-2 py-0.5 font-mono text-xs font-bold text-band-ink">
              VENUE ARCHIVE
            </span>
          </div>
        </div>

        {/* Level 2: Venue Title Headline */}
        <h2 className="mt-2.5 mb-2 font-display text-[24px] sm:text-[27px] font-black leading-tight text-ink tracking-tight text-pretty">
          {venueName}{" "}
          {(venueCity || venuePref) && (
            <span className="inline-block text-[16px] sm:text-[17px] font-medium text-muted whitespace-nowrap">
              （{venuePref ? `${venuePref} · ` : ""}{venueCity}）
            </span>
          )}
        </h2>

        {/* Level 3a: Venue Identity Summary Bar (Clean, single cohesive line) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line-soft font-mono text-[12px] text-muted">
          <span className="font-bold text-ink">
            共舉辦過 <span className="tabular-nums text-[14px] text-pool font-extrabold">{venueShows.length}</span> 場演出
          </span>
          {venueTier && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-bold border ${venueTier.cls}`} title={venueTier.desc}>
              {venueTier.label}
            </span>
          )}
          {spanYearsText && (
            <span className="rounded bg-paper px-1.5 py-0.5 text-xs font-bold text-muted border border-line-soft">
              📅 {spanYearsText}
            </span>
          )}
        </div>

        {/* Level 3b: Action Toolbar & Collapsible Tools */}
        <div className="mt-2 flex flex-col gap-2 border-t border-line-soft/80 pt-2 font-mono text-[11px] slip-ignore-export">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyVenueHistory}
                className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer select-none border ${
                  copied
                    ? "bg-band text-band-ink border-band shadow-xs"
                    : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                }`}
                title="複製此場地的演出歷史紀錄"
              >
                <span>{copied ? "✓ 已複製歷程" : "📋 複製歷程"}</span>
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-ink hover:bg-band hover:border-band transition-colors no-underline"
                title="在 Google 地圖查看場館位置"
              >
                <span>🗺️ Google Maps</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowMoreTools((v) => !v)}
              className="inline-flex items-center justify-center gap-1 rounded bg-paper hover:bg-tape-tint/50 px-2.5 py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:border-ink/60 transition-colors cursor-pointer select-none"
              aria-expanded={showMoreTools}
              title="展開更多紀錄（常唱曲目、首登台/最新出演里程碑、年度分佈與資料庫外鏈）"
            >
              <span>{showMoreTools ? "收合紀錄 ▴" : "🛠️ 更多紀錄 ▾"}</span>
            </button>
          </div>

          {/* Collapsible Venue Extra Tools & Milestone Drawer */}
          {showMoreTools && (
            <div className="mt-1 flex flex-col gap-2.5 border-t border-line-soft/60 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {yearBreakdown.length >= 3 && (
                  <button
                    type="button"
                    onClick={() => setShowYearBreakdown((v) => !v)}
                    className="inline-flex items-center gap-1 rounded bg-paper px-2.5 py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:bg-tape-tint/50 transition-colors cursor-pointer select-none"
                    aria-expanded={showYearBreakdown}
                  >
                    <span>{showYearBreakdown ? "▾ 年度分佈" : "▸ 年度分佈"}</span>
                  </button>
                )}
                <a
                  href={livefansUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-muted hover:text-ink hover:bg-band hover:border-band transition-colors no-underline"
                  title="在 LiveFans 查看場館歷史演算法"
                >
                  <span>🎫 LiveFans</span>
                </a>
              </div>

              {/* Level 3.5: Top Songs Performed Here (Only when >= 4 shows & has real repeat songs) */}
              {topSongs.length > 0 && venueShows.length >= 4 && topSongs.some((s) => s.count >= 2) && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5 border-t border-line-soft/60 pt-2 font-mono text-[11px]">
                  <span className="font-bold text-muted flex items-center gap-1">
                    <span>🏆 本場地常唱曲目：</span>
                  </span>
                  {topSongs.map((s) => (
                    <a
                      key={s.id}
                      href={routeHash.song(s.id)}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectSong?.(s.id);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 border border-line-soft text-ink hover:bg-tape-tint/40 hover:border-ink/60 transition-colors no-underline cursor-pointer"
                      title={`查看歌曲《${s.title}》的全歷史演出紀錄`}
                    >
                      <span className="font-medium">{s.title}</span>
                      <span className="font-bold text-pool tabular-nums">({s.count}次)</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Level 4: Milestone Performance (Only when venue has >= 3 shows) */}
              {sortedShows.length >= 3 && firstApp && latestApp && firstApp.showId !== latestApp.showId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-t border-line-soft/80 pt-2.5 font-mono text-[12px]">
                  {/* First Live */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-xs font-bold text-muted">
                      <span className="flex items-center gap-1 text-ink">
                        <span className="text-band font-bold" aria-hidden="true">★</span> 首次登台 / 首演場次
                      </span>
                      <span className="tabular-nums font-semibold">{firstShow ? showDate(firstShow) : "—"}</span>
                    </div>
                    {firstApp && firstShow ? (
                      <a
                        href={routeHash.show(firstApp.showId)}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectShow(firstApp.showId);
                        }}
                        className="group flex flex-col text-ink no-underline hover:text-pool transition-colors"
                      >
                        <span
                          className="font-bold text-[13px] break-words line-clamp-2 leading-snug group-hover:underline"
                          title={firstApp.unitTitle}
                        >
                          {firstApp.unitTitle}
                        </span>
                      </a>
                    ) : (
                      <span className="text-muted">暫無紀錄</span>
                    )}
                  </div>

                  {/* Latest Live */}
                  <div className="flex flex-col gap-0.5 sm:border-l sm:border-line-soft/80 sm:pl-4">
                    <div className="flex items-center justify-between text-xs font-bold text-muted">
                      <span className="flex items-center gap-1 text-ink">
                        <span className="text-band font-bold" aria-hidden="true">★</span> {t("slips.latestPerformed", "最新出演場次")}
                      </span>
                      <span className="tabular-nums font-semibold">{latestShow ? showDate(latestShow, locale) : "—"}</span>
                    </div>
                    {latestApp && latestShow ? (
                      <a
                        href={routeHash.show(latestApp.showId)}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectShow(latestApp.showId);
                        }}
                        className="group flex flex-col text-ink no-underline hover:text-pool transition-colors"
                      >
                        <span
                          className="font-bold text-[13px] break-words line-clamp-2 leading-snug group-hover:underline"
                          title={latestApp.unitTitle}
                        >
                          {latestApp.unitTitle}
                        </span>
                      </a>
                    ) : (
                      <span className="text-muted">暫無紀錄</span>
                    )}
                  </div>
                </div>
              )}

              {/* Collapsible Year-by-Year Performance Frequency Drawer */}
              {showYearBreakdown && yearBreakdown.length > 0 && (
                <div className="mt-1 border-t border-line-soft/80 pt-2 font-mono text-[11px]">
                  <div className="text-muted font-bold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>📅 各年度演出頻率分佈：</span>
                    </span>
                    <span className="font-normal text-muted/70">（跨越 {yearBreakdown.length} 個年份）</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {yearBreakdown.map(([yr, count]) => (
                      <span
                        key={yr}
                        className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 border border-line-soft text-ink tabular-nums"
                      >
                        <span className="text-muted font-semibold">{yr}年</span>
                        <span className="font-bold text-ink">{count}場</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TicketPerforationDivider />

      {/* Category Tabs */}
      {availableTypes.length > 0 && (
        <div className="my-2 border-b border-line-soft pb-2.5">
          <div
            role="tablist"
            aria-label="演出類型篩選"
            className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:flex md:flex-nowrap md:[&>*]:flex-1 gap-1.5"
          >
            {availableTypes.map((cat) => {
              const count = typeCounts.get(cat) || 0;
              const isActive = effectiveType === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={songFilterPillClass(isActive)}
                  onClick={() => setSelectedType(cat)}
                >
                  <span>{t("categories." + cat, cat)}</span>
                  <span className="font-mono text-[11px] tabular-nums opacity-85">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasCollapsible && (
        <div className="flex items-center justify-end gap-2 pt-1 pb-2 font-mono text-[11px] text-muted">
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-muted transition-colors hover:text-ink hover:underline"
            onClick={expandAll}
          >
            全部展開
          </button>
          <span aria-hidden="true">・</span>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-muted transition-colors hover:text-ink hover:underline"
            onClick={collapseAll}
          >
            全部收合
          </button>
        </div>
      )}

      {groupedByUnit.length === 0 ? (
        <p className="m-0 px-1 py-6 text-center font-mono text-[13px] text-muted">
          {venueShows.length === 0 ? "此場地尚無演出紀錄" : "此分類下無演出紀錄"}
        </p>
      ) : (
        <div className="space-y-4 pt-1">
          {groupedByUnit.map((g) => {
            const isCollapsible = g.items.length > 1;
            const isCollapsed = isCollapsible && (collapsedMap.get(g.unitId) ?? false);

            return (
              <section key={g.unitId} className="flex flex-col">
                <div
                  className={`flex flex-col gap-2 rounded-[4px] border border-line-soft bg-paper/70 px-3.5 py-2.5 transition-colors ${
                    isCollapsible
                      ? "cursor-pointer hover:bg-line-soft/80 hover:border-ink/30 select-none"
                      : ""
                  }`}
                  onClick={isCollapsible ? () => toggleUnit(g.unitId) : undefined}
                  role={isCollapsible ? "button" : undefined}
                  tabIndex={isCollapsible ? 0 : undefined}
                  onKeyDown={
                    isCollapsible
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleUnit(g.unitId);
                          }
                        }
                      : undefined
                  }
                  aria-expanded={isCollapsible ? !isCollapsed : undefined}
                >
                  {/* Desktop: Single Row Layout with Title on Left, Counts at Line-End */}
                  <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
                    <h3
                      className="m-0 min-w-0 flex-1 break-words font-display text-[15px] font-extrabold leading-snug text-ink text-pretty"
                      title={g.unitTitle}
                    >
                      {g.unitTitle}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted tabular-nums">
                      <span className="font-bold text-ink">共 {g.items.length} 場</span>
                      {isCollapsible && (
                        <span className="rounded border border-line-soft bg-card px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink">
                          {isCollapsed ? "▼ 展開" : "▲ 收合"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile: Two-Tier Layout */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="m-0 min-w-0 flex-1 break-words font-display text-[14px] font-extrabold leading-snug text-ink text-pretty"
                        title={g.unitTitle}
                      >
                        {g.unitTitle}
                      </h3>
                      {isCollapsible && (
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-muted/80 text-[13px] font-bold pt-0.5"
                        >
                          {isCollapsed ? "▾" : "▴"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-line-soft/60 pt-1.5 font-mono text-[11px]">
                      <span className="font-bold text-ink tabular-nums">共 {g.items.length} 場</span>
                      {isCollapsible && (
                        <span className="rounded border border-line-soft bg-card px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink">
                          {isCollapsed ? "▼ 展開清單" : "▲ 收合清單"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isCollapsed && (
                  <ul className="m-0 mt-1 list-none p-0">
                    {g.items.map(({ showId, show }) => {
                      const ud = unitData?.get(g.unitId);
                      const fullItems = ud?.full?.get(showId) || [];
                      const songCount = fullItems.filter(
                        (i) => i.songId || i.title
                      ).length;

                      const hasSolo = fullItems.some((i) =>
                        getKindArray(i.kind).includes("satoshi-solo")
                      );
                      const hasRequest = fullItems.some((i) =>
                        getKindArray(i.kind).includes("request")
                      );
                      const hasPremiere = fullItems.some((i) =>
                        getKindArray(i.kind).includes("premiere")
                      );

                      return (
                        <li
                          key={showId}
                          className="border-b border-line-soft/80 px-2.5 py-2.5 last:border-b-0 hover:bg-paper/40 transition-colors"
                        >
                          <a
                            className="group flex items-center justify-between gap-3 text-ink no-underline transition-colors focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none"
                            href={routeHash.show(showId)}
                            onClick={(e) => {
                              e.preventDefault();
                              onSelectShow(showId);
                            }}
                          >
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex flex-wrap items-baseline gap-x-2.5 leading-snug">
                                <span className="font-mono text-[13px] font-bold text-ink group-hover:text-pool group-hover:underline">
                                  📅 {showDate(show, locale)}
                                </span>
                                {formatShowTime(show, locale) && (
                                  <span className="font-mono text-[11px] text-muted">
                                    ⏰ {formatShowTime(show, locale)}
                                  </span>
                                )}
                              </div>
                              {(hasSolo || hasRequest || hasPremiere) && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {hasSolo && (
                                    <span className="inline-block rounded-[3px] border border-solo/30 bg-solo/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-solo leading-none">
                                      ♪ {t("badges.satoshi-solo", "自彈自唱")}
                                    </span>
                                  )}
                                  {hasRequest && (
                                    <span className="inline-block rounded-[3px] border border-request/30 bg-request/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-request leading-none">
                                      ♪ {t("badges.request", "現場點歌")}
                                    </span>
                                  )}
                                  {hasPremiere && (
                                    <span className="inline-block rounded-[3px] border border-premiere/30 bg-premiere/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-premiere leading-none">
                                      ♪ {t("badges.premiere", "新歌初演")}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] tabular-nums">
                              <span className="rounded bg-paper px-2 py-0.5 font-semibold text-muted border border-line-soft">
                                {songCount > 0 ? `${songCount} 首曲目` : "尚無曲目"}
                              </span>
                              <span
                                className="font-bold text-pool opacity-80 group-hover:translate-x-0.5 transition-transform"
                                aria-hidden="true"
                              >
                                檢視歌單 →
                              </span>
                            </div>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Soundboard Engineer Run Sheet Footer */}
      <TicketBarcodeFooter
        serial={`VENUE: ${venueName.toUpperCase()} // PASS-${venueShows.length.toString().padStart(3, "0")}`}
        label="OFFICIAL HIGEDAN DISM // VENUE ARCHIVE PASS"
      />
    </article>
  );
}
