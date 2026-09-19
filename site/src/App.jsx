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
  const skip = new Set(diff.skip ?? []);
  const items = tpl.filter((i) => !skip.has(i.order)).map((i) => ({ ...i }));
  for (const i of items) if (i.order in notes) i.note = notes[i.order];
  const inserts = {};
  for (const ins of diff.insert ?? [])
    (inserts[ins.after] ??= []).push({ ...ins.item });
  return items.flatMap((i) => [i, ...(inserts[i.order] ?? [])]);
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
        <div className="unit-groups" role="group" aria-label="選擇單元">
          {tourUnits.length > 0 && (
            <div className="query-tabs tour-tabs" role="group" aria-label="巡演">
              {[...tourUnits]
                .sort((a, b) => (unitEarliest(b) < unitEarliest(a) ? -1 : 1))
                .map((u) => (
                  <button
                    key={u.id}
                    className={`query-tab ${u.id === selUnitId ? "is-on" : ""}`}
                    onClick={() => handleUnitChange(u.id)}
                    aria-pressed={u.id === selUnitId}
                  >
                    {shortUnitTitle(u)}
                  </button>
                ))}
            </div>
          )}
          {eventUnits.length > 0 && (
            <div className="query-tabs event-tabs" role="group" aria-label="事件">
              {[...eventUnits]
                .sort((a, b) => (unitEarliest(b) < unitEarliest(a) ? -1 : 1))
                .map((u) => (
                  <button
                    key={u.id}
                    className={`query-tab ${u.id === selUnitId ? "is-on" : ""}`}
                    onClick={() => handleUnitChange(u.id)}
                    aria-pressed={u.id === selUnitId}
                  >
                    {shortUnitTitle(u)}
                  </button>
                ))}
            </div>
          )}
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
              (current?.shows ?? []).map((s) => {
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

            {tab === "song" &&
              (() => {
                const songs = allUsedSongs.filter((s) =>
                  s.title.toLowerCase().includes(needle),
                );
                if (!songs.length)
                  return (
                    <li>
                      <p className="empty-hint">
                        沒有符合的歌曲，換個關鍵字試試。
                      </p>
                    </li>
                  );
                return songs.map((s) => {
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
                });
              })()}

            {tab === "venue" &&
              (() => {
                const venues = allVenues.filter(
                  (v) =>
                    v.name.toLowerCase().includes(needle) ||
                    v.city.toLowerCase().includes(needle),
                );
                if (!venues.length)
                  return (
                    <li>
                      <p className="empty-hint">
                        沒有符合的場地，換個關鍵字試試。
                      </p>
                    </li>
                  );
                return venues.map((v) => (
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

  const primaryKind = (i) => {
    const k = i.kind ?? [];
    if (k.includes("premiere")) return "premiere";
    if (songUnreleased.has(i.songId)) return "unreleased";
    if (k.includes("satoshi-solo")) return "satoshi-solo";
    if (k.includes("request")) return "request";
    return null;
  };

  const cardClass = (i) => SLIP_CLASS[primaryKind(i)] ?? "";

  const cardTabs = (i) => {
    const set = new Set(i.kind ?? []);
    if (songUnreleased.has(i.songId)) set.add("unreleased");
    return KIND_ORDER.filter((k) => set.has(k));
  };

  const runKey = (i) =>
    i.songId && (i.kind ?? []).length > 0
      ? `${primaryKind(i)}::${(i.kind ?? []).join(",")}`
      : null;

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
    if (!first.songId) {
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
    const songLine = (it) => (
      <a
        className="setlist-song"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectSong(it.songId);
        }}
      >
        {songTitle[it.songId]}
      </a>
    );
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

  const songCount = items.filter((i) => i.songId).length;

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
          {ud.unit.type}・共 {songCount} 首演出曲目・{" "}
          <a href={s.sourceUrls[0]} target="_blank" rel="noreferrer">
            livefans 來源
          </a>
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
              {(item.kind ?? [])
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