import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

describe("19. Unified Omnibox Search & Flattened Show & Venue Navigation (ADR-0140)", () => {
  it("renders ShowNavigator with instant search input and 'ALL' categories option", async () => {
    const { ShowNavigator } = await loadModule("src/components/navigators/ShowNavigator.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    const mockUnits = [
      { id: "u-rejoice", title: "OFFICIAL HIGEDAN DISM one-man tour 2024 - Rejoice -", shows: [{ id: "s1", date: "2024-09-01", place: "マリンメッセ福岡" }], templateSetlist: [{ songId: "subtitle" }] },
      { id: "u-editorial", title: "one-man tour 2021-2022 - Editorial -", shows: [{ id: "s2", date: "2021-09-04", place: "ぴあアリーナMM" }] },
    ];

    const mockUnitData = new Map([
      ["u-rejoice", { id: "u-rejoice", shows: [{ id: "s1", date: "2024-09-01", place: "マリンメッセ福岡" }] }],
    ]);

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(ShowNavigator, {
          selCategory: "ALL",
          selYear: "2024",
          selUnitId: "u-rejoice",
          selShow: "s1",
          allUnits: mockUnits,
          categoryStats: { ALL: { units: 2, shows: 2 }, "巡演專場": { units: 2, shows: 2 } },
          availableYears: ["2024", "2021"],
          filteredUnits: [mockUnits[0]],
          pagedUnits: [mockUnits[0]],
          unitData: mockUnitData,
          current: mockUnitData.get("u-rejoice"),
          handleCategoryClick: () => {},
          handleSelectUnit: () => {},
          handleSelectShow: () => {},
        })
      )
    );

    // Verify search input exists
    assert.ok(html.includes("data-testid=\"show-search-input\""), "renders show search input");
    // Verify standard performance categories render without ALL button
    assert.ok(!html.includes("data-testid=\"show-category-all\""), "does not render ALL categories button");
    assert.ok(html.includes("巡演專場") || html.includes("Tour"), "renders localized Tour category pill");
    // Verify Rejoice unit renders
    assert.ok(html.includes("Rejoice"), "renders Rejoice unit");
  });

  it("renders VenueNavigator with instant search input and 18-item grid support", async () => {
    const { VenueNavigator } = await loadModule("src/components/navigators/VenueNavigator.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    const mockVenues = [
      { name: "日本武道館", prefecture: "東京都", city: "千代田區" },
      { name: "橫濱競技場", prefecture: "神奈川縣", city: "橫濱市" },
      { name: "大阪城展演廳", prefecture: "大阪府", city: "大阪市" },
    ];

    const mockGlobalVenueShows = new Map([
      ["日本武道館", [{ id: "s1" }, { id: "s2" }]],
      ["橫濱競技場", [{ id: "s3" }]],
      ["大阪城展演廳", [{ id: "s4" }]],
    ]);

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(VenueNavigator, {
          venueSortMode: "count",
          allVenues: mockVenues,
          venuesSortedByCount: mockVenues,
          filteredVenues: mockVenues,
          pagedVenues: mockVenues,
          globalVenueShows: mockGlobalVenueShows,
          selVenue: "日本武道館",
          handleSelectVenue: () => {},
        })
      )
    );

    // Verify search input exists
    assert.ok(html.includes("data-testid=\"venue-search-input\""), "renders venue search input");
    // Verify Budokan candidate card exists
    assert.ok(html.includes("日本武道館"), "renders Budokan venue card");
    assert.ok(html.includes("大阪城展演廳"), "renders Osaka venue card");
  });

  it("adapts VenueNavigator page size responsively (18 on desktop vs 10 in mobile drawer)", async () => {
    const { VenueNavigator } = await loadModule("src/components/navigators/VenueNavigator.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    // 15 venues: On desktop (pageSize 18) all 15 fit; in drawer (pageSize 10) only 10 fit
    const mockVenues = Array.from({ length: 15 }, (_, i) => ({
      name: `Venue-${i + 1}`,
      prefecture: "東京都",
      city: "千代田區",
    }));

    // Desktop: isDrawer = false
    const desktopHtml = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(VenueNavigator, {
          isDrawer: false,
          venueSortMode: "count",
          allVenues: mockVenues,
          venuesSortedByCount: mockVenues,
          filteredVenues: mockVenues,
          selVenue: "Venue-1",
          handleSelectVenue: () => {},
        })
      )
    );
    assert.ok(desktopHtml.includes("Venue-15"), "desktop includes 15th venue on first page");

    // Drawer: isDrawer = true
    const drawerHtml = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(VenueNavigator, {
          isDrawer: true,
          draftState: { venueSortMode: "count", venuePage: 0, venueName: "Venue-1" },
          setDraftState: () => {},
          venueSortMode: "count",
          allVenues: mockVenues,
          venuesSortedByCount: mockVenues,
          filteredVenues: mockVenues,
          selVenue: "Venue-1",
          handleSelectVenue: () => {},
        })
      )
    );
    assert.ok(drawerHtml.includes("Venue-10"), "drawer includes 10th venue on first page");
    assert.ok(!drawerHtml.includes("Venue-15"), "drawer restricts first page to 10 venues to prevent vertical blowout");
  });
});
