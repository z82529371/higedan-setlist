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

describe("23. Tour TicketBook Dedicated Page (#/tickets) & Timeline Management (#35)", () => {
  const mockShow1 = {
    id: "1720174",
    date: "2024-11-30",
    city: "高陽",
    venue: "KINTEX Hall 5",
    region: "海外",
    prefecture: "韓國",
    title: "Official髭男dism Asia Tour 2024 - Rejoice -",
    opensAt: "17:00",
    startsAt: "19:00",
  };

  const mockShow2 = {
    id: "1720175",
    date: "2024-12-15",
    city: "台北",
    venue: "台北小巨蛋",
    region: "海外",
    prefecture: "台灣",
    title: "Official髭男dism Asia Tour 2024 - Rejoice -",
    opensAt: "18:00",
    startsAt: "19:00",
  };

  const mockShow3 = {
    id: "1672276",
    date: "2023-02-16",
    city: "東京",
    venue: "日本武道館",
    region: "日本 - 關東",
    prefecture: "東京都",
    title: "SHOCKING NUTS TOUR",
    opensAt: "17:30",
    startsAt: "18:30",
  };

  const mockTourUnit1 = {
    id: "asia-tour-2024",
    title: "Official髭男dism Asia Tour 2024 - Rejoice -",
    shortTitle: "Rejoice Asia Tour",
    type: "巡演專場",
    shows: [mockShow1, mockShow2],
  };

  const mockTourUnit2 = {
    id: "shocking-nuts-2023",
    title: "Official髭男dism SHOCKING NUTS TOUR",
    shortTitle: "SHOCKING NUTS",
    type: "巡演專場",
    shows: [mockShow3],
  };

  const mockUnitData = new Map([
    ["asia-tour-2024", { unit: mockTourUnit1, shows: [mockShow1, mockShow2], full: new Map(), isTour: true }],
    ["shocking-nuts-2023", { unit: mockTourUnit2, shows: [mockShow3], full: new Map(), isTour: true }],
  ]);

  const mockShowById = new Map([
    [mockShow1.id, mockShow1],
    [mockShow2.id, mockShow2],
    [mockShow3.id, mockShow3],
  ]);

  const mockUnitIdByShowId = new Map([
    [mockShow1.id, "asia-tour-2024"],
    [mockShow2.id, "asia-tour-2024"],
    [mockShow3.id, "shocking-nuts-2023"],
  ]);

  describe("Subtest 1: URL Hash Route State Machine (#/tickets) & Navigation Invariants", () => {
    it("parses and generates #/tickets route hashes bidirectionally with language support", async () => {
      const { parseRoute, buildRouteHash, routeHash } = await loadModule("/src/lib/routes.js");

      // 1. Parsing variations
      assert.deepStrictEqual(parseRoute("#/tickets"), { kind: "tickets", value: null });
      assert.deepStrictEqual(parseRoute("/#/tickets"), { kind: "tickets", value: null });
      assert.deepStrictEqual(parseRoute("#/tickets/"), { kind: "tickets", value: null });
      assert.deepStrictEqual(parseRoute("/tickets"), { kind: "tickets", value: null });

      // Language parameter preservation
      assert.deepStrictEqual(parseRoute("#/tickets?lang=ja"), {
        kind: "tickets",
        value: null,
        lang: "ja",
      });
      assert.deepStrictEqual(parseRoute("#/tickets?lang=en"), {
        kind: "tickets",
        value: null,
        lang: "en",
      });

      // 2. Hash generation
      assert.strictEqual(buildRouteHash("tickets"), "#/tickets");
      assert.strictEqual(buildRouteHash("tickets", null, { lang: "ja" }), "#/tickets?lang=ja");
      assert.strictEqual(buildRouteHash("tickets", null, { lang: "zh-TW" }), "#/tickets"); // zh-TW is default

      // 3. routeHash helper
      assert.strictEqual(typeof routeHash.tickets, "function");
      assert.strictEqual(routeHash.tickets(), "#/tickets");
      assert.strictEqual(routeHash.tickets({ lang: "ko" }), "#/tickets?lang=ko");
    });

    it("penetrates direct deep link for ticket-book (#/tickets) setting viewMode to 'tickets'", async () => {
      const { useArchiveRoute } = await loadModule("/src/hooks/useArchiveRoute.js");
      const { useArchiveFilter } = await loadModule("/src/hooks/useArchiveFilter.js");
      const { allUnits, buildIndex } = await loadModule("/src/lib/domain.js");
      const index = buildIndex();

      globalThis.window.location.hash = "#/tickets";
      let capturedRoute = null;

      function TestHookRunner() {
        const filterState = useArchiveFilter({
          unitData: index.unitData,
          trackShows: index.trackShows,
          globalVenueShows: index.globalVenueShows,
          allUsedSongs: index.allUsedSongs,
          allVenues: index.allVenues,
          initialUnitId: allUnits[0]?.id ?? null,
          initialSongId: index.allUsedSongs[0]?.id ?? null,
          initialVenueName: index.allVenues[0]?.name ?? null,
        });

        capturedRoute = useArchiveRoute({
          unitData: index.unitData,
          allUsedSongs: index.allUsedSongs,
          allVenues: index.allVenues,
          unitIdByShowId: index.unitIdByShowId,
          filterState,
        });

        return null;
      }

      renderToStaticMarkup(React.createElement(TestHookRunner));
      assert.ok(capturedRoute);
      assert.strictEqual(capturedRoute.viewMode, "tickets", "viewMode must be 'tickets' on #/tickets deep link");
      assert.strictEqual(typeof capturedRoute.handleSelectTickets, "function");
      assert.strictEqual(typeof capturedRoute.handleReturnArchive, "function");
    });
  });

  describe("Subtest 2: TicketBook Domain Hook (useTicketBook)", () => {
    it("provides reactive ticket-book state, attended count, attendedShows array, and atomic remove", async () => {
      const {
        useTicketBook,
        recordAttendance,
        getSafeStorage,
      } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      recordAttendance("1720174", { date: "2024-11-30" }, storage);
      recordAttendance("1720175", { date: "2024-12-15" }, storage);

      let hookResult = null;
      function TestHook() {
        hookResult = useTicketBook({ storage });
        return null;
      }

      renderToStaticMarkup(React.createElement(TestHook));
      assert.ok(hookResult);
      assert.strictEqual(hookResult.count, 2);
      assert.strictEqual(hookResult.attendedShows.length, 2);
      assert.strictEqual(typeof hookResult.remove, "function");

      // Test remove
      hookResult.remove("1720174");
      const checkPayload = JSON.parse(storage.getItem("hg_ticket_book_v1"));
      assert.strictEqual(Boolean(checkPayload.attendedShows["1720174"]), false);
      assert.strictEqual(Boolean(checkPayload.attendedShows["1720175"]), true);

      storage.clear();
    });
  });

  describe("Subtest 3: TicketBook Empty State & Exploration Flow", () => {
    it("renders ticket-aesthetic Empty State with exploration CTA when 0 shows are attended", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookPage } = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
      const { getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      let returnArchiveCalled = false;

      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            storage,
            onReturnArchive: () => {
              returnArchiveCalled = true;
            },
          })
        )
      );

      assert.ok(htmlZh.includes('data-testid="ticket-book-empty-state"'), "Must render ticket-book-empty-state");
      assert.ok(htmlZh.includes("尚未收藏任何參戰票根"), "Must display empty title");
      assert.ok(htmlZh.includes("開始探索演出場次"), "Must display explore CTA button");
      assert.ok(htmlZh.includes('data-testid="ticket-book-explore-cta"'), "Must render ticket-book-explore-cta button");
    });
  });

  describe("Subtest 4: Timeline List Presentation, Badges & Show Details", () => {
    it("renders attended shows timeline in reverse chronological order with tickets, venues, and actions", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookPage } = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      // Record 3 shows across 2023 and 2024
      recordAttendance(
        mockShow1.id,
        {
          date: mockShow1.date,
          seat: "Arena A 12",
          notes: "Amazing performance in Korea!",
        },
        storage
      );
      recordAttendance(mockShow2.id, { date: mockShow2.date }, storage);
      recordAttendance(mockShow3.id, { date: mockShow3.date }, storage);

      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            storage,
          })
        )
      );

      // Verify header summary badge
      assert.ok(htmlZh.includes('data-testid="ticket-book-total-badge"'), "Must render ticket-book-total-badge");
      assert.ok(htmlZh.includes("累計參戰 3 場"), "Must display total count of 3 shows");

      // Verify timeline items rendered
      assert.ok(htmlZh.includes(`data-testid="timeline-item-${mockShow1.id}"`));
      assert.ok(htmlZh.includes(`data-testid="timeline-item-${mockShow2.id}"`));
      assert.ok(htmlZh.includes(`data-testid="timeline-item-${mockShow3.id}"`));

      // Verify venue and city formatting
      assert.ok(htmlZh.includes("台北小巨蛋"));
      assert.ok(htmlZh.includes("KINTEX Hall 5"));
      assert.ok(htmlZh.includes("日本武道館"));

      // Verify seat and notes presentation
      assert.ok(htmlZh.includes("Arena A 12"));
      assert.ok(htmlZh.includes("Amazing performance in Korea!"));

      // Verify action buttons: Jump to Ticket and Remove Check-in co-located in top header, plus in-place memorial export in bottom action row (Issue #43)
      assert.ok(htmlZh.includes(`data-testid="view-ticket-btn-${mockShow1.id}"`));
      assert.ok(htmlZh.includes(`data-testid="remove-btn-${mockShow1.id}"`));
      assert.ok(htmlZh.includes(`data-testid="export-memorial-btn-${mockShow1.id}"`));
      assert.ok(htmlZh.includes("儲存紀念票根"));
      assert.ok(!htmlZh.includes("mt-3 pt-2.5 border-t border-line-soft flex items-center justify-end"), "Redundant bottom action row must be removed");

      // Check reverse chronological order: mockShow2 (2024-12-15) must appear before mockShow1 (2024-11-30), which is before mockShow3 (2023-02-16)
      const idx2 = htmlZh.indexOf(`data-testid="timeline-item-${mockShow2.id}"`);
      const idx1 = htmlZh.indexOf(`data-testid="timeline-item-${mockShow1.id}"`);
      const idx3 = htmlZh.indexOf(`data-testid="timeline-item-${mockShow3.id}"`);
      assert.ok(idx2 < idx1 && idx1 < idx3, "Timeline must be ordered reverse-chronologically (newest first)");

      storage.clear();
    });
  });

  describe("Subtest 5: Year & Tour Keyword Filtering", () => {
    it("filters timeline by year and tour/venue keywords", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookPage } = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      recordAttendance(mockShow1.id, { date: mockShow1.date }, storage);
      recordAttendance(mockShow2.id, { date: mockShow2.date }, storage);
      recordAttendance(mockShow3.id, { date: mockShow3.date }, storage);

      // 1. Initial render has year selector with 2024, 2023, and all
      const htmlInitial = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            storage,
          })
        )
      );
      assert.ok(htmlInitial.includes('data-testid="ticket-book-year-filter"'));
      assert.ok(htmlInitial.includes('data-testid="ticket-book-search-input"'));

      // 2. Filter by Year 2023 only
      const html2023 = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            storage,
            initialYear: "2023",
          })
        )
      );
      assert.ok(html2023.includes(`data-testid="timeline-item-${mockShow3.id}"`));
      assert.ok(!html2023.includes(`data-testid="timeline-item-${mockShow1.id}"`));
      assert.ok(!html2023.includes(`data-testid="timeline-item-${mockShow2.id}"`));

      // 3. Filter by Keyword "台北"
      const htmlTaipei = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            storage,
            initialKeyword: "台北",
          })
        )
      );
      assert.ok(htmlTaipei.includes(`data-testid="timeline-item-${mockShow2.id}"`));
      assert.ok(!htmlTaipei.includes(`data-testid="timeline-item-${mockShow1.id}"`));
      assert.ok(!htmlTaipei.includes(`data-testid="timeline-item-${mockShow3.id}"`));

      // 4. Keyword with zero matches renders filter-empty message
      const htmlNoMatch = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            storage,
            initialKeyword: "NonExistentVenueName999",
          })
        )
      );
      assert.ok(htmlNoMatch.includes('data-testid="ticket-book-no-match"'));
      assert.ok(htmlNoMatch.includes("無符合條件的參戰場次"));

      storage.clear();
    });
  });

  describe("Subtest 6: Global Header, Mobile Floating Controls & Status Bar TicketBook Entrances with Dynamic Badge", () => {
    it("renders TicketBook entrance with attended count badge only when count > 0, and hides it from LandingHero", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ArchiveHeader } = await loadModule("/src/components/layout/ArchiveHeader.jsx");
      const { FilterDrawer } = await loadModule("/src/components/layout/FilterDrawer.jsx");
      const { ArchiveStatusBar } = await loadModule("/src/components/layout/ArchiveStatusBar.jsx");
      const { MobileFloatingControls } = await loadModule("/src/components/layout/MobileFloatingControls.jsx");
      const LandingHero = (await loadModule("/src/components/LandingHero.jsx")).default;
      const { TicketBookPage } = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      // Zero-count checks (when count === 0, badges must NOT render)
      const zeroHeader = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ArchiveHeader, {
            totalAllShows: 100,
            allUsedSongs: [],
            allVenues: [],
            categoriesCount: 8,
            tab: "show",
            setTab: () => {},
            setQ: () => {},
            setIsFilterDrawerOpen: () => {},
            storage,
          })
        )
      );
      assert.ok(!zeroHeader.includes('data-testid="header-ticket-book-btn"'), "ArchiveHeader must NOT render ticket button beside LanguageSwitcher");

      const zeroStatusBar = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ArchiveStatusBar, {
            tab: "show",
            handleSelectTickets: () => {},
            handleReturnHome: () => {},
            slipRef: { current: null },
            storage,
          })
        )
      );
      assert.ok(zeroStatusBar.includes('data-testid="status-bar-ticket-book-btn"'), "ArchiveStatusBar renders ticket button");
      assert.ok(!zeroStatusBar.includes('data-testid="status-bar-ticket-badge-count"'), "ArchiveStatusBar must NOT render badge when count is 0");

      const zeroMobileFab = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(MobileFloatingControls, {
            tab: "show",
            onOpenSearch: () => {},
            onOpenDrawer: () => {},
            onReturnHome: () => {},
            onSelectTickets: () => {},
            storage,
          })
        )
      );
      assert.ok(zeroMobileFab.includes('data-testid="mobile-ticket-book-fab"'), "MobileFloatingControls renders mobile-ticket-book-fab");
      assert.ok(!zeroMobileFab.includes('data-testid="mobile-ticket-badge-count"'), "MobileFloatingControls must NOT render badge when count is 0");

      // Verify LandingHero does NOT render ticket book button
      const heroHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(LandingHero, {
            onEnterArchive: () => {},
            onSelectSong: () => {},
            onSelectUnit: () => {},
            onSelectVenue: () => {},
            onSelectShow: () => {},
            onOpenCalendar: () => {},
            onSelectTab: () => {},
            totalAllShows: 100,
            allUsedSongs: [],
            allVenues: [],
            allUnits: [],
            q: "",
            setQ: () => {},
          })
        )
      );
      assert.ok(!heroHtml.includes('data-testid="landing-ticket-book-btn"'), "LandingHero must NOT render ticket book button");
      assert.ok(heroHtml.includes('data-testid="landing-feature-ticket-book"'), "LandingHero must render feature card for ticket book");
      assert.ok(heroHtml.includes("個人巡演票夾"), "LandingHero feature card must show ticket book title");
      assert.ok(heroHtml.includes("開啟我的巡演票夾"), "LandingHero feature card must show ticket book CTA");

      // Now add 1 attendance record
      recordAttendance(mockShow1.id, { date: mockShow1.date }, storage);

      // 1. ArchiveHeader (count > 0 renders badge)
      const htmlHeader = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ArchiveHeader, {
            totalAllShows: 100,
            allUsedSongs: [],
            allVenues: [],
            categoriesCount: 8,
            tab: "show",
            setTab: () => {},
            setQ: () => {},
            setIsFilterDrawerOpen: () => {},
            storage,
          })
        )
      );
      assert.ok(!htmlHeader.includes('data-testid="header-ticket-book-btn"'), "ArchiveHeader must NOT render ticket button beside LanguageSwitcher");

      // 2. ArchiveStatusBar (count > 0 renders badge next to home)
      const htmlStatusBar = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ArchiveStatusBar, {
            tab: "show",
            handleSelectTickets: () => {},
            handleReturnHome: () => {},
            slipRef: { current: null },
            storage,
          })
        )
      );
      assert.ok(htmlStatusBar.includes('data-testid="status-bar-ticket-badge-count"'), "ArchiveStatusBar must render badge count when count > 0");

      // 3. MobileFloatingControls (count > 0 renders badge)
      const htmlMobileFab = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(MobileFloatingControls, {
            tab: "show",
            onOpenSearch: () => {},
            onOpenDrawer: () => {},
            onReturnHome: () => {},
            onSelectTickets: () => {},
            storage,
          })
        )
      );
      assert.ok(htmlMobileFab.includes('data-testid="mobile-ticket-badge-count"'), "MobileFloatingControls must render mobile-ticket-badge-count when count > 0");
      assert.ok(htmlMobileFab.includes(">1<"), "Mobile badge count must display 1");

      // 4. FilterDrawer
      const htmlDrawer = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(FilterDrawer, {
            isOpen: true,
            tab: "show",
            onClose: () => {},
            onCommit: () => {},
            confirmButtonLabel: "套用",
            renderShowNavigator: () => null,
            renderSongNavigator: () => null,
            renderVenueNavigator: () => null,
            storage,
          })
        )
      );
      assert.ok(htmlDrawer.includes('data-testid="drawer-ticket-book-btn"'), "FilterDrawer must render ticket-book button");
      assert.ok(htmlDrawer.includes('data-testid="drawer-ticket-badge-count"'), "FilterDrawer must render drawer badge count");
      assert.ok(htmlDrawer.includes(">1<"), "Drawer badge count must display 1");

      // 5. TicketBookPage emoji audit & mobile floating docks
      const htmlPage = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: new Map(),
            showById: new Map(),
            unitIdByShowId: new Map(),
            allUsedSongs: [],
            onReturnArchive: () => {},
            onReturnHome: () => {},
            storage,
          })
        )
      );
      assert.ok(htmlPage.includes("🎟️"), "TicketBookPage must use 🎟️ emoji");
      assert.ok(!htmlPage.includes("🛂"), "TicketBookPage must NOT contain legacy 🛂 emoji");
      assert.ok(!htmlPage.includes("護照"), "TicketBookPage must NOT contain legacy 護照 keyword");
      assert.ok(htmlPage.includes('data-testid="mobile-ticket-back-archive-fab"'), "TicketBookPage must render mobile back-archive FAB");
      assert.ok(htmlPage.includes('data-testid="mobile-ticket-back-home-fab"'), "TicketBookPage must render mobile back-home FAB");
      assert.ok(htmlPage.includes('data-testid="mobile-ticket-back-top-fab"'), "TicketBookPage must render mobile back-top FAB");
      assert.ok(htmlPage.includes("hidden sm:flex"), "TicketBookPage top utility bar must be hidden on mobile");

      storage.clear();
    });
  });

  describe("Subtest 7: Quick Check-in in TourSlip Itinerary and ShowNavigator Attended Badges", () => {
    it("renders quick attend button in TourSlip and dynamic attended badge in ShowNavigator without opening details", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TourSlip } = await loadModule("/src/components/slips/TourSlip.jsx");
      const { ShowNavigator } = await loadModule("/src/components/navigators/ShowNavigator.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      const mockTourData = {
        unit: mockTourUnit1,
        shows: [mockShow1, mockShow2],
        full: new Map([
          [mockShow1.id, [{ songId: "pretender", title: "Pretender" }]],
          [mockShow2.id, [{ songId: "pretender", title: "Pretender" }]],
        ]),
        isTour: true,
      };

      // 1. TourSlip before attendance: shows must have un-attended quick check-in buttons
      const htmlTourUnattended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TourSlip, {
            tourUnitData: mockTourUnit1,
            ud: mockTourData,
            storage,
          })
        )
      );
      assert.ok(htmlTourUnattended.includes(`data-testid="tour-stop-attend-btn-${mockShow1.id}"`), "TourSlip must render quick attend button for show 1");
      assert.ok(htmlTourUnattended.includes(`data-testid="tour-stop-attend-btn-${mockShow2.id}"`), "TourSlip must render quick attend button for show 2");
      assert.ok(htmlTourUnattended.includes("收進票夾"), "Quick attend button shows '收進票夾' when un-attended");

      // 2. ShowNavigator before attendance: no attended checkmark badges
      const htmlNavUnattended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowNavigator, {
            unitData: mockUnitData,
            current: mockTourData,
            selUnitId: "asia-tour-2024",
            selCategory: "巡演專場",
            unitsByCategory: { "巡演專場": [mockTourUnit1] },
            categoryStats: { "巡演專場": { units: 1, shows: 2 } },
            availableYears: ["2024"],
            filteredUnits: [mockTourUnit1],
            pagedUnits: [mockTourUnit1],
            storage,
          })
        )
      );
      assert.ok(!htmlNavUnattended.includes(`data-testid="show-nav-attended-badge-${mockShow1.id}"`), "ShowNavigator must NOT have badge for show 1 before check-in");

      // Now record attendance for show 1 only
      recordAttendance(mockShow1.id, { date: mockShow1.date }, storage);

      // 3. TourSlip after check-in: show 1 has attended checkmark; show 2 remains un-attended
      const htmlTourAttended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TourSlip, {
            tourUnitData: mockTourUnit1,
            ud: mockTourData,
            storage,
          })
        )
      );
      assert.ok(htmlTourAttended.includes("已收進票夾"), "Quick attend button shows '已收進票夾' after check-in");
      assert.ok(htmlTourAttended.includes("bg-tape"), "Quick attend button uses bg-tape when attended");

      // 4. ShowNavigator after check-in: show 1 has checkmark badge; show 2 does not
      const htmlNavAttended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowNavigator, {
            unitData: mockUnitData,
            current: mockTourData,
            selUnitId: "asia-tour-2024",
            selCategory: "巡演專場",
            unitsByCategory: { "巡演專場": [mockTourUnit1] },
            categoryStats: { "巡演專場": { units: 1, shows: 2 } },
            availableYears: ["2024"],
            filteredUnits: [mockTourUnit1],
            pagedUnits: [mockTourUnit1],
            storage,
          })
        )
      );
      assert.ok(htmlNavAttended.includes(`data-testid="show-nav-attended-badge-${mockShow1.id}"`), "ShowNavigator must render attended badge for show 1");
      assert.ok(!htmlNavAttended.includes(`data-testid="show-nav-attended-badge-${mockShow2.id}"`), "ShowNavigator must NOT render attended badge for un-attended show 2");

      storage.clear();
    });
  });

  describe("Subtest 8: Ticket Book Dual-Track Backup & Transfer UI (#38 / #42)", () => {
    it("renders backup and transfer trigger button in TicketBookPage header and mobile docks", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookPage } = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
      const { getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            storage,
          })
        )
      );

      assert.ok(
        htmlZh.includes('data-testid="ticket-book-backup-trigger"'),
        "Must render ticket-book-backup-trigger button in desktop top bar"
      );
      assert.ok(
        htmlZh.includes("備份與轉移紀錄"),
        "Must display consumer-friendly title on transfer button"
      );
    });

    it("renders TicketBookTransferModal with dual-track controls and strictly zero developer jargon", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookTransferModal } = await loadModule(
        "/src/components/ticket-book/TicketBookTransferModal.jsx"
      );
      const { getSafeStorage, recordAttendance } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();
      recordAttendance(mockShow1.id, { seat: "Arena A" }, storage);

      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookTransferModal, {
            isOpen: true,
            onClose: () => {},
            storage,
            knownShowKeys: [mockShow1.id, mockShow2.id],
          })
        )
      );

      // Verify modal elements
      assert.ok(html.includes('data-testid="ticket-book-transfer-modal"'));
      assert.ok(html.includes('data-testid="transfer-download-backup"'));
      assert.ok(html.includes('data-testid="transfer-file-input"'));
      assert.ok(html.includes('data-testid="transfer-copy-code"'));
      assert.ok(html.includes('data-testid="transfer-code-input"'));

      // Consumer-friendly verification: Prohibit developer jargon
      assert.ok(!html.includes("JSON"), "Must NOT contain developer jargon 'JSON'");
      assert.ok(!html.includes("Payload"), "Must NOT contain developer jargon 'Payload'");
      assert.ok(!html.includes("LocalStorage"), "Must NOT contain developer jargon 'LocalStorage'");
      assert.ok(!html.includes("Database"), "Must NOT contain developer jargon 'Database'");
      assert.ok(!html.includes("Schema"), "Must NOT contain developer jargon 'Schema'");

      // Verify multi-lingual rendering across all 4 locales
      const locales = ["ja", "en", "ko", "zh-TW"];
      for (const loc of locales) {
        const locHtml = renderToStaticMarkup(
          React.createElement(
            I18nProvider,
            { initialLocale: loc },
            React.createElement(TicketBookTransferModal, {
              isOpen: true,
              onClose: () => {},
              storage,
              knownShowKeys: [mockShow1.id, mockShow2.id],
            })
          )
        );
        assert.ok(locHtml.includes('data-testid="ticket-book-transfer-modal"'));
      }
    });

    it("renders diff preview with merge and overwrite actions when valid incoming backup is provided", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookTransferModal } = await loadModule(
        "/src/components/ticket-book/TicketBookTransferModal.jsx"
      );
      const { getSafeStorage, recordAttendance } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();
      recordAttendance(mockShow1.id, { seat: "Arena A" }, storage);

      const previewDiff = {
        newShowsCount: 2,
        updatedShowsCount: 1,
        totalIncomingShows: 3,
      };

      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookTransferModal, {
            isOpen: true,
            onClose: () => {},
            storage,
            knownShowKeys: [mockShow1.id, mockShow2.id],
            initialDiff: previewDiff,
          })
        )
      );

      assert.ok(html.includes('data-testid="transfer-diff-preview"'));
      assert.ok(html.includes('data-testid="transfer-confirm-merge"'));
      assert.ok(html.includes('data-testid="transfer-confirm-overwrite"'));
      assert.ok(html.includes("2"));
      assert.ok(html.includes("1"));
    });
  });

  describe("Subtest 9: In-place Memorial Card Modal Export Flow (#43)", () => {
    it("renders export button on each timeline card and opens MemorialCardModal seamlessly in-place", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookPage } = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      // Pre-record attendance with seat, notes, and custom stamp preference
      recordAttendance(
        mockShow1.id,
        {
          date: mockShow1.date,
          seat: "Arena A 12",
          notes: "Unforgettable night at KINTEX!",
          stampId: "stamp-rejoice",
          includeSeat: true,
          includeNotes: true,
        },
        storage
      );

      // 1. Initial render without open modal (initialMemorialShowId: null)
      const htmlClosed = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            storage,
            initialMemorialShowId: null,
          })
        )
      );

      // Verify the in-place export button is rendered on the timeline card
      assert.ok(
        htmlClosed.includes(`data-testid="export-memorial-btn-${mockShow1.id}"`),
        "Timeline card must render export-memorial-btn"
      );
      assert.ok(htmlClosed.includes("🎨"), "Button must contain palette icon");
      assert.ok(htmlClosed.includes("儲存紀念票根"), "Button must display localized label");
      // Memorial card modal must NOT be rendered when closed
      assert.ok(
        !htmlClosed.includes('data-testid="memorial-card-modal"'),
        "Memorial card modal must not be rendered when initialMemorialShowId is null"
      );

      // 2. Open modal in-place for mockShow1 (initialMemorialShowId: mockShow1.id)
      const htmlOpen = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            storage,
            initialMemorialShowId: mockShow1.id,
            initialMemorialImageUrl: "data:image/png;base64,mockPngData",
          })
        )
      );

      // Verify MemorialCardModal is rendered right inside TicketBookPage without route redirection
      assert.ok(
        htmlOpen.includes('data-testid="memorial-card-modal"'),
        "Memorial card modal must be mounted inside TicketBookPage"
      );
      assert.ok(htmlOpen.includes("KINTEX Hall 5"), "Modal preview must reflect show venue");
      assert.ok(htmlOpen.includes("2024-11-30"), "Modal preview must reflect show date");
      assert.ok(htmlOpen.includes("Arena A 12"), "Modal preview must reflect custom seat");
      assert.ok(htmlOpen.includes("Unforgettable night at KINTEX!"), "Modal preview must reflect custom notes");
      assert.ok(
        htmlOpen.includes('data-testid="ticket-stamp"'),
        "Modal preview must reflect commemorative stamp"
      );
      assert.ok(
        htmlOpen.includes('data-stamp-id="default"'),
        "Modal preview must reflect canonical default stamp id"
      );
      assert.ok(
        htmlOpen.includes("現場") || htmlOpen.includes("LIVE"),
        "Modal preview must reflect authentic live stamp text"
      );
      assert.ok(
        htmlOpen.includes('data-testid="memorial-download-btn"'),
        "Modal must provide PNG export trigger button"
      );
      assert.ok(
        htmlOpen.includes("higedan-memorial-1720174"),
        "Download button must provide show-specific filename"
      );

      // 3. Multi-lingual consistency across all 4 locales (zh-TW, ja, en, ko)
      const localeSpecs = [
        { loc: "zh-TW", label: "儲存紀念票根", title: "預覽並儲存本場次的紀念票根" },
        { loc: "ja", label: "記念チケットを保存", title: "この公演の記念チケットをプレビューして保存" },
        { loc: "en", label: "Save Memorial Ticket", title: "Preview and save commemorative ticket for this show" },
        { loc: "ko", label: "기념 티켓 저장", title: "이 공연의 기념 티켓 미리보기 및 저장" },
      ];

      for (const { loc, label, title } of localeSpecs) {
        const locHtml = renderToStaticMarkup(
          React.createElement(
            I18nProvider,
            { initialLocale: loc },
            React.createElement(TicketBookPage, {
              unitData: mockUnitData,
              showById: mockShowById,
              unitIdByShowId: mockUnitIdByShowId,
              storage,
              initialMemorialShowId: mockShow1.id,
            })
          )
        );
        assert.ok(
          locHtml.includes(`data-testid="export-memorial-btn-${mockShow1.id}"`),
          `Must render export button in ${loc}`
        );
        assert.ok(locHtml.includes(label), `Must render localized button label in ${loc}`);
        assert.ok(locHtml.includes(title), `Must render localized button title attribute in ${loc}`);
        assert.ok(
          locHtml.includes('data-testid="memorial-card-modal"'),
          `Must render MemorialCardModal in ${loc}`
        );
      }

      storage.clear();
    });
  });
});
