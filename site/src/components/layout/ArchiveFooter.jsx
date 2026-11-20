import { useI18n } from "../../lib/i18n.jsx";
import {
  ARCHIVE_FEEDBACK_EMAIL,
  ARCHIVE_AUTHOR_INSTAGRAM,
  ARCHIVE_AUTHOR_INSTAGRAM_URL,
} from "../../lib/feedback.js";

/**
 * Shared archival footer rendered across all non-fullscreen archive views.
 * Keeps deep-linked visitors informed of the unofficial/non-profit scope
 * and correction contact channels without verbose metadata clutter.
 */
export function ArchiveFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-12 border-t-[1.5px] border-ink pt-3 font-mono text-[11px] sm:text-[12px] text-muted space-y-1.5">
      <p className="m-0 leading-relaxed">
        {t(
          "landing.footerDisclaimer",
          "Official 髭男 dism 歌迷非官方非營利演出歷史檔案庫 · 資料源自官方公告、演出現場一手記錄與 LiveFans 查證"
        )}
      </p>
      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[6px]">
        <span>
          {t("footer.contactLabel", "資料勘誤與反饋：")}
          <a
            href={`mailto:${ARCHIVE_FEEDBACK_EMAIL}?subject=${encodeURIComponent(t("footer.contactSubject", "[Official HIGEDAN Archive] 資料勘誤與意見反饋"))}`}
            className="text-ink underline hover:text-band transition-colors"
          >
            {ARCHIVE_FEEDBACK_EMAIL}
          </a>
        </span>
        <span>
          {t("footer.authorLabel", "作者 IG：")}
          <a
            href={ARCHIVE_AUTHOR_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline hover:text-band transition-colors"
          >
            @{ARCHIVE_AUTHOR_INSTAGRAM}
          </a>
        </span>
      </div>
    </footer>
  );
}
