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

describe("29. Mobile Filter Drawer Dimension Tabs & Transactional Rollback", () => {
  let I18nProvider;
  let ArchiveHeader;
  let MobileFloatingControls;
  let FilterDrawer;
  let domainMod;
  let buildIndex;
  let index;

  before(async () => {
    const i18nMod = await loadModule("/src/lib/i18n.jsx");
    I18nProvider = i18nMod.I18nProvider;

    domainMod = await loadModule("/src/lib/domain.js");
    buildIndex = domainMod.buildIndex;
    index = buildIndex();
    const allUnits = domainMod.allUnits;

    const headerMod = await loadModule("/src/components/layout/ArchiveHeader.jsx");
    ArchiveHeader = headerMod.ArchiveHeader;

    const floatingMod = await loadModule("/src/components/layout/MobileFloatingControls.jsx");
    MobileFloatingControls = floatingMod.MobileFloatingControls;

    const drawerMod = await loadModule("/src/components/layout/FilterDrawer.jsx");
    FilterDrawer = drawerMod.FilterDrawer;
  });

  it("verifies ArchiveHeader hides 3 query tabs on mobile via hidden sm:grid", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(ArchiveHeader, {
          totalAllShows: 100,
          allUsedSongs: [{ id: "song-1" }],
          allVenues: [{ name: "武道館" }],
          categoriesCount: 8,
          tab: "show",
          setTab: () => {},
          setQ: () => {},
          setIsFilterDrawerOpen: () => {},
        })
      )
    );

    assert.ok(html.includes("hidden sm:grid"), "ArchiveHeader must hide tabs on small screens via hidden sm:grid");
    assert.ok(html.includes("🎫"), "ArchiveHeader must still contain show emoji tab for desktop");
    assert.ok(html.includes("🎵"), "ArchiveHeader must still contain song emoji tab for desktop");
    assert.ok(html.includes("🏛️"), "ArchiveHeader must still contain venue emoji tab for desktop");
  });

  it("verifies MobileFloatingControls displays dynamic dimension icon and unified '篩選' text across locales", () => {
    const locales = [
      { locale: "zh-TW", expectedText: "篩選" },
      { locale: "ja", expectedText: "絞り込み" },
      { locale: "en", expectedText: "Filter" },
      { locale: "ko", expectedText: "필터" },
    ];

    for (const { locale, expectedText } of locales) {
      // 1. Show mode
      const htmlShow = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: locale },
          React.createElement(MobileFloatingControls, {
            tab: "show",
            onOpenSearch: () => {},
            onOpenDrawer: () => {},
            onReturnHome: () => {},
          })
        )
      );
      assert.ok(htmlShow.includes("🎫"), `MobileFloatingControls must show 🎫 in show mode for ${locale}`);
      assert.ok(htmlShow.includes(expectedText), `MobileFloatingControls must show ${expectedText} in show mode for ${locale}`);

      // 2. Song mode
      const htmlSong = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: locale },
          React.createElement(MobileFloatingControls, {
            tab: "song",
            onOpenSearch: () => {},
            onOpenDrawer: () => {},
            onReturnHome: () => {},
          })
        )
      );
      assert.ok(htmlSong.includes("🎵"), `MobileFloatingControls must show 🎵 in song mode for ${locale}`);
      assert.ok(htmlSong.includes(expectedText), `MobileFloatingControls must show ${expectedText} in song mode for ${locale}`);

      // 3. Venue mode
      const htmlVenue = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: locale },
          React.createElement(MobileFloatingControls, {
            tab: "venue",
            onOpenSearch: () => {},
            onOpenDrawer: () => {},
            onReturnHome: () => {},
          })
        )
      );
      assert.ok(htmlVenue.includes("🏛️"), `MobileFloatingControls must show 🏛️ in venue mode for ${locale}`);
      assert.ok(htmlVenue.includes(expectedText), `MobileFloatingControls must show ${expectedText} in venue mode for ${locale}`);
    }
  });

  it("verifies FilterDrawer renders compact segmented dimension tabs in header", () => {
    let selectedTab = null;
    const htmlDrawer = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(FilterDrawer, {
          isOpen: true,
          tab: "show",
          draftTab: "show",
          onSelectTab: (t) => {
            selectedTab = t;
          },
          onClose: () => {},
          onCommit: () => {},
          confirmButtonLabel: "確認套用",
          renderShowNavigator: () => React.createElement("div", { "data-testid": "show-content" }, "SHOWS"),
          renderSongNavigator: () => React.createElement("div", { "data-testid": "song-content" }, "SONGS"),
          renderVenueNavigator: () => React.createElement("div", { "data-testid": "venue-content" }, "VENUES"),
        })
      )
    );

    assert.ok(htmlDrawer.includes('data-testid="drawer-tab-show"'), "Must render drawer show tab");
    assert.ok(htmlDrawer.includes('data-testid="drawer-tab-song"'), "Must render drawer song tab");
    assert.ok(htmlDrawer.includes('data-testid="drawer-tab-venue"'), "Must render drawer venue tab");
    assert.ok(htmlDrawer.includes('data-testid="show-content"'), "Must render active show content");
    assert.ok(!htmlDrawer.includes('data-testid="song-content"'), "Must NOT render song content when active is show");
    assert.ok(!htmlDrawer.includes('data-testid="venue-content"'), "Must NOT render venue content when active is show");

    // Check that close button ✕ is present
    assert.ok(htmlDrawer.includes("✕"), "Must render ✕ close button in header");
  });

  it("verifies FilterDrawer renders staged tab content when draftTab is song or venue", () => {
    // 1. Staged Song tab
    const htmlSong = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(FilterDrawer, {
          isOpen: true,
          tab: "show", // base tab is show
          draftTab: "song", // staged tab is song
          onSelectTab: () => {},
          onClose: () => {},
          onCommit: () => {},
          confirmButtonLabel: "確認套用",
          renderShowNavigator: () => React.createElement("div", { "data-testid": "show-content" }, "SHOWS"),
          renderSongNavigator: () => React.createElement("div", { "data-testid": "song-content" }, "SONGS"),
          renderVenueNavigator: () => React.createElement("div", { "data-testid": "venue-content" }, "VENUES"),
        })
      )
    );

    assert.ok(htmlSong.includes('data-testid="song-content"'), "Must render staged song content");
    assert.ok(!htmlSong.includes('data-testid="show-content"'), "Must NOT render show content when staged is song");

    // 2. Staged Venue tab
    const htmlVenue = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(FilterDrawer, {
          isOpen: true,
          tab: "show", // base tab is show
          draftTab: "venue", // staged tab is venue
          onSelectTab: () => {},
          onClose: () => {},
          onCommit: () => {},
          confirmButtonLabel: "確認套用",
          renderShowNavigator: () => React.createElement("div", { "data-testid": "show-content" }, "SHOWS"),
          renderSongNavigator: () => React.createElement("div", { "data-testid": "song-content" }, "SONGS"),
          renderVenueNavigator: () => React.createElement("div", { "data-testid": "venue-content" }, "VENUES"),
        })
      )
    );

    assert.ok(htmlVenue.includes('data-testid="venue-content"'), "Must render staged venue content");
    assert.ok(!htmlVenue.includes('data-testid="show-content"'), "Must NOT render show content when staged is venue");
  });

  it("verifies confirmButtonLabel respects staged draftState.tab over base tab", async () => {
    const filterMod = await loadModule("/src/hooks/useArchiveFilter.js");
    const { useArchiveFilter } = filterMod;
    const routeMod = await loadModule("/src/hooks/useArchiveRoute.js");
    const { useArchiveRoute } = routeMod;

    const targetSong = index.allUsedSongs[0];
    assert.ok(targetSong);

    let routeWithStagedSong;
    function TestStagedSongComponent() {
      const filterState = useArchiveFilter({
        unitData: index.unitData,
        trackShows: index.trackShows,
        globalVenueShows: index.globalVenueShows,
        allUsedSongs: index.allUsedSongs,
        allVenues: index.allVenues,
        initialUnitId: domainMod.allUnits[0]?.id ?? null,
        initialSongId: targetSong.id,
        initialVenueName: index.allVenues[0]?.name ?? null,
      });
      routeWithStagedSong = useArchiveRoute({
        unitData: index.unitData,
        allVenues: index.allVenues,
        allUsedSongs: index.allUsedSongs,
        unitIdByShowId: index.unitIdByShowId,
        filterState,
        initialDraftState: {
          tab: "song",
          songId: targetSong.id,
          album: "all",
          songSortMode: "count",
        },
      });
      return null;
    }

    renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(TestStagedSongComponent)
      )
    );

    assert.equal(routeWithStagedSong.tab, "show", "Base tab is show");
    assert.equal(routeWithStagedSong.draftState.tab, "song", "Staged tab is song");
    assert.ok(routeWithStagedSong.confirmButtonLabel.includes("歌曲") || routeWithStagedSong.confirmButtonLabel.includes("《"), "confirmButtonLabel must calculate for staged song tab");
  });
});
