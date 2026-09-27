import { Fragment, useMemo, useRef, useState } from "react";
import songsData from "./data/songs.json";
import "./style.css";

const tourUnits = Object.values(
  import.meta.glob("./data/tours/*.json", { eager: true, import: "default" }),
);
const eventUnits = Object.values(
  import.meta.glob("./data/events/*.json", { eager: true, import: "default" }),
);

const songTitle = Object.fromEntries(
  songsData.songs.map((s) => [s.id, s.title]),
);
const songUnreleased = new Set(
  songsData.songs.filter((s) => s.unreleased).map((s) => s.id),
);

const KIND_BADGE = {
  premiere: "新歌",
  "satoshi-solo": "自彈自唱",
  request: "點歌",
};

const KIND_TAB = {
  premiere: "NEW SONG",
  "satoshi-solo": "SATOSHI SOLO",
  request: "REQUEST",
  unreleased: "UNRELEASED",
};
const KIND_ORDER = ["premiere", "unreleased", "satoshi-solo", "request"];

const ALBUM_MAP = {
  "same-blue": "Rejoice (2024)",
  "50pct": "Rejoice (2024)",
  "sanitizer": "Rejoice (2024)",
  "elder-flower": "Rejoice (2024)",
  "make-me-wonder": "Rejoice (2024)",
  "tattoo": "Rejoice (2024)",
  "subtitle": "Rejoice (2024)",
  "mixed-nuts": "Rejoice (2024)",
  "white-noise": "Rejoice (2024)",
  "nichijo": "Rejoice (2024)",
  "b-side-blues": "Rejoice (2024)",
  "dakuten": "Rejoice (2024)",
  "sousisouai": "Rejoice (2024)",
  "sharon": "Rejoice (2024)",

  "editorial": "Editorial (2021)",
  "apoptosis": "Editorial (2021)",
  "cry-baby": "Editorial (2021)",
  "i-love": "Editorial (2021)",
  "laughter": "Editorial (2021)",
  "universe": "Editorial (2021)",
  "parabola": "Editorial (2021)",
  "anarchy": "Editorial (2021)",
  "shower": "Editorial (2021)",
  "green-rain": "Editorial (2021)",
  "knit-no-boushi": "Editorial (2021)",
  "bed-side-story": "Editorial (2021)",
  "lost-in-my-room": "Editorial (2021)",

  "pretender": "Traveler (2019)",
  "shukumei": "Traveler (2019)",
  "stand-by-you": "Traveler (2019)",
  "yesterday": "Traveler (2019)",
  "fire-ground": "Traveler (2019)",
  "amazing": "Traveler (2019)",
  "rowan": "Traveler (2019)",
  "vintage": "Traveler (2019)",
  "115man-kiro-no-film": "Traveler (2019)",
  "takaga-i-love-you": "Traveler (2019)",
  "bad-for-me": "Traveler (2019)",

  "no-doubt": "エスカパレード (2018)",
  "itan-na-star": "エスカパレード (2018)",
  "sweet-tweet": "エスカパレード (2018)",
  "lady": "エスカパレード (2018)",
  "rolling": "エスカパレード (2018)",
  "driver": "エスカパレード (2018)",
  "trailer": "エスカパレード (2018)",
  "ai-nandaga": "エスカパレード (2018)",
  "yugure-zoi": "エスカパレード (2018)",
  "shihatsu-ga-michibiku-kouhukuron": "エスカパレード (2018)",
};

const ALBUM_ORDER = [
  "Rejoice (2024)",
  "Editorial (2021)",
  "Traveler (2019)",
  "エスカパレード (2018)",
  "EP / 單曲",
  "未發行曲目",
];

function getSongAlbum(song) {
  if (song.unreleased || songUnreleased.has(song.id)) return "未發行曲目";
  return ALBUM_MAP[song.id] ?? "EP / 單曲";
}

const REGION_ORDER = [
  "海外（台灣 / 韓國 / 東南亞）",
  "日本 - 關東",
  "日本 - 關西",
  "日本 - 東北 / 北海道",
  "日本 - 中部 / 九州 / 其他",
];

function getVenueRegion(v) {
  const c = v.city ?? "";
  const n = v.name ?? "";
  if (
    c.includes("台北") ||
    c.includes("首爾") ||
    c.includes("曼谷") ||
    c.includes("新加坡") ||
    n.includes("UOB") ||
    n.includes("高尺")
  ) {
    return "海外（台灣 / 韓國 / 東南亞）";
  }
  if (
    c.includes("東京") ||
    c.includes("埼玉") ||
    c.includes("橫濱") ||
    c.includes("千葉")
  ) {
    return "日本 - 關東";
  }
  if (
    c.includes("大阪") ||
    c.includes("神戶") ||
    c.includes("京都") ||
    c.includes("兵庫")
  ) {
    return "日本 - 關西";
  }
  if (
    c.includes("仙台") ||
    c.includes("札幌") ||
    c.includes("宮城") ||
    c.includes("岩手") ||
    c.includes("北海道")
  ) {
    return "日本 - 東北 / 北海道";
  }
  return "日本 - 中部 / 九州 / 其他";
}

function showDate(s) {
  return s.weekday ? `${s.date}（${s.weekday}）` : s.date;
}

function showLabel(s) {
  return `${showDate(s)} ${s.venue}（${s.city}）`;
}

function shortUnitTitle(unit) {
  return unit.title.replace(/^OFFICIAL HIGE DANDISM /, "");
}

function unitEarliest(unit) {
  return (unit.shows ?? []).reduce(
    (m, s) => (s.date < m ? s.date : m),
    unit.shows?.[0]?.date ?? "9999-12-31",
  );
}

const allUnits = [...tourUnits, ...eventUnits].sort((a, b) =>
  unitEarliest(b) < unitEarliest(a) ? -1 : 1,
);

function resolve(diff, tpl) {
  const notes = Object.fromEntries(
    (diff.note ?? []).map((n) => [n.order, n.note]),
  );
  const kinds = Object.fromEntries(
    (diff.kind ?? []).map((k) => [k.order, k.kind]),
  );
  const skip = new Set(diff.skip ?? []);
  
  const inserts = {};
  for (const ins of diff.insert ?? []) {
    (inserts[ins.after] ??= []).push({ ...ins.item });
  }

  const result = [];
  if (inserts[0]) {
    result.push(...inserts[0]);
  }

  for (const item of tpl) {
    if (!skip.has(item.order)) {
      const copy = { ...item };
      if (copy.order in notes) copy.note = notes[copy.order];
      if (copy.order in kinds) copy.kind = kinds[copy.order];
      result.push(copy);
    }
    if (inserts[item.order]) {
      result.push(...inserts[item.order]);
    }
  }

  return result;
}

function resolveShowItems(unit, show) {
  if (unit.templateSetlist) return resolve(show.diff ?? {}, unit.templateSetlist);
  return show.setlist ?? [];
}

function defaultShowId(unit) {
  const shows = [...(unit?.shows ?? [])].sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );
  return shows.at(-1)?.id ?? null;
}

export default function App() {
  const {
    unitData,
    globalSongShows,
    globalVenueShows,
    allUsedSongs,
    allVenues,
    showById,
    unitIdByShowId,
  } = useMemo(() => {
    const unitDataMap = new Map();
    const songShowsMap = new Map();
    const venueShowsMap = new Map();
    const showByIdMap = new Map();
    const unitByShow = new Map();

    for (const unit of allUnits) {
      const isTour = !!unit.templateSetlist;
      const tpl = unit.templateSetlist;
      const tplSongSet = new Set(
        (tpl ?? []).filter((i) => i.songId).map((i) => i.songId),
      );
      const shows = [...(unit.shows ?? [])].sort((a, b) =>
        a.date < b.date ? -1 : 1,
      );
      const full = new Map(shows.map((s) => [s.id, resolveShowItems(unit, s)]));
      const songShows = new Map();

      for (const s of shows) {
        showByIdMap.set(s.id, s);
        unitByShow.set(s.id, unit.id);

        if (s.venue) {
          if (!venueShowsMap.has(s.venue)) venueShowsMap.set(s.venue, []);
          venueShowsMap.get(s.venue).push({
            showId: s.id,
            unitId: unit.id,
            unitTitle: shortUnitTitle(unit),
            unitType: unit.type,
            show: s,
          });
        }

        for (const i of full.get(s.id)) {
          if (!i.songId) continue;
          if (!songShows.has(i.songId)) songShows.set(i.songId, []);
          songShows.get(i.songId).push(s.id);

          if (!songShowsMap.has(i.songId)) songShowsMap.set(i.songId, []);
          songShowsMap.get(i.songId).push({
            showId: s.id,
            unitId: unit.id,
            unitTitle: shortUnitTitle(unit),
            unitType: unit.type,
            item: i,
            isTemplateSong: isTour && tplSongSet.has(i.songId),
          });
        }
      }

      unitDataMap.set(unit.id, { unit, isTour, tpl, shows, full, songShows });
    }

    const usedSongsList = songsData.songs.filter(
      (s) => (songShowsMap.get(s.id) ?? []).length > 0,
    );

    const venuesList = Array.from(venueShowsMap.keys())
      .map((venue) => ({
        name: venue,
        city: venueShowsMap.get(venue)[0]?.show.city ?? "",
        shows: venueShowsMap.get(venue),
      }))
      .sort(
        (a, b) =>
          b.shows.length - a.shows.length || a.name.localeCompare(b.name),
      );

    return {
      unitData: unitDataMap,
      globalSongShows: songShowsMap,
      globalVenueShows: venueShowsMap,
      allUsedSongs: usedSongsList,
      allVenues: venuesList,
      showById: showByIdMap,
      unitIdByShowId: unitByShow,
    };
  }, []);

  const [selUnitId, setSelUnitId] = useState(
    allUnits[0]?.id ?? null,
  );
  const [tab, setTab] = useState("show");
  const [selSong, setSelSong] = useState(allUsedSongs[0]?.id ?? null);
  const [selVenue, setSelVenue] = useState(allVenues[0]?.name ?? null);
  const [selShow, setSelShow] = useState(() => defaultShowId(allUnits[0]));
  const [q, setQ] = useState("");

  const [songGroupFilter, setSongGroupFilter] = useState("all");
  const [venueGroupFilter, setVenueGroupFilter] = useState("all");
  const [showGroupFilter, setShowGroupFilter] = useState("all");
  const [showYearFilter, setShowYearFilter] = useState("all");

  const slipRef = useRef(null);

  const current = unitData.get(selUnitId);

  const handleSelectShow = (showId) => {
    const unitId = unitIdByShowId.get(showId);
    if (unitId) setSelUnitId(unitId);
    setTab("show");
    setSelShow(showId);
    setTimeout(() => {
      slipRef.current?.scrollIntoView({ block: "nearest" });
    }, 0);
  };

  const handleSelectSong = (songId) => {
    setTab("song");
    setSelSong(songId);
    setQ("");
  };

  const handleSelectVenue = (venueName) => {
    setTab("venue");
    setSelVenue(venueName);
    setQ("");
  };

  const handleUnitChange = (unitId) => {
    setSelUnitId(unitId);
    setTab("show");
    setSelSong(null);
    setQ("");
    setSelShow(defaultShowId(unitData.get(unitId)?.unit));
  };

  const needle = q.trim().toLowerCase();

  const searchLabelText = tab === "venue" ? "搜尋場地" : "搜尋歌名";
  const searchPlaceholder =
    tab === "venue" ? "例如 台北小巨蛋 或 橫濱" : "例如 Subtitle";

  const tplSongs = current?.tpl?.filter((i) => i.songId).length ?? 0;
  const tplCount = current?.tpl?.length ?? 0;
  const footTpl = current?.isTour
    ? `巡演模板：${tplSongs} 首${tplCount > tplSongs ? `＋${tplCount - tplSongs}段過場` : ""}`
    : "單發場合，曲目全文收錄";

  return (
    <Fragment>
      <div className="flight-band">
        <span>{current?.unit.title ?? ""}</span>
        <span className="dot-sep">●</span>
        <span>
          {current?.shows.length ?? 0} 場・{current?.songShows.size ?? 0} 首歌曲
        </span>
        <span className="dot-sep">●</span>
        <span>資料來源 livefans</span>
      </div>

      <header className="hero">
        <p className="hero-eyebrow">
          <span className="stamp">{current?.isTour ? "巡演檔案" : "演出檔案"}</span>
          {current ? `${shortUnitTitle(current.unit)}・場次 × 歌曲雙向查詢` : ""}
        </p>
        <h1 className="hero-title">
          那一晚，<span className="thin">他們唱了什麼。</span>
        </h1>
      </header>

      <div className="query-tabs" role="group" aria-label="查詢方向">
        <button
          className={`query-tab ${tab === "show" ? "is-on" : ""}`}
          onClick={() => {
            setTab("show");
            setQ("");
          }}
          aria-pressed={tab === "show"}
        >
          場次
        </button>
        <button
          className={`query-tab ${tab === "song" ? "is-on" : ""}`}
          onClick={() => {
            setTab("song");
            setQ("");
            if (!selSong) setSelSong(allUsedSongs[0]?.id ?? null);
          }}
          aria-pressed={tab === "song"}
        >
          歌曲
        </button>
        <button
          className={`query-tab ${tab === "venue" ? "is-on" : ""}`}
          onClick={() => {
            setTab("venue");
            setQ("");
            if (!selVenue) setSelVenue(allVenues[0]?.name ?? null);
          }}
          aria-pressed={tab === "venue"}
        >
          場地
        </button>

        <div className="query-search">
          <label htmlFor="q">{searchLabelText}</label>
          <input
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
                    s.title.toLowerCase().includes(needle),
                  );
                  if (matched) setSelSong(matched.id);
                } else if (tab === "venue") {
                  const matched = allVenues.find(
                    (v) =>
                      v.name.toLowerCase().includes(needle) ||
                      v.city.toLowerCase().includes(needle),
                  );
                  if (matched) setSelVenue(matched.name);
                }
              }
            }}
            autoComplete="off"
          />
        </div>
      </div>

      {tab === "show" && (
        (() => {
          const soloUnits = allUnits.filter((u) => u.type === "專場");
          const festUnits = allUnits.filter((u) => u.type !== "專場");

          // Filter by category
          const categoryFiltered = allUnits.filter((u) => {
            if (showGroupFilter === "tour") return u.type === "專場";
            if (showGroupFilter === "event") return u.type !== "專場";
            return true;
          });

          // Extract available start years within current category
          const yearsSet = new Set(
            categoryFiltered
              .map((u) => unitEarliest(u).split("-")[0])
              .filter((y) => y && y !== "9999"),
          );
          const availableYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));

          // Filter by year if selected
          const finalUnits = categoryFiltered.filter((u) => {
            if (showYearFilter === "all") return true;
            return unitEarliest(u).split("-")[0] === showYearFilter;
          });

          return (
            <div className="filter-pill-bar" role="group" aria-label="場次巡演分組">
              <div className="group-label">演出類型</div>
              <button
                className={`filter-pill ${showGroupFilter === "all" ? "is-active" : ""}`}
                onClick={() => {
                  setShowGroupFilter("all");
                  setShowYearFilter("all");
                }}
              >
                全部場次 ({allUnits.length})
              </button>
              <button
                className={`filter-pill ${showGroupFilter === "tour" ? "is-active" : ""}`}
                onClick={() => {
                  setShowGroupFilter("tour");
                  setShowYearFilter("all");
                }}
              >
                巡演專場 ({soloUnits.length})
              </button>
              <button
                className={`filter-pill ${showGroupFilter === "event" ? "is-active" : ""}`}
                onClick={() => {
                  setShowGroupFilter("event");
                  setShowYearFilter("all");
                }}
              >
                音樂祭／特別事件 ({festUnits.length})
              </button>

              <div style={{ margin: "10px 0 4px 0", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span className="group-label" style={{ margin: 0 }}>開始年份</span>
                <button
                  className={`filter-pill ${showYearFilter === "all" ? "is-active" : ""}`}
                  onClick={() => setShowYearFilter("all")}
                >
                  全部年份
                </button>
                {availableYears.map((year) => {
                  const count = categoryFiltered.filter(
                    (u) => unitEarliest(u).split("-")[0] === year,
                  ).length;
                  return (
                    <button
                      key={year}
                      className={`filter-pill ${showYearFilter === year ? "is-active" : ""}`}
                      onClick={() => setShowYearFilter(year)}
                    >
                      📅 {year} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="unit-pills-row">
                {[...finalUnits]
                  .sort((a, b) => (unitEarliest(b) < unitEarliest(a) ? -1 : 1))
                  .map((u) => (
                    <button
                      key={u.id}
                      className={`unit-pill ${u.type === "專場" ? "tour-pill" : "event-pill"} ${u.id === selUnitId ? "is-on" : ""}`}
                      onClick={() => handleUnitChange(u.id)}
                    >
                      {shortUnitTitle(u)}
                    </button>
                  ))}
              </div>
            </div>
          );
        })()
      )}

      {tab === "song" && (
        <div className="filter-pill-bar" role="group" aria-label="歌曲專輯分組">
          <div className="group-label">專輯／發行分類</div>
          <button
            className={`filter-pill ${songGroupFilter === "all" ? "is-active" : ""}`}
            onClick={() => setSongGroupFilter("all")}
          >
            全部歌曲 ({allUsedSongs.length})
          </button>
          {ALBUM_ORDER.map((album) => {
            const count = allUsedSongs.filter(
              (s) => getSongAlbum(s) === album,
            ).length;
            if (!count) return null;
            return (
              <button
                key={album}
                className={`filter-pill ${songGroupFilter === album ? "is-active" : ""}`}
                onClick={() => setSongGroupFilter(album)}
              >
                💿 {album} ({count})
              </button>
            );
          })}
        </div>
      )}

      {tab === "venue" && (
        <div className="filter-pill-bar" role="group" aria-label="場地區域分組">
          <div className="group-label">地區分區</div>
          <button
            className={`filter-pill ${venueGroupFilter === "all" ? "is-active" : ""}`}
            onClick={() => setVenueGroupFilter("all")}
          >
            全部地區 ({allVenues.length})
          </button>
          {REGION_ORDER.map((region) => {
            const count = allVenues.filter(
              (v) => getVenueRegion(v) === region,
            ).length;
            if (!count) return null;
            return (
              <button
                key={region}
                className={`filter-pill ${venueGroupFilter === region ? "is-active" : ""}`}
                onClick={() => setVenueGroupFilter(region)}
              >
                📍 {region} ({count})
              </button>
            );
          })}
        </div>
      )}

      <main className="query-grid">
        <nav
          className="drawer"
          aria-label={
            tab === "show"
              ? "場次列表"
              : tab === "song"
                ? "歌曲列表"
                : "場地列表"
          }
        >
          <ul className="drawer-list">
            {tab === "show" &&
              (() => {
                const shows = current?.shows ?? [];
                if (!shows.length) return null;
                return (
                  <Fragment>
                    <li className="drawer-group-header">
                      {shortUnitTitle(current.unit)}
                    </li>
                    {shows.map((s) => {
                      const songCount = current.full
                        .get(s.id)
                        .filter((i) => i.songId).length;
                      return (
                        <li key={s.id}>
                          <a
                            className={`drawer-link ${s.id === selShow ? "is-on" : ""}`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectShow(s.id);
                            }}
                            title={showLabel(s)}
                          >
                            <span className="drawer-show">
                              <span className="drawer-date">{showDate(s)}</span>
                              <span className="drawer-venue">{s.venue}</span>
                              <span className="drawer-city">{s.city}</span>
                            </span>
                            <span className="drawer-count">{songCount} 首</span>
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
                  s.title.toLowerCase().includes(needle),
                );
                if (songGroupFilter !== "all") {
                  filtered = filtered.filter(
                    (s) => getSongAlbum(s) === songGroupFilter,
                  );
                }
                if (!filtered.length)
                  return (
                    <li>
                      <p className="empty-hint">
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
                  groups.has(album),
                );

                return sortedAlbums.map((album) => (
                  <Fragment key={album}>
                    <li className="drawer-group-header">💿 {album}</li>
                    {groups.get(album).map((s) => {
                      const count = (globalSongShows.get(s.id) ?? []).length;
                      return (
                        <li key={s.id}>
                          <a
                            className={`drawer-link ${s.id === selSong ? "is-on" : ""}`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectSong(s.id);
                            }}
                          >
                            <span className="drawer-song">
                              {s.title}
                              {songUnreleased.has(s.id) && (
                                <span className="unreleased-tag">（未發行）</span>
                              )}
                            </span>
                            <span className="drawer-count">{count} 場</span>
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
                    v.city.toLowerCase().includes(needle),
                );
                if (venueGroupFilter !== "all") {
                  filtered = filtered.filter(
                    (v) => getVenueRegion(v) === venueGroupFilter,
                  );
                }
                if (!filtered.length)
                  return (
                    <li>
                      <p className="empty-hint">
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
                  groups.has(region),
                );

                return sortedRegions.map((region) => (
                  <Fragment key={region}>
                    <li className="drawer-group-header">📍 {region}</li>
                    {groups.get(region).map((v) => (
                      <li key={v.name}>
                        <a
                          className={`drawer-link ${v.name === selVenue ? "is-on" : ""}`}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectVenue(v.name);
                          }}
                        >
                          <span className="drawer-song">
                            {v.name}
                            <span className="venue-city-sub">（{v.city}）</span>
                          </span>
                          <span className="drawer-count">{v.shows.length} 場</span>
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
            />
          )}
          {tab === "song" && (
            <SongSlip
              songId={selSong}
              globalSongShows={globalSongShows}
              showById={showById}
              onSelectShow={handleSelectShow}
            />
          )}
          {tab === "venue" && (
            <VenueSlip
              venueName={selVenue}
              globalVenueShows={globalVenueShows}
              onSelectShow={handleSelectShow}
            />
          )}
        </section>
      </main>

      <footer className="page-foot">
        <span>{footTpl}</span>
        <span>{current?.isTour ? "各場差異以 insert / skip 記錄" : ""}</span>
        <span>演出順序、安可標記逐場核對 livefans</span>
      </footer>
    </Fragment>
  );
}

function ShowSlip({ ud, showId, onSelectSong }) {
  if (!ud) return null;
  const s = ud.unit.shows.find((x) => x.id === showId);
  if (!s) return null;

  const items = ud.full.get(showId);
  const main = [];
  const enc = [];
  for (const i of items) (i.encore ? enc : main).push(i);

  let m = 0;
  let en = 0;
  const cueNo = (i) => (i.encore ? `EN${(en += 1)}` : `M${(m += 1)}`);

  const SLIP_CLASS = {
    premiere: "premiere-slip",
    unreleased: "unreleased-slip",
    "satoshi-solo": "satoshi-solo-slip",
    request: "request-slip",
  };

  const getKindArray = (i) => {
    if (!i || !i.kind) return [];
    return Array.isArray(i.kind) ? i.kind : [i.kind];
  };

  const primaryKind = (i) => {
    const k = getKindArray(i);
    if (k.includes("premiere")) return "premiere";
    if (songUnreleased.has(i.songId)) return "unreleased";
    if (k.includes("satoshi-solo")) return "satoshi-solo";
    if (k.includes("request")) return "request";
    return null;
  };

  const cardClass = (i) => SLIP_CLASS[primaryKind(i)] ?? "";

  const cardTabs = (i) => {
    const set = new Set(getKindArray(i));
    if (songUnreleased.has(i.songId)) set.add("unreleased");
    return KIND_ORDER.filter((k) => set.has(k));
  };

  const runKey = (i) => {
    const k = getKindArray(i);
    return i.songId && k.length > 0
      ? `${primaryKind(i)}::${k.join(",")}`
      : null;
  };

  const groupRuns = (list) => {
    const runs = [];
    for (const i of list) {
      const key = runKey(i);
      const last = runs[runs.length - 1];
      if (key && last && last.key === key) last.items.push(i);
      else runs.push({ key, items: [i] });
    }
    return runs;
  };

  const renderRun = (g, prefix) => {
    const first = g.items[0];
    if (!first.songId && !first.title) {
      return (
        <li key={prefix} className="setlist-item interlude-line">
          <span className="cue-no">—</span>
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
        return <span className="setlist-song-unlinked">{title}</span>;
      }
      return (
        <a
          className="setlist-song"
          href="#"
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
        <span className="slip-tabs">
          {tabs.map((k) => (
            <span key={k} className={`slip-tab slip-tab--${k}`}>
              {KIND_TAB[k]}
            </span>
          ))}
        </span>
      ) : null;
    if (multi) {
      return (
        <li key={prefix} className={`setlist-item ${slipClass}`}>
          {tabBar}
          <span className="run-block">
            {g.items.map((it) => (
              <span key={it.order} className="run-line">
                <span className="cue-no">{cueNo(it)}</span>
                <span>
                  {songLine(it)}
                  {it.note && <span className="track-note"> {it.note}</span>}
                </span>
              </span>
            ))}
          </span>
        </li>
      );
    }
    return (
      <li key={prefix} className={`setlist-item ${slipClass}`}>
        {tabBar}
        <span className="cue-no">{cueNo(first)}</span>
        <span>
          {songLine(first)}
          {first.note && <span className="track-note"> {first.note}</span>}
        </span>
      </li>
    );
  };

  const songCount = items.filter((i) => i.songId || i.title).length;

  return (
    <article className="slip" aria-label="場次曲目清單">
      <div className="slip-head">
        <h3 className="slip-title show-title-block">
          <span className="show-title-date">{showDate(s)}</span>
          <span className="show-title-venue">{s.venue}</span>
          <span className="show-title-city">（{s.city}）</span>
        </h3>
        <p className="slip-meta">
          {s.opensAt ? `${s.opensAt} 開演・` : ""}
          {ud.unit.type}・共 {songCount} 首演出曲目
          {s.sourceUrls?.[0] && (
            <>
              ・{" "}
              <a href={s.sourceUrls[0]} target="_blank" rel="noreferrer">
                livefans 來源
              </a>
            </>
          )}
        </p>
      </div>

      <ol className="setlist">
        {groupRuns(main).map((g, idx) => renderRun(g, `m-${idx}`))}
      </ol>
      {enc.length > 0 && (
        <>
          <div className="encore-cut" aria-hidden="true">
            ENCORE
          </div>
          <ol className="setlist">
            {groupRuns(enc).map((g, idx) => renderRun(g, `e-${idx}`))}
          </ol>
        </>
      )}
    </article>
  );
}

function SongSlip({ songId, globalSongShows, showById, onSelectShow }) {
  if (!songId) {
    return (
      <div className="slip">
        <p className="empty-hint">選一首歌曲，看它在全檔案庫哪幾場出現過。</p>
      </div>
    );
  }

  const appearances = globalSongShows.get(songId) ?? [];

  return (
    <article className="slip" aria-label="歌曲全域出現場次">
      <div className="slip-head">
        <p className="slip-tour">ALL TOURS → SONG SHOWS</p>
        <h3 className="slip-title">
          {songTitle[songId]}
          {songUnreleased.has(songId) && (
            <span className="unreleased-tag">（未發行）</span>
          )}
        </h3>
        <p className="slip-meta song-detail-count">
          全檔案庫共出現於 {appearances.length} 場演出
        </p>
      </div>
      <ul className="appearance-list">
        {appearances.map(({ showId, unitTitle, unitType, item }) => {
          const s = showById.get(showId);
          return (
            <li key={showId}>
              <span className="tour-badge">
                {unitTitle}
                {unitType !== "專場" && (
                  <span className="type-badge">{unitType}</span>
                )}
              </span>
              <a
                className="show-link-block"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectShow(showId);
                }}
              >
                <span className="show-link-date">{showDate(s)}</span>
                <span className="show-link-venue">{s.venue}</span>
                <span className="show-link-city">（{s.city}）</span>
              </a>
              {(Array.isArray(item.kind) ? item.kind : item.kind ? [item.kind] : [])
                .filter((k) => KIND_BADGE[k])
                .map((k) => (
                  <span key={k} className={`kind-badge kind-badge--${k}`}>
                    {KIND_BADGE[k]}
                  </span>
                ))}
              {item.note && <span className="track-note"> {item.note}</span>}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function VenueSlip({ venueName, globalVenueShows, onSelectShow }) {
  if (!venueName) {
    return (
      <div className="slip">
        <p className="empty-hint">選一個場地，看在該場地舉行過哪些場次。</p>
      </div>
    );
  }

  const venueShows = globalVenueShows.get(venueName) ?? [];
  const firstCity = venueShows[0]?.show.city ?? "";

  return (
    <article className="slip" aria-label="場地全域場次">
      <div className="slip-head">
        <p className="slip-tour">ALL TOURS → VENUE SHOWS</p>
        <h3 className="slip-title">
          {venueName} <span className="venue-city-badge">（{firstCity}）</span>
        </h3>
        <p className="slip-meta song-detail-count">
          全檔案庫共舉辦過 {venueShows.length} 場演出
        </p>
      </div>
      <ul className="appearance-list">
        {venueShows.map(({ showId, unitTitle, unitType, show }) => (
          <li key={showId}>
            <span className="tour-badge">
              {unitTitle}
              {unitType !== "專場" && (
                <span className="type-badge">{unitType}</span>
              )}
            </span>
            <a
              className="show-link-block"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectShow(showId);
              }}
            >
              <span className="show-link-date">{showDate(show)}</span>
              <span className="show-link-venue">{show.venue}</span>
              <span className="show-link-city">（{show.city}）</span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}