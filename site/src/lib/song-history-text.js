import { songTitle, songAlias, showDate } from "./domain.js";
import { localizeVenue } from "./locales/venues.js";

/**
 * Builds the locale-aware plain-text song history for clipboard copy.
 * Pure function extracted from SongSlip to keep slip components under
 * the 800-line modularization invariant (ADR-0101).
 */
export function buildSongHistoryText({
  songId,
  albumName,
  appearancesCount,
  firstShow,
  firstApp,
  latestShow,
  latestApp,
  specialVersionCounts,
  hasSpecials,
  locale = "zh-TW",
}) {
  const title = songTitle[songId] || songId;
  const alias = songAlias[songId];
  const lines = [
    locale === "en"
      ? `【Official Hige Dandism Song Archive】`
      : locale === "ja"
        ? `【Official 髭男 dism 公演アーカイブ】`
        : locale === "ko"
          ? `【Official 히게단 dism 공연 아카이브】`
          : `【Official 髭男 dism 演唱會檔案】`,
    locale === "en"
      ? `🎵 Song: "${title}"${alias ? ` (Alias: ${alias})` : ""}`
      : locale === "ja"
        ? `🎵 楽曲：《${title}》${alias ? `（別名：${alias}）` : ""}`
        : locale === "ko"
          ? `🎵 곡: 《${title}》${alias ? ` (별명: ${alias})` : ""}`
          : `🎵 歌曲：《${title}》${alias ? `（別名：${alias}）` : ""}`,
    locale === "en"
      ? `💿 Album: ${albumName}`
      : locale === "ja"
        ? `💿 アルバム：${albumName}`
        : locale === "ko"
          ? `💿 앨범: ${albumName}`
          : `💿 專輯：${albumName}`,
    locale === "en"
      ? `📊 Stats: ${appearancesCount} shows`
      : locale === "ja"
        ? `📊 演奏統計：全 ${appearancesCount} 公演`
        : locale === "ko"
          ? `📊 공연 통계: 총 ${appearancesCount}회`
          : `📊 演出統計：全檔案庫共出演 ${appearancesCount} 場`,
  ];
  if (firstShow && firstApp) {
    const locFirstVenue = localizeVenue(firstShow.venue, locale);
    lines.push(
      locale === "en"
        ? `🚩 First: ${showDate(firstShow, locale)} ${firstApp.unitTitle} (${locFirstVenue})`
        : locale === "ja"
          ? `🚩 初披露：${showDate(firstShow, locale)} ${firstApp.unitTitle}（${locFirstVenue}）`
          : locale === "ko"
            ? `🚩 첫 공연: ${showDate(firstShow, locale)} ${firstApp.unitTitle} (${locFirstVenue})`
            : `🚩 初次演出：${showDate(firstShow, locale)} ${firstApp.unitTitle}（${locFirstVenue}）`
    );
  }
  if (latestShow && latestApp) {
    const locLatestVenue = localizeVenue(latestShow.venue, locale);
    lines.push(
      locale === "en"
        ? `🚩 Latest: ${showDate(latestShow, locale)} ${latestApp.unitTitle} (${locLatestVenue})`
        : locale === "ja"
          ? `🚩 最新公演：${showDate(latestShow, locale)} ${latestApp.unitTitle}（${locLatestVenue}）`
          : locale === "ko"
            ? `🚩 최근 공연: ${showDate(latestShow, locale)} ${latestApp.unitTitle} (${locLatestVenue})`
            : `🚩 最新演出：${showDate(latestShow, locale)} ${latestApp.unitTitle}（${locLatestVenue}）`
    );
  }
  if (hasSpecials) {
    const parts = [];
    if (specialVersionCounts.solo)
      parts.push(
        locale === "en"
          ? `Satoshi Solo ${specialVersionCounts.solo}`
          : locale === "ja"
            ? `弾き語り ${specialVersionCounts.solo} 公演`
            : locale === "ko"
              ? `단독 연주 ${specialVersionCounts.solo}회`
              : `自彈自唱 ${specialVersionCounts.solo} 場`
      );
    if (specialVersionCounts.request)
      parts.push(
        locale === "en"
          ? `Request ${specialVersionCounts.request}`
          : locale === "ja"
            ? `リクエスト ${specialVersionCounts.request} 公演`
            : locale === "ko"
              ? `리퀘스트 ${specialVersionCounts.request}회`
              : `現場點歌 ${specialVersionCounts.request} 場`
      );
    if (specialVersionCounts.premiere)
      parts.push(
        locale === "en"
          ? `Premiere ${specialVersionCounts.premiere}`
          : locale === "ja"
            ? `新曲 ${specialVersionCounts.premiere} 公演`
            : locale === "ko"
              ? `신곡 ${specialVersionCounts.premiere}회`
              : `新歌首演 ${specialVersionCounts.premiere} 場`
      );
    lines.push(
      locale === "en"
        ? `✨ Special versions: ${parts.join(" · ")}`
        : locale === "ja"
          ? `✨ 特殊バージョン：${parts.join(" · ")}`
          : locale === "ko"
            ? `✨ 특수 버전: ${parts.join(" · ")}`
            : `✨ 特殊版本：${parts.join(" · ")}`
    );
  }
  lines.push(
    locale === "en"
      ? `🔗 Source: Official Hige Dandism Two-Way Archive`
      : locale === "ja"
        ? `🔗 出典：Official 髭男 dism 双方向アーカイブ`
        : locale === "ko"
          ? `🔗 출처: Official 히게단 dism 양방향 아카이브`
          : `🔗 來源：Official 髭男 dism 演唱會雙向檔案庫`
  );
  return lines;
}
