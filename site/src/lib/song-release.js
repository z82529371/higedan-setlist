import { ALBUM_MAP } from "./constants.js";
import songsData from "../data/songs.json";

const songUnreleasedSet = new Set(
  songsData.songs.filter((s) => s.unreleased).map((s) => s.id)
);

/**
 * Single & EP Provenance Master Map (ADR-0143)
 * Maps song IDs to their first-release Single or EP physical/digital debut provenance.
 */
export const SINGLE_EP_PROVENANCE = {
  // Physical Singles (Official Japanese Discography SSOT)
  "no-doubt": { type: "physical", index: "1st", title: "ノーダウト", year: "2018", album: "エスカパレード" },
  "pretender": { type: "physical", index: "2nd", title: "Pretender", year: "2019", album: "Traveler" },
  "shukumei": { type: "physical", index: "3rd", title: "宿命", year: "2019", album: "Traveler" },
  "i-love": { type: "physical", index: "4th", title: "I LOVE...", year: "2020", album: "Editorial" },
  "universe": { type: "physical", index: "5th", title: "Universe", year: "2021", album: "Editorial" },
  "chessboard": { type: "dual", physicalIndex: "6th", digitalIndex: "11th", title: "Chessboard", year: "2023", album: "Rejoice" },
  "nichijo": { type: "dual", physicalIndex: "6th", digitalIndex: "12th", title: "日常", year: "2023", album: "Rejoice" },
  "stardust": { type: "dual", physicalIndex: "7th", digitalIndex: "20th", title: "スターダスト", year: "2026", album: null },
  "elder-flower": { type: "dual", physicalIndex: "7th", digitalIndex: "19th", title: "エルダーフラワー", year: "2026", album: null },

  // Digital Singles
  "tell-me-baby": { type: "digital", index: "1st", title: "Tell Me Baby / ブラザーズ", year: "2017", album: "エスカパレード" },
  "brothers": { type: "digital", index: "1st", title: "Tell Me Baby / ブラザーズ", year: "2017", album: "エスカパレード" },
  "bad-for-me": { type: "digital", index: "2nd", title: "バッドフォーミー", year: "2018", album: "Traveler" },
  "parabola": { type: "digital", index: "3rd", title: "パラボラ", year: "2020", album: "Editorial" },
  "laughter": { type: "digital", index: "4th", title: "Laughter", year: "2020", album: "Editorial" },
  "cry-baby": { type: "digital", index: "5th", title: "Cry Baby", year: "2021", album: "Editorial" },
  "anarchy": { type: "digital", index: "6th", title: "Anarchy", year: "2022", album: "Rejoice" },
  "anarchy-rejoice-ver": { type: "digital", index: "6th", title: "Anarchy", year: "2022", album: "Rejoice" },
  "mixed-nuts": { type: "dual_ep", digitalIndex: "7th", epIndex: "4th", title: "ミックスナッツ", epTitle: "ミックスナッツ EP", year: "2022", album: "Rejoice" },
  "subtitle": { type: "digital", index: "8th", title: "Subtitle", year: "2022", album: "Rejoice" },
  "white-noise": { type: "digital", index: "9th", title: "ホワイトノイズ", year: "2023", album: "Rejoice" },
  "tattoo": { type: "digital", index: "10th", title: "TATTOO", year: "2023", album: "Rejoice" },
  "soulsoup": { type: "digital", index: "13th", title: "SOULSOUP", year: "2023", album: "Rejoice" },
  "same-blue": { type: "digital", index: "14th", title: "Same Blue", year: "2024", album: null },
  "50pct": { type: "digital", index: "15th", title: "50%", year: "2024", album: null },
  "rashisa": { type: "digital", index: "16th", title: "らしさ", year: "2025", album: null },
  "sanitizer": { type: "digital", index: "17th", title: "Sanitizer", year: "2025", album: null },
  "make-me-wonder": { type: "digital", index: "18th", title: "Make Me Wonder", year: "2025", album: null },

  // EPs
  "whats-going-on": { type: "ep", index: "1st", title: "What's Going On?", year: "2016", album: null },
  "stand-by-you": { type: "ep", index: "2nd", title: "Stand By You EP", year: "2018", album: "Traveler" },
  "fire-ground": { type: "ep", index: "2nd", title: "Stand By You EP", year: "2018", album: "Traveler" },
  "hello": { type: "ep", index: "3rd", title: "HELLO EP", year: "2020", album: "Editorial" },
  "natsu-moyou-no-neko": { type: "ep", index: "3rd", title: "HELLO EP", year: "2020", album: "Editorial" },
  "hakan": { type: "ep", index: "4th", title: "ミックスナッツ EP", year: "2022", album: "Rejoice" },
  "choral-a": { type: "ep", index: "4th", title: "ミックスナッツ EP", year: "2022", album: "Rejoice" },
  "lady": { type: "digital_ep", index: "Digital 1st", title: "LADY", year: "2017", album: "エスカパレード" },
  "driver": { type: "digital_ep", index: "Digital 1st", title: "LADY", year: "2017", album: "エスカパレード" },
};

/**
 * Resolves the official release provenance for a song across locales (ADR-0143).
 * Returns dual provenance: e.g. "2nd Single《Pretender》(2019) · 収録アルバム《Traveler》"
 */
export function getSongReleaseProvenance(songId, locale = "zh-TW") {
  if (songUnreleasedSet.has(songId)) {
    if (locale === "ja") return "未音源化作品（デモ / ライブ限定）";
    if (locale === "en") return "Unreleased Work (Demo / Live Only)";
    if (locale === "ko") return "미발매 곡 (데모 / 라이브 한정)";
    return "未正式發行作品（Demo / 現場限定）";
  }

  const prov = SINGLE_EP_PROVENANCE[songId];
  const isEn = locale === "en";
  const openQuote = isEn ? '"' : "《";
  const closeQuote = isEn ? '"' : "》";

  const albPrefix =
    locale === "zh-TW"
      ? "収録專輯"
      : locale === "ja"
      ? "収録アルバム"
      : locale === "ko"
      ? "수록 앨범"
      : "Album: ";

  const uncolLabel =
    locale === "ja"
      ? "アルバム未収録"
      : locale === "ko"
      ? "앨범 미수록"
      : locale === "en"
      ? "Uncollected in Album"
      : "專輯未收錄";

  if (prov) {
    let lead = "";
    if (prov.type === "physical") {
      lead = `${prov.index} Single${openQuote}${prov.title}${closeQuote}(${prov.year})`;
    } else if (prov.type === "digital") {
      lead = `${prov.index} Digital Single${openQuote}${prov.title}${closeQuote}(${prov.year})`;
    } else if (prov.type === "dual") {
      lead = `${prov.physicalIndex} Single / ${prov.digitalIndex} Digital Single${openQuote}${prov.title}${closeQuote}(${prov.year})`;
    } else if (prov.type === "ep") {
      lead = `${prov.index} EP${openQuote}${prov.title}${closeQuote}(${prov.year})`;
    } else if (prov.type === "dual_ep") {
      lead = `${prov.digitalIndex} Digital Single / ${prov.epIndex} EP${openQuote}${prov.epTitle}${closeQuote}(${prov.year})`;
    } else if (prov.type === "digital_ep") {
      lead = `${prov.index} EP${openQuote}${prov.title}${closeQuote}(${prov.year})`;
    }

    if (prov.album) {
      return `${lead} · ${albPrefix}${openQuote}${prov.album}${closeQuote}`;
    }
    return `${lead} · ${uncolLabel}`;
  }

  // Album-only debut tracks
  const mappedAlbum = ALBUM_MAP[songId];
  if (mappedAlbum) {
    // If string like "エスカパレード (2018)", parse album title and year
    const match = mappedAlbum.match(/^(.*?)\s*\((\d{4})\)$/);
    if (match) {
      const [, title, year] = match;
      return `${albPrefix}${openQuote}${title}${closeQuote} (${year})`;
    }
    return `${albPrefix}${openQuote}${mappedAlbum}${closeQuote}`;
  }

  return `${albPrefix}${openQuote}Official Album${closeQuote}`;
}
