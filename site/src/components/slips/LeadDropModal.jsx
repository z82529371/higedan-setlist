import React, { useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import {
  ARCHIVE_FEEDBACK_EMAIL,
  validateEvidenceUrl,
  buildGmailWebComposeUrl,
  buildLeadMailtoUrl,
  buildLeadFallbackText,
} from "../../lib/feedback.js";

/**
 * LeadDropModal
 * 樂迷現場情報線索投遞彈窗 (ADR-0122 / #45, #40)
 * 100% 純前端架構：提供「網頁版 Gmail 一鍵預填直達」與「一鍵複製整組內容與信箱」，零後端、零 API Key 負擔。
 */
export function LeadDropModal({
  isOpen,
  onClose,
  show,
  unitTitle = "",
  questType = "setlist", // "setlist" | "time"
}) {
  const { t, locale } = useI18n();
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEvidenceUrl("");
      setNotes("");
      setErrorMsg("");
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTime = questType === "time";
  const modalTitle = isTime
    ? t("slips.quest.modalTitleTime", "⏰ 提供演出時間線索")
    : t("slips.quest.modalTitleSetlist", "🔍 提供曲目情報線索");

  const showDate = show?.date || "";
  const showTitle = unitTitle || show?.title || "";
  const showVenue = show?.venue || "";

  const isValidUrl = validateEvidenceUrl(evidenceUrl);
  const cleanUrl = evidenceUrl.trim();

  const gmailUrl = isValidUrl
    ? buildGmailWebComposeUrl({ show, unitTitle, evidenceUrl: cleanUrl, notes, questType, locale })
    : "";

  const mailtoUrl = isValidUrl
    ? buildLeadMailtoUrl({ show, unitTitle, evidenceUrl: cleanUrl, notes, questType, locale })
    : "";

  const handleCopy = () => {
    if (!isValidUrl) {
      setErrorMsg(t("slips.quest.invalidUrl", "請填寫以 http:// 或 https:// 開頭的有效網址"));
      return;
    }
    setErrorMsg("");
    const fallbackText = buildLeadFallbackText({
      show,
      unitTitle,
      evidenceUrl: cleanUrl,
      notes,
      questType,
      locale,
    });
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fallbackText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {});
    }
  };

  const handleGmailClick = (e) => {
    if (!isValidUrl) {
      e.preventDefault();
      setErrorMsg(t("slips.quest.invalidUrl", "請填寫以 http:// 或 https:// 開頭的有效網址"));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
      data-testid="lead-drop-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[520px] rounded-[3px] border-[1.5px] border-ink bg-card p-5 sm:p-6 text-ink shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line-soft pb-3 mb-4">
          <h3
            id="lead-modal-title"
            className="m-0 text-[16px] sm:text-[17px] font-bold text-ink flex items-center gap-2"
          >
            <span>{modalTitle}</span>
          </h3>
          <button
            type="button"
            data-testid="lead-close-btn"
            onClick={onClose}
            aria-label={t("slips.quest.close", "關閉")}
            className="flex h-7 w-7 items-center justify-center rounded border border-line-soft bg-paper text-muted hover:border-ink hover:text-ink transition-colors cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Show Descriptor Badge */}
        <div className="mb-4 rounded border border-dashed border-ink/30 bg-paper/80 p-3 text-[12px] leading-relaxed">
          <div className="font-bold text-ink flex items-center gap-1.5">
            <span className="font-mono whitespace-nowrap shrink-0">📅 {showDate}</span>
            <span className="text-muted">·</span>
            <span className="truncate">{showTitle}</span>
          </div>
          {showVenue && (
            <div className="mt-1 text-muted truncate">
              📍 {showVenue}
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          <p className="m-0 text-[13px] leading-relaxed text-muted">
            {t(
              "slips.quest.modalDesc",
              "若您持有或在網路上發現本場演出的現場紀錄（Twitter/X 貼文、LiveFans、IG 或報導），請直接貼上網址，我們將核對並收錄至官方檔案庫！"
            )}
          </p>

          {/* Evidence URL Input */}
          <div>
            <label
              htmlFor="lead-evidence-input"
              className="block text-[12px] font-mono font-bold text-ink mb-1.5"
            >
              {t("slips.quest.evidenceLabel", "佐證連結（必填）")}
              <span className="text-band font-bold ml-1">*</span>
            </label>
            <input
              id="lead-evidence-input"
              data-testid="lead-evidence-input"
              type="url"
              required
              value={evidenceUrl}
              onChange={(e) => {
                setEvidenceUrl(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder={t("slips.quest.evidencePlaceholder", "https://x.com/... 或 LiveFans / 報導網址")}
              className="w-full rounded border border-line-soft bg-paper px-3 py-2 text-[13px] font-mono text-ink placeholder:text-muted/60 focus:border-ink focus:outline-none transition-colors"
            />
            {errorMsg && (
              <p className="mt-1 text-[11px] font-mono font-bold text-red-600 dark:text-red-400">
                ⚠️ {errorMsg}
              </p>
            )}
          </div>

          {/* Notes / Submitter Name Input */}
          <div>
            <label
              htmlFor="lead-notes-input"
              className="block text-[12px] font-mono font-bold text-ink mb-1.5"
            >
              {t("slips.quest.notesLabel", "備註說明或您的稱呼（選填）")}
            </label>
            <textarea
              id="lead-notes-input"
              data-testid="lead-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("slips.quest.notesPlaceholder", "例：推文照片有紙本歌單、自彈自唱、您的暱稱...")}
              className="w-full resize-none rounded border border-line-soft bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-muted/60 focus:border-ink focus:outline-none transition-colors"
            />
          </div>

          {/* Direct Actions: Two Pure Client-Side Options */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              data-testid="lead-copy-btn"
              onClick={handleCopy}
              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded border border-line-soft bg-paper px-4 py-1.5 font-mono text-[12px] font-bold text-ink hover:border-ink hover:bg-tape-tint transition-colors cursor-pointer"
            >
              <span>{copied ? "✓" : "📋"}</span>
              <span>{copied ? t("slips.quest.copied", "✓ 已複製到剪貼簿") : t("slips.quest.copyFallbackBtn", "複製內容與信箱")}</span>
            </button>

            <a
              href={isValidUrl ? gmailUrl : "#"}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="lead-submit-btn"
              onClick={handleGmailClick}
              className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded bg-band px-5 py-1.5 font-mono text-[13px] font-bold text-band-ink border border-ink/40 shadow-xs hover:brightness-105 transition-all no-underline ${
                isValidUrl ? "cursor-pointer" : "opacity-70 cursor-not-allowed"
              }`}
            >
              <span>📮</span>
              <span>{t("slips.quest.openGmail", "在網頁版 Gmail 寄出")}</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>

          {/* Desktop Mail Client & Direct Email Footnote */}
          <div className="pt-2 border-t border-line-soft/60 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-muted">
            <div>
              <span>📮 {t("slips.quest.officialContact", "官方勘誤信箱：")} </span>
              <strong className="text-ink">{ARCHIVE_FEEDBACK_EMAIL}</strong>
            </div>
            <a
              href={isValidUrl ? mailtoUrl : "#"}
              data-testid="lead-mailto-btn"
              onClick={(e) => {
                if (!isValidUrl) {
                  e.preventDefault();
                  setErrorMsg(t("slips.quest.invalidUrl", "請填寫以 http:// 或 https:// 開頭的有效網址"));
                }
              }}
              className="text-muted hover:text-ink underline transition-colors cursor-pointer"
            >
              {t("slips.quest.nativeMail", "使用本機郵件軟體")} ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
