import songsData from "../data/songs.json";
import { ALBUM_MAP } from "./constants.js";
import { trackKeyOf, trackKey } from "./track.js";
import { resolveShowItems } from "./resolve.js";

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
export const songLiveFansId = Object.fromEntries(
  songsData.songs.filter((s) => s.livefansId).map((s) => [s.id, s.livefansId])
);

export function getSongAlbum(song) {
  if (song.unreleased || songUnreleased.has(song.id)) return "未發行曲目";
  return ALBUM_MAP[song.id] ?? "EP / 單曲";
}

/**
 * 格式化演出時間（開場／開演時間領域規範）
 * 1. 雙時間俱備：`17:00 開場 / 18:00 開演`
 * 2. 僅開演時刻（startsAt 或歷史單一時間 opensAt）：`18:00 開演`
 * 3. 無時間：`null`
 */
export function formatShowTime(show) {
  if (!show) return null;
  const { opensAt, startsAt } = show;
  if (opensAt && startsAt) {
    return `${opensAt} 開場 / ${startsAt} 開演`;
  }
  if (startsAt) {
    return `${startsAt} 開演`;
  }
  if (opensAt) {
    return `${opensAt} 開演`;
  }
  return null;
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

export function getUnitTypeLabel(unit) {
  if (!unit) return "其他";
  if (unit.type === "店家活動") return "店家活動";
  if (unit.type === "特別專場") return "特別專場";
  if (unit.type === "學園祭") return "學園祭";
  if (unit.type === "對バン" || unit.type === "聯合專場") return "聯合專場";
  if (unit.type === "電視演出" || unit.type === "TV拼盤") return "電視演出";
  if (unit.type === "線上直播") return "線上直播";
  if (unit.type === "音樂祭") return "音樂祭";
  if (unit.type === "巡演專場") return "巡演專場";
  if (unit.type === "專場") return unit.templateSetlist || unit.isTour ? "巡演專場" : "特別專場";
  return unit.templateSetlist || unit.isTour ? "巡演專場" : (unit.type || "其他");
}

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
          unitType: getUnitTypeLabel(unit),
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
            unitType: getUnitTypeLabel(unit),
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

export const FREQUENCY_TIER_CONFIG = {
  core: {
    tier: "core",
    label: "核心全勤",
    badgeLabel: "核心全勤 100%",
    badgeClass: "bg-card text-ink border-[1.5px] border-band font-bold shadow-2xs",
    pillClass: "bg-card text-ink border border-band/70 font-bold",
    marker: "★",
    markerClass: "text-band",
  },
  regular: {
    tier: "regular",
    label: "巡演定番",
    badgeLabel: "巡演定番",
    badgeClass: "bg-card text-ink border border-line font-bold shadow-2xs",
    pillClass: "bg-card text-ink border border-line font-medium",
    marker: "●",
    markerClass: "text-ink",
  },
  rotating: {
    tier: "rotating",
    label: "雙日輪替",
    badgeLabel: "雙日輪替",
    badgeClass: "bg-card text-ink border border-amber-600/50 dark:border-amber-500/50 font-bold shadow-2xs",
    pillClass: "bg-card text-ink border border-amber-600/40 dark:border-amber-500/40 font-medium",
    marker: "▲",
    markerClass: "text-amber-600 dark:text-amber-400",
  },
  surprise: {
    tier: "surprise",
    label: "限定突襲",
    badgeLabel: "限定突襲",
    badgeClass: "bg-card text-ink border border-unreleased/50 font-bold shadow-2xs",
    pillClass: "bg-card text-ink border border-unreleased/40 font-medium",
    marker: "◆",
    markerClass: "text-unreleased",
  },
};

export function getTourFrequencyTier(count, totalShows) {
  if (totalShows <= 0) return "surprise";
  if (count === totalShows) return "core";
  const ratio = count / totalShows;
  const percentage = Math.round(ratio * 100);
  if (percentage >= 70) return "regular";
  if (percentage >= 30) return "rotating";
  return "surprise";
}

export function formatFrequencyStats(count, totalShows) {
  const ratio = totalShows > 0 ? count / totalShows : 0;
  const percentage = totalShows > 0 ? Math.round(ratio * 100) : 0;
  const tier = getTourFrequencyTier(count, totalShows);
  const tierInfo = FREQUENCY_TIER_CONFIG[tier] || FREQUENCY_TIER_CONFIG.surprise;
  const tierBadgeLabel =
    tier === "core" ? "核心全勤 100%" : `${tierInfo.label} ${percentage}%`;

  return {
    ratio,
    percentage,
    tier,
    tierLabel: tierInfo.label,
    tierBadgeLabel,
    badgeClass: tierInfo.badgeClass,
    pillClass: tierInfo.pillClass,
  };
}

export function computeTourStatistics(tourUnitData) {
  if (!tourUnitData) {
    return {
      unit: null,
      tour: null,
      isTour: false,
      totalShows: 0,
      consensusTracks: [],
      templateTracks: [],
      coreTracks: [],
      regularTracks: [],
      rotatingTracks: [],
      surpriseTracks: [],
      interludes: [],
      itinerary: [],
      stats: {
        totalShows: 0,
        coreCount: 0,
        regularCount: 0,
        rotatingCount: 0,
        surpriseCount: 0,
        uniqueSongsCount: 0,
        prefecturesCount: 0,
        citiesCount: 0,
        dateStart: "",
        dateEnd: "",
      },
    };
  }

  const unit = tourUnitData.unit || tourUnitData;
  const isTour = !!(unit.templateSetlist || unit.isTour || tourUnitData.isTour);
  const rawTpl = tourUnitData.tpl || unit.templateSetlist || [];
  const shows = [...(tourUnitData.shows || unit.shows || [])].sort((a, b) =>
    (a.date || "").localeCompare(b.date || "") || (a.id || "").localeCompare(b.id || "")
  );
  const totalShows = shows.length;
  const full = tourUnitData.full;

  const resolvedShows = shows.map((s) => ({
    show: s,
    items: full?.get?.(s.id) ?? resolveShowItems(unit, s),
  }));

  const uniquePrefectures = new Set();
  const uniqueCities = new Set();
  const allUniqueSongKeys = new Set();

  for (const s of shows) {
    if (s.prefecture) uniquePrefectures.add(s.prefecture);
    if (s.city) uniqueCities.add(s.city);
  }

  const tplSongSet = new Set();
  for (const t of rawTpl) {
    if (t.songId) tplSongSet.add(t.songId);
  }

  // 1. Consensus / Template Tracks calculation
  const consensusTracks = rawTpl.map((item) => {
    const songId = item.songId || null;
    const title = (songId && songTitle[songId]) || item.title || "";
    const songKey = songId || item.title;
    if (songKey) allUniqueSongKeys.add(songKey);

    const appearances = [];
    const variationNotes = new Set();

    for (const rs of resolvedShows) {
      const matched = rs.items.filter((it) =>
        (songId && it.songId === songId) ||
        (!songId && item.title && (it.title === item.title || it.name === item.title))
      );

      if (matched.length > 0) {
        appearances.push(rs.show.id);
        for (const m of matched) {
          if (m.note) variationNotes.add(m.note);
        }
      }
    }

    const count = appearances.length;
    const freq = formatFrequencyStats(count, totalShows);

    return {
      order: item.order,
      songId,
      title,
      encore: !!item.encore,
      count,
      totalShows,
      ratio: freq.ratio,
      percentage: freq.percentage,
      tier: freq.tier,
      tierLabel: freq.tierLabel,
      tierBadgeLabel: freq.tierBadgeLabel,
      badgeClass: freq.badgeClass,
      pillClass: freq.pillClass,
      appearances,
      variations: Array.from(variationNotes),
    };
  });

  const coreTracks = consensusTracks.filter((t) => t.tier === "core");
  const regularTracks = consensusTracks.filter((t) => t.tier === "regular");
  const rotatingTracks = consensusTracks.filter((t) => t.tier === "rotating");
  const surpriseTemplateTracks = consensusTracks.filter((t) => t.tier === "surprise");

  // 2. Surprise Non-Template Tracks & Interludes
  const nonTemplateSongMap = new Map();
  const interludes = [];

  for (const rs of resolvedShows) {
    for (const it of rs.items) {
      if (it.type === "interlude" || (!it.songId && !it.title)) {
        interludes.push({
          showId: rs.show.id,
          show: rs.show,
          item: it,
          cue: "—",
        });
        continue;
      }

      const sid = it.songId;
      const stitle = (sid && songTitle[sid]) || it.title;
      const songKey = sid || stitle;
      if (songKey) allUniqueSongKeys.add(songKey);

      const isTemplateSong = sid ? tplSongSet.has(sid) : rawTpl.some((t) => t.title === stitle);
      if (!isTemplateSong) {
        const key = sid || stitle;
        if (!nonTemplateSongMap.has(key)) {
          nonTemplateSongMap.set(key, {
            songId: sid || null,
            title: stitle,
            appearances: [],
            shows: [],
            notes: new Set(),
          });
        }
        const record = nonTemplateSongMap.get(key);
        if (!record.appearances.includes(rs.show.id)) {
          record.appearances.push(rs.show.id);
          record.shows.push(rs.show);
        }
        if (it.note) record.notes.add(it.note);
      }
    }
  }

  const allNonTemplateTracks = Array.from(nonTemplateSongMap.values()).map((rec) => {
    const count = rec.appearances.length;
    const freq = formatFrequencyStats(count, totalShows);

    return {
      songId: rec.songId,
      title: rec.title,
      count,
      totalShows,
      ratio: freq.ratio,
      percentage: freq.percentage,
      tier: freq.tier,
      tierLabel: freq.tierLabel,
      tierBadgeLabel: freq.tierBadgeLabel,
      badgeClass: freq.badgeClass,
      pillClass: freq.pillClass,
      appearances: rec.appearances,
      shows: rec.shows,
      variations: Array.from(rec.notes),
    };
  });

  const surpriseTracks = allNonTemplateTracks
    .filter((t) => t.ratio < 0.3 || t.tier === "surprise")
    .sort((a, b) => b.count - a.count || (a.title > b.title ? 1 : -1));

  // 3. Chronological Itinerary Timeline
  const itinerary = shows.map((s, idx) => ({
    id: s.id,
    index: idx + 1,
    date: s.date,
    weekday: s.weekday || "",
    venue: s.venue,
    city: s.city,
    prefecture: s.prefecture || "",
    region: s.region || "",
    time: formatShowTime(s),
    sourceUrls: s.sourceUrls || [],
    isFirst: idx === 0,
    isFinal: idx === shows.length - 1,
  }));

  const earliestDate = shows[0]?.date ?? "";
  const latestDate = shows.at(-1)?.date ?? "";

  const stats = {
    totalShows,
    coreCount: coreTracks.length,
    regularCount: regularTracks.length,
    rotatingCount: rotatingTracks.length,
    surpriseCount: surpriseTemplateTracks.length + surpriseTracks.length,
    interludesCount: interludes.length,
    uniqueSongsCount: allUniqueSongKeys.size,
    prefecturesCount: uniquePrefectures.size,
    citiesCount: uniqueCities.size,
    dateStart: earliestDate,
    dateEnd: latestDate,
  };

  return {
    unit,
    tour: unit,
    isTour,
    totalShows,
    consensusTracks,
    templateTracks: consensusTracks,
    coreTracks,
    regularTracks,
    rotatingTracks,
    surpriseTracks,
    nonTemplateTracks: allNonTemplateTracks,
    interludes,
    itinerary,
    stats,
  };
}
