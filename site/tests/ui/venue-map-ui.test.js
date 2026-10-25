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

describe("24. Interactive SVG Venue Map Canvas & Career Journey Navigator (#53, ADR-0124)", () => {
  let I18nProvider;
  let buildIndex;
  let allUnits;
  let VenueMapCanvas;
  let VenueNavigator;
  let JourneyPlaybackControls;
  let JourneyPage;
  let JourneyFilterDrawer;
  let FilterDrawer;
  let MobileFloatingControls;
  let ArchiveStatusBar;
  let TourVan3D;
  let TourAirplane3D;
  let index;

  before(async () => {
    const i18nMod = await loadModule("/src/lib/i18n.jsx");
    I18nProvider = i18nMod.I18nProvider;

    const domainMod = await loadModule("/src/lib/domain.js");
    buildIndex = domainMod.buildIndex;
    allUnits = domainMod.allUnits;
    index = buildIndex();

    const mapCanvasMod = await loadModule("/src/components/VenueMapCanvas.jsx");
    VenueMapCanvas = mapCanvasMod.VenueMapCanvas;
    TourVan3D = mapCanvasMod.TourVan3D;
    TourAirplane3D = mapCanvasMod.TourAirplane3D;

    const playbackControlsMod = await loadModule("/src/components/JourneyPlaybackControls.jsx");
    JourneyPlaybackControls = playbackControlsMod.JourneyPlaybackControls;

    const journeyPageMod = await loadModule("/src/components/journey/JourneyPage.jsx");
    JourneyPage = journeyPageMod.JourneyPage;

    const journeyDrawerMod = await loadModule("/src/components/journey/JourneyFilterDrawer.jsx");
    JourneyFilterDrawer = journeyDrawerMod.JourneyFilterDrawer;

    const venueNavMod = await loadModule("/src/components/navigators/VenueNavigator.jsx");
    VenueNavigator = venueNavMod.VenueNavigator;

    const drawerMod = await loadModule("/src/components/layout/FilterDrawer.jsx");
    FilterDrawer = drawerMod.FilterDrawer;

    const floatingMod = await loadModule("/src/components/layout/MobileFloatingControls.jsx");
    MobileFloatingControls = floatingMod.MobileFloatingControls;

    const statusBarMod = await loadModule("/src/components/layout/ArchiveStatusBar.jsx");
    ArchiveStatusBar = statusBarMod.ArchiveStatusBar;
  });

  it("renders VenueMapCanvas macro view with 47 Japan prefectures, dual insets, 3-tier tokens, and 4-locale A11y labels", () => {
    for (const locale of ["zh-TW", "ja", "en", "ko"]) {
      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: locale },
          React.createElement(VenueMapCanvas, {
            allVenues: index.allVenues,
            globalVenueShows: index.globalVenueShows,
            selectedPrefecture: null,
            onSelectPrefecture: () => {},
            onSelectVenue: () => {},
          })
        )
      );

      assert.ok(html.includes('viewBox="0 0 800 560"'), `${locale} macro map must use 0 0 800 560 viewBox`);
      assert.ok(html.includes("OVERSEAS ASIA INSET"), `${locale} map must render Overseas Asia Inset header`);
      assert.ok(html.includes("OKINAWA INSET"), `${locale} map must render Okinawa Inset header`);
      assert.ok(html.includes("43 / 47"), `${locale} map must display 43 / 47 prefecture completion progress`);

      // Verify 3-tier token classification attributes
      assert.ok(html.includes('data-pref="岩手縣"') && html.includes('data-tier="unvisited"'), "Unvisited Iwate must have data-tier=unvisited");
      assert.ok(html.includes('data-pref="沖繩縣"') && html.includes('data-tier="visited"'), "Visited Okinawa must have data-tier=visited");
      assert.ok(html.includes('data-pref="東京都"') && html.includes('data-tier="sanctuary_or_hub"'), "Hub Tokyo must have data-tier=sanctuary_or_hub");
      assert.ok(html.includes('data-pref="島根縣"') && html.includes('data-tier="sanctuary_or_hub"'), "San'in Shimane must have data-tier=sanctuary_or_hub");
      assert.ok(html.includes('data-testid="ocean-graticule-layer"'), "Must render ocean graticule layer");
      assert.ok(html.includes('vector-effect="non-scaling-stroke"'), "Prefecture paths must use non-scaling-stroke");
      assert.ok(html.includes('data-testid="venue-hud-card"'), `${locale} must render unified venue-hud-card at bottom-left`);

      // Verify keyboard accessibility role="button" and tabIndex="0"
      assert.ok(html.includes('role="button"'), `${locale} interactive prefecture nodes must have role="button"`);
      assert.ok(/tabindex="0"/i.test(html), `${locale} interactive prefecture nodes must have tabIndex="0"`);
    }
  });

  it("renders VenueMapCanvas Spotlight Zoom viewBox, spiderfied pins, city filter pills, and return button when a prefecture is selected", () => {
    const htmlChiba = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(VenueMapCanvas, {
          allVenues: index.allVenues,
          globalVenueShows: index.globalVenueShows,
          selectedPrefecture: "千葉縣",
          onSelectPrefecture: () => {},
          onSelectVenue: () => {},
        })
      )
    );

    assert.ok(!htmlChiba.includes('viewBox="0 0 800 560"'), "Selected prefecture must zoom viewBox closer than 0 0 800 560");
    assert.ok(htmlChiba.includes('data-testid="map-reset-zoom-btn"'), "Must render return to national overview button");
    assert.ok(htmlChiba.includes('data-testid="venue-map-pin"'), "Must render individual venue pins in zoomed view");
    assert.ok(htmlChiba.includes('data-dimmed="true"'), "Neighboring prefectures must be dimmed in Spotlight Zoom");
    assert.ok(htmlChiba.includes('data-testid="venue-hud-card"'), "Must render venue-hud-card in Spotlight Zoom");
    assert.ok(htmlChiba.includes("md:hidden") && htmlChiba.includes("border-t"), "Must dock mobile HUD status ribbon directly below map canvas");
    assert.ok(htmlChiba.includes("h-[280px] sm:h-[300px]"), "Mobile map canvas must maintain comfortable h-[280px] aspect ratio");
    assert.ok(htmlChiba.includes('pointer-events="all"'), "Venue pins must feature transparent touch shield with pointer-events: all");
    assert.ok(htmlChiba.includes('data-testid="map-fullscreen-btn"'), "Must render fullscreen explore button on map frame");
    assert.ok(htmlChiba.includes("千葉縣"), "Venue HUD card must show Chiba prefecture summary when zoomed in idle state");
    assert.ok(htmlChiba.includes('data-testid="map-venue-card"'), "Must render synchronized venue cards list below map");
    assert.ok(htmlChiba.includes('data-testid="map-drilldown-panel"'), "Main page drilldown panel must be rendered (ADR-0126)");
    assert.ok(htmlChiba.includes("max-h-[360px] md:max-h-[440px]"), "Drilldown panel must provide max-h-[360px] boundary for mobile scrolling (ADR-0126)");
    assert.ok(htmlChiba.includes("幕張展覽館"), "Must list Chiba Makuhari Messe venues below zoomed map");

    const htmlShimane = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(VenueMapCanvas, {
          allVenues: index.allVenues,
          globalVenueShows: index.globalVenueShows,
          selectedPrefecture: "島根縣",
          onSelectPrefecture: () => {},
          onSelectVenue: () => {},
        })
      )
    );
    assert.ok(htmlShimane.includes("🌱"), "Shimane sanctuary must display 🌱 in venue-hud-card");
  });

  it("renders VenueNavigator pure venue sorting (ADR-0125) and JourneyPage career journey route with TV broadcast filter", () => {
    // 1. Venues Map mode in VenueNavigator
    const htmlMapMode = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(VenueNavigator, {
          venueSortMode: "map",
          setVenueSortMode: () => {},
          selMapPrefecture: "島根縣",
          setSelMapPrefecture: () => {},
          selVenue: "松江AZTiC canova",
          venuePage: 0,
          setVenuePage: () => {},
          allVenues: index.allVenues,
          allUnits,
          globalVenueShows: index.globalVenueShows,
          venuesSortedByCount: index.allVenues,
          filteredVenues: index.allVenues,
          pagedVenues: index.allVenues.slice(0, 10),
          handleSelectVenue: () => {},
          handleSelectMap: () => {},
        })
      )
    );

    assert.ok(htmlMapMode.includes('data-testid="venue-sort-map"'), "Must render interactive venue map sort button");
    assert.ok(htmlMapMode.includes('data-testid="venue-sort-count"'), "Must render venue count sort button");
    assert.ok(!htmlMapMode.includes('data-testid="venue-mode-venues"'), "Legacy sub-mode toggle must be purged from VenueNavigator (ADR-0125)");
    assert.ok(htmlMapMode.includes("松江AZTiC canova"), "Must render Shimane venue in drilled-down map view");

    // 2. Career Journey Route page (2012-2026, JourneyPage)
    const htmlJourneyMode = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(JourneyPage, {
          allUnits,
          allVenues: index.allVenues,
          globalVenueShows: index.globalVenueShows,
          onSelectShow: () => {},
          onReturnArchive: () => {},
          onReturnHome: () => {},
          onSelectTickets: () => {},
        })
      )
    );

    assert.ok(htmlJourneyMode.includes('data-testid="career-journey-panel"'), "Must render career journey panel");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-filter-bar"'), "Must render desktop journey-filter-bar");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-playback-dock"'), "Must render journey playback docked directly under map canvas (ADR-0127)");
    assert.ok(htmlJourneyMode.includes('data-testid="mobile-archive-fab"'), "Must render mobile-archive-fab with ticket-book parity (ADR-0127)");
    assert.ok(htmlJourneyMode.includes('data-testid="mobile-journey-filter-fab"'), "Must render mobile-journey-filter-fab with ticket-book parity (ADR-0127)");
    assert.ok(htmlJourneyMode.includes("pb-24"), "JourneyPage container must reserve bottom clearance for floating FABs");
    assert.ok(htmlJourneyMode.includes("washi-tape"), "JourneyPage ticket must render washi masking tape (ADR-0127)");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-stops-badge"'), "JourneyPage header must render stops badge (ADR-0127)");
    assert.ok(htmlJourneyMode.includes("h-[420px] sm:h-[520px] md:h-[640px]"), "Journey map canvas must render maximized height (ADR-0127)");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-tv-toggle"'), "Must render TV broadcast toggle (+24 shows)");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-year-select"'), "Must render year dropdown selector");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-tour-select"'), "Must render tour dropdown selector");
    assert.ok(!htmlJourneyMode.includes('value="free-live-tour-2015"'), "Must exclude mini-lives/store events from tour selector");
    assert.ok(htmlJourneyMode.includes("523"), "Default career journey must show 523 live stops");

    // 2.5 Mobile Journey Filter Drawer (Staged Apply)
    const htmlDrawer = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(JourneyFilterDrawer, {
          isOpen: true,
          onClose: () => {},
          onApply: () => {},
          tourOptions: [{ id: "14-2021-editorial", title: "Editorial" }],
          careerYears: ["2021", "2024"],
          currentTourId: "ALL",
          currentYear: "ALL",
          includeTv: false,
          excludedTvCount: 24,
          virtualCount: 1,
        })
      )
    );

    assert.ok(htmlDrawer.includes('data-testid="journey-filter-drawer"'), "Must render journey-filter-drawer when open (ADR-0127)");
    assert.ok(htmlDrawer.includes('data-testid="drawer-journey-tour-select"'), "Must render drawer tour selector");
    assert.ok(htmlDrawer.includes('data-testid="drawer-journey-year-select"'), "Must render drawer year selector");
    assert.ok(htmlDrawer.includes('data-testid="drawer-journey-tv-toggle"'), "Must render drawer TV toggle");
    assert.ok(htmlDrawer.includes('data-testid="journey-drawer-confirm-btn"'), "Must render drawer confirm apply button");

    // Sequential playback: auto-plays from the origin, single active leg, no corridor aggregation
    assert.ok(htmlJourneyMode.includes('data-testid="journey-playback-controls"'), "Must render journey playback transport bar");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-playback-toggle"'), "Must render play/pause toggle");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-playback-scrub"'), "Must render draggable timeline");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-playback-camera-toggle"'), "Must render follow-cam toggle button");
    for (const rate of ["1", "2", "4"]) {
      assert.ok(
        htmlJourneyMode.includes(`data-testid="journey-playback-speed-${rate}"`),
        `Must render ${rate}× speed control`
      );
    }
    assert.ok(htmlJourneyMode.includes('data-testid="map-world-layer"'), "Must render map-world-layer");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-footprint-layer"'), "Must render the travelled-footprint layer");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-current-stop"'), "Must mark the current stop at the origin");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-hud-card"'), "Must show fixed bottom-left HUD ticket card with date & full venue");
    assert.ok(htmlJourneyMode.includes("md:hidden") && htmlJourneyMode.includes("SETLIST ➔"), "Must dock mobile journey HUD ribbon below map with direct SETLIST link");
    assert.ok(!htmlJourneyMode.includes("…"), "Must never truncate venue names with ellipsis in HUD card");
    assert.ok(!htmlJourneyMode.includes('data-leg-state="footprint"'), "Playback must start with no travelled legs drawn");
    assert.ok(!htmlJourneyMode.includes('data-testid="journey-vehicle-marker"'), "No vehicle marker before the first leg is drawn");
    assert.ok(!htmlJourneyMode.includes("data-corridor"), "Corridor aggregation must be removed in favour of sequential playback");
    assert.ok(htmlJourneyMode.includes('data-playing="true"'), "Playback must auto-play on entering the journey page");
    assert.ok(htmlJourneyMode.includes('viewBox="0 0 800 560"'), "Journey must start in national overview view (0 0 800 560) by default");
    assert.ok(!htmlJourneyMode.includes("rotateX"), "Must not use blurry CSS 3D rotateX which causes texture rasterization blur");
    assert.ok(
      /data-testid="journey-playback-speed-2"[^>]*aria-pressed="true"/.test(htmlJourneyMode),
      "2× must be the default playback speed"
    );
  });

  it("renders TourVan3D and TourAirplane3D with pure SVG vector details, tires, headlights, and wings", () => {
    const vanHtml = renderToStaticMarkup(React.createElement(TourVan3D, { angle: 45 }));
    assert.ok(vanHtml.includes("#dc2626"), "TourVan3D must feature pure crimson red 6-seater SUV body");
    assert.ok(!vanHtml.includes('stroke="var(--color-ink)"'), "TourVan3D must not have black stroke border around the body (純紅無黑邊)");
    assert.ok(vanHtml.includes("#e2e8f0"), "TourVan3D must feature silver metallic roof rack");
    assert.ok(vanHtml.includes("rotate(45) scale(0.7)"), "TourVan3D must apply steering angle and default 0.7x scale");

    const vanOverviewHtml = renderToStaticMarkup(React.createElement(TourVan3D, { angle: 0, scale: 1.35 }));
    assert.ok(vanOverviewHtml.includes("scale(1.35)"), "TourVan3D must support enlarged 1.35x scale in national overview");

    const planeHtml = renderToStaticMarkup(React.createElement(TourAirplane3D, { angle: -30 }));
    assert.ok(planeHtml.includes("#f8fafc"), "TourAirplane3D must feature platinum silver fuselage");
    assert.ok(!planeHtml.includes('stroke="var(--color-ink)"'), "TourAirplane3D must not have black stroke border around the body");
    assert.ok(planeHtml.includes("#0f172a"), "TourAirplane3D must feature tinted cockpit and cabin windows");
    assert.ok(planeHtml.includes("rotate(-30) scale(0.72)"), "TourAirplane3D must apply flight angle and 0.72x scale");

    const planeOverviewHtml = renderToStaticMarkup(React.createElement(TourAirplane3D, { angle: 0, scale: 1.4 }));
    assert.ok(planeOverviewHtml.includes("scale(1.4)"), "TourAirplane3D must support enlarged 1.4x scale in national overview");
  });

  it("renders JourneyPlaybackControls as an auto-playing transport with 2× selected by default", () => {
    const stops = [
      { showId: "s1", date: "2012-06-10", venue: "松江AZTiC canova" },
      { showId: "s2", date: "2012-07-01", venue: "東京" },
    ];
    const playback = {
      progress: 0,
      total: 1,
      isPlaying: true,
      speed: 2,
      cameraMode: "follow",
      frame: { completedLegs: 0, currentLeg: null, legT: 0, isComplete: false },
      toggle: () => {},
      scrub: () => {},
      setSpeed: () => {},
      toggleCameraMode: () => {},
    };

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "en" },
        React.createElement(JourneyPlaybackControls, { playback, stops })
      )
    );

    assert.ok(html.includes('data-playing="true"'), "Transport must report active playback");
    assert.ok(!html.includes("data-reduced-motion"), "Playback must ignore reduced-motion preferences");
    assert.ok(!html.includes("journey-playback-reduced-note"), "No reduced-motion notice is needed");
    for (const rate of ["1", "2", "4"]) {
      assert.ok(html.includes(`data-testid="journey-playback-speed-${rate}"`), `Must always offer ${rate}×`);
    }
    assert.ok(
      /data-testid="journey-playback-speed-2"[^>]*aria-pressed="true"/.test(html),
      "2× must be pressed by default"
    );
    assert.ok(html.includes("Pause"), "Auto-playing transport must offer a pause action");
    assert.ok(html.includes('data-testid="journey-playback-camera-toggle"'), "Must render follow-cam toggle");
    assert.ok(html.includes('data-testid="journey-playback-scrub"'), "Timeline stays usable for scrubbing");
    assert.ok(html.includes('max="1"'), "Timeline max must equal the transition count");
    assert.ok(html.includes("2012-06-10") && html.includes("Matsue AZTiC canova"), "Must show the selected stop date & venue");
    assert.ok(html.includes("Stop 1 / 2"), "Must show stop progress label");
  });

  it("verifies ADR-0125 mobile drawer confinement, pure FilterDrawer, and vertical emoji FABs in MobileFloatingControls", () => {
    // 1. FilterDrawer is 100% pure filter drawer without extraneous buttons
    const htmlDrawer = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(FilterDrawer, {
          isOpen: true,
          tab: "venue",
          onClose: () => {},
          onCommit: () => {},
          confirmButtonLabel: "確認套用",
          renderShowNavigator: () => null,
          renderSongNavigator: () => null,
          renderVenueNavigator: () => React.createElement("div", { "data-testid": "drawer-venue-nav-content" }, "NAV"),
        })
      )
    );

    assert.ok(!htmlDrawer.includes('data-testid="drawer-ticket-book-btn"'), "FilterDrawer must be clean without ticket-book button");
    assert.ok(!htmlDrawer.includes('data-testid="drawer-journey-btn"'), "FilterDrawer must be clean without journey button");
    assert.ok(htmlDrawer.includes('data-testid="drawer-venue-nav-content"'), "FilterDrawer must render venue navigator content inside drawer");

    // 2. MobileFloatingControls vertical emoji FABs (Top: Tour Footprint 🚐, Middle: Ticket Book 🎟️)
    const htmlFloating = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(MobileFloatingControls, {
          tab: "venue",
          onOpenSearch: () => {},
          onOpenDrawer: () => {},
          onReturnHome: () => {},
          onSelectTickets: () => {},
          onSelectJourney: () => {},
        })
      )
    );

    assert.ok(htmlFloating.includes('data-testid="mobile-journey-fab"'), "Must render mobile-journey-fab");
    assert.ok(htmlFloating.includes('data-testid="mobile-ticket-book-fab"'), "Must render mobile-ticket-book-fab");
    const journeyIdx = htmlFloating.indexOf('data-testid="mobile-journey-fab"');
    const ticketIdx = htmlFloating.indexOf('data-testid="mobile-ticket-book-fab"');
    assert.ok(journeyIdx < ticketIdx, "Tour Footprint 🚐 must be placed vertically above Ticket Book 🎟️ (ADR-0125)");

    // 3. ArchiveStatusBar quick entrance for Career Tour Footprint
    const htmlStatusBar = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(ArchiveStatusBar, {
          tab: "venue",
          current: null,
          selSong: null,
          currentSongObj: null,
          selVenue: "日本武道館",
          currentVenueObj: { shows: [1, 2, 3] },
          trackShows: new Map(),
          slipRef: { current: null },
          handleReturnHome: () => {},
          handleSelectTickets: () => {},
          handleSelectJourney: () => {},
        })
      )
    );

    assert.ok(htmlStatusBar.includes('data-testid="status-bar-journey-btn"'), "ArchiveStatusBar must render career tour footprint button (ADR-0125)");
    assert.ok(htmlStatusBar.includes("巡演足跡"), "Must show friendly '巡演足跡' label on desktop status bar");
  });

  it("verifies ADR-0126 responsive triptych portrait venue map, perforation dividers, and Spotlight Zoom in portrait mode", () => {
    // 1. Macro view in portrait mode across all 4 locales
    for (const locale of ["zh-TW", "ja", "en", "ko"]) {
      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: locale },
          React.createElement(VenueMapCanvas, {
            layout: "portrait",
            allVenues: index.allVenues,
            globalVenueShows: index.globalVenueShows,
            selectedPrefecture: null,
            onSelectPrefecture: () => {},
          })
        )
      );

      assert.ok(html.includes('viewBox="0 0 540 930"'), "Must render 540x930 ultra-narrow portrait canvas");
      assert.ok(html.includes('data-testid="triptych-divider-overseas"'), "Must render Overseas-Mainland perforation divider");
      assert.ok(html.includes('data-testid="triptych-divider-okinawa"'), "Must render Mainland-Okinawa perforation divider");
      assert.ok(html.includes("✂ ──"), "Must include vintage ticket scissor stamp marks");
      assert.ok(html.includes('x="20" y="20" width="500" height="205"'), "Overseas inset must have full-width bounds in portrait");
      assert.ok(html.includes('x="150" y="848" width="240" height="68"'), "Okinawa inset must have compact bounds in portrait (ADR-0126)");
      assert.ok(!html.includes('data-testid="map-fullscreen-modal"'), "Fullscreen modal must not be open by default");
      assert.ok(!html.includes("venueMap.japanMainlandTitle"), "No untranslated locale key");
    }

    // 2. Spotlight Zoom into Tokyo in portrait mode
    const htmlTokyo = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(VenueMapCanvas, {
          layout: "portrait",
          allVenues: index.allVenues,
          globalVenueShows: index.globalVenueShows,
          selectedPrefecture: "東京都",
          onSelectPrefecture: () => {},
        })
      )
    );

    assert.ok(htmlTokyo.includes('viewBox="266 586 115 81"'), "Must zoom to Tokyo portrait viewBox (266 586 115 81)");
    assert.ok(!htmlTokyo.includes('data-testid="triptych-divider-overseas"'), "Dividers must be hidden when zoomed");
    assert.ok(htmlTokyo.includes('data-testid="map-reset-zoom-btn"'), "Must render return button when zoomed in portrait");
    assert.ok(htmlTokyo.includes('data-testid="venue-pins-layer"'), "Must render venue pins in portrait");
    assert.ok(htmlTokyo.includes('data-testid="map-drilldown-panel"'), "Must render map-drilldown-panel on mobile portrait view (ADR-0126)");
    assert.ok(htmlTokyo.includes('data-testid="map-venue-card"'), "Must render map-venue-card list in portrait view");
    assert.ok(htmlTokyo.includes("max-h-[360px]"), "Drilldown panel must have max-h-[360px] boundary on mobile");
    assert.ok(!htmlTokyo.includes("hidden md:flex"), "Drilldown panel must not be hidden on mobile");
  });
});
