/**
 * japan-map-paths.js — Pre-Simplified Ticket-Style SVG Vector Geometry for Japan 47 Prefectures
 * and Dual Ticket-Stub Insets (Overseas Asia + Okinawa), with Spotlight Zoom ViewBoxes (ADR-0124).
 *
 * Zero external runtime dependencies (< 10 KB raw, < 3 KB gzip).
 * Projected in the exact 800x560 coordinate space as `projectLatLngToSvg` in `venue-map.js`.
 */

import { MAP_VIEWBOX, OVERSEAS_INSET_BOUNDS, OKINAWA_INSET_BOUNDS } from "./venue-map.js";

export const PREFECTURE_PATHS = [
  {
    "prefecture": "北海道",
    "zone": "main",
    "path": "M607,-1.2L706,42L720.6,78L679.8,92.4L644.8,124.8L577.9,114L557.5,146.4L545.8,117.6L560.4,78L589.5,34.8Z",
    "cx": 607.1,
    "cy": 84.7,
    "viewBox": "420 0 380 266"
  },
  {
    "prefecture": "青森縣",
    "zone": "main",
    "path": "M560.4,142.8L595.3,142.8L601.1,182.4L548.7,186L551.6,153.6Z",
    "cx": 573.7,
    "cy": 167.1,
    "viewBox": "515 122 120 84"
  },
  {
    "prefecture": "岩手縣",
    "zone": "main",
    "path": "M577.9,182.4L609.9,182.4L607,236.4L577.9,236.4Z",
    "cx": 593.2,
    "cy": 209.4,
    "viewBox": "524 161 139 97"
  },
  {
    "prefecture": "宮城縣",
    "zone": "main",
    "path": "M569.1,232.8L601.1,236.4L577.9,276L563.3,276Z",
    "cx": 578,
    "cy": 259,
    "viewBox": "522 212 120 84"
  },
  {
    "prefecture": "秋田縣",
    "zone": "main",
    "path": "M548.7,182.4L577.9,182.4L577.9,232.8L545.8,229.2Z",
    "cx": 555.2,
    "cy": 206.9,
    "viewBox": "497 162 130 91"
  },
  {
    "prefecture": "山形縣",
    "zone": "main",
    "path": "M545.8,229.2L569.1,232.8L563.3,276L537.1,272.4Z",
    "cx": 561.1,
    "cy": 259.9,
    "viewBox": "493 211 120 84"
  },
  {
    "prefecture": "福島縣",
    "zone": "main",
    "path": "M528.3,272.4L580.8,276L577.9,308.4L528.3,308.4Z",
    "cx": 568.7,
    "cy": 290.2,
    "viewBox": "495 248 120 84"
  },
  {
    "prefecture": "茨城縣",
    "zone": "main",
    "path": "M554.5,308.4L577.9,308.4L574.9,348L542.9,344.4Z",
    "cx": 567.7,
    "cy": 326.7,
    "viewBox": "500 286 120 84"
  },
  {
    "prefecture": "栃木縣",
    "zone": "main",
    "path": "M531.3,301.2L557.5,308.4L554.5,333.6L531.3,333.6Z",
    "cx": 548.1,
    "cy": 320.7,
    "viewBox": "484 275 120 84"
  },
  {
    "prefecture": "群馬縣",
    "zone": "main",
    "path": "M507.9,304.8L534.2,304.8L542.9,337.2L507.9,337.2Z",
    "cx": 522.9,
    "cy": 329.2,
    "viewBox": "465 279 120 84"
  },
  {
    "prefecture": "埼玉縣",
    "zone": "main",
    "path": "M516.7,330L548.7,333.6L548.7,349.8L519.6,348Z",
    "cx": 542.7,
    "cy": 344.8,
    "viewBox": "473 298 120 84"
  },
  {
    "prefecture": "千葉縣",
    "zone": "main",
    "path": "M547.3,340.8L577.9,348L557.5,380.4L544.4,366Z",
    "cx": 552.3,
    "cy": 352.1,
    "viewBox": "501 319 120 84"
  },
  {
    "prefecture": "東京都",
    "zone": "main",
    "path": "M522.5,344.4L549.3,347.3L547.3,358.8L525.4,357Z",
    "cx": 543.1,
    "cy": 353,
    "viewBox": "476 310 120 84"
  },
  {
    "prefecture": "神奈川縣",
    "zone": "main",
    "path": "M522.5,353.4L545.8,355.9L541.4,371.4L522.5,371.4Z",
    "cx": 538.1,
    "cy": 361.3,
    "viewBox": "474 320 120 84"
  },
  {
    "prefecture": "新潟縣",
    "zone": "main",
    "path": "M537.1,250.8L537.1,272.4L516.7,312L484.6,308.4L507.9,272.4Z",
    "cx": 524,
    "cy": 272.2,
    "viewBox": "432 226 157 110"
  },
  {
    "prefecture": "富山縣",
    "zone": "main",
    "path": "M458.4,308.4L484.6,308.4L481.7,330L458.4,330Z",
    "cx": 470.5,
    "cy": 315.5,
    "viewBox": "412 277 120 84"
  },
  {
    "prefecture": "石川縣",
    "zone": "main",
    "path": "M455.5,286.8L473,286.8L458.4,330L441,333.6Z",
    "cx": 453.8,
    "cy": 320.5,
    "viewBox": "397 268 120 84"
  },
  {
    "prefecture": "福井縣",
    "zone": "main",
    "path": "M435.1,330L458.4,333.6L443.9,358.8L420.6,362.4Z",
    "cx": 441.1,
    "cy": 342.7,
    "viewBox": "380 304 120 84"
  },
  {
    "prefecture": "山梨縣",
    "zone": "main",
    "path": "M499.2,344.4L525.4,344.4L522.5,369.6L502.1,369.6Z",
    "cx": 519.4,
    "cy": 361.9,
    "viewBox": "452 315 120 84"
  },
  {
    "prefecture": "長野縣",
    "zone": "main",
    "path": "M481.7,304.8L510.9,304.8L502.1,369.6L475.9,369.6Z",
    "cx": 498.9,
    "cy": 317.8,
    "viewBox": "410 279 167 117"
  },
  {
    "prefecture": "岐阜縣",
    "zone": "main",
    "path": "M443.9,326.4L481.7,326.4L478.8,369.6L449.7,371.4Z",
    "cx": 457.5,
    "cy": 360.9,
    "viewBox": "403 307 120 84"
  },
  {
    "prefecture": "靜岡縣",
    "zone": "main",
    "path": "M478.8,362.4L525.4,366L519.6,391.2L478.8,391.2Z",
    "cx": 484,
    "cy": 387.6,
    "viewBox": "442 335 120 84"
  },
  {
    "prefecture": "愛知縣",
    "zone": "main",
    "path": "M454.1,362.4L487.6,366L478.8,391.2L455.5,389.4Z",
    "cx": 461.8,
    "cy": 372.3,
    "viewBox": "411 335 120 84"
  },
  {
    "prefecture": "三重縣",
    "zone": "main",
    "path": "M443.9,369.6L461.4,376.8L441,420L432.2,412.8Z",
    "cx": 444.6,
    "cy": 394.8,
    "viewBox": "382 349 130 91"
  },
  {
    "prefecture": "滋賀縣",
    "zone": "main",
    "path": "M430.8,355.2L448.2,358.8L443.9,384L430.8,382.2Z",
    "cx": 431.7,
    "cy": 377,
    "viewBox": "380 328 120 84"
  },
  {
    "prefecture": "京都府",
    "zone": "main",
    "path": "M401.6,351.6L432.2,355.2L432.2,387.6L406,384Z",
    "cx": 428.3,
    "cy": 376.6,
    "viewBox": "357 328 120 84"
  },
  {
    "prefecture": "大阪府",
    "zone": "main",
    "path": "M408.9,376.8L427.9,380.4L423.5,403.8L408.9,402Z",
    "cx": 420.7,
    "cy": 388.4,
    "viewBox": "358 348 120 84"
  },
  {
    "prefecture": "兵庫縣",
    "zone": "main",
    "path": "M385.6,351.6L419.1,355.2L419.1,391.2L385.6,391.2Z",
    "cx": 414.5,
    "cy": 387.3,
    "viewBox": "342 329 120 84"
  },
  {
    "prefecture": "奈良縣",
    "zone": "main",
    "path": "M423.5,385.8L441,385.8L435.1,418.2L422,416.4Z",
    "cx": 429.1,
    "cy": 391.4,
    "viewBox": "372 360 120 84"
  },
  {
    "prefecture": "和歌山縣",
    "zone": "main",
    "path": "M406,400.2L432.2,405.6L429.3,434.4L406,430.8Z",
    "cx": 418.4,
    "cy": 417.7,
    "viewBox": "359 375 120 84"
  },
  {
    "prefecture": "鳥取縣",
    "zone": "main",
    "path": "M352.1,353.4L390,353.4L388.5,373.2L352.1,373.2Z",
    "cx": 357.5,
    "cy": 361.1,
    "viewBox": "311 321 120 84"
  },
  {
    "prefecture": "島根縣",
    "zone": "main",
    "path": "M308.4,353.4L357.9,353.4L355,376.8L309.9,402Z",
    "cx": 348.6,
    "cy": 360.5,
    "viewBox": "271 334 125 87"
  },
  {
    "prefecture": "岡山縣",
    "zone": "main",
    "path": "M356.5,369.6L388.5,369.6L385.6,398.4L357.9,398.4Z",
    "cx": 373.6,
    "cy": 389.3,
    "viewBox": "313 342 120 84"
  },
  {
    "prefecture": "廣島縣",
    "zone": "main",
    "path": "M318.6,376.8L362.3,376.8L362.3,405.6L321.6,407.4Z",
    "cx": 338.8,
    "cy": 397.7,
    "viewBox": "280 350 120 84"
  },
  {
    "prefecture": "山口縣",
    "zone": "main",
    "path": "M283.7,387.6L324.5,394.8L324.5,420L283.7,416.4Z",
    "cx": 306.6,
    "cy": 411.8,
    "viewBox": "244 362 120 84"
  },
  {
    "prefecture": "德島縣",
    "zone": "main",
    "path": "M366.7,405.6L400.2,405.6L397.3,430.8L368.1,427.2Z",
    "cx": 393.3,
    "cy": 410.9,
    "viewBox": "323 376 120 84"
  },
  {
    "prefecture": "香川縣",
    "zone": "main",
    "path": "M362.3,396.6L390,396.6L388.5,412.8L362.3,412.8Z",
    "cx": 378.3,
    "cy": 400.4,
    "viewBox": "316 363 120 84"
  },
  {
    "prefecture": "愛媛縣",
    "zone": "main",
    "path": "M318.6,405.6L368.1,409.2L353.6,448.8L318.6,445.2Z",
    "cx": 341.2,
    "cy": 418.5,
    "viewBox": "283 385 120 84"
  },
  {
    "prefecture": "高知縣",
    "zone": "main",
    "path": "M336.1,418.2L385.6,418.2L382.7,459.6L333.2,459.6Z",
    "cx": 363.3,
    "cy": 428.8,
    "viewBox": "299 397 120 84"
  },
  {
    "prefecture": "福岡縣",
    "zone": "main",
    "path": "M263.3,412.8L295.3,414.6L289.5,448.8L266.2,448.8Z",
    "cx": 272.1,
    "cy": 427.4,
    "viewBox": "219 389 120 84"
  },
  {
    "prefecture": "佐賀縣",
    "zone": "main",
    "path": "M251.7,427.2L274.9,430.8L272,450.6L253.1,448.8Z",
    "cx": 269.7,
    "cy": 439.7,
    "viewBox": "203 397 120 84"
  },
  {
    "prefecture": "長崎縣",
    "zone": "main",
    "path": "M237.1,427.2L260.4,434.4L272,466.8L237.1,466.8Z",
    "cx": 252.3,
    "cy": 442.8,
    "viewBox": "195 405 120 84"
  },
  {
    "prefecture": "熊本縣",
    "zone": "main",
    "path": "M263.3,441.6L298.3,441.6L292.4,481.2L260.4,481.2Z",
    "cx": 281.5,
    "cy": 455.2,
    "viewBox": "219 419 120 84"
  },
  {
    "prefecture": "大分縣",
    "zone": "main",
    "path": "M283.7,423.6L318.6,423.6L318.6,459.6L286.6,456Z",
    "cx": 307,
    "cy": 440.2,
    "viewBox": "241 400 120 84"
  },
  {
    "prefecture": "宮崎縣",
    "zone": "main",
    "path": "M289.5,456L315.7,459.6L301.2,508.2L282.2,502.8Z",
    "cx": 297.2,
    "cy": 481.6,
    "viewBox": "232 435 134 94"
  },
  {
    "prefecture": "鹿兒島縣",
    "zone": "main",
    "path": "M257.5,477.6L293.9,484.8L286.6,524.4L257.5,520.8Z",
    "cx": 276.5,
    "cy": 499.4,
    "viewBox": "216 459 120 84"
  },
  {
    "prefecture": "沖繩縣",
    "zone": "okinawa",
    "path": "M655,514L678,495L705,476L732,462L744,470L718,492L692,512L666,524Z",
    "cx": 697,
    "cy": 492,
    "viewBox": "620 437 160 112"
  },
  {
    "prefecture": "韓國",
    "zone": "overseas",
    "path": "M50,62L114,62L114,110L50,110Z",
    "cx": 82,
    "cy": 86,
    "viewBox": "5 32 154 108"
  },
  {
    "prefecture": "台灣",
    "zone": "overseas",
    "path": "M166,72L230,72L230,120L166,120Z",
    "cx": 198,
    "cy": 96,
    "viewBox": "121 42 154 108"
  },
  {
    "prefecture": "新加坡",
    "zone": "overseas",
    "path": "M166,138L230,138L230,186L166,186Z",
    "cx": 198,
    "cy": 162,
    "viewBox": "121 108 154 108"
  },
  {
    "prefecture": "泰國",
    "zone": "overseas",
    "path": "M50,138L114,138L114,186L50,186Z",
    "cx": 82,
    "cy": 162,
    "viewBox": "5 108 154 108"
  }
];

export const PREFECTURE_MAP_BY_NAME = Object.fromEntries(
  PREFECTURE_PATHS.map((entry) => [entry.prefecture, entry])
);

export const OVERSEAS_INSET_VIEWBOX = "0 0 300 210";
export const OKINAWA_INSET_VIEWBOX = "580 410 220 154";

/**
 * Returns the SVG `viewBox` string ("x y w h") for macro overview (`null`)
 * or a zoomed-in Spotlight view for a specific prefecture, overseas country, or `"海外"`.
 *
 * @param {string|null} target
 * @returns {string}
 */
export function getZoomViewBox(target) {
  if (!target) return MAP_VIEWBOX.str;
  if (target === "海外" || target === "overseas") {
    return OVERSEAS_INSET_VIEWBOX;
  }
  if (target === "沖繩縣") {
    return OKINAWA_INSET_VIEWBOX;
  }
  const entry = PREFECTURE_MAP_BY_NAME[target];
  if (entry?.viewBox) {
    return entry.viewBox;
  }
  return MAP_VIEWBOX.str;
}

export { MAP_VIEWBOX, OVERSEAS_INSET_BOUNDS, OKINAWA_INSET_BOUNDS };
