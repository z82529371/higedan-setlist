import React, { useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import {
  ARCHIVE_FEEDBACK_EMAIL,
  WEB3FORMS_ENDPOINT,
  DEFAULT_WEB3FORMS_KEY,
  validateEvidenceUrl,
  buildLeadSubmissionPayload,
  buildLeadFallbackText,
} from "../../lib/feedback.js";

/**
 * LeadDropModal
 * 樂迷現場情報線索投遞彈窗 (ADR-0122 / #45, #40)
 * 供樂迷就地快速提供 Twitter/X、LiveFans 等佐證網址與備註，透過無伺服器轉發直達管理信箱。
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
  const [status, setStatus] = useState("idle"); // "idle" | "submitting" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEvidenceUrl("");
      setNotes("");
      setStatus("idle");
      setErrorMsg("");
      setCopied(false);
    }
  }, [isOpen]);

  // Handle Escape key to close
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanUrl = evidenceUrl.trim();

    if (!cleanUrl || !validateEvidenceUrl(cleanUrl)) {
      setErrorMsg(t("slips.quest.invalidUrl", "請填寫以 http:// 或 https:// 開頭的有效網址"));
      return;
    }

    setErrorMsg("");
    setStatus("submitting");

    const payload = buildLeadSubmissionPayload({
      show,
      unitTitle,
      evidenceUrl: cleanUrl,
      notes,
      questType,
      locale,
    });

    try {
      // If no access key is configured in dev/offline, gracefully simulate or send
      if (!DEFAULT_WEB3FORMS_KEY) {
        setStatus("error");
        return;
      }

      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleCopyFallback = () => {
    const fallbackText = buildLeadFallbackText({
      show,
      unitTitle,
      evidenceUrl,
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
        <div className="mb-4 rounded border border-dashed border-ink/30 bg-paper/80 p-3 text-[12px] font-mono leading-relaxed">
          <div className="font-bold text-ink flex items-center gap-1.5">
            <span className="whitespace-nowrap shrink-0">📅 {showDate}</span>
            <span className="text-muted">·</span>
            <span className="truncate">{showTitle}</span>
          </div>
          {showVenue && (
            <div className="mt-1 text-muted truncate">
              📍 {showVenue}
            </div>
          )}
        </div>

        {status === "success" ? (
          /* Success Screen */
          <div className="py-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-band/20 text-ink text-2xl mb-2">
              📮
            </div>
            <h4 className="text-[16px] font-bold text-ink m-0">
              {t("slips.quest.successTitle", "📮 情報已送達！")}
            </h4>
            <p className="mt-2 text-[13px] leading-relaxed text-muted max-w-[420px] mx-auto">
              {t(
                "slips.quest.successDesc",
                "感謝您協助拼湊 Official 髭男 dism 歷史現場拼圖！我們將儘速查驗並更新檔案庫。"
              )}
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[38px] items-center justify-center rounded bg-band px-6 py-1.5 font-mono text-[13px] font-bold text-band-ink border border-ink/40 shadow-xs hover:brightness-105 transition-colors cursor-pointer"
              >
                {t("slips.quest.close", "關閉")}
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full resize-none rounded border border-line-soft bg-paper px-3 py-2 text-[13px] font-mono text-ink placeholder:text-muted/60 focus:border-ink focus:outline-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex min-h-[38px] items-center justify-center rounded border border-line-soft bg-paper px-4 py-1.5 font-mono text-[12px] font-bold text-muted hover:border-ink hover:text-ink transition-colors cursor-pointer"
              >
                {t("slips.quest.close", "關閉")}
              </button>
              <button
                type="submit"
                data-testid="lead-submit-btn"
                disabled={status === "submitting"}
                className="w-full sm:w-auto inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded bg-band px-5 py-1.5 font-mono text-[13px] font-bold text-band-ink border border-ink/40 shadow-xs hover:brightness-105 disabled:opacity-60 transition-all cursor-pointer"
              >
                <span>📮</span>
                <span>
                  {status === "submitting"
                    ? t("slips.quest.submitting", "正在傳送...")
                    : t("slips.quest.submitBtn", "確認送出情報")}
                </span>
              </button>
            </div>

            {/* Email contact footnote */}
            <div className="pt-2 border-t border-line-soft/60 flex items-center justify-between text-[11px] font-mono text-muted">
              <span>{t("slips.quest.officialContact", "官方勘誤信箱：")} <strong className="text-ink">{ARCHIVE_FEEDBACK_EMAIL}</strong></span>
            </div>

            {/* Error or Fallback Section */}
            {status === "error" && (
              <div className="mt-3 rounded border border-red-500/40 bg-red-500/10 p-3 text-[12px] font-mono leading-relaxed">
                <p className="m-0 font-bold text-ink">
                  ⚠️ {t("slips.quest.fallbackPrompt", "線上傳送未完成，請點此複製內容手動寄信至")}{" "}
                  <code className="text-band-ink font-bold">{ARCHIVE_FEEDBACK_EMAIL}</code>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyFallback}
                    className="inline-flex items-center gap-1 rounded bg-paper border border-ink/40 px-3 py-1 font-mono text-[11px] font-bold text-ink hover:bg-tape transition-colors cursor-pointer"
                  >
                    {copied
                      ? t("slips.quest.copied", "✓ 已複製到剪貼簿")
                      : t("slips.quest.copyFallbackBtn", "📋 複製內容與信箱")}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
