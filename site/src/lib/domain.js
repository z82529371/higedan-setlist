import songsData from "../data/songs.json";
import { ALBUM_MAP } from "./constants.js";
import { trackKeyOf, trackKey } from "./track.js";
import { resolve, resolveShowItems } from "./resolve.js";

const tourUnits = Object.values(
  import.meta.glob("../data/tours/*.json", { eager: true, import: "default" })
);
const eventUnits = Object.values(
  import.meta.glob("../data/events/*.json", { eager: true, import: "default" })
);

export const songTitle = Object.fromEntries(
  songsData.songs.map((s) => [s.id, s.title])
);
export const songUnreleased = new Set(
  songsData.songs.filter((s) => s.unreleased).map((s) => s.id)
);

export function getSongAlbum(song) {
  if (song.unreleased || songUnreleased.has(song.id)) return "未發行曲目";
  return ALBUM_MAP[song.id] ?? "EP / 單曲";
}

export function getVenueRegion(v) {
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

export function showDate(s) {
  return s.weekday ? `${s.date}（${s.weekday}）` : s.date;
}

export function showLabel(s) {
  return `${showDate(s)} ${s.venue}（${s.city}）`;
}

export function shortUnitTitle(unit) {
  if (!unit) return "";
  if (unit.shortTitle) return unit.shortTitle;
  const shortened = (unit.title ?? "")
    .replace(
      /^(?:Official\s*髭男\s*dism|Official\s*Hige\s*Dandism)\s*[-–—:：]?\s*/i,
      ""
    )
    .trim();
  return shortened || unit.title || "";
}

export function unitEarliest(unit) {
  return (unit.shows ?? []).reduce(
    (m, s) => (s.date < m ? s.date : m),
    unit.shows?.[0]?.date ?? "9999-12-31"
  );
}

export const allUnits = [...tourUnits, ...eventUnits].sort((a, b) =>
  unitEarliest(b) < unitEarliest(a) ? -1 : 1
);

export function defaultShowId(unit) {
  const shows = [...(unit?.shows ?? [])].sort((a, b) =>
    a.date < b.date ? -1 : 1
  );
  const withSongs = shows.filter(
    (s) =>
      unit?.templateSetlist ||
      (s.setlist ?? []).some((i) => i.songId || i.title)
  );
  return (withSongs.length > 0 ? withSongs.at(-1) : shows.at(-1))?.id ?? null;
}

export function buildIndex() {
  const unitDataMap = new Map();
  const trackShowsMap = new Map();
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
        }
        const key = trackKeyOf(i);
        if (key) {
          if (!trackShowsMap.has(key)) trackShowsMap.set(key, []);
          trackShowsMap.get(key).push({
            showId: s.id,
            unitId: unit.id,
            unitTitle: shortUnitTitle(unit),
            unitType: unit.type,
            item: i,
            ...(i.songId
              ? { isTemplateSong: isTour && tplSongSet.has(i.songId) }
              : {}),
          });
        }
      }
    }

    unitDataMap.set(unit.id, { unit, isTour, tpl, shows, full, songShows });
  }

  const usedSongsList = songsData.songs.filter(
    (s) => (trackShowsMap.get(trackKey("song", s.id)) ?? []).length > 0
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
      (a, b) => b.shows.length - a.shows.length || a.name.localeCompare(b.name)
    );

  return {
    unitData: unitDataMap,
    trackShows: trackShowsMap,
    globalVenueShows: venueShowsMap,
    allUsedSongs: usedSongsList,
    allVenues: venuesList,
    showById: showByIdMap,
    unitIdByShowId: unitByShow,
  };
}
