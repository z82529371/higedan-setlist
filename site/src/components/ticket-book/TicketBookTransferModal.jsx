import { useState, useRef, useEffect, useMemo } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import {
  getSafeStorage,
  loadTicketBook,
  exportTicketBookBackup,
  encodeTicketBookTransferCode,
  decodeTicketBookTransferCode,
  parseAndValidateTicketBookBackup,
  importTicketBookBackup,
} from "../../lib/ticket-book.js";
import { TicketPerforationDivider } from "../slips/TicketCommon.jsx";

export function TicketBookTransferModal({
  isOpen,
  onClose,
  storage: propStorage,
  knownShowKeys = [],
  initialDiff = null,
}) {
  const { t } = useI18n();
  const storage = useMemo(() => propStorage || getSafeStorage(), [propStorage]);

  const [inputCode, setInputCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewResult, setPreviewResult] = useState(() => {
    if (initialDiff) {
      return {
        valid: true,
        diff: initialDiff,
        parsedPayload: { holderName: "", attendedShows: {} },
      };
    }
    return null;
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  // Sync initialDiff if prop changes
  useEffect(() => {
    if (initialDiff) {
      setPreviewResult({
        valid: true,
        diff: initialDiff,
        parsedPayload: { holderName: "", attendedShows: {} },
      });
    }
  }, [initialDiff]);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setInputCode("");
      setCopiedCode(false);
      setErrorMessage("");
      setSuccessMessage("");
      if (!initialDiff) setPreviewResult(null);
    }
  }, [isOpen, initialDiff]);

  if (!isOpen) return null;

  const currentPayload = loadTicketBook(storage);

  // Action: Download File Backup
  const handleDownloadBackup = () => {
    setErrorMessage("");
    try {
      const backup = exportTicketBookBackup(storage);
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backup.filename || "higedan-ticket-book-backup.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setErrorMessage(t("ticketBook.invalidFileError", "檔案處理發生錯誤，請重試"));
    }
  };

  // Action: File Input Change
  const handleFileChange = (e) => {
    setErrorMessage("");
    setSuccessMessage("");
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const res = parseAndValidateTicketBookBackup(content, currentPayload, knownShowKeys);
      if (res.valid) {
        setPreviewResult(res);
      } else {
        setErrorMessage(t("ticketBook.invalidFileError", "檔案格式不正確或已毀損，請確認選取正確的票夾備份檔"));
        setPreviewResult(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage(t("ticketBook.invalidFileError", "檔案格式不正確或已毀損，請確認選取正確的票夾備份檔"));
      setPreviewResult(null);
    };
    reader.readAsText(file);
    // Reset file input so same file can be picked again
    e.target.value = "";
  };

  // Action: Copy Transfer Code
  const handleCopyCode = () => {
    setErrorMessage("");
    try {
      const code = encodeTicketBookTransferCode(currentPayload);
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2500);
        });
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      }
    } catch {
      setErrorMessage(t("ticketBook.invalidCodeError", "代碼產生失敗，請重試"));
    }
  };

  // Action: Apply Pasted Transfer Code
  const handleApplyCode = () => {
    setErrorMessage("");
    setSuccessMessage("");
    const trimmed = inputCode.trim();
    if (!trimmed) {
      setErrorMessage(t("ticketBook.invalidCodeError", "請先貼上轉移代碼"));
      return;
    }

    const decoded = decodeTicketBookTransferCode(trimmed);
    if (!decoded) {
      setErrorMessage(t("ticketBook.invalidCodeError", "轉移代碼無效或格式不完整，請重新複製後貼上"));
      setPreviewResult(null);
      return;
    }

    const res = parseAndValidateTicketBookBackup(decoded, currentPayload, knownShowKeys);
    if (res.valid) {
      setPreviewResult(res);
    } else {
      setErrorMessage(t("ticketBook.invalidCodeError", "轉移代碼無效或格式不完整，請重新複製後貼上"));
      setPreviewResult(null);
    }
  };

  // Action: Confirm Merge
  const handleConfirmMerge = () => {
    if (!previewResult || !previewResult.parsedPayload) return;
    const res = importTicketBookBackup(previewResult.parsedPayload, { mode: "merge" }, storage);
    if (res.success) {
      setSuccessMessage(t("ticketBook.transferSuccessNotice", "參戰紀錄已成功同步更新！"));
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  // Action: Confirm Overwrite
  const handleConfirmOverwrite = () => {
    if (!previewResult || !previewResult.parsedPayload) return;
    const res = importTicketBookBackup(previewResult.parsedPayload, { mode: "overwrite" }, storage);
    if (res.success) {
      setSuccessMessage(t("ticketBook.transferSuccessNotice", "參戰紀錄已成功同步更新！"));
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const diff = previewResult?.diff;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="ticket-book-transfer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-[560px] my-8 rounded-[4px] border-[1.5px] border-ink bg-card p-5 sm:p-7 shadow-2xl text-ink font-sans">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-tape-tint text-muted hover:text-ink transition-colors cursor-pointer"
          aria-label="Close"
        >
          <span className="text-xl leading-none">✕</span>
        </button>

        {/* Modal Header */}
        <div className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[4px] bg-band border border-ink shadow-2xs mb-2">
            <span className="text-xl" aria-hidden="true">🔄</span>
          </div>
          <h2 className="m-0 font-display text-[20px] sm:text-[22px] font-black text-ink tracking-tight">
            {t("ticketBook.transferModalTitle", "票夾備份與跨裝置轉移")}
          </h2>
          <p className="mt-1.5 mb-0 text-[12px] sm:text-[13px] text-muted leading-relaxed">
            {t(
              "ticketBook.transferModalSubtitle",
              "在更換手機、多裝置同步或長期保存時，安全備份與轉移您的參戰紀錄"
            )}
          </p>
        </div>

        <TicketPerforationDivider className="my-4" />

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-4 rounded-[3px] border border-red-500/40 bg-red-50 dark:bg-red-950/40 p-3 text-[12px] font-bold text-red-700 dark:text-red-300">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Success Feedback */}
        {successMessage && (
          <div className="mb-4 rounded-[3px] border border-green-600/40 bg-green-50 dark:bg-green-950/40 p-3 text-[12px] font-bold text-green-700 dark:text-green-300">
            ✓ {successMessage}
          </div>
        )}

        {/* Diff Preview Card (When Valid Payload parsed) */}
        {diff ? (
          <div
            data-testid="transfer-diff-preview"
            className="mb-5 rounded-[4px] border-[1.5px] border-ink bg-paper p-4 space-y-3"
          >
            <div className="flex items-center gap-2 font-display text-[14px] font-black text-ink">
              <span aria-hidden="true">📋</span>
              <span>{t("ticketBook.diffPreviewTitle", "即將匯入的紀錄預覽")}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded border border-ink/20 bg-card p-2.5">
                <span className="text-muted block text-[11px]">
                  {t("ticketBook.diffNewShows", "新增場次：{count} 場", { count: diff.newShowsCount })}
                </span>
                <span className="font-mono text-[16px] font-extrabold text-ink">
                  +{diff.newShowsCount}
                </span>
              </div>
              <div className="rounded border border-ink/20 bg-card p-2.5">
                <span className="text-muted block text-[11px]">
                  {t("ticketBook.diffUpdatedShows", "更新備忘/座位：{count} 場", { count: diff.updatedShowsCount })}
                </span>
                <span className="font-mono text-[16px] font-extrabold text-ink">
                  ~{diff.updatedShowsCount}
                </span>
              </div>
            </div>

            <p className="m-0 text-[11px] text-muted font-mono">
              {t("ticketBook.diffTotalShows", "備份包含總場次：{count} 場", { count: diff.totalIncomingShows })}
            </p>

            {/* Merge vs Overwrite Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                data-testid="transfer-confirm-merge"
                onClick={handleConfirmMerge}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-[4px] border-[1.5px] border-ink bg-band px-4 py-2.5 font-mono text-[12px] font-extrabold text-ink shadow-2xs hover:brightness-105 transition-all cursor-pointer"
              >
                <span>✓ {t("ticketBook.mergeAction", "保留現有並合併")}</span>
              </button>
              <button
                type="button"
                data-testid="transfer-confirm-overwrite"
                onClick={handleConfirmOverwrite}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-ink/40 bg-card px-4 py-2 font-mono text-[11px] font-bold text-muted hover:text-ink hover:bg-tape-tint transition-all cursor-pointer"
              >
                <span>⚠ {t("ticketBook.overwriteAction", "完全覆蓋為此備份")}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Track 1: File Backup & Restore */}
            <section className="rounded-[4px] border border-ink/20 bg-paper/60 p-3.5 space-y-2.5">
              <div>
                <h3 className="m-0 font-display text-[13px] font-extrabold text-ink flex items-center gap-1.5">
                  <span aria-hidden="true">💾</span>
                  <span>{t("ticketBook.fileTrackTitle", "檔案備份與還原")}</span>
                </h3>
                <p className="mt-1 mb-0 text-[11px] text-muted">
                  {t("ticketBook.fileTrackDesc", "將票夾記錄匯出為本機檔案保存，或選取先前的備份檔案還原。")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  data-testid="transfer-download-backup"
                  onClick={handleDownloadBackup}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/40 bg-card px-3 py-1.5 font-mono text-[11px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
                >
                  <span aria-hidden="true">⬇</span>
                  <span>{t("ticketBook.downloadBackup", "下載備份檔案")}</span>
                </button>

                <input
                  type="file"
                  accept=".json,application/json"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  data-testid="transfer-file-input"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink/40 bg-card px-3 py-1.5 font-mono text-[11px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
                >
                  <span aria-hidden="true">📂</span>
                  <span>{t("ticketBook.selectBackupFile", "選取備份檔案")}</span>
                </button>
              </div>
            </section>

            {/* Track 2: Quick Transfer Code */}
            <section className="rounded-[4px] border border-ink/20 bg-paper/60 p-3.5 space-y-2.5">
              <div>
                <h3 className="m-0 font-display text-[13px] font-extrabold text-ink flex items-center gap-1.5">
                  <span aria-hidden="true">📲</span>
                  <span>{t("ticketBook.codeTrackTitle", "快速跨機轉移碼")}</span>
                </h3>
                <p className="mt-1 mb-0 text-[11px] text-muted">
                  {t("ticketBook.codeTrackDesc", "在手機間可直接複製這串轉移代碼，貼到新手機完成同步。")}
                </p>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  data-testid="transfer-copy-code"
                  onClick={handleCopyCode}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-ink/40 bg-card px-3 py-1.5 font-mono text-[11px] font-bold text-ink shadow-2xs hover:bg-tape-tint transition-colors cursor-pointer"
                >
                  <span aria-hidden="true">{copiedCode ? "✓" : "📋"}</span>
                  <span>
                    {copiedCode
                      ? t("ticketBook.codeCopied", "✓ 代碼已複製")
                      : t("ticketBook.copyCode", "複製轉移代碼")}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    data-testid="transfer-code-input"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder={t("ticketBook.pasteCodePlaceholder", "在此貼上轉移代碼...")}
                    className="flex-1 rounded-[3px] border border-ink/30 bg-card px-2.5 py-1.5 text-[11px] font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-band"
                  />
                  <button
                    type="button"
                    data-testid="transfer-apply-code"
                    onClick={handleApplyCode}
                    className="inline-flex items-center gap-1 rounded-[3px] border border-ink/40 bg-tape px-3 py-1.5 font-mono text-[11px] font-extrabold text-ink shadow-2xs hover:brightness-105 cursor-pointer"
                  >
                    <span>{t("ticketBook.applyCode", "讀取代碼")}</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
