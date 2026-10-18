import React from "react";
import { songTitle } from "../../lib/domain.js";
import { useI18n } from "../../lib/i18n.jsx";

export function ShowSlipPanels({
  showLegend,
  showDiff,
  setlistDiff,
  prevShow,
  showAnalysis,
  albumBreakdown,
  mainCount,
  encCount,
  showCompare,
  showList,
  showId,
  activeCompareId,
  setCompareShowId,
  customCompareDiff,
}) {
  const { t } = useI18n();
  return (
    <>
      {/* Collapsible Legend Details */}
      {showLegend && (
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded bg-paper/70 p-2.5 text-[11px] font-mono border border-line-soft slip-ignore-export">
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-solo text-white text-[11px] font-bold">
              SOLO
            </span>
            <span className="text-ink">{t("slips.panels.legendSolo", "自彈自唱")}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-request text-white text-[11px] font-bold">
              REQUEST
            </span>
            <span className="text-ink">{t("slips.panels.legendRequest", "現場點歌")}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-unreleased text-white text-[11px] font-bold">
              UNRELEASED
            </span>
            <span className="text-ink">{t("slips.panels.legendUnreleased", "未發行曲")}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-premiere text-white text-[11px] font-bold">
              PREMIERE
            </span>
            <span className="text-ink">{t("slips.panels.legendPremiere", "新歌初披露")}</span>
          </div>
        </div>
      )}

      {/* Collapsible Setlist Diff Drawer */}
      {showDiff && setlistDiff && !setlistDiff.identical && (
        <div className="mt-2.5 border-t border-line-soft/80 pt-2 font-mono text-[11px] slip-ignore-export">
          <div className="text-ink font-bold mb-1 flex items-center gap-1">
            <span>
              {t("slips.panels.diffWithPrevious", "🔄 與前一場（{date} {venue}）曲目更換：", {
                date: prevShow.date.slice(5),
                venue: prevShow.city ? t("cities." + prevShow.city, prevShow.city) : prevShow.venue,
              })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {setlistDiff.added.length > 0 && (
              <span className="text-request font-semibold">
                {t("slips.panels.diffAdded", "換入（＋）：")}
                {setlistDiff.added.map((id) => songTitle[id] || id).join("、")}
              </span>
            )}
            {setlistDiff.removed.length > 0 && (
              <span className="text-muted font-medium">
                {t("slips.panels.diffRemoved", "換出（－）：")}
                {setlistDiff.removed.map((id) => songTitle[id] || id).join("、")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Album Era Breakdown Drawer */}
      {showAnalysis && albumBreakdown.length > 0 && (
        <div className="mt-2.5 border-t border-line-soft/80 pt-2 font-mono text-[11px] slip-ignore-export">
          <div className="text-muted font-bold mb-1.5 flex items-center gap-1">
            <span>💿 {t("slips.panels.albumCompositionTitle", "演出曲目專輯構成：")}</span>
            <span className="font-normal text-muted/70">
              {t("slips.panels.mainEncoreBreakdown", "（本篇 {mainCount} 首 · 安可 {encCount} 首）", {
                mainCount,
                encCount,
              })}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {albumBreakdown.map(([alb, count]) => (
              <span
                key={alb}
                className="inline-flex items-center gap-1 rounded bg-paper px-2 py-0.5 border border-line-soft text-ink"
              >
                <span className="text-muted">{alb}</span>
                <span className="font-bold">
                  {count}{t("slips.panels.songUnit", "首")}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Tour Show Compare Drawer */}
      {showCompare && showList.length > 1 && (
        <div className="mt-2.5 border-t border-line-soft/80 pt-2 font-mono text-[11px] space-y-2 slip-ignore-export">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-ink flex items-center gap-1">
              <span>{t("slips.panels.anyShowCompareTitle", "⚖️ 巡演任意雙場對比：")}</span>
            </span>
            <label className="flex items-center gap-1.5 text-muted">
              <span>{t("slips.panels.compareTarget", "對比目標：")}</span>
              <select
                value={activeCompareId}
                onChange={(e) => setCompareShowId(e.target.value)}
                className="rounded border border-line-soft bg-paper px-2 py-0.5 font-mono text-[11px] font-semibold text-ink cursor-pointer focus-visible:outline-pool"
              >
                {showList
                  .filter((x) => x.id !== showId)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.date.slice(5)} {x.city ? t("cities." + x.city, x.city) : x.venue}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {customCompareDiff && (
            <div className="space-y-1">
              {customCompareDiff.isIdentical ? (
                <p className="text-muted m-0">
                  {t("slips.panels.compareIdentical", "✓ 兩場合計 {count} 首曲目完全一致。", {
                    count: customCompareDiff.commonCount,
                  })}
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="font-bold text-request">
                      {t("slips.panels.thisShowExclusive", "本場限定（＋{count} 首）：", {
                        count: customCompareDiff.onlyThis.length,
                      })}
                    </span>
                    {customCompareDiff.onlyThis.length > 0 ? (
                      <span className="text-ink">
                        {customCompareDiff.onlyThis
                          .map((id) => songTitle[id] || id)
                          .join("、")}
                      </span>
                    ) : (
                      <span className="text-muted">{t("slips.panels.none", "無")}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="font-bold text-muted">
                      {t("slips.panels.otherShowExclusive", "對比場限定（－{count} 首）：", {
                        count: customCompareDiff.onlyOther.length,
                      })}
                    </span>
                    {customCompareDiff.onlyOther.length > 0 ? (
                      <span className="text-muted">
                        {customCompareDiff.onlyOther
                          .map((id) => songTitle[id] || id)
                          .join("、")}
                      </span>
                    ) : (
                      <span className="text-muted">{t("slips.panels.none", "無")}</span>
                    )}
                  </div>
                  <div className="text-muted/80 text-[10px]">
                    {t("slips.panels.commonTracks", "共通演出曲目：{count} 首", {
                      count: customCompareDiff.commonCount,
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
