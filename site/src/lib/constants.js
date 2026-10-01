export const KIND_BADGE = {
  premiere: "新歌",
  "satoshi-solo": "自彈自唱",
  request: "點歌",
};

export const KIND_TAB = {
  premiere: "NEW SONG",
  "satoshi-solo": "SATOSHI SOLO",
  request: "REQUEST",
  unreleased: "UNRELEASED",
};
export const KIND_ORDER = ["premiere", "unreleased", "satoshi-solo", "request"];

export const queryTabClass = (isOn) =>
  `appearance-none rounded-full border-[1.5px] border-ink px-[22px] py-2 text-[14px] font-bold cursor-pointer select-none transition-all shadow-[2px_2px_0_rgba(23,35,59,0.12)] hover:-translate-y-[1px] hover:bg-pool-wash hover:shadow-[3px_3px_0_rgba(23,35,59,0.18)] active:translate-y-0 active:shadow-[1px_1px_0_rgba(23,35,59,0.14)] focus-visible:outline-2 focus-visible:outline-tape focus-visible:outline-offset-2 ${
    isOn
      ? "bg-ink text-white shadow-[2px_2px_0_var(--color-ink)] hover:opacity-95"
      : "bg-card text-ink"
  }`;

export const filterPillClass = (isActive) =>
  `appearance-none rounded border-[1.5px] px-[14px] py-[6px] text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all motion-reduce:transition-none focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 ${
    isActive
      ? "bg-band text-band-ink border-band shadow-[2px_2px_0_#e8b428] font-bold"
      : "border-line bg-paper text-ink hover:bg-pool-wash hover:border-pool hover:text-pool"
  }`;

export const unitPillClass = (isOn) =>
  `appearance-none rounded-full border px-3 py-1 text-[12px] font-semibold cursor-pointer transition-all motion-reduce:transition-none focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 ${
    isOn
      ? "bg-tape text-[#3a2c00] border-ink font-bold shadow-[1px_1px_0_var(--color-ink)]"
      : "border-line bg-card text-ink hover:border-ink hover:bg-pool-wash"
  }`;

export const SETLIST_ITEM =
  "flex items-baseline gap-3 border-b border-line-soft px-1 py-2 last:border-b-0";
export const CUE_NO =
  "min-w-[42px] text-right font-mono text-[12px] font-semibold text-muted tabular-nums";
export const CUE_COLOR = {
  premiere: "text-premiere",
  unreleased: "text-unreleased",
  "satoshi-solo": "text-solo",
  request: "text-request",
};
export const TRACK_NOTE = "text-[13px] text-muted";
export const SETLIST_SONG =
  "border-b border-transparent font-medium text-ink no-underline transition-colors hover:border-pool hover:text-pool focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none";
export const TITLE_LINK =
  "transition-colors hover:text-pool focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none";
export const SLIP_ARTICLE =
  "relative rounded-[3px] border-[1.5px] border-ink bg-card px-[26px] pb-6 pt-[46px] shadow-[5px_5px_0_rgba(23,35,59,0.14)] max-sm:px-4 max-sm:pb-[18px] max-sm:pt-[42px]";
export const SLIP_TAPE =
  "pointer-events-none absolute left-1/2 top-[-13px] h-[26px] w-[132px] -translate-x-1/2 rotate-[1.5deg] border-x border-dashed border-tape-edge bg-tape-soft";
export const SLIP_CARD = {
  premiere:
    "relative rounded-[2px] border-[1.5px] border-premiere border-l-[7px] bg-premiere-bg px-[14px] py-[10px] -mx-2 my-[18px] -rotate-[0.6deg] shadow-[4px_6px_0_var(--color-premiere-wash)] max-sm:mx-[-4px] max-sm:my-3",
  unreleased:
    "relative rounded-[2px] border-[1.5px] border-unreleased border-l-[7px] bg-unreleased-bg px-[14px] py-[10px] -mx-2 my-[18px] rotate-[1.1deg] shadow-[4px_6px_0_var(--color-unreleased-wash)] max-sm:mx-[-4px] max-sm:my-3",
  "satoshi-solo":
    "relative rounded-[2px] border-[1.5px] border-solo border-l-[7px] bg-solo-bg px-[14px] py-[10px] -mx-2 my-[18px] -rotate-[0.4deg] shadow-[4px_6px_0_var(--color-solo-wash)] max-sm:mx-[-4px] max-sm:my-3",
  request:
    "relative rounded-[2px] border-[1.5px] border-request border-l-[7px] bg-white px-[14px] py-[10px] -mx-2 my-[18px] -rotate-[1.2deg] shadow-[4px_6px_0_var(--color-request-shadow)] max-sm:mx-[-4px] max-sm:my-3",
};
export const SLIP_TAB_COLOR = {
  premiere: "bg-premiere",
  unreleased: "bg-unreleased",
  "satoshi-solo": "bg-solo",
  request: "bg-request",
};

export const KIND_BADGE_CLASS = (k) =>
  k === "request"
    ? "bg-[#fbe9e6] text-request"
    : k === "satoshi-solo"
    ? "bg-[#d8efe8] text-[#0b5f50]"
    : "bg-tape text-[#3a2c00]";

export const DRAWER_LINK = (isOn) =>
  `flex items-center justify-between gap-[10px] border-l-4 border-transparent px-[14px] py-[10px] no-underline transition-colors motion-reduce:transition-none focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 ${
    isOn
      ? "border-l-tape bg-band text-band-ink hover:bg-band"
      : "border-l-transparent text-ink hover:border-l-pool hover:bg-pool-wash"
  }`;

export const ALBUM_MAP = {
  finder: "Rejoice (2024)",
  "get-back-to-jinsei": "Rejoice (2024)",
  "mixed-nuts": "Rejoice (2024)",
  soulsoup: "Rejoice (2024)",
  catchball: "Rejoice (2024)",
  nichijo: "Rejoice (2024)",
  sharon: "Rejoice (2024)",
  dakuten: "Rejoice (2024)",
  subtitle: "Rejoice (2024)",
  anarchy: "Rejoice (2024)",
  "white-noise": "Rejoice (2024)",
  uramitsuramikiwami: "Rejoice (2024)",
  chessboard: "Rejoice (2024)",
  tattoo: "Rejoice (2024)",
  "b-side-blues": "Rejoice (2024)",

  editorial: "Editorial (2021)",
  apoptosis: "Editorial (2021)",
  "i-love": "Editorial (2021)",
  filament: "Editorial (2021)",
  hello: "Editorial (2021)",
  "cry-baby": "Editorial (2021)",
  shower: "Editorial (2021)",
  "midori-no-amayoke": "Editorial (2021)",
  parabola: "Editorial (2021)",
  "pending-machine": "Editorial (2021)",
  "bedroom-talk": "Editorial (2021)",
  laughter: "Editorial (2021)",
  universe: "Editorial (2021)",
  "lost-in-my-room": "Editorial (2021)",

  yesterday: "Traveler (2019)",
  shukumei: "Traveler (2019)",
  amazing: "Traveler (2019)",
  rowan: "Traveler (2019)",
  "bad-for-me": "Traveler (2019)",
  "saigo-no-koi-wazurai": "Traveler (2019)",
  vintage: "Traveler (2019)",
  "stand-by-you": "Traveler (2019)",
  "fire-ground": "Traveler (2019)",
  "tabi-wa-michizure": "Traveler (2019)",
  "052519": "Traveler (2019)",
  pretender: "Traveler (2019)",
  "last-song": "Traveler (2019)",
  travelers: "Traveler (2019)",

  "115man-kiro-no-film": "エスカパレード (2018)",
  "no-doubt": "エスカパレード (2018)",
  escapade: "エスカパレード (2018)",
  lady: "エスカパレード (2018)",
  "takaga-i-love-you": "エスカパレード (2018)",
  "saredo-hibi-wa": "エスカパレード (2018)",
  kanousei: "エスカパレード (2018)",
  "tell-me-baby": "エスカパレード (2018)",
  "second-line": "エスカパレード (2018)",
  driver: "エスカパレード (2018)",
  sousisouai: "エスカパレード (2018)",
  brothers: "エスカパレード (2018)",
  hatsumeika: "エスカパレード (2018)",

  "itan-na-star": "Report (2017)",
  rolling: "Report (2017)",
  trailer: "Report (2017)",
  "55": "Report (2017)",
  "inu-ka-cat-ka-de-shinumade-kenka-shiyou": "Report (2017)",
  "hajimari-no-asa": "Report (2017)",
  equal: "Report (2017)",

  "whats-going-on": "What's Going On? (2016)",
  mikanseinamamade: "What's Going On? (2016)",
  "knit-no-boushi": "What's Going On? (2016)",
  "kiiroi-kuruma": "What's Going On? (2016)",

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

export const ALBUM_ORDER = [
  "Rejoice (2024)",
  "Editorial (2021)",
  "Traveler (2019)",
  "エスカパレード (2018)",
  "Report (2017)",
  "What's Going On? (2016)",
  "MAN IN THE MIRROR (2016)",
  "ラブとピースは君の中 (2015)",
  "EP / 單曲",
  "未發行曲目",
];

export const REGION_ORDER = [
  "海外（台灣 / 韓國 / 東南亞）",
  "日本 - 關東",
  "日本 - 關西",
  "日本 - 東北 / 北海道",
  "日本 - 中部 / 九州 / 其他",
];
