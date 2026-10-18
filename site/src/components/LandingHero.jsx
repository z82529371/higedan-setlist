import { useMemo } from "react";
import SearchBox from "./SearchBox.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import { useI18n } from "../lib/i18n.jsx";

export default function LandingHero({
  onEnterArchive,
  onSelectSong,
  onSelectUnit,
  onSelectVenue,
  onSelectShow,
  onOpenCalendar,
  onSelectTab,
  totalAllShows,
  allUsedSongs,
  allVenues,
  allUnits,
  q,
  setQ,
}) {
  const { t } = useI18n();

  // Find indicators for hot prompts
  const rejoiceUnit = useMemo(() => {
    return allUnits.find(
      (u) =>
        u.title?.includes("Rejoice") ||
        u.shortTitle?.includes("Rejoice") ||
        u.id?.includes("rejoice")
    );
  }, [allUnits]);

  const taipeiShowId = useMemo(() => {
    for (const u of allUnits) {
      if (u.shows) {
        const found = u.shows.find(
          (s) =>
            s.venue?.name?.includes("台北小巨蛋") ||
            s.venue?.name?.includes("臺北小巨蛋") ||
            s.id?.includes("taipei")
        );
        if (found) return { unitId: u.id, showId: found.id };
      }
    }
    return null;
  }, [allUnits]);

  const pretenderSong = useMemo(() => {
    return allUsedSongs.find(
      (s) =>
        s.title?.toLowerCase().includes("pretender") ||
        s.id?.toLowerCase().includes("pretender")
    );
  }, [allUsedSongs]);

  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6 py-6 sm:py-12 flex flex-col items-center text-center animate-fade-in relative">
      {/* Top Utility Bar (Language Switcher) */}
      <div className="w-full flex justify-end items-center mb-3 sm:mb-5">
        <LanguageSwitcher />
      </div>

      {/* Brand Logo & Header */}
      <header className="flex flex-col items-center">
        <div className="mb-4 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-band border-[1.5px] border-ink shadow-xs">
          <img
            src="/favicon.svg"
            alt="Official髭男dism"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
          />
        </div>

        <p className="m-0 mb-2 font-mono text-[11px] sm:text-[13px] tracking-[0.22em] text-muted font-bold uppercase">
          {t("header.livePerformanceArchive")}
        </p>

        <h1 className="m-0 max-w-full font-display text-[clamp(24px,5.5vw,48px)] font-black leading-tight tracking-tight text-ink text-balance">
          <span className="whitespace-nowrap">Official髭男dism</span>{" "}
          <span className="inline-block whitespace-nowrap font-extrabold text-band-ink bg-band/40 px-2 py-0.5 rounded-[4px] border border-ink/20 [box-decoration-break:clone]">
            {t("header.brandTitle")}
          </span>
        </h1>

        <p className="mt-3 sm:mt-4 mb-0 text-[13px] sm:text-[16px] text-muted max-w-[620px] mx-auto leading-relaxed font-sans">
          {t("header.landingSubtitle")}
        </p>

        {/* 5 Stats Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-[12px] text-ink">
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-card px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">📅</span> {t("header.years")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-card px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">🎫</span>{" "}
            <span className="tabular-nums">{totalAllShows}</span> {t("header.publicShows")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-card px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">🎭</span> 8 {t("header.performanceTypes")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-card px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">🎵</span>{" "}
            <span className="tabular-nums">{allUsedSongs.length}</span> {t("header.originalSongs")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-ink/20 bg-card px-2.5 py-1 font-semibold shadow-2xs">
            <span aria-hidden="true">📍</span>{" "}
            <span className="tabular-nums">{allVenues.length}</span> {t("header.historicVenues")}
          </span>
        </div>
      </header>

      {/* Spotlight Central Search Box (Single Clean Layer ADR-0095/0096) */}
      <section
        className="w-full max-w-[640px] mt-8 sm:mt-10 text-left"
        aria-label={t("landing.instantSearchAria", "即時檢索")}
      >
        <SearchBox
          q={q}
          setQ={setQ}
          allUsedSongs={allUsedSongs}
          allUnits={allUnits}
          allVenues={allVenues}
          size="lg"
          onSelectSong={(sId) => {
            onSelectSong(sId);
          }}
          onSelectUnit={(uId) => {
            onSelectUnit(uId);
          }}
          onSelectVenue={(vName) => {
            onSelectVenue(vName);
          }}
          onSelectShow={(shId) => {
            if (onSelectShow) onSelectShow(shId);
          }}
          onOpenCalendar={onOpenCalendar}
        />

        {/* 4 Hot exploration pills */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px]">
          <span className="text-muted font-bold mr-0.5 text-xs">{t("landing.hotExploration", "熱門探索：")}</span>
          <button
            type="button"
            onClick={() => {
              if (rejoiceUnit) {
                onSelectUnit(rejoiceUnit.id);
              } else {
                onEnterArchive();
              }
            }}
            className="rounded-[4px] border border-ink/25 bg-card hover:bg-band hover:text-band-ink px-2.5 py-1 font-medium transition-colors motion-reduce:transition-none cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <span aria-hidden="true">🎫</span> {t("landing.hotPrompts.rejoiceTour", "2024 Rejoice 巡演")}
          </button>

          <button
            type="button"
            onClick={() => {
              if (taipeiShowId) {
                onSelectUnit(taipeiShowId.unitId, taipeiShowId.showId);
              } else if (rejoiceUnit) {
                onSelectUnit(rejoiceUnit.id);
              } else {
                onEnterArchive();
              }
            }}
            className="rounded-[4px] border border-ink/25 bg-card hover:bg-band hover:text-band-ink px-2.5 py-1 font-medium transition-colors motion-reduce:transition-none cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <span aria-hidden="true">📍</span> {t("landing.hotPrompts.taipeiShow", "台北小巨蛋專場")}
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab("song", { sortMode: "count" });
            }}
            className="rounded-[4px] border border-ink/25 bg-card hover:bg-band hover:text-band-ink px-2.5 py-1 font-medium transition-colors motion-reduce:transition-none cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <span aria-hidden="true">🏆</span> {t("landing.hotPrompts.songRanking", "歌曲演唱排行")}
          </button>

          <button
            type="button"
            onClick={() => {
              if (pretenderSong) {
                onSelectSong(pretenderSong.id);
              } else {
                onSelectTab("song");
              }
            }}
            className="rounded-[4px] border border-ink/25 bg-card hover:bg-band hover:text-band-ink px-2.5 py-1 font-medium transition-colors motion-reduce:transition-none cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <span aria-hidden="true">🎵</span> Pretender
          </button>
        </div>
      </section>

      {/* 3 Feature Spotlight Cards */}
      <section
        className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 mt-10 sm:mt-12 w-full text-left"
        aria-label={t("landing.features.sectionAria", "三大核心特色")}
      >
        {/* Card 1: Bi-directional Archive */}
        <button
          type="button"
          onClick={() => onSelectTab("song")}
          className="group flex flex-col justify-between rounded-xl border-[1.5px] border-ink/25 bg-card p-5 text-left transition-all motion-reduce:transition-none hover:border-ink hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-paper border border-ink/20 text-base shadow-2xs">
                🔄
              </span>
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider group-hover:text-band-ink">
                BI-DIRECTIONAL
              </span>
            </div>
            <h3 className="m-0 font-display text-[16px] sm:text-[17px] font-bold text-ink">
              {t("landing.features.bidirectionalTitle", "雙向深度檢索")}
            </h3>
            <p className="mt-2 mb-0 text-[13px] text-muted leading-relaxed">
              {t("landing.features.bidirectionalDesc", "查場次看完整歌單與版本差異；查歌曲秒速透視其全歷史演出場次、累計次數與初登場。")}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line-soft flex items-center justify-between text-[12px] font-bold text-ink group-hover:text-band-ink">
            <span>{t("landing.features.bidirectionalAction", "瀏覽歌曲歷史庫")}</span>
            <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
              →
            </span>
          </div>
        </button>

        {/* Card 2: Authentic Ticket Craftsmanship */}
        <button
          type="button"
          onClick={() => onEnterArchive()}
          className="group flex flex-col justify-between rounded-xl border-[1.5px] border-ink/25 bg-card p-5 text-left transition-all motion-reduce:transition-none hover:border-ink hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-paper border border-ink/20 text-base shadow-2xs">
                🎟️
              </span>
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider group-hover:text-band-ink">
                TICKET STUB
              </span>
            </div>
            <h3 className="m-0 font-display text-[16px] sm:text-[17px] font-bold text-ink">
              {t("landing.features.ticketStubTitle", "實體票券與舞台單據")}
            </h3>
            <p className="mt-2 mb-0 text-[13px] text-muted leading-relaxed">
              {t("landing.features.ticketStubDesc", "手撕和紙膠帶、雙側撕票缺口、典藏條碼與現場舞台 Run-Sheet 擬真，重現每場巡演的實體溫度。")}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line-soft flex items-center justify-between text-[12px] font-bold text-ink group-hover:text-band-ink">
            <span>{t("landing.features.ticketStubAction", "檢視現場票根")}</span>
            <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
              →
            </span>
          </div>
        </button>

        {/* Card 3: Complete Chronology & Provenance */}
        <button
          type="button"
          onClick={() => onSelectTab("venue")}
          className="group flex flex-col justify-between rounded-xl border-[1.5px] border-ink/25 bg-card p-5 text-left transition-all motion-reduce:transition-none hover:border-ink hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-paper border border-ink/20 text-base shadow-2xs">
                🏛️
              </span>
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider group-hover:text-band-ink">
                PROVENANCE
              </span>
            </div>
            <h3 className="m-0 font-display text-[16px] sm:text-[17px] font-bold text-ink">
              {t("landing.features.provenanceTitle", "2012–2026 全域足跡")}
            </h3>
            <p className="mt-2 mb-0 text-[13px] text-muted leading-relaxed">
              {t("landing.features.provenanceDesc", "收錄 8 大演出型態、{venueCount} 處歷史場館與未發行地下原創曲，100% 一手官方資料嚴謹查證。", {
                venueCount: allVenues.length,
              })}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line-soft flex items-center justify-between text-[12px] font-bold text-ink group-hover:text-band-ink">
            <span>{t("landing.features.provenanceAction", "探索歷史場館")}</span>
            <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
              →
            </span>
          </div>
        </button>
      </section>

      {/* Primary CTA */}
      <div className="mt-10 sm:mt-14 flex flex-col items-center">
        <button
          type="button"
          onClick={onEnterArchive}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-band text-band-ink font-bold text-[15px] sm:text-[17px] border-2 border-ink shadow-md hover:brightness-105 active:scale-[0.99] transition-all motion-reduce:transition-none cursor-pointer focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none"
        >
          <span>{t("landing.primaryCta", "進入完整檔案庫探索")}</span>
          <span aria-hidden="true" className="font-mono text-lg">
            →
          </span>
        </button>
        <p className="mt-2.5 text-[12px] text-muted">
          {t("landing.primaryCtaSubtitle", "支援場次、歌曲與場館全方位切換與雙層智能導航")}
        </p>
      </div>

      {/* Minimalist Disclaimer Footer */}
      <footer className="mt-14 sm:mt-20 pt-6 border-t border-line-soft/80 w-full text-center">
        <p className="m-0 text-[11px] sm:text-[12px] text-muted leading-relaxed font-sans">
          {t(
            "landing.footerDisclaimer",
            "Official 髭男 dism 歌迷非官方非營利演出歷史檔案庫 · 資料源自官方公告、演出現場一手記錄與 LiveFans 查證"
          )}
        </p>
      </footer>
    </div>
  );
}
