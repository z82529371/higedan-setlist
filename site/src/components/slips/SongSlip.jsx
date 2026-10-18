import { useState, useMemo, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { SLIP_ARTICLE, SLIP_TAPE } from "../../lib/constants.js";
import { visibleBadges } from "../../lib/kind.js";
import { songTitle, songAlias, songUnreleased, showDate, getSongAlbum, songLiveFansId } from "../../lib/domain.js";
import { buildSongHistoryText } from "../../lib/song-history-text.js";
import { trackKey, routeHash } from "../../lib/track.js";
import { CATEGORY_ORDER, songFilterPillClass, TicketPerforationDivider, TicketBarcodeFooter } from "./TicketCommon.jsx";
import { SongMilestonesDrawer } from "./SongMilestonesDrawer.jsx";

export function SongSlip({ songId, trackShows, showById, unitData, onSelectShow, onSelectVenue }) {
  const { locale, t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [onlySpecial, setOnlySpecial] = useState(false);
  const [showYearBreakdown, setShowYearBreakdown] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  const appearances = useMemo(() => {
    return songId ? (trackShows.get(trackKey("song", songId)) ?? []) : [];
  }, [trackShows, songId]);

  // Chronologically sorted appearances for milestone calculation
  const sortedAppearances = useMemo(() => {
    return [...appearances].sort((a, b) => {
      const dateA = showById.get(a.showId)?.date ?? "";
      const dateB = showById.get(b.showId)?.date ?? "";
      return dateA.localeCompare(dateB);
    });
  }, [appearances, showById]);

  const firstApp = sortedAppearances[0] ?? null;
  const latestApp = sortedAppearances[sortedAppearances.length - 1] ?? null;
  const firstShow = firstApp ? showById.get(firstApp.showId) : null;
  const latestShow = latestApp ? showById.get(latestApp.showId) : null;

  // Year breakdown for performance frequency
  const yearBreakdown = useMemo(() => {
    const map = new Map();
    for (const app of appearances) {
      const d = showById.get(app.showId)?.date;
      if (d) {
        const yr = d.slice(0, 4);
        map.set(yr, (map.get(yr) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [appearances, showById]);

  // Concert placement / role analysis
  const liveRole = useMemo(() => {
    if (appearances.length === 0) return null;
    let encoreCount = 0;
    let orderSum = 0;
    let orderCount = 0;
    for (const app of appearances) {
      if (app.item?.encore) {
        encoreCount++;
      }
      if (typeof app.item?.order === "number") {
        orderSum += app.item.order;
        orderCount++;
      }
    }
    const encoreRate = Math.round((encoreCount / appearances.length) * 100);
    const avgOrder = orderCount > 0 ? Math.round(orderSum / orderCount) : null;

    let positionText = "";
    if (encoreRate >= 50) {
      positionText = t("slips.song.encoreStaple", "安可核心常客");
    } else if (avgOrder && avgOrder <= 4) {
      positionText = t("slips.song.energeticOpener", "開場熱血衝刺 (前段)");
    } else if (avgOrder && avgOrder >= 14) {
      positionText = t("slips.song.climaxFinale", "本篇高潮壓軸 (後段)");
    } else {
      positionText = t("slips.song.midTransition", "中段沉浸銜接 (中段)");
    }
    return {
      encoreRate,
      avgOrder,
      positionText,
    };
  }, [appearances, t]);

  // Rarity Tier & Dormancy
  const rarityTier = useMemo(() => {
    const total = appearances.length;
    if (total === 0) return null;
    let label = t("slips.song.activeLive", "🎵 活躍演出曲"), cls = "text-ink bg-paper border-line-soft";
    if (total >= 100) { label = t("slips.song.coreStaple", "🔥 核心定番曲"); cls = "text-request bg-request-wash border-request/40"; }
    else if (total >= 40) { label = t("slips.song.mainstayTrack", "⭐ 巡演主力曲"); cls = "text-band-ink bg-tape-tint border-ink/30"; }
    else if (total <= 3) { label = t("slips.song.phantomSpecial", "💎 幻之限定曲"); cls = "text-unreleased bg-unreleased-wash border-unreleased/40"; }
    else if (total <= 12) { label = t("slips.song.rareGem", "✨ 珍稀選曲"); cls = "text-solo bg-paper border-line-soft"; }

    const latestYear = latestShow?.date ? parseInt(latestShow.date.slice(0, 4), 10) : null;
    const isDormant = latestYear && latestYear <= 2021 && total > 3;

    return { label, cls, isDormant };
  }, [appearances, latestShow, t]);

  // Special version statistics (satoshi-solo, request, premiere)
  const specialVersionCounts = useMemo(() => {
    let solo = 0;
    let request = 0;
    let premiere = 0;
    for (const app of appearances) {
      const kind = app.item?.kind ?? "";
      if (kind.includes("satoshi-solo")) solo++;
      if (kind.includes("request")) request++;
      if (kind.includes("premiere")) premiere++;
    }
    return {
      solo,
      request,
      premiere,
      total: solo + request + premiere,
    };
  }, [appearances]);

  const hasSpecials = specialVersionCounts.total > 0;

  const typeCounts = useMemo(() => {
    const counts = new Map();
    for (const app of appearances) {
      const t = app.unitType || "其他";
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return counts;
  }, [appearances]);

  const availableTypes = useMemo(() => {
    const types = CATEGORY_ORDER.filter((t) => typeCounts.has(t));
    for (const t of typeCounts.keys()) {
      if (!types.includes(t)) types.push(t);
    }
    return types;
  }, [typeCounts]);

  const [selectedType, setSelectedType] = useState(() => availableTypes[0] ?? "巡演專場");

  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(selectedType)) {
      setSelectedType(availableTypes[0]);
    }
  }, [availableTypes, selectedType]);

  const effectiveType = availableTypes.includes(selectedType)
    ? selectedType
    : availableTypes[0];

  const filteredAppearances = useMemo(() => {
    if (onlySpecial) {
      return appearances.filter((app) => {
        const kind = app.item?.kind ?? "";
        return (
          kind.includes("satoshi-solo") ||
          kind.includes("request") ||
          kind.includes("premiere")
        );
      });
    }
    if (!effectiveType) return appearances;
    return appearances.filter(
      (app) => (app.unitType || "其他") === effectiveType
    );
  }, [appearances, effectiveType, onlySpecial]);

  const COLLAPSIBLE_THRESHOLD = 3;

  const groupedByUnit = useMemo(() => {
    const groups = [];
    let current = null;
    for (const app of filteredAppearances) {
      if (!current || current.unitId !== app.unitId) {
        current = {
          unitId: app.unitId,
          unitTitle: app.unitTitle,
          unitType: app.unitType,
          items: [],
        };
        groups.push(current);
      }
      current.items.push(app);
    }
    return groups;
  }, [filteredAppearances]);

  const [collapsedMap, setCollapsedMap] = useState(() => new Map());

  useEffect(() => {
    const initial = new Map();
    groupedByUnit.forEach((g) => {
      if (g.items.length > COLLAPSIBLE_THRESHOLD) {
        initial.set(g.unitId, true);
      }
    });
    setCollapsedMap(initial);
  }, [songId, effectiveType, onlySpecial, groupedByUnit]);

  if (!songId) {
    return (
      <div className={SLIP_ARTICLE}>
        <span aria-hidden="true" className={SLIP_TAPE} />
        <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
          {t("slips.selectSongHint", "選一首歌曲，看它在全檔案庫哪幾場出現過。")}
        </p>
      </div>
    );
  }

  const toggleUnit = (unitId) => {
    setCollapsedMap((prev) => new Map(prev).set(unitId, !prev.get(unitId)));
  };

  const expandAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) if (g.items.length > COLLAPSIBLE_THRESHOLD) next.set(g.unitId, false);
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) if (g.items.length > COLLAPSIBLE_THRESHOLD) next.set(g.unitId, true);
      return next;
    });
  };

  const hasCollapsible = groupedByUnit.some(
    (g) => g.items.length > COLLAPSIBLE_THRESHOLD
  );

  const albumName = getSongAlbum({ id: songId });
  const livefansId = songLiveFansId[songId];
  const youtubeUrl = `https://www.youtube.com/results?search_query=Official+髭男+dism+${encodeURIComponent(songTitle[songId] || songId)}+Live`;
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent("Official 髭男 dism " + (songTitle[songId] || songId))}`;
  const livefansUrl = livefansId ? `https://www.livefans.jp/songs/${livefansId}` : null;

  const handleCopyHistory = () => {
    const lines = buildSongHistoryText({
      songId,
      albumName,
      appearancesCount: appearances.length,
      firstShow,
      firstApp,
      latestShow,
      latestApp,
      specialVersionCounts,
      hasSpecials,
      locale,
    });
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label={t("songExtra.ariaHeadline", "歌曲全域出現場次")}
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="relative rounded-t-[2px] bg-black/[0.025] dark:bg-white/[0.025] -mx-[26px] max-sm:-mx-4 -mt-[46px] max-sm:-mt-[42px] px-[26px] max-sm:px-4 pt-[46px] max-sm:pt-[42px] pb-3">
        {/* Level 1: Artist branding & Album badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-paper px-2 py-0.5 font-mono text-[11px] font-bold text-muted border border-line-soft">
              {albumName}
            </span>
            <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-band/15 px-2 py-0.5 font-mono text-xs font-bold text-band-ink">
              SONG ARCHIVE
            </span>
          </div>
        </div>

        {/* Level 2: Song Title Headline */}
        <h2 className="mt-2.5 mb-1 font-display text-[26px] sm:text-[30px] font-black leading-tight text-ink tracking-tight text-pretty">
          {songTitle[songId] || songId}
          {songUnreleased.has(songId) && (
            <span className="ml-2 inline-block rounded border border-unreleased/40 bg-unreleased-wash px-2 py-0.5 font-mono text-[12px] font-semibold text-unreleased align-middle">
              {t("songExtra.unreleasedBadge", "未發行")}
            </span>
          )}
        </h2>
        {songAlias[songId] && (
          <div className="-mt-0.5 mb-2 font-mono text-[13px] text-muted font-medium">
            {t("search.aliasPrefix", "別名：")}{songAlias[songId]}
          </div>
        )}

        {/* Level 3a: Song Identity Summary Bar (Clean, single cohesive line) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line-soft font-mono text-[12px] text-muted">
          <span className="font-bold text-ink">
            {t("slips.performedShowsCount", "共出演 {count} 場", { count: appearances.length })}
          </span>
          {rarityTier && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-bold border ${rarityTier.cls}`}>
              {rarityTier.label}
            </span>
          )}
          {rarityTier?.isDormant && (
            <span className="rounded bg-paper px-1.5 py-0.5 text-xs font-bold text-muted border border-line-soft">
              {t("slips.song.dormantRecent", "📦 近年封箱中")}
            </span>
          )}
          {hasSpecials && (
            <span className="rounded bg-tape/20 px-1.5 py-0.5 font-bold text-ink border border-ink/20 text-xs">
              {t("slips.song.specialVersionsCount", "✨ 特殊版本 {count}場", { count: specialVersionCounts.total })}
            </span>
          )}
          {liveRole && (
            <span className="inline-flex items-center gap-1 text-xs text-ink/80">
              <span>· 🎯 {liveRole.positionText}</span>
              {liveRole.avgOrder && <span>{t("slips.song.avgPosition", "(平均M{order})", { order: liveRole.avgOrder })}</span>}
              {liveRole.encoreRate > 0 && <span>{t("slips.song.encoreRate", "· 安可率{rate}%", { rate: liveRole.encoreRate })}</span>}
            </span>
          )}
        </div>

        {/* Level 3b: Action Toolbar & Collapsible Tools */}
        <div className="mt-2.5 flex flex-col gap-2 border-t border-line-soft/80 pt-2 font-mono text-[11px] slip-ignore-export">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyHistory}
                className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer select-none border ${
                  copied
                    ? "bg-band text-band-ink border-band shadow-xs"
                    : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                }`}
                title={t("songExtra.copyTitle", "複製這首歌曲的演出歷史摘要")}
              >
                <span>{copied ? t("slips.copied", "✓ 已複製") : t("slips.copyHistory", "📋 複製歷程")}</span>
              </button>

              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-ink hover:bg-band hover:border-band transition-colors no-underline"
                title={t("songExtra.youtubeTitle", "在 YouTube 搜尋現場 Live 影片")}
              >
                <span>▶ YouTube</span>
              </a>
              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-line-soft bg-paper px-2 py-1 font-mono text-[11px] font-bold text-ink hover:bg-band hover:border-band transition-colors no-underline"
                title={t("songExtra.spotifyTitle", "在 Spotify 聆聽官方音源")}
              >
                <span>🎧 Spotify</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowMoreTools((v) => !v)}
              className="inline-flex items-center justify-center gap-1 rounded bg-paper hover:bg-tape-tint/50 px-2.5 py-1 text-[11px] font-mono font-bold text-ink border border-line-soft hover:border-ink/60 transition-colors cursor-pointer select-none"
              aria-expanded={showMoreTools}
              title={t("songExtra.expandToolsTitle", "展開更多歷程（首演/最新出演里程碑、年度分佈與資料庫外鏈）")}
            >
              <span>{showMoreTools ? t("slips.song.collapseHistory", "收合歷程 ▴") : t("slips.song.moreHistory", "🛠️ 更多歷程 ▾")}</span>
            </button>
          </div>

          {/* Collapsible Milestone & Extra Tools Drawer */}
          <SongMilestonesDrawer
            showMoreTools={showMoreTools}
            showYearBreakdown={showYearBreakdown}
            setShowYearBreakdown={setShowYearBreakdown}
            yearBreakdown={yearBreakdown}
            livefansUrl={livefansUrl}
            sortedAppearances={sortedAppearances}
            firstApp={firstApp}
            latestApp={latestApp}
            firstShow={firstShow}
            latestShow={latestShow}
            onSelectShow={onSelectShow}
            onSelectVenue={onSelectVenue}
          />
        </div>
      </div>

      <TicketPerforationDivider />

      {/* Category Tabs & Special Version Toggle */}
      <div className="my-2 space-y-2 border-b border-line-soft pb-2.5">
        <div
          role="tablist"
          aria-label={t("songExtra.filterAria", "演出類型篩選")}
          className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:flex md:flex-nowrap md:[&>*]:flex-1 gap-1.5"
        >
          {availableTypes.map((cat) => {
            const count = typeCounts.get(cat) || 0;
            const isActive = !onlySpecial && effectiveType === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={songFilterPillClass(isActive)}
                onClick={() => {
                  setOnlySpecial(false);
                  setSelectedType(cat);
                }}
              >
                <span>{t("categories." + cat, cat)}</span>
                <span className="font-mono text-[11px] tabular-nums opacity-85">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {hasSpecials && (
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                onlySpecial
                  ? "bg-band text-band-ink border border-ink/40 shadow-xs"
                  : "bg-paper text-ink border border-line-soft hover:bg-tape-tint/50"
              }`}
              onClick={() => setOnlySpecial((prev) => !prev)}
            >
              <span>{t("slips.song.onlySpecialVersions", "✨ 僅顯示特殊演出版本")}</span>
              <span className="tabular-nums">({specialVersionCounts.total} {t("navigators.showsUnit", "場")})</span>
              {specialVersionCounts.solo > 0 && (
                <span className="opacity-75">· {t("badges.satoshi-solo", "彈唱")}{specialVersionCounts.solo}</span>
              )}
              {specialVersionCounts.request > 0 && (
                <span className="opacity-75">· {t("badges.request", "點歌")}{specialVersionCounts.request}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {hasCollapsible && (
        <div className="flex items-center justify-end gap-2 pt-1 font-mono text-[11px] text-muted">
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-muted transition-colors hover:text-ink hover:underline"
            onClick={expandAll}
          >
            {t("slips.common.expandAll", "全部展開")}
          </button>
          <span aria-hidden="true">・</span>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-muted transition-colors hover:text-ink hover:underline"
            onClick={collapseAll}
          >
            {t("slips.common.collapseAll", "全部收合")}
          </button>
        </div>
      )}

      {groupedByUnit.length === 0 ? (
        <p className="m-0 px-1 py-6 text-center font-mono text-[13px] text-muted">
          {t("slips.noShowsInCategory", "此分類下無演出紀錄")}
        </p>
      ) : (
        <div className="space-y-4 pt-1">
          {groupedByUnit.map((g) => {
            const isCollapsible = g.items.length > COLLAPSIBLE_THRESHOLD;
            const isCollapsed = isCollapsible && (collapsedMap.get(g.unitId) ?? false);
            const targetUnit = unitData?.get(g.unitId)?.unit;
            const totalShowsInTour = targetUnit?.shows?.length ?? g.items.length;
            const renderAttendance = () => {
              if (totalShowsInTour <= 1) return null;
              if (g.items.length === totalShowsInTour) {
                return (
                  <span className="rounded bg-tape-tint px-1.5 py-0.5 text-xs font-bold text-ink border border-ink/20">
                    {t("slips.song.fullAttendanceBadge", "★ 全勤 ({count}/{total})", {
                      count: g.items.length,
                      total: totalShowsInTour,
                    })}
                  </span>
                );
              }
              if (totalShowsInTour > 2) {
                return (
                  <span className="rounded bg-paper px-1.5 py-0.5 text-xs font-medium text-pool border border-pool/30">
                    {t("slips.song.rotationBadge", "🔄 輪替 ({count}/{total})", {
                      count: g.items.length,
                      total: totalShowsInTour,
                    })}
                  </span>
                );
              }
              return null;
            };

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
                  {/* Desktop: Single Row Layout with Title on Left, Counts & Attendance at Line-End */}
                  <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
                    <h3
                      className="m-0 min-w-0 flex-1 break-words font-display text-[15px] font-extrabold leading-snug text-ink text-pretty"
                      title={g.unitTitle}
                    >
                      {g.unitTitle}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted tabular-nums">
                      <span className="font-bold text-ink">
                        {t("slips.showsCount", "共 {count} 場", { count: g.items.length })}
                      </span>
                      {renderAttendance()}
                      {isCollapsible && (
                        <span className="rounded border border-line-soft bg-card px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink">
                          {isCollapsed
                            ? "▼ " + t("slips.common.expand", "展開")
                            : "▲ " + t("slips.common.collapse", "收合")}
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink tabular-nums">
                          {t("slips.showsCount", "共 {count} 場", { count: g.items.length })}
                        </span>
                        {renderAttendance()}
                      </div>
                      {isCollapsible && (
                        <span className="rounded border border-line-soft bg-card px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink">
                          {isCollapsed
                            ? "▼ " + t("slips.common.expandList", "展開清單")
                            : "▲ " + t("slips.common.collapseList", "收合清單")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isCollapsed && (
                  <ul className="m-0 mt-1 list-none p-0">
                    {g.items.map(({ showId, item }) => {
                      const s = showById.get(showId);
                      const badges = visibleBadges(item.kind);
                      const hasMeta = badges.length > 0 || !!item.note;

                      return (
                        <li
                          key={showId}
                          className="border-b border-line-soft/80 px-2.5 py-2.5 last:border-b-0 hover:bg-paper/40 transition-colors"
                        >
                          <a
                            className="group flex flex-col text-ink no-underline transition-colors hover:text-request focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none"
                            href={routeHash.show(showId, locale)}
                            onClick={(e) => {
                              e.preventDefault();
                              onSelectShow(showId);
                            }}
                          >
                            <div className="flex flex-wrap items-baseline gap-x-2 leading-snug">
                              <span className="shrink-0 font-mono text-[12px] font-semibold text-muted">
                                {showDate(s, locale)}
                              </span>
                              <span className="show-link-venue text-[14px] font-bold text-ink group-hover:text-pool group-hover:underline">
                                {s.venue}
                              </span>
                              <span className="shrink-0 text-[13px] text-muted">
                                （{s.city}）
                              </span>
                            </div>
                            {hasMeta && (
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-0.5">
                                {badges.map(({ key, label, cls }) => (
                                  <span
                                    key={key}
                                    className={`inline-block rounded-[3px] border px-1.5 py-0.5 align-middle font-mono text-[11px] font-bold leading-none tracking-wide ${cls}`}
                                  >
                                    ♪ {t("badges." + key, label)}
                                  </span>
                                ))}
                                {item.note && (
                                  <span className="font-mono text-[11px] text-muted font-medium">
                                    💬 {item.note}
                                  </span>
                                )}
                              </div>
                            )}
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
        serial={`TRACK: ${songId.toUpperCase()} // PERF-${appearances.length.toString().padStart(3, "0")}`}
        label="OFFICIAL HIGEDAN DISM // TRACK PERFORMANCE ARCHIVE"
      />
    </article>
  );
}
