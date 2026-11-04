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
  "no-doubt": { type: "physical", index: "1st", title: "ノーダウト", year: "2018", album: "エスカパレード", releaseId: "single-no-doubt" },
  "pretender": { type: "physical", index: "2nd", title: "Pretender", year: "2019", album: "Traveler", releaseId: "single-pretender" },
  "shukumei": { type: "physical", index: "3rd", title: "宿命", year: "2019", album: "Traveler", releaseId: "single-shukumei" },
  "i-love": { type: "physical", index: "4th", title: "I LOVE...", year: "2020", album: "Editorial", releaseId: "single-i-love" },
  "universe": { type: "physical", index: "5th", title: "Universe", year: "2021", album: "Editorial", releaseId: "single-universe" },
  "chessboard": { type: "dual", physicalIndex: "6th", digitalIndex: "11th", title: "Chessboard", year: "2023", album: "Rejoice", releaseId: "single-chessboard-nichijo" },
  "nichijo": { type: "dual", physicalIndex: "6th", digitalIndex: "12th", title: "日常", year: "2023", album: "Rejoice", releaseId: "single-chessboard-nichijo" },
  "stardust": { type: "dual", physicalIndex: "7th", digitalIndex: "20th", title: "スターダスト", year: "2026", album: null, releaseId: "single-stardust-elder-flower" },
  "elder-flower": { type: "dual", physicalIndex: "7th", digitalIndex: "19th", title: "エルダーフラワー", year: "2026", album: null, releaseId: "single-stardust-elder-flower" },

  // Digital Singles
  "tell-me-baby": { type: "digital", index: "1st", title: "Tell Me Baby / ブラザーズ", year: "2017", album: "エスカパレード", releaseId: "digital-tell-me-baby-brothers" },
  "brothers": { type: "digital", index: "1st", title: "Tell Me Baby / ブラザーズ", year: "2017", album: "エスカパレード", releaseId: "digital-tell-me-baby-brothers" },
  "bad-for-me": { type: "digital", index: "2nd", title: "バッドフォーミー", year: "2018", album: "Traveler", releaseId: "digital-bad-for-me" },
  "parabola": { type: "digital", index: "3rd", title: "パラボラ", year: "2020", album: "Editorial", releaseId: "digital-parabola" },
  "laughter": { type: "digital", index: "4th", title: "Laughter", year: "2020", album: "Editorial", releaseId: "digital-laughter" },
  "cry-baby": { type: "digital", index: "5th", title: "Cry Baby", year: "2021", album: "Editorial", releaseId: "digital-cry-baby" },
  "anarchy": { type: "digital", index: "6th", title: "Anarchy", year: "2022", album: "Rejoice", releaseId: "digital-anarchy" },
  "anarchy-rejoice-ver": { type: "digital", index: "6th", title: "Anarchy", year: "2022", album: "Rejoice", releaseId: "digital-anarchy" },
  "mixed-nuts": { type: "dual_ep", digitalIndex: "7th", epIndex: "4th", title: "ミックスナッツ", epTitle: "ミックスナッツ EP", year: "2022", album: "Rejoice", releaseId: "ep-mixed-nuts" },
  "subtitle": { type: "digital", index: "8th", title: "Subtitle", year: "2022", album: "Rejoice", releaseId: "digital-subtitle" },
  "white-noise": { type: "digital", index: "9th", title: "ホワイトノイズ", year: "2023", album: "Rejoice", releaseId: "digital-white-noise" },
  "tattoo": { type: "digital", index: "10th", title: "TATTOO", year: "2023", album: "Rejoice", releaseId: "digital-tattoo" },
  "soulsoup": { type: "digital", index: "13th", title: "SOULSOUP", year: "2023", album: "Rejoice", releaseId: "digital-soulsoup" },
  "same-blue": { type: "digital", index: "14th", title: "Same Blue", year: "2024", album: null, releaseId: "digital-same-blue" },
  "50pct": { type: "digital", index: "15th", title: "50%", year: "2024", album: null, releaseId: "digital-50pct" },
  "rashisa": { type: "digital", index: "16th", title: "らしさ", year: "2025", album: null, releaseId: "digital-rashisa" },
  "sanitizer": { type: "digital", index: "17th", title: "Sanitizer", year: "2025", album: null, releaseId: "digital-sanitizer" },
  "make-me-wonder": { type: "digital", index: "18th", title: "Make Me Wonder", year: "2025", album: null, releaseId: "digital-make-me-wonder" },

  // EPs
  "whats-going-on": { type: "ep", index: "1st", title: "What's Going On?", year: "2016", album: null, releaseId: "ep-whats-going-on" },
  "stand-by-you": { type: "ep", index: "2nd", title: "Stand By You EP", year: "2018", album: "Traveler", releaseId: "ep-stand-by-you" },
  "fire-ground": { type: "ep", index: "2nd", title: "Stand By You EP", year: "2018", album: "Traveler", releaseId: "ep-stand-by-you" },
  "hello": { type: "ep", index: "3rd", title: "HELLO EP", year: "2020", album: "Editorial", releaseId: "ep-hello" },
  "natsu-moyou-no-neko": { type: "ep", index: "3rd", title: "HELLO EP", year: "2020", album: "Editorial", releaseId: "ep-hello" },
  "hakan": { type: "ep", index: "4th", title: "ミックスナッツ EP", year: "2022", album: "Rejoice", releaseId: "ep-mixed-nuts" },
  "choral-a": { type: "ep", index: "4th", title: "ミックスナッツ EP", year: "2022", album: "Rejoice", releaseId: "ep-mixed-nuts" },
  "lady": { type: "digital_ep", index: "Digital 1st", title: "LADY", year: "2017", album: "エスカパレード", releaseId: "ep-lady" },
  "driver": { type: "digital_ep", index: "Digital 1st", title: "LADY", year: "2017", album: "エスカパレード", releaseId: "ep-lady" },
};

/**
 * Resolves the target studio release ID for a song (ADR-0144).
 * Checks single/EP provenance first, then falls back to album era mapping.
 */
export function getSongReleaseId(songId) {
  if (songUnreleasedSet.has(songId)) return null;
  const prov = SINGLE_EP_PROVENANCE[songId];
  if (prov?.releaseId) return prov.releaseId;

  const album = ALBUM_MAP[songId];
  if (album) {
    if (album.includes("Traveler")) return "album-traveler";
    if (album.includes("Editorial")) return "album-editorial";
    if (album.includes("Rejoice")) return "album-rejoice";
    if (album.includes("エスカパレード")) return "album-escaparade";
    if (album.includes("Report") || album.includes("レポート")) return "album-report";
    if (album.includes("MAN IN THE MIRROR")) return "album-man-in-the-mirror";
    if (album.includes("ラブとピースは君の中")) return "album-love-and-peace";
    if (album.includes("What's Going On")) return "ep-whats-going-on";
  }
  return null;
}

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
