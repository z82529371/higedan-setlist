import { useMemo, useState } from "react";
import SearchBox from "./SearchBox.jsx";
import InteractiveFoilTicket from "./landing/InteractiveFoilTicket.jsx";
import { useI18n } from "../lib/i18n.jsx";
import { useTicketBook } from "../lib/ticket-book.js";
import { isValidEraTheme } from "../lib/tour-theme.js";
import {
  findLatestTourUnit,
  formatLatestTourPromptLabel,
  buildFeaturedTicketDeck,
} from "../lib/landing.js";
import {
  ARCHIVE_FEEDBACK_EMAIL,
  ARCHIVE_AUTHOR_INSTAGRAM,
  ARCHIVE_AUTHOR_INSTAGRAM_URL,
} from "../lib/feedback.js";

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

  const songTitleMap = useMemo(() => {
    const map = {};
    for (const s of allUsedSongs) {
      if (s?.id && s?.title) map[s.id] = s.title;
    }
    return map;
  }, [allUsedSongs]);

  const ticketDeck = useMemo(
    () => buildFeaturedTicketDeck(allUnits, songTitleMap),
    [allUnits, songTitleMap]
  );

  const [deckIndex, setDeckIndex] = useState(0);
  const activeCard =
    ticketDeck.length > 0 ? ticketDeck[deckIndex % ticketDeck.length] : null;

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement?.getAttribute("data-theme") === "dark";

  const eraStyle = useMemo(() => {
    const theme = activeCard?.theme;
    if (!isValidEraTheme(theme)) return undefined;
    return {
      "--era-accent": isDark ? theme.dark : theme.light,
      "--era-accent-ink": isDark ? theme.darkInk : theme.lightInk,
    };
  }, [activeCard, isDark]);

  const handleNextTicket = () => {
    if (ticketDeck.length <= 1) return;
    setDeckIndex((prev) => (prev + 1) % ticketDeck.length);
  };

  const handleOpenCardShow = (card) => {
    if (!card?.showId) {
      onEnterArchive();
      return;
    }
    if (onSelectShow) {
      onSelectShow(card.showId);
    } else if (onSelectUnit) {
      onSelectUnit(card.unitId, card.showId);
    }
  };

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

  const catalogStubs = [
    {
      index: "01",
      code: "BI-DIRECTIONAL",
      iconType: "songs",
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
      iconType: "venues",
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
      iconType: "tickets",
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
      iconType: "journey",
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
      iconType: "ranking",
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
      iconType: "releases",
      testId: "landing-stub-releases",
      title: t("landing.features.releasesTitle", "官方發行"),
      desc: t(
        "landing.features.releasesDesc",
        "歷年現場影音 BD/DVD、特典映像與錄音室完整唱片品番索引。"
      ),
      action: t("landing.features.releasesAction", "瀏覽官方發行"),
      onClick: () => {
        if (onSelectReleases) onSelectReleases();
        else onEnterArchive();
      },
    },
  ];

  const inlineMetrics = [
    { key: "shows", value: totalAllShows, label: t("header.publicShows"), onClick: onEnterArchive },
    { key: "types", value: "8", label: t("header.performanceTypes"), onClick: onEnterArchive },
    { key: "songs", value: allUsedSongs.length, label: t("header.originalSongs"), onClick: () => onSelectTab("song") },
    { key: "venues", value: allVenues.length, label: t("header.historicVenues"), onClick: () => onSelectTab("venue", { sortMode: "map" }) },
  ];

  return (
    <div
      style={eraStyle}
      className="mx-auto max-w-[960px] px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center animate-fade-in relative"
    >
      {/* Asymmetric Split Hero Stage: Clean Search & Masthead (Left) + Floating 3D Foil Ticket (Right) */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-12 items-center">
        {/* Left: Pure Editorial Masthead + Spotlight Search + Primary CTA */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="mb-4 inline-flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-[3px] bg-band border-[1.5px] border-ink shadow-xs shrink-0">
              <img
                src="/favicon.svg"
                alt="Official髭男dism"
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.22em] text-ink/75 font-bold uppercase leading-tight">
                UNOFFICIAL FAN ARCHIVE
              </span>
              <span className="mt-0.5 font-mono text-[11px] font-bold text-ink/60 tabular-nums">
                {t("header.years")}
              </span>
            </div>
          </div>

          <h1 className="m-0 max-w-full font-display text-ink text-balance">
            <span className="block text-[clamp(32px,5.4vw,48px)] font-black leading-[1.08] tracking-[0.05em]">
              Official髭男dism
            </span>
            <span className="mt-3 inline-flex items-center gap-3 font-mono text-[clamp(16px,2.4vw,22px)] font-bold leading-none tracking-[0.28em] uppercase text-ink/85">
              <span
                aria-hidden="true"
                className="inline-block w-7 sm:w-9 h-[3px] rounded-full transition-colors duration-300 shrink-0"
                style={{ backgroundColor: "var(--era-accent, var(--color-band))" }}
              />
              <span>LIVE ARCHIVE</span>
            </span>
          </h1>

          <p className="mt-3.5 mb-0 text-[13px] sm:text-[15px] text-muted max-w-[460px] leading-relaxed font-sans">
            {t("header.landingSubtitle")}
          </p>

          {/* Spotlight Search Box */}
          <div
            className="w-full max-w-[500px] mt-6 text-left"
            aria-label={t("landing.instantSearchAria", "即時檢索")}
          >
            <SearchBox
              q={q}
              setQ={setQ}
              allUsedSongs={allUsedSongs}
              allUnits={allUnits}
              allVenues={allVenues}
              size="lg"
              onSelectSong={(sId) => onSelectSong(sId)}
              onSelectUnit={(uId) => onSelectUnit(uId)}
              onSelectVenue={(vName) => onSelectVenue(vName)}
              onSelectShow={(shId) => {
                if (onSelectShow) onSelectShow(shId);
              }}
              onOpenCalendar={onOpenCalendar}
            />

            {/* Minimal Quick Jump Row */}
            <div className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-x-2.5 gap-y-1.5 text-[12px]">
              <span className="text-ink/65 font-semibold text-[11px]">
                {t("landing.hotExploration", "熱門探索：")}
              </span>
              <button
                type="button"
                onClick={() => (latestTourUnit ? onSelectUnit(latestTourUnit.id) : onEnterArchive())}
                className="text-ink/85 hover:text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-ink font-medium cursor-pointer transition-colors"
              >
                {latestTourLabel}
              </button>
              <span className="text-ink/25" aria-hidden="true">/</span>
              <button
                type="button"
                onClick={() => {
                  if (taipeiShowId) onSelectUnit(taipeiShowId.unitId, taipeiShowId.showId);
                  else if (latestTourUnit) onSelectUnit(latestTourUnit.id);
                  else onEnterArchive();
                }}
                className="text-ink/85 hover:text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-ink font-medium cursor-pointer transition-colors"
              >
                {t("landing.hotPrompts.taipeiShow", "台北小巨蛋專場")}
              </button>
              <span className="text-ink/25" aria-hidden="true">/</span>
              <button
                type="button"
                onClick={() => (pretenderSong ? onSelectSong(pretenderSong.id) : onSelectTab("song"))}
                className="text-ink/85 hover:text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-ink font-medium cursor-pointer transition-colors"
              >
                Pretender
              </button>
              <span className="text-ink/25" aria-hidden="true">/</span>
              <button
                type="button"
                onClick={handleNextTicket}
                className="text-ink font-semibold underline underline-offset-4 decoration-ink/40 hover:decoration-ink cursor-pointer transition-colors"
              >
                {t("landing.hotPrompts.randomTicket", "隨機抽一張票根")}
              </button>
            </div>
          </div>

          {/* Primary CTA (Era-Synced with Active 3D Ticket) */}
          <div className="mt-6 w-full sm:w-auto flex items-center justify-center lg:justify-start">
            <button
              type="button"
              data-testid="landing-primary-cta"
              onClick={onEnterArchive}
              style={{
                backgroundColor: "var(--era-accent, var(--color-band))",
                color: "var(--era-accent-ink, var(--color-band-ink))",
              }}
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3 rounded-[3px] font-bold text-[15px] border-[1.5px] border-ink shadow-[4px_4px_0_rgba(0,0,0,0.18)] dark:shadow-none hover:brightness-105 transition-colors duration-200 motion-reduce:transition-none cursor-pointer touch-stamp focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none"
            >
              <span>{t("landing.primaryCta", "進入完整檔案庫探索")}</span>
              <span aria-hidden="true" className="font-mono font-black">
                →
              </span>
            </button>
          </div>

          {/* Single-Line Clean Interactive Archive Metrics */}
          <div className="mt-6 pt-4 border-t border-ink/15 w-full flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 text-[12px] text-ink/80">
            {inlineMetrics.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={m.onClick}
                className="inline-flex items-baseline gap-1 hover:text-ink cursor-pointer transition-colors group"
              >
                <span className="font-mono text-[14px] font-black text-ink tabular-nums group-hover:underline">
                  {m.value}
                </span>
                <span className="font-sans text-[11px] font-medium text-ink/75 group-hover:text-ink">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Independent Floating 3D Foil-Sheen Collectible Live Ticket */}
        <div className="w-full pt-2 lg:pt-0">
          <InteractiveFoilTicket
            card={activeCard}
            cardIndex={deckIndex % Math.max(1, ticketDeck.length)}
            deckLength={ticketDeck.length}
            onNextCard={handleNextTicket}
            onOpenShow={handleOpenCardShow}
          />
        </div>
      </section>

      {/* 6 Archival Index Ledger Rows (replaces Bento Feature Card Grid) */}
      <section
        data-testid="landing-catalog-stubs"
        className="mt-14 sm:mt-16 w-full text-left"
        aria-label={t("landing.features.sectionAria", "六大典藏目錄索引")}
      >
        <div className="mb-0 flex items-center justify-between border-b-[1.5px] border-ink pb-2">
          <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-ink uppercase">
            INDEX 01—06 // {t("landing.features.sectionHeading", "典藏目錄索引")}
          </span>
          <span className="font-mono text-[11px] font-semibold text-ink/60">
            {t("landing.features.accessStubsBadge", "6 大入口")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-x border-b border-ink/25 bg-card divide-y divide-ink/15 md:divide-y-0">
          {catalogStubs.map((stub, idx) => (
            <button
              key={stub.index}
              type="button"
              data-testid={stub.testId}
              onClick={stub.onClick}
              className={`group relative flex items-baseline justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-tape-tint/50 cursor-pointer touch-stamp focus-visible:ring-2 focus-visible:ring-band focus-visible:outline-none ${
                idx % 2 === 0 ? "md:border-r md:border-ink/15" : ""
              } ${idx >= 2 ? "md:border-t md:border-ink/15" : ""}`}
            >
              <div className="flex items-baseline gap-3 min-w-0 flex-1">
                <span className="font-mono text-[11px] font-black text-ink/55 tabular-nums shrink-0 group-hover:text-ink">
                  {stub.index}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="m-0 font-display text-[15px] font-bold text-ink leading-snug group-hover:underline underline-offset-4">
                      {stub.title}
                    </h3>
                    {stub.badgeCount > 0 && (
                      <span
                        data-testid="landing-ticket-book-badge"
                        className="inline-flex items-center rounded-[2px] bg-tape text-ink font-mono text-[10px] font-bold px-1.5 py-0.5 border border-ink/40 tabular-nums shrink-0"
                      >
                        ✓ {stub.badgeCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 mb-0 text-[12px] text-muted leading-snug line-clamp-1">
                    {stub.desc}
                  </p>
                </div>
              </div>

              <span
                className="font-mono text-[12px] font-bold text-ink/60 group-hover:text-ink shrink-0"
                aria-hidden="true"
              >
                →
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Minimalist Disclaimer Footer */}
      <footer className="mt-14 sm:mt-20 pt-6 border-t border-line-soft/80 w-full text-center">
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
