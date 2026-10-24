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

    const venueNavMod = await loadModule("/src/components/navigators/VenueNavigator.jsx");
    VenueNavigator = venueNavMod.VenueNavigator;
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
      assert.ok(html.includes('data-pref="島根縣"') && html.includes("🌱"), "San'in Sanctuary Shimane must display 🌱 marker");

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
    assert.ok(htmlChiba.includes('data-testid="map-venue-card"'), "Must render synchronized venue cards list below map");
    assert.ok(htmlChiba.includes("幕張展覽館"), "Must list Chiba Makuhari Messe venues below zoomed map");
  });

  it("renders VenueNavigator dual mode toggle (Venues Map/Ranking vs 2012-2026 Career Journey Route) and TV broadcast filter", () => {
    // 1. Venues Map mode
    const htmlMapMode = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(VenueNavigator, {
          venueSubMode: "venues",
          setVenueSubMode: () => {},
          venueSortMode: "map",
          setVenueSortMode: () => {},
          selMapPrefecture: "島根縣",
          setSelMapPrefecture: () => {},
          selRegion: "日本 - 中部 / 九州 / 其他",
          setSelRegion: () => {},
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
          handleSelectMapJourney: () => {},
        })
      )
    );

    assert.ok(htmlMapMode.includes('data-testid="venue-mode-venues"'), "Must render venues mode tab button");
    assert.ok(htmlMapMode.includes('data-testid="venue-mode-journey"'), "Must render career journey mode tab button");
    assert.ok(htmlMapMode.includes('data-testid="venue-sort-map"'), "Must render interactive venue map sort button");
    assert.ok(htmlMapMode.includes("松江AZTiC canova"), "Must render Shimane venue in drilled-down map view");

    // 2. Career Journey Route mode (2012-2026)
    const htmlJourneyMode = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(VenueNavigator, {
          venueSubMode: "journey",
          setVenueSubMode: () => {},
          venueSortMode: "map",
          setVenueSortMode: () => {},
          selRegion: "日本 - 關東",
          setSelRegion: () => {},
          selVenue: "",
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
          handleSelectMapJourney: () => {},
        })
      )
    );

    assert.ok(htmlJourneyMode.includes('data-testid="career-journey-panel"'), "Must render career journey panel");
    assert.ok(htmlJourneyMode.includes('data-testid="journey-tv-toggle"'), "Must render TV broadcast toggle (+24 shows)");
    assert.ok(htmlJourneyMode.includes("523"), "Default career journey must show 523 live stops");
    assert.ok(htmlJourneyMode.includes("🚐"), "Must render overland van legend");
    assert.ok(htmlJourneyMode.includes("✈️"), "Must render flight route legend");
    assert.ok(htmlJourneyMode.includes("🏕️"), "Must render consecutive stay legend");
  });
});
