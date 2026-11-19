import { useMemo } from "react";
import SearchBox from "./SearchBox.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import {
  TicketPerforationDivider,
  TicketBarcodeFooter,
} from "./slips/TicketCommon.jsx";
import { useI18n } from "../lib/i18n.jsx";
import { useTicketBook } from "../lib/ticket-book.js";
import {
  findLatestTourUnit,
  formatLatestTourPromptLabel,
  pickRandomPlayableShow,
} from "../lib/landing.js";
import {
  ARCHIVE_FEEDBACK_EMAIL,
  ARCHIVE_AUTHOR_INSTAGRAM,
  ARCHIVE_AUTHOR_INSTAGRAM_URL,
} from "../lib/feedback.js";

const QUICK_JUMP_BTN_BASE =
  "rounded-[3px] border px-3 py-1.5 text-ink transition-colors motion-reduce:transition-none cursor-pointer shadow-2xs touch-stamp flex items-center gap-1.5 hover:bg-band hover:text-band-ink";

export default function LandingHero({
  onEnterArchive,
  onSelectSong,
  onSelectUnit,
  onSelectVenue,
  onSelectShow,
  onOpenCalendar,
  onSelectTab,
  onSelectTickets,
  onSelectRanking,
  onSelectJourney,
  onSelectReleases,
  totalAllShows,
  allUsedSongs,
  allVenues,
  allUnits,
  q,
  setQ,
  storage,
}) {
  const { t } = useI18n();
  const { count: ticketCount } = useTicketBook({ storage });

  const latestTourUnit = useMemo(() => findLatestTourUnit(allUnits), [allUnits]);
  const latestTourLabel = useMemo(() => {
    const formatted = formatLatestTourPromptLabel(latestTourUnit);
    return formatted || t("landing.hotPrompts.latestTourFallback", "最新巡演");
  }, [latestTourUnit, t]);

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

  const handleRandomShow = () => {
    const picked = pickRandomPlayableShow(allUnits);
    if (picked) {
      if (onSelectShow) {
        onSelectShow(picked.showId);
      } else if (onSelectUnit) {
        onSelectUnit(picked.unitId, picked.showId);
      }
    } else {
      onEnterArchive();
    }
  };

  const catalogStubs = [
    {
      index: "01",
      code: "BI-DIRECTIONAL",
      icon: "🔄",
      testId: "landing-stub-songs",
      title: t("landing.features.bidirectionalTitle", "雙向深度檢索"),
      desc: t(
        "landing.features.bidirectionalDesc",
        "依專輯與演唱次數速查每首歌的全歷史演出與版本差異。"
      ),
      action: t("landing.features.bidirectionalAction", "瀏覽歌曲履歷"),
      onClick: () => onSelectTab("song"),
    },
    {
      index: "02",
      code: "VENUE ATLAS",
      icon: "🗺️",
      testId: "landing-stub-venues",
      title: t("landing.features.venueMapTitle", "場地制霸地圖"),
      desc: t(
        "landing.features.venueMapDesc",
        "探索日本 47 都道府縣與海外場館演出編年史。"
      ),
      action: t("landing.features.venueMapAction", "展開場地地圖"),
      onClick: () => onSelectTab("venue", { sortMode: "map" }),
    },
    {
      index: "03",
      code: "TICKET BOOK",
      icon: "🗂️",
      testId: "landing-feature-ticket-book",
      title: t("landing.features.ticketBookTitle", "個人巡演票夾"),
      desc: t(
        "landing.features.ticketBookDesc",
        "離線打卡參戰場次、統計曲庫解鎖並匯出紀念票卡。"
      ),
      action: t("landing.features.ticketBookAction", "開啟我的巡演票夾"),
      badgeCount: ticketCount,
      onClick: () => {
        if (onSelectTickets) onSelectTickets();
      },
    },
    {
      index: "04",
      code: "TOUR JOURNEY",
      icon: "🚐",
      testId: "landing-feature-journey",
      title: t("landing.features.journeyTitle", "全生涯巡演動態足跡"),
      desc: t(
        "landing.features.journeyDesc",
        "跟隨巡演小巴與航班自島根啟程，動態重溫橫跨列島與海外軌跡。"
      ),
      action: t("landing.features.journeyAction", "啟動巡演足跡"),
      onClick: () => {
        if (onSelectJourney) onSelectJourney();
        else onSelectTab("venue");
      },
    },
    {
      index: "05",
      code: "LEADERBOARD",
      icon: "🏆",
      testId: "landing-stub-ranking",
      title: t("landing.features.rankingTitle", "排行殿堂"),
      desc: t(
        "landing.features.rankingDesc",
        "現場演唱總榜 Top 20、專場巡演、音樂祭與高頻場館榮譽榜。"
      ),
      action: t("landing.features.rankingAction", "進入排行殿堂"),
      onClick: () => {
        if (onSelectRanking) onSelectRanking();
        else onSelectTab("song", { sortMode: "count" });
      },
    },
    {
      index: "06",
      code: "RELEASES",
      icon: "💿",
      testId: "landing-stub-releases",
      title: t("landing.features.releasesTitle", "官方發行"),
      desc: t(
        "landing.features.releasesDesc",
        "歷年現場影音 BD/DVD、特典映像與錄音室全量唱片品番索引。"
      ),
      action: t("landing.features.releasesAction", "瀏覽官方發行"),
      onClick: () => {
        if (onSelectReleases) onSelectReleases();
        else onEnterArchive();
      },
    },
  ];

  const specItems = [
    {
      key: "years",
      value: t("header.years"),
      label: t("landing.archiveSpanLabel", "收錄年份"),
    },
    {
      key: "shows",
      value: totalAllShows,
      label: t("header.publicShows"),
    },
    {
      key: "types",
      value: "8",
      label: t("header.performanceTypes"),
    },
    {
      key: "songs",
      value: allUsedSongs.length,
      label: t("header.originalSongs"),
    },
    {
      key: "venues",
      value: allVenues.length,
      label: t("header.historicVenues"),
    },
  ];

  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6 py-7 sm:py-12 flex flex-col items-center text-center animate-fade-in relative">
      {/* Top Utility Bar (Language Switcher Only — ADR-0107 / ADR-0115) */}
      <div className="w-full flex justify-end items-center gap-2 mb-6 sm:mb-8">
        <LanguageSwitcher />
      </div>

      {/* Master Admission Pass (ADR-0148) */}
      <article className="relative w-full rounded-[3px] border-[1.5px] border-ink bg-card px-4 pt-10 pb-7 sm:px-[26px] sm:pt-14 sm:pb-9 shadow-xl dark:shadow-none">
        {/* Top Serrated Washi Tape */}
        <div
          className="washi-tape pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 rotate-[1.2deg] h-[26px] w-[140px] border-x border-dashed border-ink/40"
          aria-hidden="true"
        />

        {/* Upper Stub: Brand Masthead & Monospace Spec Strip */}
        <header className="flex flex-col items-center sm:px-4">
          <div className="mb-4 sm:mb-5 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-[3px] bg-band border-[1.5px] border-ink shadow-xs">
            <img
              src="/favicon.svg"
              alt="Official髭男dism"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            />
          </div>

          <p className="m-0 mb-2.5 font-mono text-[11px] sm:text-[12px] tracking-[0.22em] text-ink font-bold uppercase">
            {t("header.livePerformanceArchive")}
          </p>

          <h1 className="m-0 max-w-full font-display text-[clamp(24px,5.2vw,44px)] font-black leading-tight tracking-tight text-ink text-balance">
            <span className="whitespace-nowrap">Official髭男dism</span>{" "}
            <span className="inline-block whitespace-nowrap font-extrabold text-band-ink bg-band/40 px-2.5 py-0.5 rounded-[3px] border border-ink/30 [box-decoration-break:clone]">
              {t("header.brandTitle")}
            </span>
          </h1>

          <p className="mt-3.5 sm:mt-4 mb-0 text-[13px] sm:text-[15px] text-muted max-w-[580px] mx-auto leading-relaxed font-sans">
            {t("header.landingSubtitle")}
          </p>

          {/* Printed Monospace Spec Strip */}
          <dl className="mt-6 sm:mt-8 mb-6 sm:mb-8 w-full max-w-[740px] grid grid-cols-2 sm:grid-cols-5 border-[1.5px] border-ink/30 rounded-[3px] bg-paper/70 divide-y sm:divide-y-0 sm:divide-x divide-ink/20 text-center">
            {specItems.map((item, idx) => (
              <div
                key={item.key}
                className={`px-3 py-3 sm:py-3.5 flex flex-col items-center justify-center ${
                  idx === 0 ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                <dt className="order-2 mt-1 font-sans text-[11px] font-semibold text-ink/80">
                  {item.label}
                </dt>
                <dd className="order-1 m-0 font-mono text-[15px] sm:text-[17px] font-black text-ink tabular-nums leading-none">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        {/* Physical Ticket Perforation Divider */}
        <div className="my-2 sm:my-3">
          <TicketPerforationDivider />
        </div>

        {/* Lower Stub: Spotlight Search + Quick Jump + Elevated Primary CTA */}
        <section
          className="w-full max-w-[660px] mx-auto pt-2 sm:pt-3 text-left"
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

          {/* Quick Jump Prompts (Dynamic Latest Tour + Iconic Landmarks + Random Ticket) */}
          <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-[12px] sm:text-[13px]">
            <span className="text-ink font-bold mr-0.5 text-xs">
              {t("landing.hotExploration", "熱門探索：")}
            </span>

            <button
              type="button"
              onClick={() => {
                if (latestTourUnit) {
                  onSelectUnit(latestTourUnit.id);
                } else {
                  onEnterArchive();
                }
              }}
              className={`${QUICK_JUMP_BTN_BASE} border-ink/35 bg-paper font-medium`}
            >
              <span aria-hidden="true">🎫</span> {latestTourLabel}
            </button>

            <button
              type="button"
              onClick={() => {
                if (taipeiShowId) {
                  onSelectUnit(taipeiShowId.unitId, taipeiShowId.showId);
                } else if (latestTourUnit) {
                  onSelectUnit(latestTourUnit.id);
                } else {
                  onEnterArchive();
                }
              }}
              className={`${QUICK_JUMP_BTN_BASE} border-ink/35 bg-paper font-medium`}
            >
              <span aria-hidden="true">📍</span>{" "}
              {t("landing.hotPrompts.taipeiShow", "台北小巨蛋專場")}
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
              className={`${QUICK_JUMP_BTN_BASE} border-ink/35 bg-paper font-medium`}
            >
              <span aria-hidden="true">🎵</span> Pretender
            </button>

            <button
              type="button"
              data-testid="landing-random-show-btn"
              onClick={handleRandomShow}
              className={`${QUICK_JUMP_BTN_BASE} border-ink/50 bg-pool-wash font-semibold`}
            >
              <span aria-hidden="true">🎲</span>{" "}
              {t("landing.hotPrompts.randomTicket", "隨機抽一張票根")}
            </button>
          </div>

          {/* Elevated Primary CTA inside Master Admission Pass */}
          <div className="mt-7 sm:mt-9 flex flex-col items-center text-center">
            <button
              type="button"
              data-testid="landing-primary-cta"
              onClick={onEnterArchive}
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 rounded-[3px] bg-band text-band-ink font-bold text-[15px] sm:text-[16px] border-[1.5px] border-ink shadow-sm dark:shadow-none hover:shadow-md hover:brightness-105 transition-all motion-reduce:transition-none cursor-pointer touch-stamp focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none"
            >
              <span>{t("landing.primaryCta", "進入完整檔案庫探索")}</span>
              <span aria-hidden="true" className="font-mono text-base font-black">
                →
              </span>
            </button>
            <p className="mt-3 mb-0 text-[12px] text-muted">
              {t(
                "landing.primaryCtaSubtitle",
                "支援場次、歌曲與場館全方位切換與雙層智能導航"
              )}
            </p>
          </div>
        </section>

        {/* Master Admission Pass Barcode Footer */}
        <div className="mt-2 sm:mt-3">
          <TicketBarcodeFooter
            serial="HGD-2012-2026-ARCHIVE"
            label="ADMIT ONE // MASTER ARCHIVE PASS"
          />
        </div>
      </article>

      {/* 6 Compact Catalog Index Stubs (3x2 Desktop / 2x3 Mobile) */}
      <section
        data-testid="landing-catalog-stubs"
        className="mt-10 sm:mt-14 w-full text-left"
        aria-label={t("landing.features.sectionAria", "六大典藏目錄索引")}
      >
        <div className="mb-4 sm:mb-5 flex items-center justify-between border-b border-ink/20 pb-2.5">
          <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-ink uppercase">
            INDEX 01—06 // {t("landing.features.sectionHeading", "典藏目錄索引")}
          </span>
          <span className="font-sans text-[11px] font-semibold text-ink/75">
            {t("landing.features.accessStubsBadge", "6 大入口")}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {catalogStubs.map((stub) => (
            <button
              key={stub.index}
              type="button"
              data-testid={stub.testId}
              onClick={stub.onClick}
              className="group relative flex flex-col justify-between rounded-[3px] border-[1.5px] border-ink bg-card p-4 sm:p-5 text-left shadow-sm dark:shadow-none hover:bg-pool-wash/40 hover:shadow-md transition-all motion-reduce:transition-none cursor-pointer touch-stamp focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-3">
                  <div className="inline-flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[11px] font-black text-band-ink bg-band/35 border border-ink/30 px-1.5 py-0.5 rounded-[3px] tabular-nums shrink-0">
                      {stub.index}
                    </span>
                    <span className="hidden sm:inline font-mono text-[10px] font-bold text-ink tracking-wider uppercase truncate">
                      {stub.code}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 shrink-0">
                    {stub.badgeCount > 0 && (
                      <span
                        data-testid="landing-ticket-book-badge"
                        className="inline-flex items-center rounded-[3px] bg-tape text-ink font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 border border-ink/40 shadow-2xs tabular-nums"
                      >
                        ✓ {stub.badgeCount}
                      </span>
                    )}
                    <span className="text-base leading-none" aria-hidden="true">
                      {stub.icon}
                    </span>
                  </div>
                </div>

                <h3 className="m-0 font-display text-[14px] sm:text-[16px] font-bold text-ink leading-snug">
                  {stub.title}
                </h3>
                <p className="mt-2 mb-0 text-[12px] sm:text-[13px] text-muted leading-relaxed">
                  {stub.desc}
                </p>
              </div>

              <div className="mt-4 sm:mt-5 pt-3 border-t border-dashed border-ink/25 flex items-center justify-between text-[11px] sm:text-[12px] font-bold text-ink">
                <span className="truncate">{stub.action}</span>
                <span
                  className="font-mono transition-transform group-hover:translate-x-1 shrink-0 ml-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Minimalist Disclaimer Footer */}
      <footer className="mt-14 sm:mt-20 pt-7 border-t border-line-soft/80 w-full text-center">
        <p className="m-0 text-[11px] sm:text-[12px] text-muted leading-relaxed font-sans">
          {t(
            "landing.footerDisclaimer",
            "Official 髭男 dism 歌迷非官方非營利演出歷史檔案庫 · 資料源自官方公告、演出現場一手記錄與 LiveFans 查證"
          )}
        </p>
        <p className="mt-2 text-[11px] sm:text-[12px] text-muted font-sans flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>
            <span>{t("footer.contactLabel", "資料勘誤與反饋：")}</span>
            <a
              href={`mailto:${ARCHIVE_FEEDBACK_EMAIL}?subject=${encodeURIComponent(t("footer.contactSubject", "[Official HIGEDAN Archive] 資料勘誤與意見反饋"))}`}
              className="text-ink underline hover:text-band-ink transition-colors"
            >
              {ARCHIVE_FEEDBACK_EMAIL}
            </a>
          </span>
          <span className="text-line-soft" aria-hidden="true">·</span>
          <span>
            <span>{t("footer.authorLabel", "作者 IG：")}</span>
            <a
              href={ARCHIVE_AUTHOR_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline hover:text-band-ink transition-colors"
            >
              @{ARCHIVE_AUTHOR_INSTAGRAM}
            </a>
          </span>
        </p>
      </footer>
    </div>
  );
}
