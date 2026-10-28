import { describe, it, before } from "node:test";
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

describe("25. Venue Map & Journey Slips Integration (TourSlip, VenueSlip, TicketBookPage, #54, ADR-0124)", () => {
  let I18nProvider;
  let buildIndex;
  let allUnits;
  let TourSlip;
  let VenueSlip;
  let TicketBookPage;
  let TicketBookMilestoneDashboard;
  let index;
  let editorialUnitData;

  before(async () => {
    const i18nMod = await loadModule("/src/lib/i18n.jsx");
    I18nProvider = i18nMod.I18nProvider;

    const domainMod = await loadModule("/src/lib/domain.js");
    buildIndex = domainMod.buildIndex;
    allUnits = domainMod.allUnits;
    index = buildIndex();

    editorialUnitData = index.unitData.get("one-man-tour-2021-2022-editorial");

    const tourSlipMod = await loadModule("/src/components/slips/TourSlip.jsx");
    TourSlip = tourSlipMod.TourSlip;

    const venueSlipMod = await loadModule("/src/components/slips/VenueSlip.jsx");
    VenueSlip = venueSlipMod.VenueSlip;

    const ticketBookPageMod = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
    TicketBookPage = ticketBookPageMod.TicketBookPage;

    const milestoneDashMod = await loadModule("/src/components/ticket-book/TicketBookMilestoneDashboard.jsx");
    TicketBookMilestoneDashboard = milestoneDashMod.TicketBookMilestoneDashboard;
  });

  it("renders TourSlip itinerary section with view toggle and tour journey route map panel", () => {
    for (const locale of ["zh-TW", "ja", "en", "ko"]) {
      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: locale },
          React.createElement(TourSlip, {
            tourUnitData: editorialUnitData,
            initialItineraryView: "map",
            onSelectShow: () => {},
          })
        )
      );

      // Verify View Toggle presence
      assert.ok(html.includes('data-testid="tour-view-toggle-list"'), `${locale} must render tour-view-toggle-list`);
      assert.ok(html.includes('data-testid="tour-view-toggle-map"'), `${locale} must render tour-view-toggle-map`);

      // Verify Tour Journey Panel presence
      assert.ok(html.includes('data-testid="tour-journey-panel"'), `${locale} must render tour-journey-panel`);
      assert.ok(html.includes('data-testid="tour-journey-info-bar"'), `${locale} must render tour-journey-info-bar`);

      // Verify Start and Final Stops
      assert.ok(html.includes('data-testid="tour-start-stop"'), `${locale} must render tour-start-stop`);
      assert.ok(html.includes('data-testid="tour-final-stop"'), `${locale} must render tour-final-stop`);

      // Editorial tour physical finale must be Matsue 2022-04-17 (Kunibiki Messe), NOT virtual show 2022-05-01
      assert.ok(html.includes("2022-04-17"), "Editorial tour route final stop must be 2022-04-17 Matsue");
      assert.ok(html.includes("くにびきメッセ") || html.includes("島根"), "Editorial tour route final stop must be Matsue/Shimane");

      // Verify Virtual Show Badge for the 2022-05-01 online livestream show
      assert.ok(html.includes('data-testid="tour-virtual-shows-badge"'), `${locale} must display virtual shows badge for Editorial`);
      assert.ok(html.includes("2022-05-01"), "Virtual shows badge must reference 2022-05-01 livestream");

      // Verify VenueMapCanvas is mounted with journey route layer
      assert.ok(html.includes('data-testid="journey-route-layer"'), `${locale} must render journey-route-layer on map canvas`);
      assert.ok(html.includes('data-testid="journey-stop-marker"'), `${locale} must render clickable journey-stop-markers`);

      // Sequential Discovery Invariant (Grilling Decision 1-4):
      // No future trajectory lines or future stops are pre-drawn upfront at playback origin
      assert.ok(!html.includes('data-testid="journey-full-route-layer"'), `${locale} must NOT draw upfront full route traces`);
      assert.ok(!html.includes('data-testid="journey-all-stops-layer"'), `${locale} must NOT draw future stop markers upfront`);
      assert.ok(!html.includes('data-leg-state="footprint"'), `${locale} must start with no completed footprint legs`);
      assert.ok(html.includes('data-testid="journey-current-stop"'), `${locale} must stamp origin stop with journey-current-stop`);
    }
  });

  it("renders VenueSlip with high-density full-width header and classic toolbar, free of redundant location cards", () => {
    // 1. Physical San'in Sanctuary Venue: 松江AZTiC canova
    const htmlCanova = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(VenueSlip, {
          venueName: "松江AZTiC canova",
          globalVenueShows: index.globalVenueShows,
        })
      )
    );

    // Verify clean, unconstrained full-width header and native subtitle
    assert.ok(htmlCanova.includes("松江AZTiC canova"), "Must render localized venue title");
    assert.ok(htmlCanova.includes('data-testid="venue-native-subtitle"'), "Venue header must render native subtitle");
    assert.ok(htmlCanova.includes("松江canova"), "Must render native venue name");

    // Verify classic compact tools without card bloat
    assert.ok(htmlCanova.includes("Google Maps"), "Must render Google Maps action");
    assert.ok(htmlCanova.includes("複製歷程"), "Must render copy history action");
    assert.ok(!htmlCanova.includes('data-testid="venue-location-card"'), "VenueSlip must NOT render redundant venue-location-card");
    assert.ok(!htmlCanova.includes('data-testid="venue-mini-locator-stamp"'), "VenueSlip must NOT render mini-locator-stamp");

    // 2. Overseas Physical Venue: 台北小巨蛋
    const htmlTaipei = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(VenueSlip, {
          venueName: "台北小巨蛋",
          globalVenueShows: index.globalVenueShows,
        })
      )
    );
    assert.ok(htmlTaipei.includes("台北小巨蛋"), "Must render Taipei Arena");
    assert.ok(!htmlTaipei.includes('data-testid="venue-location-card"'), "Overseas venue must NOT render location card");
    assert.ok(!htmlTaipei.includes('data-testid="venue-mini-locator-stamp"'), "Overseas venue must NOT render mini-locator-stamp");

    // 3. Virtual Livestream Venue: 線上直播
    const htmlVirtual = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(VenueSlip, {
          venueName: "線上直播",
          globalVenueShows: index.globalVenueShows,
        })
      )
    );
    assert.ok(!htmlVirtual.includes('data-testid="venue-location-card"'), "Virtual livestream venue must NOT render location card");
    assert.ok(!htmlVirtual.includes('data-testid="venue-mini-locator-stamp"'), "Virtual livestream venue must NOT render mini-locator-stamp");
  });

  it("renders TicketBookPage personal concert footprint map with conquered prefectures progress", () => {
    // Mock memory storage for ticket book
    const store = new Map();
    const mockStorage = {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };

    // 1. Initial Empty State
    const htmlEmpty = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(TicketBookPage, {
          unitData: index.unitData,
          showById: index.showById,
          unitIdByShowId: index.unitIdByShowId,
          allUsedSongs: index.allUsedSongs,
          storage: mockStorage,
        })
      )
    );

    assert.ok(htmlEmpty.includes('data-testid="ticket-book-footprint-map"'), "Must render ticket-book-footprint-map container");
    assert.ok(htmlEmpty.includes('data-testid="footprint-empty-hint"'), "Empty state must render footprint-empty-hint");

    // 2. User with checked-in shows:
    // - 1310540: 2021-09-04 Pia Arena MM (Kanagawa)
    // - 1310585: 2022-04-17 Matsue (Shimane)
    // - 1420960: 2022-05-01 Online Livestream (Virtual -> should be excluded from physical footprint)
    const mockAttended = {
      version: 1,
      attendedShows: {
        "1310540": { showKey: "1310540", attendedAt: "2021-09-04" },
        "1310585": { showKey: "1310585", attendedAt: "2022-04-17" },
        "1420960": { showKey: "1420960", attendedAt: "2022-05-01" },
      },
      updatedAt: "2026-10-28T00:00:00Z",
    };
    mockStorage.setItem("hg_ticket_book_v1", JSON.stringify(mockAttended));

    for (const locale of ["zh-TW", "ja", "en", "ko"]) {
      const htmlAttended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: locale },
          React.createElement(TicketBookPage, {
            unitData: index.unitData,
            showById: index.showById,
            unitIdByShowId: index.unitIdByShowId,
            allUsedSongs: index.allUsedSongs,
            storage: mockStorage,
          })
        )
      );

      // Collapsible Sections across all screen sizes (Grilling Decision):
      // Top 3 songs, Timeline highlights, and Footprint map are all independently collapsible
      assert.ok(htmlAttended.includes('data-testid="toggle-top-songs-btn"'), `${locale} must render toggle-top-songs-btn`);
      assert.ok(htmlAttended.includes('data-testid="toggle-timeline-btn"'), `${locale} must render toggle-timeline-btn`);
      assert.ok(htmlAttended.includes('data-testid="toggle-footprint-map-btn"'), `${locale} must render toggle-footprint-map-btn`);

      assert.ok(htmlAttended.includes('data-testid="ticket-book-footprint-map"'), `${locale} must render ticket-book-footprint-map`);
      assert.ok(htmlAttended.includes('data-testid="footprint-progress-badge"'), `${locale} must render footprint-progress-badge`);
      // 2 physical prefectures (Kanagawa, Shimane) out of 47
      assert.ok(htmlAttended.includes("2 / 47") || htmlAttended.includes("2/47"), `${locale} must show 2 / 47 prefectures progress`);
      // Physical route should be rendered on map canvas
      assert.ok(htmlAttended.includes('data-testid="journey-route-layer"'), `${locale} must render personal movement trajectory`);
      // Ticket Book Footprint initial full state (Grilling Decision 5):
      // Full attended trajectory displayed upfront with completed footprint legs and footprint stops
      assert.ok(htmlAttended.includes('data-leg-state="footprint"'), `${locale} ticket book must show completed footprint legs`);
      assert.ok(htmlAttended.includes('data-stop-state="footprint"'), `${locale} ticket book must show past footprint stops`);
      // Single Numbered Station Circle rule (Grilling Decision):
      // Only the current stop is rendered as the prominent numbered circle
      assert.ok(htmlAttended.includes('data-testid="journey-current-stop"'), `${locale} ticket book must feature single current stop badge`);
      // Prefecture dynamic lighting: Conquered prefectures (Shimane/Kanagawa) lit up, unvisited remain unvisited
      assert.ok(htmlAttended.includes('data-pref="島根縣" data-tier="sanctuary_or_hub"'), `${locale} must conquer Shimane sanctuary`);
      assert.ok(htmlAttended.includes('data-pref="神奈川縣" data-tier="visited"'), `${locale} must conquer Kanagawa prefecture`);
      assert.ok(htmlAttended.includes('data-pref="北海道" data-tier="unvisited"'), `${locale} unvisited Hokkaido must stay unvisited`);
    }
  });
});
