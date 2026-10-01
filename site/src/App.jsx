import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  queryTabClass,
  filterPillClass,
  unitPillClass,
  DRAWER_LINK,
  ALBUM_ORDER,
  REGION_ORDER,
} from "./lib/constants.js";
import {
  allUnits,
  getSongAlbum,
  getVenueRegion,
  showDate,
  showLabel,
  shortUnitTitle,
  songUnreleased,
  unitEarliest,
  defaultShowId,
  buildIndex,
} from "./lib/domain.js";
import { trackKey, parseRoute, routeHash } from "./lib/track.js";
import { ShowSlip, SongSlip, TitleSlip, VenueSlip } from "./components/slips.jsx";
import "./style.css";

export default function App() {
  const {
    unitData,
    trackShows,
    globalVenueShows,
    allUsedSongs,
    allVenues,
    showById,
    unitIdByShowId,
  } = useMemo(() => buildIndex(), []);

  const initialSelection = () => {
    const fallback = {
      tab: "show",
      selUnitId: allUnits[0]?.id ?? null,
      selSong: allUsedSongs[0]?.id ?? null,
      selTitle: null,
      selVenue: allVenues[0]?.name ?? null,
      selShow: defaultShowId(allUnits[0]),
    };
    const r = parseRoute(window.location.hash);
    if (!r) return fallback;
    if (r.kind === "song" && allUsedSongs.some((s) => s.id === r.value))
      return { ...fallback, tab: "song", selSong: r.value };
    if (r.kind === "title" && trackShows.has(trackKey("title", r.value)))
      return { ...fallback, tab: "song", selSong: null, selTitle: r.value };
    if (r.kind === "show" && unitIdByShowId.has(r.value))
      return {
        ...fallback,
        selUnitId: unitIdByShowId.get(r.value),
        selShow: r.value,
      };
    if (r.kind === "venue" && allVenues.some((v) => v.name === r.value))
      return { ...fallback, tab: "venue", selVenue: r.value };
    return fallback;
  };
  const [initial] = useState(initialSelection);

  const [selUnitId, setSelUnitId] = useState(initial.selUnitId);
  const [tab, setTab] = useState(initial.tab);
  const [selSong, setSelSong] = useState(initial.selSong);
  const [selTitle, setSelTitle] = useState(initial.selTitle);
  const [selVenue, setSelVenue] = useState(initial.selVenue);
  const [selShow, setSelShow] = useState(initial.selShow);
  const [q, setQ] = useState("");

  const [songGroupFilter, setSongGroupFilter] = useState(() => {
    if (initial.selSong) {
      const s = allUsedSongs.find((x) => x.id === initial.selSong);
      if (s) return getSongAlbum(s);
    }
    return ALBUM_ORDER[0];
  });
  const [venueGroupFilter, setVenueGroupFilter] = useState(() => {
    if (initial.selVenue) {
      const v = allVenues.find((x) => x.name === initial.selVenue);
      if (v) return getVenueRegion(v);
    }
    return REGION_ORDER[0];
  });
  const [showGroupFilter, setShowGroupFilter] = useState(() => {
    if (initial.selUnitId) {
      const u = allUnits.find((x) => x.id === initial.selUnitId);
      if (u) {
        if (u.type === "專場") return "tour";
        if (u.type === "對バン" || u.type === "聯合專場") return "collab";
        return "event";
      }
    }
    return "tour";
  });
  const [showYearFilter, setShowYearFilter] = useState(() => {
    if (initial.selUnitId) {
      const u = allUnits.find((x) => x.id === initial.selUnitId);
      if (u) {
        const y = unitEarliest(u).split("-")[0];
        if (y && y !== "9999") return y;
      }
    }
    return "2026";
  });

  const slipRef = useRef(null);

  const current = unitData.get(selUnitId);

  // Hash is the single funnel: selections write hash, hashchange applies state.
  const applyRoute = (r) => {
    if (!r) return;
    if (r.kind === "song" && allUsedSongs.some((s) => s.id === r.value)) {
      setTab("song");
      setSelSong(r.value);
      const s = allUsedSongs.find((x) => x.id === r.value);
      if (s) setSongGroupFilter(getSongAlbum(s));
      setSelTitle(null);
      setQ("");
    } else if (r.kind === "title" && trackShows.has(trackKey("title", r.value))) {
      setTab("song");
      setSelTitle(r.value);
      setSelSong(null);
      setQ("");
    } else if (r.kind === "show" && unitIdByShowId.has(r.value)) {
      const uId = unitIdByShowId.get(r.value);
      setSelUnitId(uId);
      const u = allUnits.find((x) => x.id === uId);
      if (u) {
        if (u.type === "專場") setShowGroupFilter("tour");
        else if (u.type === "對バン" || u.type === "聯合專場") setShowGroupFilter("collab");
        else setShowGroupFilter("event");
        const y = unitEarliest(u).split("-")[0];
        if (y && y !== "9999") setShowYearFilter(y);
      }
      setTab("show");
      setSelShow(r.value);
    } else if (
      r.kind === "venue" &&
      allVenues.some((v) => v.name === r.value)
    ) {
      setTab("venue");
      setSelVenue(r.value);
      const v = allVenues.find((x) => x.name === r.value);
      if (v) setVenueGroupFilter(getVenueRegion(v));
      setQ("");
    }
  };

  useEffect(() => {
    const onHash = () => applyRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (hash) => {
    if (window.location.hash === hash) applyRoute(parseRoute(hash));
    else window.location.hash = hash;
  };

  const handleSelectShow = (showId) => {
    go(routeHash.show(showId));
    setTimeout(() => {
      slipRef.current?.scrollIntoView({ block: "nearest" });
    }, 0);
  };

  const handleSelectSong = (songId) => {
    setQ("");
    go(routeHash.song(songId));
  };

  const handleSelectTitle = (title) => {
    setQ("");
    go(routeHash.title(title));
  };

  const handleSelectVenue = (venueName) => {
    setQ("");
    go(routeHash.venue(venueName));
  };

  const handleUnitChange = (unitId) => {
    setSelSong(null);
    setSelTitle(null);
    setQ("");
    go(routeHash.show(defaultShowId(unitData.get(unitId)?.unit)));
  };

  const needle = q.trim().toLowerCase();

  const searchLabelText = tab === "venue" ? "搜尋場地" : "搜尋歌名";
  const searchPlaceholder =
    tab === "venue"
      ? "全庫搜尋場地，例如 台北小巨蛋"
      : "全庫搜尋歌曲，例如 Subtitle";

  const tplSongs = current?.tpl?.filter((i) => i.songId).length ?? 0;
  const tplCount = current?.tpl?.length ?? 0;
  const footTpl = current?.isTour
    ? `巡演模板：${tplSongs} 首${
        tplCount > tplSongs ? `＋${tplCount - tplSongs}段過場` : ""
      }`
    : "單發場合，曲目全文收錄";

  return (
    <Fragment>
      <div className="mx-[-20px] flex flex-wrap items-center gap-x-5 gap-y-2 bg-band px-5 py-2.5 font-mono text-[12px] tracking-[0.14em] text-band-ink max-sm:mx-[-14px]">
        <span>{current?.unit.title ?? ""}</span>
        <span className="opacity-45">●</span>
        <span>
          {current?.shows.length ?? 0} 場・{current?.songShows.size ?? 0} 首歌曲
        </span>
        <span className="opacity-45">●</span>
        <span>資料來源 livefans</span>
      </div>

      <header className="pb-2 pt-9">
        <p className="m-0 mb-[10px] font-mono text-[12px] tracking-[0.22em] text-muted">
          <span className="mr-2 inline-block rounded-full border-[1.5px] border-ink px-[10px] py-[1px] tracking-[0.18em] text-ink">
            {current?.isTour ? "巡演檔案" : "演出檔案"}
          </span>
          {current
            ? `${shortUnitTitle(current.unit)}・場次 × 歌曲雙向查詢`
            : ""}
        </p>
        <h1 className="m-0 font-display text-[clamp(34px,5.2vw,60px)] font-extrabold leading-[1.08] tracking-[0.01em] [text-wrap:balance]">
          那一晚，<span className="font-bold text-pool">他們唱了什麼。</span>
        </h1>
      </header>

      <div
        className="mt-8 mb-[14px] flex flex-wrap items-center gap-2"
        role="group"
        aria-label="查詢方向"
      >
        <button
          className={queryTabClass(tab === "show")}
          onClick={() => {
            setTab("show");
            setQ("");
          }}
          aria-pressed={tab === "show"}
        >
          場次
        </button>
        <button
          className={queryTabClass(tab === "song")}
          onClick={() => {
            setTab("song");
            setQ("");
            if (!selSong && !selTitle) setSelSong(allUsedSongs[0]?.id ?? null);
          }}
          aria-pressed={tab === "song"}
        >
          歌曲
        </button>
        <button
          className={queryTabClass(tab === "venue")}
          onClick={() => {
            setTab("venue");
            setQ("");
            if (!selVenue) setSelVenue(allVenues[0]?.name ?? null);
          }}
          aria-pressed={tab === "venue"}
        >
          場地
        </button>

        <div className="ml-auto flex max-w-[340px] flex-[1_1_220px] items-center gap-2 max-lg:ml-0 max-lg:w-full max-lg:max-w-none">
          <label
            htmlFor="q"
            className="whitespace-nowrap font-mono text-[12px] text-muted"
          >
            {searchLabelText}
          </label>
          <input
            className="w-full rounded-[3px] border-[1.5px] border-ink bg-card px-3 py-2 text-[14px] text-ink"
            id="q"
            type="search"
            placeholder={searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (tab === "song") {
                  const matched = allUsedSongs.find((s) =>
                    s.title.toLowerCase().includes(needle)
                  );
                  if (matched) handleSelectSong(matched.id);
                } else if (tab === "venue") {
                  const matched = allVenues.find(
                    (v) =>
                      v.name.toLowerCase().includes(needle) ||
                      v.city.toLowerCase().includes(needle)
                  );
                  if (matched) handleSelectVenue(matched.name);
                }
              }
            }}
            autoComplete="off"
          />
        </div>
      </div>

      {tab === "show" &&
        (() => {
          const soloUnits = allUnits.filter((u) => u.type === "專場");
          const collabUnits = allUnits.filter(
            (u) => u.type === "對バン" || u.type === "聯合專場"
          );
          const festUnits = allUnits.filter(
            (u) =>
              u.type !== "專場" &&
              u.type !== "對バン" &&
              u.type !== "聯合專場"
          );

          // Filter by category
          const categoryFiltered = allUnits.filter((u) => {
            if (showGroupFilter === "collab")
              return u.type === "對バン" || u.type === "聯合專場";
            if (showGroupFilter === "event")
              return (
                u.type !== "專場" &&
                u.type !== "對バン" &&
                u.type !== "聯合專場"
              );
            return u.type === "專場";
          });

          // Extract available start years within current category
          const yearsSet = new Set(
            categoryFiltered
              .map((u) => unitEarliest(u).split("-")[0])
              .filter((y) => y && y !== "9999")
          );
          const availableYears = Array.from(yearsSet).sort((a, b) =>
            b.localeCompare(a)
          );

          const activeYear = availableYears.includes(showYearFilter)
            ? showYearFilter
            : availableYears[0] ?? "";

          // Filter by active year
          const finalUnits = categoryFiltered.filter(
            (u) => unitEarliest(u).split("-")[0] === activeYear
          );

          const handleCategoryChange = (catKey, unitsList) => {
            setShowGroupFilter(catKey);
            const years = Array.from(
              new Set(
                unitsList
                  .map((u) => unitEarliest(u).split("-")[0])
                  .filter((y) => y && y !== "9999")
              )
            ).sort((a, b) => b.localeCompare(a));
            const targetYear = years.includes(showYearFilter)
              ? showYearFilter
              : years[0];
            if (targetYear) setShowYearFilter(targetYear);
            const firstUnit = unitsList.find(
              (u) => unitEarliest(u).split("-")[0] === targetYear
            );
            if (firstUnit) handleUnitChange(firstUnit.id);
          };

          return (
            <div
              className="mb-5 flex flex-col gap-y-2.5 rounded-[3px] border-[1.5px] border-ink bg-card px-4 py-3 shadow-[4px_4px_0_rgba(23,35,59,0.1)]"
              role="group"
              aria-label="場次巡演分組"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-[6px] flex items-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted after:content-['：']">
                  演出類型
                </span>
                <button
                  className={filterPillClass(showGroupFilter === "tour")}
                  onClick={() => handleCategoryChange("tour", soloUnits)}
                >
                  巡演專場 ({soloUnits.length})
                </button>
                <button
                  className={filterPillClass(showGroupFilter === "collab")}
                  onClick={() => handleCategoryChange("collab", collabUnits)}
                >
                  聯合專場 ({collabUnits.length})
                </button>
                <button
                  className={filterPillClass(showGroupFilter === "event")}
                  onClick={() => handleCategoryChange("event", festUnits)}
                >
                  音樂祭／特別事件 ({festUnits.length})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-[6px] flex items-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted after:content-['：']">
                  開始年份
                </span>
                {availableYears.map((year) => {
                  const count = categoryFiltered.filter(
                    (u) => unitEarliest(u).split("-")[0] === year
                  ).length;
                  return (
                    <button
                      key={year}
                      className={filterPillClass(activeYear === year)}
                      onClick={() => {
                        setShowYearFilter(year);
                        const firstUnit = categoryFiltered.find(
                          (u) => unitEarliest(u).split("-")[0] === year
                        );
                        if (firstUnit) handleUnitChange(firstUnit.id);
                      }}
                    >
                      📅 {year} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 flex w-full flex-wrap gap-x-[10px] gap-y-[6px] border-t border-dashed border-line pt-[10px]">
                {[...finalUnits]
                  .sort((a, b) => (unitEarliest(b) < unitEarliest(a) ? -1 : 1))
                  .map((u) => (
                    <button
                      key={u.id}
                      className={unitPillClass(u.id === selUnitId)}
                      onClick={() => handleUnitChange(u.id)}
                    >
                      {shortUnitTitle(u)}
                    </button>
                  ))}
              </div>
            </div>
          );
        })()}

      {tab === "song" && (
        <div
          className="mb-5 flex flex-wrap items-center gap-x-[10px] gap-y-2 rounded-[3px] border-[1.5px] border-ink bg-card px-4 py-3 shadow-[4px_4px_0_rgba(23,35,59,0.1)]"
          role="group"
          aria-label="歌曲專輯分組"
        >
          <div className="mr-[6px] flex items-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted after:content-['：']">
            專輯分類
          </div>
          {ALBUM_ORDER.map((album) => {
            const count = allUsedSongs.filter(
              (s) => getSongAlbum(s) === album
            ).length;
            if (!count) return null;
            return (
              <button
                key={album}
                className={filterPillClass(songGroupFilter === album)}
                onClick={() => {
                  setSongGroupFilter(album);
                  const firstSong = allUsedSongs.find(
                    (s) => getSongAlbum(s) === album
                  );
                  if (firstSong) handleSelectSong(firstSong.id);
                }}
              >
                💿 {album} ({count})
              </button>
            );
          })}
        </div>
      )}

      {tab === "venue" && (
        <div
          className="mb-5 flex flex-wrap items-center gap-x-[10px] gap-y-2 rounded-[3px] border-[1.5px] border-ink bg-card px-4 py-3 shadow-[4px_4px_0_rgba(23,35,59,0.1)]"
          role="group"
          aria-label="場地區域分組"
        >
          <div className="mr-[6px] flex items-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted after:content-['：']">
            地區分區
          </div>
          {REGION_ORDER.map((region) => {
            const count = allVenues.filter(
              (v) => getVenueRegion(v) === region
            ).length;
            if (!count) return null;
            return (
              <button
                key={region}
                className={filterPillClass(venueGroupFilter === region)}
                onClick={() => {
                  setVenueGroupFilter(region);
                  const firstVenue = allVenues.find(
                    (v) => getVenueRegion(v) === region
                  );
                  if (firstVenue) handleSelectVenue(firstVenue.name);
                }}
              >
                📍 {region} ({count})
              </button>
            );
          })}
        </div>
      )}

      <main className="grid grid-cols-[300px_1fr] items-start gap-5 max-lg:grid-cols-1">
        <nav
          className="max-h-[72vh] overflow-hidden overflow-y-auto rounded-[3px] border-[1.5px] border-ink bg-card max-lg:max-h-none"
          aria-label={
            tab === "show"
              ? "場次列表"
              : tab === "song"
              ? "歌曲列表"
              : "場地列表"
          }
        >
          <ul className="m-0 list-none p-0 [&>li]:border-b [&>li]:border-line-soft [&>li:last-child]:border-b-0">
            {tab === "show" &&
              (() => {
                const shows = current?.shows ?? [];
                if (!shows.length) return null;
                return (
                  <Fragment>
                    <li className="sticky top-0 z-[2] border-b-[1.5px] border-ink bg-band px-[14px] py-[6px] font-mono text-[11px] font-bold tracking-[0.1em] text-band-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                      {shortUnitTitle(current.unit)}
                    </li>
                    {shows.map((s) => {
                      const songCount = current.full
                        .get(s.id)
                        .filter((i) => i.songId).length;
                      return (
                        <li key={s.id}>
                          <a
                            className={DRAWER_LINK(s.id === selShow)}
                            href={routeHash.show(s.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectShow(s.id);
                            }}
                            title={showLabel(s)}
                          >
                            <span className="flex min-w-0 flex-1 flex-col leading-[1.5]">
                              <span className="font-mono text-[12px] text-muted [.bg-band_&]:text-inherit [.bg-band_&]:opacity-85">
                                {showDate(s)}
                              </span>
                              <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-bold">
                                {s.venue}
                              </span>
                              <span className="text-[13px] text-muted [.bg-band_&]:text-inherit [.bg-band_&]:opacity-85">
                                {s.city}
                              </span>
                            </span>
                            <span className="whitespace-nowrap font-mono text-[12px] text-muted [.bg-band_&]:text-white">
                              {songCount} 首
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </Fragment>
                );
              })()}

            {tab === "song" &&
              (() => {
                let filtered = allUsedSongs.filter((s) =>
                  s.title.toLowerCase().includes(needle)
                );
                // Piercing search: when search is empty, filter by active album; when searching, search all albums
                if (!needle && songGroupFilter) {
                  filtered = filtered.filter(
                    (s) => getSongAlbum(s) === songGroupFilter
                  );
                }
                if (!filtered.length)
                  return (
                    <li>
                      <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
                        沒有符合的歌曲，換個分組或關鍵字試試。
                      </p>
                    </li>
                  );

                // Group by Album
                const groups = new Map();
                for (const s of filtered) {
                  const album = getSongAlbum(s);
                  if (!groups.has(album)) groups.set(album, []);
                  groups.get(album).push(s);
                }

                const sortedAlbums = ALBUM_ORDER.filter((album) =>
                  groups.has(album)
                );

                return sortedAlbums.map((album) => (
                  <Fragment key={album}>
                    <li className="sticky top-0 z-[2] border-b-[1.5px] border-ink bg-band px-[14px] py-[6px] font-mono text-[11px] font-bold tracking-[0.1em] text-band-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                      💿 {album}
                    </li>
                    {groups.get(album).map((s) => {
                      const count = (trackShows.get(trackKey("song", s.id)) ?? []).length;
                      return (
                        <li key={s.id}>
                          <a
                            className={DRAWER_LINK(s.id === selSong)}
                            href={routeHash.song(s.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectSong(s.id);
                            }}
                          >
                            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                              {s.title}
                              {songUnreleased.has(s.id) && (
                                <span className="ml-1 text-[0.8em] font-normal text-muted [.bg-band_&]:text-white/75">
                                  （未發行）
                                </span>
                              )}
                            </span>
                            <span className="whitespace-nowrap font-mono text-[12px] text-muted [.bg-band_&]:text-white">
                              {count} 場
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </Fragment>
                ));
              })()}

            {tab === "venue" &&
              (() => {
                let filtered = allVenues.filter(
                  (v) =>
                    v.name.toLowerCase().includes(needle) ||
                    v.city.toLowerCase().includes(needle)
                );
                // Piercing search: when search is empty, filter by active region; when searching, search all regions
                if (!needle && venueGroupFilter) {
                  filtered = filtered.filter(
                    (v) => getVenueRegion(v) === venueGroupFilter
                  );
                }
                if (!filtered.length)
                  return (
                    <li>
                      <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
                        沒有符合的場地，換個分區或關鍵字試試。
                      </p>
                    </li>
                  );

                // Group by Region
                const groups = new Map();
                for (const v of filtered) {
                  const region = getVenueRegion(v);
                  if (!groups.has(region)) groups.set(region, []);
                  groups.get(region).push(v);
                }

                const sortedRegions = REGION_ORDER.filter((region) =>
                  groups.has(region)
                );

                return sortedRegions.map((region) => (
                  <Fragment key={region}>
                    <li className="sticky top-0 z-[2] border-b-[1.5px] border-ink bg-band px-[14px] py-[6px] font-mono text-[11px] font-bold tracking-[0.1em] text-band-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                      📍 {region}
                    </li>
                    {groups.get(region).map((v) => (
                      <li key={v.name}>
                        <a
                          className={DRAWER_LINK(v.name === selVenue)}
                          href={routeHash.venue(v.name)}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectVenue(v.name);
                          }}
                        >
                          <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                            {v.name}
                            <span className="text-[12px] font-normal text-muted [.bg-band_&]:text-inherit">
                              （{v.city}）
                            </span>
                          </span>
                          <span className="whitespace-nowrap font-mono text-[12px] text-muted [.bg-band_&]:text-white">
                            {v.shows.length} 場
                          </span>
                        </a>
                      </li>
                    ))}
                  </Fragment>
                ));
              })()}
          </ul>
        </nav>

        <section ref={slipRef}>
          {tab === "show" && (
            <ShowSlip
              ud={current}
              showId={selShow}
              onSelectSong={handleSelectSong}
              onSelectTitle={handleSelectTitle}
            />
          )}
          {tab === "song" &&
            (selTitle ? (
              <TitleSlip
                title={selTitle}
                trackShows={trackShows}
                showById={showById}
                onSelectShow={handleSelectShow}
              />
            ) : (
              <SongSlip
                songId={selSong}
                trackShows={trackShows}
                showById={showById}
                onSelectShow={handleSelectShow}
              />
            ))}
          {tab === "venue" && (
            <VenueSlip
              venueName={selVenue}
              globalVenueShows={globalVenueShows}
              onSelectShow={handleSelectShow}
            />
          )}
        </section>
      </main>

      <footer className="mt-12 flex flex-wrap gap-x-[18px] gap-y-[6px] border-t-[1.5px] border-ink pt-3 font-mono text-[12px] text-muted">
        <span>{footTpl}</span>
        <span>{current?.isTour ? "各場差異以 insert / skip 記錄" : ""}</span>
        <span>演出順序、安可標記逐場核對 livefans</span>
      </footer>
    </Fragment>
  );
}

