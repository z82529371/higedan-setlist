import { useState, useMemo, useEffect } from "react";
import {
  KIND_TAB,
  SETLIST_ITEM,
  CUE_NO,
  TRACK_NOTE,
  SLIP_ARTICLE,
  SLIP_TAPE,
} from "../lib/constants.js";
import {
  getKindArray,
  primaryKind,
  kindTabs,
  visibleBadges,
  slipClassFor,
  cueColorFor,
  songWeightFor,
  tabColorFor,
} from "../lib/kind.js";
import { songTitle, songUnreleased, showDate } from "../lib/domain.js";
import { trackKey, trackRoute, routeHash } from "../lib/track.js";
import { assignCues } from "../lib/resolve.js";

function getSourceLabel(url) {
  if (!url) return "來源紀錄";
  if (/x\.com|twitter\.com/i.test(url)) return "X 來源紀錄";
  if (/livefans\.jp/i.test(url)) return "LiveFans 來源紀錄";
  if (/wikipedia\.org/i.test(url)) return "維基百科 來源紀錄";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `${host} 來源紀錄`;
  } catch {
    return "來源紀錄";
  }
}

const CATEGORY_ORDER = [
  "巡演專場",
  "特別專場",
  "聯合專場",
  "店家活動",
  "音樂祭",
  "學園祭",
  "電視演出",
  "線上直播",
];

const songFilterPillClass = (isActive) =>
  `appearance-none w-full flex items-center justify-center gap-1 rounded border-[1.5px] px-1.5 py-[5px] sm:px-2 text-[12px] font-semibold cursor-pointer whitespace-nowrap transition-colors motion-reduce:transition-none text-center focus-visible:outline-[2px] focus-visible:outline-pool focus-visible:outline-offset-2 ${
    isActive
      ? "bg-band text-band-ink border-band shadow-[1px_1px_0_#d5a200] font-bold"
      : "border-line bg-paper text-ink hover:bg-pool-wash hover:border-pool hover:text-pool"
  }`;

export function ShowSlip({ ud, showId, onSelectSong, onSelectShow }) {
  if (!ud) return null;
  const s = ud.unit.shows.find((x) => x.id === showId);
  if (!s) return null;

  const items = ud.full.get(showId);
  const rawMain = [];
  const rawEnc = [];
  for (const i of items) (i.encore ? rawEnc : rawMain).push(i);
  const main = assignCues(rawMain, "M");
  const enc = assignCues(rawEnc, "EN");

  const unrel = (i) => songUnreleased.has(i.songId);
  const primaryOf = (i) => primaryKind(getKindArray(i.kind), unrel(i));

  const cueColor = (i) => cueColorFor(primaryOf(i));

  const songWeight = (i) => songWeightFor(primaryOf(i));

  const cardClass = (i) => slipClassFor(primaryOf(i));

  const cardTabs = (i) => kindTabs(getKindArray(i.kind), unrel(i));

  const runKey = (i) => {
    if (!i.songId) return null;
    const prim = primaryOf(i);
    if (!prim) return null;
    const tabs = cardTabs(i);
    return `${prim}::${tabs.join(",")}`;
  };

  const groupRuns = (list) => {
    const runs = [];
    for (const p of list) {
      const key = runKey(p.item);
      const last = runs[runs.length - 1];
      if (key && last && last.key === key) last.items.push(p);
      else runs.push({ key, items: [p] });
    }
    return runs;
  };

  const renderRun = (g, prefix) => {
    const first = g.items[0].item;
    if (!first.songId && !first.title) {
      return (
        <li
          key={prefix}
          className={`${SETLIST_ITEM} text-[13px] text-muted [&_.cue-no]:text-line`}
        >
          <span className="cue-no min-w-[42px] text-right font-mono text-[12px] text-line">
            —
          </span>
          <span>{first.note ?? ""}</span>
        </li>
      );
    }
    const multi = g.key && g.items.length > 1;
    const slipClass = cardClass(first);
    const tabs = cardTabs(first);
    const songLine = (it) => {
      const title = it.title ?? songTitle[it.songId];
      if (!it.songId) {
        return <span className="font-medium text-ink">{title}</span>;
      }
      const link = trackRoute(it, songWeight(it));
      return (
        <a
          className={link.cls}
          href={link.hash}
          onClick={(e) => {
            e.preventDefault();
            onSelectSong(it.songId);
          }}
        >
          {title}
        </a>
      );
    };
    const tabBar =
      tabs.length > 0 ? (
        <span className="absolute left-[14px] top-[-11px] z-[1] flex gap-[6px]">
          {tabs.map((k) => (
            <span
              key={k}
              className={`px-2 py-[1px] font-mono text-[10px] font-semibold leading-[1.4] tracking-[0.2em] text-white ${tabColorFor(
                k
              )}`}
            >
              {KIND_TAB[k]}
            </span>
          ))}
        </span>
      ) : null;
    if (multi) {
      return (
        <li key={prefix} className={`${SETLIST_ITEM} ${slipClass}`}>
          {tabBar}
          <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
            {g.items.map((p) => (
              <span
                key={p.item.order}
                className="flex min-w-0 items-baseline gap-3"
              >
                <span className={`${CUE_NO} ${cueColor(p.item)}`}>{p.cue}</span>
                <span>
                  {songLine(p.item)}
                  {p.item.note && (
                    <span className={TRACK_NOTE}> {p.item.note}</span>
                  )}
                </span>
              </span>
            ))}
          </span>
        </li>
      );
    }
    return (
      <li key={prefix} className={`${SETLIST_ITEM} ${slipClass}`}>
        {tabBar}
        <span className={`${CUE_NO} ${cueColor(first)}`}>{g.items[0].cue}</span>
        <span>
          {songLine(first)}
          {first.note && <span className={TRACK_NOTE}> {first.note}</span>}
        </span>
      </li>
    );
  };

  const songCount = items.filter((i) => i.songId || i.title).length;

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="場次曲目清單"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-4 border-b-2 border-ink pb-4">
        {/* Level 1: Artist branding & category badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-tape-soft/40 px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
            {ud.unit.type}
          </span>
        </div>

        {/* Level 2: Tour / Event Name Headline */}
        <h2 className="mt-2.5 mb-3 font-display text-[22px] sm:text-[25px] font-black leading-tight text-ink tracking-tight text-pretty">
          {ud.unit.title}
        </h2>
        {/* Level 3: Specific Show Details Ticket Stub Box */}
        <div className="rounded-[4px] border border-line-soft bg-paper/50 p-3 sm:p-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-1 border-b border-line-soft/80 pb-2">
            <div className="flex items-center gap-1.5 font-mono text-[14px] font-bold text-ink">
              <span className="text-[13px] text-muted" aria-hidden="true">📅</span>
              {showDate(s)}
            </div>
            {s.opensAt && (
              <span className="font-mono text-[12px] font-medium text-muted">
                <span aria-hidden="true">⏰</span> {s.opensAt} 開演
              </span>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="m-0 font-display text-[20px] sm:text-[22px] font-extrabold text-ink">
              {s.venue}
              <span className="ml-1.5 text-[15px] font-medium text-muted">
                （{s.city}）
              </span>
            </h3>
            <span className="font-mono text-[12px] font-semibold text-pool">
              {songCount > 0 ? `共 ${songCount} 首演出曲目` : "尚無曲目紀錄"}
            </span>
          </div>
        </div>

        {/* Level 4: External Source Link */}
        {s.sourceUrls && s.sourceUrls.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[12px] text-muted [&_a]:text-pool [&_a]:underline-offset-[3px]">
            {s.sourceUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono hover:underline"
              >
                <span aria-hidden="true">🔗</span> {getSourceLabel(url)}
              </a>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="my-8 rounded-[3px] border border-dashed border-line bg-paper px-6 py-8 text-center">
          <p className="m-0 text-[16px] font-bold text-ink">🔍 歌單情報未明</p>
          <p className="m-0 mt-2 text-[13px] text-muted">
            本場演出目前尚無公開曲目紀錄
          </p>
        </div>
      ) : (
        <>
          <ol className="m-0 list-none p-0">
            {groupRuns(main).map((g, idx) => renderRun(g, `m-${idx}`))}
          </ol>
          {enc.length > 0 && (
            <>
              <div
                className="encore-cut mb-[6px] mt-[18px] flex items-center gap-[10px] font-mono text-[12px] font-semibold tracking-[0.24em] text-ink before:h-[10px] before:w-[10px] before:border-[1.5px] before:border-ink before:bg-tape after:flex-1 after:border-t-[1.5px] after:border-dashed after:border-ink"
                aria-hidden="true"
              >
                ENCORE
              </div>
              <ol className="m-0 list-none p-0">
                {groupRuns(enc).map((g, idx) => renderRun(g, `e-${idx}`))}
              </ol>
            </>
          )}
        </>
      )}
    </article>
  );
}

export function SongSlip({ songId, trackShows, showById, onSelectShow }) {
  const appearances = useMemo(() => {
    return songId ? (trackShows.get(trackKey("song", songId)) ?? []) : [];
  }, [trackShows, songId]);

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
    if (!effectiveType) return appearances;
    return appearances.filter(
      (app) => (app.unitType || "其他") === effectiveType
    );
  }, [appearances, effectiveType]);

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
  }, [songId, effectiveType, groupedByUnit]);

  if (!songId) {
    return (
      <div className={SLIP_ARTICLE}>
        <span aria-hidden="true" className={SLIP_TAPE} />
        <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
          選一首歌曲，看它在全檔案庫哪幾場出現過。
        </p>
      </div>
    );
  }

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
        if (g.items.length > COLLAPSIBLE_THRESHOLD) next.set(g.unitId, false);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) {
        if (g.items.length > COLLAPSIBLE_THRESHOLD) next.set(g.unitId, true);
      }
      return next;
    });
  };

  const hasCollapsible = groupedByUnit.some(
    (g) => g.items.length > COLLAPSIBLE_THRESHOLD
  );

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="歌曲全域出現場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-4 border-b-2 border-ink pb-4">
        {/* Level 1: Artist branding & category badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-tape-soft/40 px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
            SONG ARCHIVE
          </span>
        </div>

        {/* Level 2: Song Title Headline */}
        <h2 className="mt-2.5 mb-2 font-display text-[24px] sm:text-[27px] font-black leading-tight text-ink tracking-tight text-pretty">
          {songTitle[songId]}
          {songUnreleased.has(songId) && (
            <span className="ml-2 inline-block rounded border border-unreleased/40 bg-unreleased-wash px-1.5 py-0.5 font-mono text-[12px] font-semibold text-unreleased align-middle">
              未發行
            </span>
          )}
        </h2>

        {/* Level 3: Summary stats badge */}
        <div className="flex items-center gap-2 font-mono text-[13px] text-muted">
          <span><span aria-hidden="true">📊</span> 全檔案庫共出現於</span>
          <span className="rounded bg-paper px-2 py-0.5 font-bold text-ink border border-line-soft">
            {appearances.length} 場演出
          </span>
        </div>
      </div>

      {availableTypes.length > 0 && (
        <div
          role="tablist"
          aria-label="演出類型篩選"
          className="my-2 grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:flex md:flex-nowrap md:[&>*]:flex-1 gap-1.5 border-b border-line-soft pb-2.5"
        >
          {availableTypes.map((t) => {
            const count = typeCounts.get(t) || 0;
            const isActive = effectiveType === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={songFilterPillClass(isActive)}
                onClick={() => setSelectedType(t)}
              >
                <span>{t}</span>
                <span className="font-mono text-[11px] tabular-nums opacity-85">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {hasCollapsible && (
        <div className="flex items-center justify-end gap-2 pt-1 font-mono text-[11px] text-muted">
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
          此分類下無演出紀錄
        </p>
      ) : (
        <div className="space-y-4 pt-1">
          {groupedByUnit.map((g) => {
            const isCollapsible = g.items.length > COLLAPSIBLE_THRESHOLD;
            const isCollapsed = isCollapsible && (collapsedMap.get(g.unitId) ?? false);

            return (
              <section key={g.unitId} className="flex flex-col">
                <div
                  className={`flex items-center justify-between gap-2.5 rounded-[4px] border border-line-soft bg-paper/70 px-3 py-2 transition-colors ${
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
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded-[3px] border border-ink/20 bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">
                      {g.unitType}
                    </span>
                    <h3 className="m-0 truncate font-display text-[15px] font-extrabold text-ink">
                      {g.unitTitle}
                    </h3>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted tabular-nums">
                    <span className="font-bold text-ink">共 {g.items.length} 場</span>
                    {isCollapsible && (
                      <span className="rounded border border-line-soft bg-card px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                        {isCollapsed ? "▼ 展開" : "▲ 收合"}
                      </span>
                    )}
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
                            href={routeHash.show(showId)}
                            onClick={(e) => {
                              e.preventDefault();
                              onSelectShow(showId);
                            }}
                          >
                            <div className="flex flex-wrap items-baseline gap-x-2 leading-snug">
                              <span className="shrink-0 font-mono text-[12px] font-semibold text-muted">
                                {showDate(s)}
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
                                    className={`inline-block rounded-[3px] border px-1.5 py-0.5 align-middle font-mono text-[10px] font-bold leading-none tracking-wide ${cls}`}
                                  >
                                    ♪ {label}
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
    </article>
  );
}



export function VenueSlip({ venueName, globalVenueShows, unitData, onSelectShow }) {
  const venueShows = useMemo(() => {
    return globalVenueShows?.get(venueName) ?? [];
  }, [globalVenueShows, venueName]);

  const COLLAPSIBLE_THRESHOLD = 3;

  const groupedByUnit = useMemo(() => {
    const groupMap = new Map();
    for (const app of venueShows) {
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
  }, [venueShows]);

  const [collapsedMap, setCollapsedMap] = useState(() => new Map());

  useEffect(() => {
    const initial = new Map();
    groupedByUnit.forEach((g) => {
      if (g.items.length > COLLAPSIBLE_THRESHOLD) {
        initial.set(g.unitId, true);
      }
    });
    setCollapsedMap(initial);
  }, [venueName, groupedByUnit]);

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
        if (g.items.length > COLLAPSIBLE_THRESHOLD) next.set(g.unitId, false);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedMap((prev) => {
      const next = new Map(prev);
      for (const g of groupedByUnit) {
        if (g.items.length > COLLAPSIBLE_THRESHOLD) next.set(g.unitId, true);
      }
      return next;
    });
  };

  const hasCollapsible = groupedByUnit.some(
    (g) => g.items.length > COLLAPSIBLE_THRESHOLD
  );

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

  const firstCity = venueShows[0]?.show?.city ?? "";

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="場地全域場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-4 border-b-2 border-ink pb-4">
        {/* Level 1: Artist branding & category badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.2em] text-muted">
            <span className="inline-block h-2 w-2 rounded-full border border-ink bg-tape" aria-hidden="true" />
            Official 髭男 dism
          </div>
          <span className="inline-flex items-center rounded-[3px] border border-ink/30 bg-tape-soft/40 px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
            VENUE ARCHIVE
          </span>
        </div>

        {/* Level 2: Venue Title Headline */}
        <h2 className="mt-2.5 mb-2 font-display text-[24px] sm:text-[27px] font-black leading-tight text-ink tracking-tight text-pretty">
          {venueName}{" "}
          {firstCity && (
            <span className="text-[17px] font-medium text-muted">
              （{firstCity}）
            </span>
          )}
        </h2>

        {/* Level 3: Summary stats badge */}
        <div className="flex items-center gap-2 font-mono text-[13px] text-muted">
          <span><span aria-hidden="true">🏛️</span> 全檔案庫共舉辦過</span>
          <span className="rounded bg-paper px-2 py-0.5 font-bold text-ink border border-line-soft">
            {venueShows.length} 場演出
          </span>
        </div>
      </div>

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
          此場地尚無演出紀錄
        </p>
      ) : (
        <div className="space-y-4 pt-1">
          {groupedByUnit.map((g) => {
            const isCollapsible = g.items.length > COLLAPSIBLE_THRESHOLD;
            const isCollapsed = isCollapsible && (collapsedMap.get(g.unitId) ?? false);

            return (
              <section key={g.unitId} className="flex flex-col">
                <div
                  className={`flex items-center justify-between gap-2.5 rounded-[4px] border border-line-soft bg-paper/70 px-3 py-2 transition-colors ${
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
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded-[3px] border border-ink/20 bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">
                      {g.unitType}
                    </span>
                    <h3 className="m-0 truncate font-display text-[15px] font-extrabold text-ink">
                      {g.unitTitle}
                    </h3>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted tabular-nums">
                    <span className="font-bold text-ink">共 {g.items.length} 場</span>
                    {isCollapsible && (
                      <span className="rounded border border-line-soft bg-card px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                        {isCollapsed ? "▼ 展開" : "▲ 收合"}
                      </span>
                    )}
                  </div>
                </div>

                {!isCollapsed && (
                  <ul className="m-0 mt-1 list-none p-0">
                    {g.items.map(({ showId, show }) => {
                      const ud = unitData?.get(g.unitId);
                      const songCount = (ud?.full?.get(showId) || []).filter(
                        (i) => i.songId || i.title
                      ).length;

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
                                  📅 {showDate(show)}
                                </span>
                                {show?.opensAt && (
                                  <span className="font-mono text-[11px] text-muted">
                                    ⏰ {show.opensAt} 開演
                                  </span>
                                )}
                              </div>
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
    </article>
  );
}
