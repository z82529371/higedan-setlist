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
    ["asia-tour-2024", { unit: mockTourUnit1, full: new Map(), isTour: true }],
    ["shocking-nuts-2023", { unit: mockTourUnit2, full: new Map(), isTour: true }],
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

      // Verify action buttons: Jump to Ticket and Remove Check-in
      assert.ok(htmlZh.includes(`data-testid="view-ticket-btn-${mockShow1.id}"`));
      assert.ok(htmlZh.includes(`data-testid="remove-btn-${mockShow1.id}"`));

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

  describe("Subtest 6: Global Header & Mobile Drawer TicketBook Entrances with Dynamic Badge", () => {
    it("renders TicketBook entrance with attended count badge in ArchiveHeader, FilterDrawer, and LandingHero", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ArchiveHeader } = await loadModule("/src/components/layout/ArchiveHeader.jsx");
      const { FilterDrawer } = await loadModule("/src/components/layout/FilterDrawer.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();
      recordAttendance(mockShow1.id, { date: mockShow1.date }, storage);

      // 1. ArchiveHeader
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
      assert.ok(htmlHeader.includes('data-testid="header-ticket-book-btn"'), "ArchiveHeader must render ticket-book button");
      assert.ok(htmlHeader.includes('data-testid="ticket-badge-count"'), "ArchiveHeader must render badge count");
      assert.ok(htmlHeader.includes(">1<"), "Badge count must display 1");

      // 2. FilterDrawer
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

      storage.clear();
    });
  });
});
