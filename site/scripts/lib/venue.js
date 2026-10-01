// 47-prefecture table: [city, region, prefecture] (Traditional Chinese).
export const PREF_TABLE = {
  北海道: ["札幌", "北海道", "北海道"],
  青森: ["青森", "東北", "青森縣"],
  岩手: ["盛岡", "東北", "岩手縣"],
  宮城: ["仙台", "東北", "宮城縣"],
  秋田: ["秋田", "東北", "秋田縣"],
  山形: ["山形", "東北", "山形縣"],
  福島: ["福島", "東北", "福島縣"],
  茨城: ["水戶", "關東", "茨城縣"],
  栃木: ["宇都宮", "關東", "栃木縣"],
  群馬: ["前橋", "關東", "群馬縣"],
  埼玉: ["埼玉", "關東", "埼玉縣"],
  千葉: ["千葉", "關東", "千葉縣"],
  東京: ["東京", "關東", "東京都"],
  神奈川: ["橫濱", "關東", "神奈川縣"],
  新潟: ["新潟", "中部", "新潟縣"],
  富山: ["富山", "中部", "富山縣"],
  石川: ["金澤", "中部", "石川縣"],
  福井: ["福井", "中部", "福井縣"],
  山梨: ["甲府", "中部", "山梨縣"],
  長野: ["長野", "中部", "長野縣"],
  岐阜: ["岐阜", "中部", "岐阜縣"],
  靜岡: ["靜岡", "中部", "靜岡縣"],
  愛知: ["名古屋", "中部", "愛知縣"],
  三重: ["津", "中部", "三重縣"],
  滋賀: ["大津", "關西", "滋賀縣"],
  京都: ["京都", "關西", "京都府"],
  大阪: ["大阪", "關西", "大阪府"],
  兵庫: ["神戶", "關西", "兵庫縣"],
  奈良: ["奈良", "關西", "奈良縣"],
  和歌山: ["和歌山", "關西", "和歌山縣"],
  鳥取: ["鳥取", "中國", "鳥取縣"],
  島根: ["松江", "中國", "島根縣"],
  岡山: ["岡山", "中國", "岡山縣"],
  廣島: ["廣島", "中國", "廣島縣"],
  山口: ["山口", "中國", "山口縣"],
  德島: ["德島", "四國", "德島縣"],
  香川: ["高松", "四國", "香川縣"],
  愛媛: ["松山", "四國", "愛媛縣"],
  高知: ["高知", "四國", "高知縣"],
  福岡: ["福岡", "九州", "福岡縣"],
  佐賀: ["佐賀", "九州", "佐賀縣"],
  長崎: ["長崎", "九州", "長崎縣"],
  熊本: ["熊本", "九州", "熊本縣"],
  大分: ["大分", "九州", "大分縣"],
  宮崎: ["宮崎", "九州", "宮崎縣"],
  鹿兒島: ["鹿兒島", "九州", "鹿兒島縣"],
  沖繩: ["那霸", "九州", "沖繩縣"],
};

// Shinjitai (JP) -> Traditional (TW) for prefecture lookup.
const SHINJITAI_FIX = {
  徳: "德",
  広: "廣",
  縄: "繩",
  浜: "濱",
  斉: "齊",
  竜: "龍",
  栄: "榮",
  渋: "澀",
};
export function prefToCityAndRegion(pref) {
  if (!pref) return { city: "東京", region: "關東", prefecture: "" };
  const raw = pref.startsWith("北海道") ? "北海道" : pref.replace(/[都府県縣]$/, "");
  const key = [...raw].map((ch) => SHINJITAI_FIX[ch] ?? ch).join("");
  const hit = PREF_TABLE[key];
  if (hit) return { city: hit[0], region: hit[1], prefecture: hit[2] };
  return { city: pref.replace(/(府|縣|県)$/, ""), region: "日本", prefecture: pref };
}

// Prefer a city embedded in the raw venue name (e.g. 松江市総合体育館 -> 松江).
export function cityFromVenueName(rawVenue, fallback) {
  const m = (rawVenue || "").match(/^\s*(.+?[市區])/);
  if (m) return m[1].replace(/[市區]$/, "");
  return fallback;
}

// Rule-based replacements for common Japanese venue keywords (pure part of
// autoTranslateVenue; the MyMemory fetch stays with the CLI caller).
const VENUE_TERM_MAP = [
  [/大ホール/g, "大會堂"],
  [/ホール/g, "會館"],
  [/会館/g, "會館"],
  [/総合/g, "綜合"],
  [/芸術/g, "藝術"],
  [/県立/g, "縣立"],
  [/県民/g, "縣民"],
  [/市民/g, "市民"],
  [/体育館/g, "體育館"],
  [/劇場/g, "劇場"],
  [/ドーム/g, "巨蛋"],
  [/アリーナ/g, "Arena"],
];

export function applyVenueTermRules(rawVenue) {
  let result = rawVenue;
  for (const [regex, replacement] of VENUE_TERM_MAP) {
    result = result.replace(regex, replacement);
  }
  return result;
}

// Wide-semantics dictionary lookup: raw livefans text, an already-normalized
// name, or the KSPO special case (matches validate-data.mjs behavior).
export function lookupVenue(name, dict) {
  if (!name) return null;
  for (const [rawKey, val] of Object.entries(dict ?? {})) {
    if (
      name === rawKey ||
      name === val.venue ||
      (rawKey === "KSPO DOME" &&
        (name.includes("高尺") || name.includes("KSPO")))
    ) {
      return { rawKey, ...val };
    }
  }
  return null;
}

// Merge a dictionary record into a show (or local names). The dictionary
// wins, including empty strings (per ADR-0034: clearing propagates).
// Returns the applied patch or null.
export function applyVenueRecord(target, record) {
  const patch = {};
  if (record.venue !== undefined && target.venue !== record.venue)
    patch.venue = record.venue;
  if (record.city !== undefined && target.city !== record.city)
    patch.city = record.city;
  if (record.region !== undefined && target.region !== record.region)
    patch.region = record.region;
  if (record.prefecture !== undefined && target.prefecture !== record.prefecture)
    patch.prefecture = record.prefecture;
  Object.assign(target, patch);
  return Object.keys(patch).length ? patch : null;
}

// Normalize a show against the dictionary. Returns the patch or null.
export function normalizeShowVenue(show, dict) {
  const hit = lookupVenue(show.venue, dict);
  if (!hit) return null;
  return applyVenueRecord(show, hit);
}

// Assemble a dictionary record for an unknown venue.
export function assembleVenueRecord({ venue, city, region, prefecture }) {
  return {
    venue,
    city: city ?? "",
    region: region ?? "",
    prefecture: prefecture ?? "",
  };
}
