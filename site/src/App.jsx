import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import songsData from "./data/songs.json";
import "./style.css";

const tourUnits = Object.values(
  import.meta.glob("./data/tours/*.json", { eager: true, import: "default" })
);
const eventUnits = Object.values(
  import.meta.glob("./data/events/*.json", { eager: true, import: "default" })
);

const songTitle = Object.fromEntries(
  songsData.songs.map((s) => [s.id, s.title])
);
const songUnreleased = new Set(
  songsData.songs.filter((s) => s.unreleased).map((s) => s.id)
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

const queryTabClass = (isOn) =>
  `appearance-none rounded-full border-[1.5px] border-ink px-[22px] py-2 text-[14px] font-bold cursor-pointer select-none transition-all shadow-[2px_2px_0_rgba(23,35,59,0.12)] hover:-translate-y-[1px] hover:bg-pool-wash hover:shadow-[3px_3px_0_rgba(23,35,59,0.18)] active:translate-y-0 active:shadow-[1px_1px_0_rgba(23,35,59,0.14)] focus-visible:outline-2 focus-visible:outline-tape focus-visible:outline-offset-2 ${
    isOn
      ? "bg-ink text-white shadow-[2px_2px_0_var(--color-ink)] hover:opacity-95"
      : "bg-card text-ink"
  }`;

const filterPillClass = (isActive) =>
  `appearance-none rounded border-[1.5px] px-[14px] py-[6px] text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all motion-reduce:transition-none focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 ${
    isActive
      ? "bg-band text-band-ink border-band shadow-[2px_2px_0_#e8b428] font-bold"
      : "border-line bg-paper text-ink hover:bg-pool-wash hover:border-pool hover:text-pool"
  }`;

const unitPillClass = (isOn) =>
  `appearance-none rounded-full border px-3 py-1 text-[12px] font-semibold cursor-pointer transition-all motion-reduce:transition-none focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 ${
    isOn
      ? "bg-tape text-[#3a2c00] border-ink font-bold shadow-[1px_1px_0_var(--color-ink)]"
      : "border-line bg-card text-ink hover:border-ink hover:bg-pool-wash"
  }`;

const SETLIST_ITEM =
  "flex items-baseline gap-3 border-b border-line-soft px-1 py-2 last:border-b-0";
const CUE_NO =
  "min-w-[42px] text-right font-mono text-[12px] font-semibold text-muted tabular-nums";
const CUE_COLOR = {
  premiere: "text-premiere",
  unreleased: "text-unreleased",
  "satoshi-solo": "text-solo",
  request: "text-request",
};
const TRACK_NOTE = "text-[13px] text-muted";
const SETLIST_SONG =
  "border-b border-transparent font-medium text-ink no-underline transition-colors hover:border-pool hover:text-pool focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none";
const SLIP_ARTICLE =
  "relative rounded-[3px] border-[1.5px] border-ink bg-card px-[26px] pb-6 pt-[46px] shadow-[5px_5px_0_rgba(23,35,59,0.14)] max-sm:px-4 max-sm:pb-[18px] max-sm:pt-[42px]";
const SLIP_TAPE =
  "pointer-events-none absolute left-1/2 top-[-13px] h-[26px] w-[132px] -translate-x-1/2 rotate-[1.5deg] border-x border-dashed border-tape-edge bg-tape-soft";
const SLIP_CARD = {
  premiere:
    "relative rounded-[2px] border-[1.5px] border-premiere border-l-[7px] bg-premiere-bg px-[14px] py-[10px] -mx-2 my-[18px] -rotate-[0.6deg] shadow-[4px_6px_0_var(--color-premiere-wash)] max-sm:mx-[-4px] max-sm:my-3",
  unreleased:
    "relative rounded-[2px] border-[1.5px] border-unreleased border-l-[7px] bg-unreleased-bg px-[14px] py-[10px] -mx-2 my-[18px] rotate-[1.1deg] shadow-[4px_6px_0_var(--color-unreleased-wash)] max-sm:mx-[-4px] max-sm:my-3",
  "satoshi-solo":
    "relative rounded-[2px] border-[1.5px] border-solo border-l-[7px] bg-solo-bg px-[14px] py-[10px] -mx-2 my-[18px] -rotate-[0.4deg] shadow-[4px_6px_0_var(--color-solo-wash)] max-sm:mx-[-4px] max-sm:my-3",
  request:
    "relative rounded-[2px] border-[1.5px] border-request border-l-[7px] bg-white px-[14px] py-[10px] -mx-2 my-[18px] -rotate-[1.2deg] shadow-[4px_6px_0_var(--color-request-shadow)] max-sm:mx-[-4px] max-sm:my-3",
};
const SLIP_TAB_COLOR = {
  premiere: "bg-premiere",
  unreleased: "bg-unreleased",
  "satoshi-solo": "bg-solo",
  request: "bg-request",
};

const KIND_BADGE_CLASS = (k) =>
  k === "request"
    ? "bg-[#fbe9e6] text-request"
    : k === "satoshi-solo"
    ? "bg-[#d8efe8] text-[#0b5f50]"
    : "bg-tape text-[#3a2c00]";

const DRAWER_LINK = (isOn) =>
  `flex items-center justify-between gap-[10px] border-l-4 border-transparent px-[14px] py-[10px] no-underline transition-colors motion-reduce:transition-none focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 ${
    isOn
      ? "border-l-tape bg-band text-band-ink hover:bg-band"
      : "border-l-transparent text-ink hover:border-l-pool hover:bg-pool-wash"
  }`;

const ALBUM_MAP = {
  "same-blue": "Rejoice (2024)",
  "50pct": "Rejoice (2024)",
  sanitizer: "Rejoice (2024)",
  "elder-flower": "Rejoice (2024)",
  "make-me-wonder": "Rejoice (2024)",
  tattoo: "Rejoice (2024)",
  subtitle: "Rejoice (2024)",
  "mixed-nuts": "Rejoice (2024)",
  "white-noise": "Rejoice (2024)",
  nichijo: "Rejoice (2024)",
  "b-side-blues": "Rejoice (2024)",
  dakuten: "Rejoice (2024)",
  sousisouai: "Rejoice (2024)",
  sharon: "Rejoice (2024)",

  editorial: "Editorial (2021)",
  apoptosis: "Editorial (2021)",
  "cry-baby": "Editorial (2021)",
  "i-love": "Editorial (2021)",
  laughter: "Editorial (2021)",
  universe: "Editorial (2021)",
  parabola: "Editorial (2021)",
  anarchy: "Editorial (2021)",
  shower: "Editorial (2021)",
  "green-rain": "Editorial (2021)",
  "knit-no-boushi": "Editorial (2021)",
  "bed-side-story": "Editorial (2021)",
  "lost-in-my-room": "Editorial (2021)",

  pretender: "Traveler (2019)",
  shukumei: "Traveler (2019)",
  "stand-by-you": "Traveler (2019)",
  yesterday: "Traveler (2019)",
  "fire-ground": "Traveler (2019)",
  amazing: "Traveler (2019)",
  rowan: "Traveler (2019)",
  vintage: "Traveler (2019)",
  "115man-kiro-no-film": "Traveler (2019)",
  "takaga-i-love-you": "Traveler (2019)",
  "bad-for-me": "Traveler (2019)",

  "no-doubt": "エスカパレード (2018)",
  "itan-na-star": "エスカパレード (2018)",
  lady: "エスカパレード (2018)",
  rolling: "エスカパレード (2018)",
  driver: "エスカパレード (2018)",
  trailer: "エスカパレード (2018)",

  "sweet-tweet": "ラブとピースは君の中 (2015)",
  "koi-no-maenarae": "ラブとピースは君の中 (2015)",
  "yugure-zoi": "ラブとピースは君の中 (2015)",
  "yuki-seku-asa-ga-kuru": "ラブとピースは君の中 (2015)",
  "shihatsu-ga-michibiku-kouhukuron": "ラブとピースは君の中 (2015)",
  "ai-nandaga": "ラブとピースは君の中 (2015)",
  parade: "ラブとピースは君の中 (2015)",
  darin: "ラブとピースは君の中 (2015)",

  "clap-clap": "MAN IN THE MIRROR (2016)",
  "coffee-to-syrup": "MAN IN THE MIRROR (2016)",
  "happy-birthday-to-you": "MAN IN THE MIRROR (2016)",
  "koi-no-sarigiwa": "MAN IN THE MIRROR (2016)",
  "zero-no-mama-de-iraterara": "MAN IN THE MIRROR (2016)",
  "nichiyoubi-no-love-letter": "MAN IN THE MIRROR (2016)",
};

const ALBUM_ORDER = [
  "Rejoice (2024)",
  "Editorial (2021)",
  "Traveler (2019)",
  "エスカパレード (2018)",
  "MAN IN THE MIRROR (2016)",
  "ラブとピースは君の中 (2015)",
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
  const r = v.region ?? "";
  const p = v.prefecture ?? "";
  const c = v.city ?? "";
  const n = v.name ?? "";

  if (
    r === "海外" ||
    p.includes("台灣") ||
    p.includes("韓國") ||
    p.includes("泰國") ||
    p.includes("新加坡") ||
    c.includes("台北") ||
    c.includes("首爾") ||
    c.includes("曼谷") ||
    c.includes("新加坡") ||
    c.includes("高陽") ||
    n.includes("UOB") ||
    n.includes("KSPO") ||
    n.includes("KINTEX")
  ) {
    return "海外（台灣 / 韓國 / 東南亞）";
  }

  if (
    r === "關東" ||
    p.includes("東京") ||
    p.includes("神奈川") ||
    p.includes("埼玉") ||
    p.includes("千葉")
  ) {
    return "日本 - 關東";
  }

  if (
    r === "關西" ||
    p.includes("大阪") ||
    p.includes("兵庫") ||
    p.includes("京都") ||
    p.includes("奈良")
  ) {
    return "日本 - 關西";
  }

  if (
    r === "東北" ||
    r === "北海道" ||
    p.includes("北海道") ||
    p.includes("宮城") ||
    p.includes("青森") ||
    p.includes("岩手") ||
    p.includes("秋田") ||
    p.includes("山形") ||
    p.includes("福島")
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
    unit.shows?.[0]?.date ?? "9999-12-31"
  );
}

const allUnits = [...tourUnits, ...eventUnits].sort((a, b) =>
  unitEarliest(b) < unitEarliest(a) ? -1 : 1
);

function resolve(diff, tpl) {
  const notes = Object.fromEntries(
    (diff.note ?? []).map((n) => [n.order, n.note])
  );
  const kinds = Object.fromEntries(
    (diff.kind ?? []).map((k) => [k.order, k.kind])
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
  if (unit.templateSetlist)
    return resolve(show.diff ?? {}, unit.templateSetlist);
  return show.setlist ?? [];
}

function defaultShowId(unit) {
  const shows = [...(unit?.shows ?? [])].sort((a, b) =>
    a.date < b.date ? -1 : 1
  );
  return shows.at(-1)?.id ?? null;
}

// Hash routes (no router dep; static hosting safe):
// #/song/<songId> #/show/<showId> #/venue/<name> #/title/<title>
function parseRoute(hash) {
  const m = (hash ?? "")
    .replace(/^#/, "")
    .match(/^\/(song|show|venue|title)\/(.+)$/);
  if (!m) return null;
  try {
    return { kind: m[1], value: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

const routeHash = {
  song: (id) => `#/song/${id}`,
  show: (id) => `#/show/${id}`,
  venue: (name) => `#/venue/${encodeURIComponent(name)}`,
  title: (title) => `#/title/${encodeURIComponent(title)}`,
};

export default function App() {
  const {
    unitData,
    globalSongShows,
    globalTitleShows,
    globalVenueShows,
    allUsedSongs,
    allVenues,
    showById,
    unitIdByShowId,
  } = useMemo(() => {
    const unitDataMap = new Map();
    const songShowsMap = new Map();
    const titleShowsMap = new Map();
    const venueShowsMap = new Map();
    const showByIdMap = new Map();
    const unitByShow = new Map();

    for (const unit of allUnits) {
      const isTour = !!unit.templateSetlist;
      const tpl = unit.templateSetlist;
      const tplSongSet = new Set(
        (tpl ?? []).filter((i) => i.songId).map((i) => i.songId)
      );
      const shows = [...(unit.shows ?? [])].sort((a, b) =>
        a.date < b.date ? -1 : 1
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
          if (i.songId) {
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
          } else if (i.title) {
            // Cover/title-only tracks: no songs.json entry, keyed by title.
            if (!titleShowsMap.has(i.title)) titleShowsMap.set(i.title, []);
            titleShowsMap.get(i.title).push({
              showId: s.id,
              unitId: unit.id,
              unitTitle: shortUnitTitle(unit),
              unitType: unit.type,
              item: i,
            });
          }
        }
      }

      unitDataMap.set(unit.id, { unit, isTour, tpl, shows, full, songShows });
    }

    const usedSongsList = songsData.songs.filter(
      (s) => (songShowsMap.get(s.id) ?? []).length > 0
    );

    const venuesList = Array.from(venueShowsMap.keys())
      .map((venue) => {
        const firstShow = venueShowsMap.get(venue)[0]?.show;
        return {
          name: venue,
          city: firstShow?.city ?? "",
          region: firstShow?.region ?? "",
          prefecture: firstShow?.prefecture ?? "",
          shows: venueShowsMap.get(venue),
        };
      })
      .sort(
        (a, b) =>
          b.shows.length - a.shows.length || a.name.localeCompare(b.name)
      );

    return {
      unitData: unitDataMap,
      globalSongShows: songShowsMap,
      globalTitleShows: titleShowsMap,
      globalVenueShows: venueShowsMap,
      allUsedSongs: usedSongsList,
      allVenues: venuesList,
      showById: showByIdMap,
      unitIdByShowId: unitByShow,
    };
  }, []);

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
    if (r.kind === "title" && globalTitleShows.has(r.value))
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

  const [songGroupFilter, setSongGroupFilter] = useState("all");
  const [venueGroupFilter, setVenueGroupFilter] = useState("all");
  const [showGroupFilter, setShowGroupFilter] = useState("all");
  const [showYearFilter, setShowYearFilter] = useState("all");

  const slipRef = useRef(null);

  const current = unitData.get(selUnitId);

  // Hash is the single funnel: selections write hash, hashchange applies state.
  const applyRoute = (r) => {
    if (!r) return;
    if (r.kind === "song" && allUsedSongs.some((s) => s.id === r.value)) {
      setTab("song");
      setSelSong(r.value);
      setSelTitle(null);
      setQ("");
    } else if (r.kind === "title" && globalTitleShows.has(r.value)) {
      setTab("song");
      setSelTitle(r.value);
      setSelSong(null);
      setQ("");
    } else if (r.kind === "show" && unitIdByShowId.has(r.value)) {
      setSelUnitId(unitIdByShowId.get(r.value));
      setTab("show");
      setSelShow(r.value);
    } else if (
      r.kind === "venue" &&
      allVenues.some((v) => v.name === r.value)
    ) {
      setTab("venue");
      setSelVenue(r.value);
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
    tab === "venue" ? "例如 台北小巨蛋 或 橫濱" : "例如 Subtitle";

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
              .filter((y) => y && y !== "9999")
          );
          const availableYears = Array.from(yearsSet).sort((a, b) =>
            b.localeCompare(a)
          );

          // Filter by year if selected
          const finalUnits = categoryFiltered.filter((u) => {
            if (showYearFilter === "all") return true;
            return unitEarliest(u).split("-")[0] === showYearFilter;
          });

          return (
            <div
              className="mb-5 flex flex-wrap items-center gap-x-[10px] gap-y-2 rounded-[3px] border-[1.5px] border-ink bg-card px-4 py-3 shadow-[4px_4px_0_rgba(23,35,59,0.1)]"
              role="group"
              aria-label="場次巡演分組"
            >
              <div className="mr-[6px] flex items-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted after:content-['：']">
                演出類型
              </div>
              <button
                className={filterPillClass(showGroupFilter === "all")}
                onClick={() => {
                  setShowGroupFilter("all");
                  setShowYearFilter("all");
                }}
              >
                全部場次 ({allUnits.length})
              </button>
              <button
                className={filterPillClass(showGroupFilter === "tour")}
                onClick={() => {
                  setShowGroupFilter("tour");
                  setShowYearFilter("all");
                }}
              >
                巡演專場 ({soloUnits.length})
              </button>
              <button
                className={filterPillClass(showGroupFilter === "event")}
                onClick={() => {
                  setShowGroupFilter("event");
                  setShowYearFilter("all");
                }}
              >
                音樂祭／特別事件 ({festUnits.length})
              </button>

              <div className="my-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted after:content-['：']">
                  開始年份
                </span>
                <button
                  className={filterPillClass(showYearFilter === "all")}
                  onClick={() => setShowYearFilter("all")}
                >
                  全部年份
                </button>
                {availableYears.map((year) => {
                  const count = categoryFiltered.filter(
                    (u) => unitEarliest(u).split("-")[0] === year
                  ).length;
                  return (
                    <button
                      key={year}
                      className={filterPillClass(showYearFilter === year)}
                      onClick={() => setShowYearFilter(year)}
                    >
                      📅 {year} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex w-full flex-wrap gap-x-[10px] gap-y-[6px] border-t border-dashed border-line pt-[10px]">
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
            專輯／發行分類
          </div>
          <button
            className={filterPillClass(songGroupFilter === "all")}
            onClick={() => setSongGroupFilter("all")}
          >
            全部歌曲 ({allUsedSongs.length})
          </button>
          {ALBUM_ORDER.map((album) => {
            const count = allUsedSongs.filter(
              (s) => getSongAlbum(s) === album
            ).length;
            if (!count) return null;
            return (
              <button
                key={album}
                className={filterPillClass(songGroupFilter === album)}
                onClick={() => setSongGroupFilter(album)}
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
          <button
            className={filterPillClass(venueGroupFilter === "all")}
            onClick={() => setVenueGroupFilter("all")}
          >
            全部地區 ({allVenues.length})
          </button>
          {REGION_ORDER.map((region) => {
            const count = allVenues.filter(
              (v) => getVenueRegion(v) === region
            ).length;
            if (!count) return null;
            return (
              <button
                key={region}
                className={filterPillClass(venueGroupFilter === region)}
                onClick={() => setVenueGroupFilter(region)}
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
                if (songGroupFilter !== "all") {
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
                      const count = (globalSongShows.get(s.id) ?? []).length;
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
                if (venueGroupFilter !== "all") {
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
                globalTitleShows={globalTitleShows}
                showById={showById}
                onSelectShow={handleSelectShow}
              />
            ) : (
              <SongSlip
                songId={selSong}
                globalSongShows={globalSongShows}
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

function ShowSlip({ ud, showId, onSelectSong, onSelectTitle }) {
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

  const SLIP_CLASS = SLIP_CARD;

  const cueColor = (i) => {
    const p = primaryKind(i);
    return p ? CUE_COLOR[p] ?? "text-muted" : "text-muted";
  };

  const songWeight = (i) => (primaryKind(i) ? "font-bold" : "font-medium");

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
        return (
          <a
            className="transition-colors hover:text-pool focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none"
            href={routeHash.title(title)}
            onClick={(e) => {
              e.preventDefault();
              onSelectTitle(title);
            }}
          >
            {title}
          </a>
        );
      }
      return (
        <a
          className={`${SETLIST_SONG} ${songWeight(it)}`}
          href={routeHash.song(it.songId)}
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
              className={`px-2 py-[1px] font-mono text-[10px] font-semibold leading-[1.4] tracking-[0.2em] text-white ${
                SLIP_TAB_COLOR[k] ?? "bg-ink"
              }`}
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
            {g.items.map((it) => (
              <span
                key={it.order}
                className="flex min-w-0 items-baseline gap-3"
              >
                <span className={`${CUE_NO} ${cueColor(it)}`}>{cueNo(it)}</span>
                <span>
                  {songLine(it)}
                  {it.note && <span className={TRACK_NOTE}> {it.note}</span>}
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
        <span className={`${CUE_NO} ${cueColor(first)}`}>{cueNo(first)}</span>
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
      <div className="mb-[6px] border-b-2 border-ink pb-3">
        <h3 className="m-0 flex flex-col gap-[2px] font-display text-[23px] font-extrabold leading-[1.3]">
          <span className="font-mono text-[15px] font-semibold text-muted">
            {showDate(s)}
          </span>
          <span className="text-[24px] font-extrabold text-ink">{s.venue}</span>
          <span className="text-[16px] font-medium text-muted">
            （{s.city}）
          </span>
        </h3>
        <p className="mt-[6px] text-[13px] text-muted [&_a]:text-pool [&_a]:underline-offset-[3px]">
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
    </article>
  );
}

function SongSlip({ songId, globalSongShows, showById, onSelectShow }) {
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

  const appearances = globalSongShows.get(songId) ?? [];

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="歌曲全域出現場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-[6px] border-b-2 border-ink pb-3">
        <p className="m-0 mb-1 font-mono text-[12px] tracking-[0.18em] text-muted">
          ALL TOURS → SONG SHOWS
        </p>
        <h3 className="m-0 font-display text-[23px] font-extrabold leading-[1.3]">
          {songTitle[songId]}
          {songUnreleased.has(songId) && (
            <span className="ml-1 align-baseline text-[0.8em] font-normal tracking-[0.02em] text-muted">
              （未發行）
            </span>
          )}
        </h3>
        <p className="mt-[6px] font-mono text-[13px] text-muted [&_a]:text-pool">
          全檔案庫共出現於 {appearances.length} 場演出
        </p>
      </div>
      <ul className="m-0 mt-3 list-none p-0">
        {appearances.map(({ showId, unitTitle, unitType, item }) => {
          const s = showById.get(showId);
          return (
            <li
              key={showId}
              className="flex items-start gap-3 border-b border-line-soft px-1 py-[10px] last:border-b-0"
            >
              <span className="mt-[2px] whitespace-nowrap rounded-[3px] border border-[rgba(30,46,74,0.25)] bg-[rgba(232,180,40,0.38)] px-[6px] py-[2px] font-mono text-[11px] font-semibold text-ink">
                {unitTitle}
                {unitType !== "專場" && (
                  <span className="ml-[7px] rounded-full border border-current px-[6px] py-[1px] align-middle font-mono text-[0.72em] font-semibold tracking-[0.04em] opacity-85">
                    {unitType}
                  </span>
                )}
              </span>
              <a
                className="flex flex-col leading-[1.45] text-ink no-underline transition-colors hover:text-request focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none [&_.show-link-venue]:hover:text-pool [&_.show-link-venue]:hover:underline"
                href={routeHash.show(showId)}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectShow(showId);
                }}
              >
                <span className="font-mono text-[12px] text-muted">
                  {showDate(s)}
                </span>
                <span className="show-link-venue text-[14px] font-bold">
                  {s.venue}
                </span>
                <span className="show-link-city text-[13px] text-muted">
                  （{s.city}）
                </span>
              </a>
              {(Array.isArray(item.kind)
                ? item.kind
                : item.kind
                ? [item.kind]
                : []
              )
                .filter((k) => KIND_BADGE[k])
                .map((k) => (
                  <span
                    key={k}
                    className={`ml-2 inline-block rounded-[3px] px-[7px] py-[3px] align-middle font-mono text-[0.72em] font-semibold leading-none tracking-[0.06em] before:content-['♪_'] ${KIND_BADGE_CLASS(
                      k
                    )}`}
                  >
                    {KIND_BADGE[k]}
                  </span>
                ))}
              {item.note && (
                <span className="text-[13px] text-muted"> {item.note}</span>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function TitleSlip({ title, globalTitleShows, showById, onSelectShow }) {
  if (!title) {
    return (
      <div className={SLIP_ARTICLE}>
        <span aria-hidden="true" className={SLIP_TAPE} />
        <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
          選一首歌曲，看它在全檔案庫哪幾場出現過。
        </p>
      </div>
    );
  }

  const appearances = globalTitleShows.get(title) ?? [];

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="翻唱全域出現場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-[6px] border-b-2 border-ink pb-3">
        <p className="m-0 mb-1 font-mono text-[12px] tracking-[0.18em] text-muted">
          ALL TOURS → SONG SHOWS
        </p>
        <h3 className="m-0 font-display text-[23px] font-extrabold leading-[1.3]">
          {title}
        </h3>
        <p className="mt-[6px] font-mono text-[13px] text-muted [&_a]:text-pool">
          全檔案庫共出現於 {appearances.length} 場演出
        </p>
      </div>
      <ul className="m-0 mt-3 list-none p-0">
        {appearances.map(({ showId, unitTitle, unitType, item }) => {
          const s = showById.get(showId);
          return (
            <li
              key={showId}
              className="flex items-start gap-3 border-b border-line-soft px-1 py-[10px] last:border-b-0"
            >
              <span className="mt-[2px] whitespace-nowrap rounded-[3px] border border-[rgba(30,46,74,0.25)] bg-[rgba(232,180,40,0.38)] px-[6px] py-[2px] font-mono text-[11px] font-semibold text-ink">
                {unitTitle}
                {unitType !== "專場" && (
                  <span className="ml-[7px] rounded-full border border-current px-[6px] py-[1px] align-middle font-mono text-[0.72em] font-semibold tracking-[0.04em] opacity-85">
                    {unitType}
                  </span>
                )}
              </span>
              <a
                className="flex flex-col leading-[1.45] text-ink no-underline transition-colors hover:text-request focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none [&_.show-link-venue]:hover:text-pool [&_.show-link-venue]:hover:underline"
                href={routeHash.show(showId)}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectShow(showId);
                }}
              >
                <span className="font-mono text-[12px] text-muted">
                  {showDate(s)}
                </span>
                <span className="show-link-venue text-[14px] font-bold">
                  {s.venue}
                </span>
                <span className="show-link-city text-[13px] text-muted">
                  （{s.city}）
                </span>
              </a>
              {(Array.isArray(item.kind)
                ? item.kind
                : item.kind
                ? [item.kind]
                : []
              )
                .filter((k) => KIND_BADGE[k])
                .map((k) => (
                  <span
                    key={k}
                    className={`ml-2 inline-block rounded-[3px] px-[7px] py-[3px] align-middle font-mono text-[0.72em] font-semibold leading-none tracking-[0.06em] before:content-['♪_'] ${KIND_BADGE_CLASS(
                      k
                    )}`}
                  >
                    {KIND_BADGE[k]}
                  </span>
                ))}
              {item.note && (
                <span className="text-[13px] text-muted"> {item.note}</span>
              )}
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
      <div className={SLIP_ARTICLE}>
        <span aria-hidden="true" className={SLIP_TAPE} />
        <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
          選一個場地，看在該場地舉行過哪些場次。
        </p>
      </div>
    );
  }

  const venueShows = globalVenueShows.get(venueName) ?? [];
  const firstCity = venueShows[0]?.show.city ?? "";

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="場地全域場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-[6px] border-b-2 border-ink pb-3">
        <p className="m-0 mb-1 font-mono text-[12px] tracking-[0.18em] text-muted">
          ALL TOURS → VENUE SHOWS
        </p>
        <h3 className="m-0 font-display text-[23px] font-extrabold leading-[1.3]">
          {venueName}{" "}
          <span className="text-[16px] font-normal text-muted">
            （{firstCity}）
          </span>
        </h3>
        <p className="mt-[6px] font-mono text-[13px] text-muted [&_a]:text-pool">
          全檔案庫共舉辦過 {venueShows.length} 場演出
        </p>
      </div>
      <ul className="m-0 mt-3 list-none p-0">
        {venueShows.map(({ showId, unitTitle, unitType, show }) => (
          <li
            key={showId}
            className="flex items-start gap-3 border-b border-line-soft px-1 py-[10px] last:border-b-0"
          >
            <span className="mt-[2px] whitespace-nowrap rounded-[3px] border border-[rgba(30,46,74,0.25)] bg-[rgba(232,180,40,0.38)] px-[6px] py-[2px] font-mono text-[11px] font-semibold text-ink">
              {unitTitle}
              {unitType !== "專場" && (
                <span className="ml-[7px] rounded-full border border-current px-[6px] py-[1px] align-middle font-mono text-[0.72em] font-semibold tracking-[0.04em] opacity-85">
                  {unitType}
                </span>
              )}
            </span>
            <a
              className="flex flex-col leading-[1.45] text-ink no-underline transition-colors hover:text-request focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none [&_.show-link-venue]:hover:text-pool [&_.show-link-venue]:hover:underline"
              href={routeHash.show(showId)}
              onClick={(e) => {
                e.preventDefault();
                onSelectShow(showId);
              }}
            >
              <span className="font-mono text-[12px] text-muted">
                {showDate(show)}
              </span>
              <span className="show-link-venue text-[14px] font-bold">
                {show.venue}
              </span>
              <span className="show-link-city text-[13px] text-muted">
                （{show.city}）
              </span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
