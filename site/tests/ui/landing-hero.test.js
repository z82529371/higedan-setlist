import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

const { React, renderToStaticMarkup } = await getReactAndRenderer();

if (!globalThis.window) {
  globalThis.window = {
    location: { hash: "", pathname: "/" },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    innerHeight: 800,
  };
}
if (!globalThis.document) {
  globalThis.document = {
    body: { style: {} },
  };
}

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

describe("LandingHero Master Admission Pass & 6 Catalog Index Stubs (ADR-0148)", () => {
  const baseProps = {
    onEnterArchive: () => {},
    onSelectSong: () => {},
    onSelectUnit: () => {},
    onSelectVenue: () => {},
    onSelectShow: () => {},
    onOpenCalendar: () => {},
    onSelectTab: () => {},
    onSelectTickets: () => {},
    onSelectRanking: () => {},
    onSelectJourney: () => {},
    onSelectReleases: () => {},
    totalAllShows: 560,
    allUsedSongs: [{ id: "pretender", title: "Pretender" }],
    allVenues: new Array(210).fill({ name: "Venue" }),
    allUnits: [
      {
        id: "arena-tour-2024-rejoice",
        title: "OFFICIAL HIGE DANDISM Arena Tour 2024 - Rejoice -",
        type: "巡演專場",
        shows: [
          {
            id: "taipei-1",
            date: "2024-12-15",
            venue: { name: "台北小巨蛋" },
            setlist: [{ songId: "pretender" }],
          },
        ],
      },
      {
        id: "asia-tour-2026",
        title: "OFFICIAL HIGE DANDISM ASIA TOUR 2026",
        type: "巡演專場",
        shows: [
          {
            id: "asia-1",
            date: "2026-08-22",
            venue: { name: "台北小巨蛋" },
            setlist: [{ songId: "pretender" }],
          },
        ],
      },
    ],
    q: "",
    setQ: () => {},
  };

  it("renders Master Admission Pass physical ticket craftsmanship with zero large SaaS rounded corners", async () => {
    const LandingHero = (await loadModule("/src/components/LandingHero.jsx")).default;
    const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(LandingHero, { ...baseProps, storage: createMemoryStorage() })
      )
    );

    // Physical ticket primitives (DESIGN.md + ADR-0148)
    assert.ok(html.includes("washi-tape"), "Master Admission Pass must include top serrated washi-tape");
    assert.ok(html.includes("SEC-PASS // VALIDATED"), "Master Admission Pass must include TicketPerforationDivider");
    assert.ok(html.includes("MASTER ARCHIVE PASS"), "Master Admission Pass must include TicketBarcodeFooter");
    assert.ok(!html.includes("rounded-2xl"), "LandingHero must NOT use forbidden SaaS rounded-2xl (DESIGN.md)");
    assert.ok(!html.includes("rounded-xl"), "LandingHero must NOT use forbidden SaaS rounded-xl (DESIGN.md)");

    // Elevated Primary CTA appears BEFORE the 6 Catalog Index Stubs
    const ctaIdx = html.indexOf('data-testid="landing-primary-cta"');
    const stubsIdx = html.indexOf('data-testid="landing-catalog-stubs"');
    assert.ok(ctaIdx > 0, "Primary CTA must render with data-testid='landing-primary-cta'");
    assert.ok(stubsIdx > 0, "Catalog Index Stubs must render with data-testid='landing-catalog-stubs'");
    assert.ok(ctaIdx < stubsIdx, "Primary CTA must be elevated inside Master Admission Pass before Catalog Index Stubs");
  });

  it("renders dynamic latest tour, random playable show button, and 6 Catalog Index Stubs without hardcoded 523", async () => {
    const LandingHero = (await loadModule("/src/components/LandingHero.jsx")).default;
    const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(LandingHero, { ...baseProps, storage: createMemoryStorage() })
      )
    );

    // Dynamic latest tour & random show button
    assert.ok(html.includes("ASIA TOUR 2026"), "Quick Jump must auto-derive latest tour label");
    assert.ok(html.includes("台北小巨蛋專場"), "Quick Jump must include Taipei Arena Show");
    assert.ok(html.includes("Pretender"), "Quick Jump must include Pretender");
    assert.ok(html.includes('data-testid="landing-random-show-btn"'), "Quick Jump must include random ticket draw button");

    // All 6 Catalog Index Stubs
    for (const testId of [
      "landing-stub-songs",
      "landing-stub-venues",
      "landing-feature-ticket-book",
      "landing-feature-journey",
      "landing-stub-ranking",
      "landing-stub-releases",
    ]) {
      assert.ok(html.includes(`data-testid="${testId}"`), `Must render Catalog Index Stub ${testId}`);
    }

    // No hardcoded stale 523 count
    assert.ok(!html.includes("523"), "Must NOT contain stale hardcoded 523 show count");
    assert.ok(html.includes("560"), "Monospace Spec Strip must show live totalAllShows");
    assert.ok(html.includes("210"), "Monospace Spec Strip must show live venue count");
  });

  it("enforces Zero Count Invariant on 03 Ticket Book stub (hidden when 0, shown when > 0)", async () => {
    const LandingHero = (await loadModule("/src/components/LandingHero.jsx")).default;
    const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
    const { recordAttendance } = await loadModule("/src/lib/ticket-book.js");

    const storage = createMemoryStorage();

    // Count === 0 -> badge must NOT render
    const htmlZero = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(LandingHero, { ...baseProps, storage })
      )
    );
    assert.ok(
      !htmlZero.includes('data-testid="landing-ticket-book-badge"'),
      "Ticket Book stub must hide count badge when attendedCount === 0 (Zero Count Invariant)"
    );

    // Count === 2 -> badge renders with bg-tape text-ink and 2
    recordAttendance("asia-1", { date: "2026-08-22" }, storage);
    recordAttendance("taipei-1", { date: "2024-12-15" }, storage);

    const htmlTwo = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(LandingHero, { ...baseProps, storage })
      )
    );
    assert.ok(
      htmlTwo.includes('data-testid="landing-ticket-book-badge"'),
      "Ticket Book stub must render count badge when attendedCount > 0"
    );
    assert.ok(htmlTwo.includes("bg-tape"), "Ticket Book badge must use high-contrast bg-tape token");
    assert.ok(htmlTwo.includes("✓ 2"), "Ticket Book badge must display attended count");
  });

  it("maintains full 4-locale parity without stale hardcoded counts across zh-TW, ja, en, ko", async () => {
    const LandingHero = (await loadModule("/src/components/LandingHero.jsx")).default;
    const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

    const checks = [
      { locale: "zh-TW", randomText: "隨機抽一張票根", rankingTitle: "排行殿堂", releasesTitle: "官方發行" },
      { locale: "ja", randomText: "ランダムで1公演", rankingTitle: "ランキング殿堂", releasesTitle: "公式リリース" },
      { locale: "en", randomText: "Random Ticket", rankingTitle: "Leaderboard Hall", releasesTitle: "Official Releases" },
      { locale: "ko", randomText: "랜덤 티켓 뽑기", rankingTitle: "랭킹 전당", releasesTitle: "공식 발매" },
    ];

    for (const { locale, randomText, rankingTitle, releasesTitle } of checks) {
      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: locale },
          React.createElement(LandingHero, { ...baseProps, storage: createMemoryStorage() })
        )
      );
      assert.ok(html.includes(randomText), `${locale} must render localized random ticket prompt (${randomText})`);
      assert.ok(html.includes(rankingTitle), `${locale} must render localized ranking stub title (${rankingTitle})`);
      assert.ok(html.includes(releasesTitle), `${locale} must render localized releases stub title (${releasesTitle})`);
      assert.ok(!html.includes("523"), `${locale} must NOT contain stale hardcoded 523`);
    }
  });
});
