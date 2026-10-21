/**
 * feedback.js — Community feedback & crowdsourced setlist/time quest mailto builders (ADR-0121 / #45, #40).
 */

export const ARCHIVE_FEEDBACK_EMAIL = "hgdnlive@gmail.com";

function getShowDescriptor({ show, unitTitle }) {
  const date = show?.date || "";
  const title = unitTitle || show?.title || "";
  const venue = show?.venue || "";
  const venuePart = venue ? ` @ ${venue}` : "";
  return { date, title, venue, venuePart, showId: show?.id || "" };
}

/**
 * Builds the standardized email subject for crowdsourced setlist quest.
 * Format: [Official髭男dism 現場情報] YYYY-MM-DD 活動名稱 @ 場館
 */
export function buildSetlistSubject({ show, unitTitle }) {
  const { date, title, venuePart } = getShowDescriptor({ show, unitTitle });
  return `[Official髭男dism 現場情報] ${date} ${title}${venuePart}`.trim();
}

const SETLIST_BODY_TEMPLATES = {
  "zh-TW": ({ showId, date, title, venue }) => [
    "你好！我想提供以下場次的曲目情報：",
    "",
    "【演出資訊】",
    `・場次 ID：${showId}`,
    `・演出日期：${date}`,
    `・活動名稱：${title}`,
    `・演出場館：${venue}`,
    "",
    "【曲目清單 (Setlist)】",
    "1. ",
    "2. ",
    "3. ",
    "4. ",
    "5. ",
    "",
    "【安可曲 (Encore)】",
    "EN1. ",
    "EN2. ",
    "",
    "【備註 / 演出特徵】",
    "（例如：自彈自唱、翻唱、新歌初披露、現場點歌等）",
    "",
    "【照片與佐證指引】",
    "若您持有當年的實體紙本歌單、入場門票票根、會場發送的宣傳單 (Flyer) 或現場推文照片，歡迎直接作為郵件附件寄出，這將大幅協助歷史紀錄查證！",
    "",
    "感謝協助補齊 Official 髭男 dism 歷史拼圖！",
  ],
  ja: ({ showId, date, title, venue }) => [
    "こんにちは！以下の公演のセットリスト情報を提供します：",
    "",
    "【公演情報】",
    `・公演 ID：${showId}`,
    `・日程：${date}`,
    `・公演名：${title}`,
    `・会場：${venue}`,
    "",
    "【セットリスト (Setlist)】",
    "1. ",
    "2. ",
    "3. ",
    "4. ",
    "5. ",
    "",
    "【アンコール (Encore)】",
    "EN1. ",
    "EN2. ",
    "",
    "【備考 / 特徴】",
    "（例：弾き語り、カバー曲、新曲初披露、MCリクエストなど）",
    "",
    "【写真・添付画像について】",
    "当時の紙のセットリスト、チケット半券、フライヤー、Twitter(X)の投稿写真などをお持ちでしたら、ぜひメールに添付してください。",
    "",
    "Official髭男dismの歴史アーカイブへのご協力ありがとうございます！",
  ],
  en: ({ showId, date, title, venue }) => [
    "Hello! I would like to contribute setlist information for the following show:",
    "",
    "[Show Information]",
    `- Show ID: ${showId}`,
    `- Date: ${date}`,
    `- Event Title: ${title}`,
    `- Venue: ${venue}`,
    "",
    "[Setlist]",
    "1. ",
    "2. ",
    "3. ",
    "4. ",
    "5. ",
    "",
    "[Encore]",
    "EN1. ",
    "EN2. ",
    "",
    "[Notes / Special Arrangements]",
    "(e.g., Acoustic piano solo, Cover songs, Song debut, Audience request)",
    "",
    "[Photo Attachments]",
    "If you have photos of physical setlists, ticket stubs, flyers, or tweets from the concert, please attach them to this email to help us verify the archive.",
    "",
    "Thank you for helping complete the Official HIGE DANDISM live archive!",
  ],
  ko: ({ showId, date, title, venue }) => [
    "안녕하세요! 아래 공연의 셋리스트 정보를 제보합니다:",
    "",
    "【공연 정보】",
    `・공연 ID: ${showId}`,
    `・일시: ${date}`,
    `・공연명: ${title}`,
    `・공연장: ${venue}`,
    "",
    "【셋리스트 (Setlist)】",
    "1. ",
    "2. ",
    "3. ",
    "4. ",
    "5. ",
    "",
    "【앙코르 (Encore)】",
    "EN1. ",
    "EN2. ",
    "",
    "【비고 / 특이사항】",
    "(예: 단독 피아노 연주, 커버곡, 신곡 최초 공개, 현장 신청곡 등)",
    "",
    "【사진 첨부 안내】",
    "당시의 종이 셋리스트, 티켓 부표, 전단지(플라이어), 트위터(X) 현장 인증 사진 등이 있으시다면 본 메일에 함께 첨부해 주세요.",
    "",
    "Official히게단dism의 라이브 아카이브 완성에 기여해 주셔서 감사합니다!",
  ],
};

/**
 * Builds the structured template body for setlist reports across 4 supported locales.
 * Per RFC 6068, mailto URI bodies use CRLF (\r\n) line breaks for cross-client reliability.
 */
export function buildSetlistBody({ show, unitTitle, locale = "zh-TW" }) {
  const descriptor = getShowDescriptor({ show, unitTitle });
  const templateFn = SETLIST_BODY_TEMPLATES[locale] || SETLIST_BODY_TEMPLATES["zh-TW"];
  return templateFn(descriptor).join("\r\n");
}

/**
 * Builds the complete prefilled mailto URL for crowdsourced setlists.
 */
export function buildSetlistMailto({ show, unitTitle, locale = "zh-TW" }) {
  const subject = buildSetlistSubject({ show, unitTitle, locale });
  const body = buildSetlistBody({ show, unitTitle, locale });
  return `mailto:${ARCHIVE_FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Builds the standardized email subject for missing show times.
 * Format: [Official髭男dism 開演時間情報] YYYY-MM-DD 活動名稱 @ 場館
 */
export function buildTimeSubject({ show, unitTitle }) {
  const { date, title, venuePart } = getShowDescriptor({ show, unitTitle });
  return `[Official髭男dism 開演時間情報] ${date} ${title}${venuePart}`.trim();
}

const TIME_BODY_TEMPLATES = {
  "zh-TW": ({ showId, date, title, venue }) => [
    "你好！我想提供以下場次的開場／開演時間情報：",
    "",
    "【演出資訊】",
    `・場次 ID：${showId}`,
    `・演出日期：${date}`,
    `・活動名稱：${title}`,
    `・演出場館：${venue}`,
    "",
    "【演出時間】",
    "・開場時間 (Doors)：",
    "・開演時間 (Start)：",
    "",
    "【時間來源說明】",
    "（例如：票根記載、官方推特公告、主辦方宣傳單 Flyer 等）",
    "",
    "感謝協助補齊 Official 髭男 dism 歷史時序！",
  ],
  ja: ({ showId, date, title, venue }) => [
    "こんにちは！以下の公演の開場・開演時間情報を提供します：",
    "",
    "【公演情報】",
    `・公演 ID：${showId}`,
    `・日程：${date}`,
    `・公演名：${title}`,
    `・会場：${venue}`,
    "",
    "【時間情報】",
    "・開場時間 (Doors)：",
    "・開演時間 (Start)：",
    "",
    "【情報ソース】",
    "（例：チケット券面、公式告知、チラシ等）",
    "",
    "Official髭男dismの歴史アーカイブへのご協力ありがとうございます！",
  ],
  en: ({ showId, date, title, venue }) => [
    "Hello! I would like to report the door/show times for the following show:",
    "",
    "[Show Information]",
    `- Show ID: ${showId}`,
    `- Date: ${date}`,
    `- Event Title: ${title}`,
    `- Venue: ${venue}`,
    "",
    "[Concert Times]",
    "- Doors Open: ",
    "- Show Starts: ",
    "",
    "[Source Information]",
    "(e.g., Printed on ticket stub, official announcement, promoter flyer)",
    "",
    "Thank you for helping complete the Official HIGE DANDISM live archive!",
  ],
  ko: ({ showId, date, title, venue }) => [
    "안녕하세요! 아래 공연의 입장/시작 시간 정보를 제보합니다:",
    "",
    "【공연 정보】",
    `・공연 ID: ${showId}`,
    `・일시: ${date}`,
    `・공연명: ${title}`,
    `・공연장: ${venue}`,
    "",
    "【시간 정보】",
    "・입장 시간 (Doors): ",
    "・시작 시간 (Start): ",
    "",
    "【출처 / 참고 자료】",
    "(예: 티켓 권면 표기, 공식 공지, 주최측 전단지 등)",
    "",
    "Official히게단dism의 라이브 아카이브 완성에 기여해 주셔서 감사합니다!",
  ],
};

/**
 * Builds the structured template body for missing time reports across 4 supported locales.
 * Per RFC 6068, mailto URI bodies use CRLF (\r\n) line breaks for cross-client reliability.
 */
export function buildTimeBody({ show, unitTitle, locale = "zh-TW" }) {
  const descriptor = getShowDescriptor({ show, unitTitle });
  const templateFn = TIME_BODY_TEMPLATES[locale] || TIME_BODY_TEMPLATES["zh-TW"];
  return templateFn(descriptor).join("\r\n");
}

/**
 * Builds the complete prefilled mailto URL for missing show times.
 */
export function buildTimeMailto({ show, unitTitle, locale = "zh-TW" }) {
  const subject = buildTimeSubject({ show, unitTitle, locale });
  const body = buildTimeBody({ show, unitTitle, locale });
  return `mailto:${ARCHIVE_FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
export const DEFAULT_WEB3FORMS_KEY =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_WEB3FORMS_KEY
    ? import.meta.env.VITE_WEB3FORMS_KEY
    : "";

/**
 * Validates whether an evidence input is a syntactically valid HTTP or HTTPS URL.
 */
export function validateEvidenceUrl(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Builds the subject line for crowdsourced lead drop submissions.
 */
export function buildLeadSubject({ show, unitTitle, questType = "setlist" }) {
  const { date, title, venuePart } = getShowDescriptor({ show, unitTitle });
  const prefix = questType === "time" ? "[Official髭男dism 開演時間線索]" : "[Official髭男dism 現場情報線索]";
  return `${prefix} ${date} ${title}${venuePart}`.trim();
}

/**
 * Builds the structured payload for Web3Forms serverless submission.
 */
export function buildLeadSubmissionPayload({
  show,
  unitTitle,
  evidenceUrl,
  notes = "",
  questType = "setlist",
  locale = "zh-TW",
  accessKey = DEFAULT_WEB3FORMS_KEY,
}) {
  const { date, title, venue, showId } = getShowDescriptor({ show, unitTitle });
  const subject = buildLeadSubject({ show, unitTitle, questType });
  const cleanUrl = typeof evidenceUrl === "string" ? evidenceUrl.trim() : "";
  const cleanNotes = typeof notes === "string" ? notes.trim() : "";

  const lines = [
    `【Official 髭男 dism 現場情報線索回報】`,
    `・場次 ID: ${showId}`,
    `・演出日期: ${date}`,
    `・活動名稱: ${title}`,
    `・演出場館: ${venue}`,
    `・情報類型: ${questType === "time" ? "開演時間" : "曲目情報"}`,
    `・佐證連結: ${cleanUrl}`,
    `・備註/稱呼: ${cleanNotes || "(無)"}`,
    `・回報語系: ${locale}`,
    `・提交時間: ${new Date().toISOString()}`,
  ];

  return {
    access_key: accessKey,
    subject,
    from_name: "HIGEDAN Live Archive Lead Drop",
    show_id: showId,
    show_date: date,
    show_title: title,
    show_venue: venue,
    quest_type: questType,
    evidence_url: cleanUrl,
    notes: cleanNotes,
    locale,
    message: lines.join("\n"),
  };
}

const FALLBACK_LABELS = {
  "zh-TW": { to: "收件者", subject: "主旨" },
  ja: { to: "宛先", subject: "件名" },
  en: { to: "To", subject: "Subject" },
  ko: { to: "받는 사람", subject: "제목" },
};

/**
 * Builds fallback human-readable plain text for clipboard copying if background API submission fails.
 */
export function buildLeadFallbackText({
  show,
  unitTitle,
  evidenceUrl,
  notes = "",
  questType = "setlist",
  locale = "zh-TW",
}) {
  const payload = buildLeadSubmissionPayload({ show, unitTitle, evidenceUrl, notes, questType, locale });
  const labels = FALLBACK_LABELS[locale] || FALLBACK_LABELS["zh-TW"];
  return [
    `${labels.to}: ${ARCHIVE_FEEDBACK_EMAIL}`,
    `${labels.subject}: ${payload.subject}`,
    ``,
    payload.message,
  ].join("\n");
}

