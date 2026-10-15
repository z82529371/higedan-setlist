import { showDate } from "./domain.js";

/**
 * Builds the locale-aware plain-text venue history for clipboard copy.
 * Pure function extracted from VenueSlip to keep slip components under
 * the 800-line modularization invariant (ADR-0101).
 */
export function buildVenueHistoryText({
  venueName,
  venuePref,
  venueCity,
  showsCount,
  spanYearsText,
  topSongs,
  sortedShows,
  locale = "zh-TW",
}) {
  const locText = `${venuePref ? `${venuePref} · ` : ""}${venueCity}`;
  const lines = [
    locale === "en"
      ? `【Official Hige Dandism @ ${venueName} Live History】`
      : locale === "ja"
        ? `【Official 髭男 dism @ ${venueName} 公演履歴】`
        : locale === "ko"
          ? `【Official 히게단 dism @ ${venueName} 공연 히스토리】`
          : `【Official 髭男 dism @ ${venueName} 演出歷程】`,
    locale === "en"
      ? `📍 Location: ${locText}`
      : locale === "ja"
        ? `📍 場所：${locText}`
        : locale === "ko"
          ? `📍 장소: ${locText}`
          : `📍 地點：${locText}`,
    locale === "en"
      ? `🏛️ Total: ${showsCount} shows`
      : locale === "ja"
        ? `🏛️ 累計公演：${showsCount} 公演`
        : locale === "ko"
          ? `🏛️ 누적 공연: ${showsCount}회`
          : `🏛️ 累計演出：${showsCount} 場`,
  ];
  if (spanYearsText) {
    lines.push(
      locale === "en"
        ? `📅 Span: ${spanYearsText}`
        : locale === "ja"
          ? `📅 年間スパン：${spanYearsText}`
          : locale === "ko"
            ? `📅 연도 범위: ${spanYearsText}`
            : `📅 年份跨度：${spanYearsText}`
    );
  }
  if (topSongs.length > 0) {
    const songList = topSongs
      .map((s) =>
        locale === "en"
          ? `${s.title} (${s.count}x)`
          : locale === "ja"
            ? `${s.title} (${s.count}回)`
            : locale === "ko"
              ? `${s.title} (${s.count}회)`
              : `${s.title} (${s.count}次)`
      )
      .join(locale === "en" ? ", " : "、");
    lines.push(
      locale === "en"
        ? `🏆 Top songs: ${songList}`
        : locale === "ja"
          ? `🏆 定番曲：${songList}`
          : locale === "ko"
            ? `🏆 단골곡: ${songList}`
            : `🏆 常唱曲目：${songList}`
    );
  }
  lines.push(
    "",
    locale === "en"
      ? "【SHOW HISTORY】"
      : locale === "ja"
        ? "【歴史公演】"
        : locale === "ko"
          ? "【역대 공연】"
          : "【歷史演出場次】"
  );
  sortedShows.forEach((app) => {
    const d = app.show?.date ? showDate(app.show, locale) : "";
    lines.push(`- ${d}｜${app.unitTitle}`);
  });
  lines.push(
    "",
    locale === "en"
      ? "#OfficialHigedanDism #Higedan #LiveArchive"
      : locale === "ja"
        ? "#Official髭男dism #ヒゲダン #聖地巡礼"
        : locale === "ko"
          ? "#Official히게단dism #히게단"
          : "#Official髭男dism #ヒゲダン #聖地巡礼"
  );
  return lines;
}
