import { useI18n } from "../../lib/i18n.jsx";
import { buildSetlistMailto } from "../../lib/feedback.js";

export function SetlistQuestCard({ show, unitTitle }) {
  const { t, locale } = useI18n();
  const mailtoUrl = buildSetlistMailto({ show, unitTitle, locale });

  return (
    <div
      data-testid="setlist-quest-card"
      className="my-8 rounded-[3px] border-[2px] border-dotted border-ink/35 bg-paper/60 p-6 sm:p-8 text-center shadow-xs"
    >
      <div
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 bg-tape text-ink text-xl mb-3 shadow-2xs select-none"
        aria-hidden="true"
      >
        📮
      </div>
      <h3 className="m-0 text-[17px] sm:text-[18px] font-bold text-ink">
        {t("slips.quest.calloutTitle", "🔍 歌單情報協尋中")}
      </h3>
      <p className="mx-auto mt-2 max-w-[560px] text-[13px] sm:text-[14px] leading-relaxed text-muted">
        {t(
          "slips.quest.calloutDesc",
          "本場演出目前尚無公開曲目紀錄。Official 髭男 dism 早期現場足跡需要大家共同拼湊！如果您曾親臨現場，或持有當年的實體紙本歌單、門票票根、宣傳單（Flyer）或現場推文照片，歡迎協助補齊歷史拼圖！"
        )}
      </p>
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={mailtoUrl}
          data-testid="quest-mailto-btn"
          title={t("slips.quest.submitTitle", "開啟郵件軟體，預填本場演出情報回報範本")}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded px-5 py-2 font-mono text-[13px] font-bold bg-band text-band-ink border border-ink/40 shadow-xs hover:brightness-105 transition-colors cursor-pointer no-underline select-none touch-stamp"
        >
          <span aria-hidden="true">📮</span>
          <span>{t("slips.quest.submitBtn", "提供本場曲目情報")}</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
