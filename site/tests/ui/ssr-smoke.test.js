import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

describe("6. Component Mount & SSR Render Smoke Test", () => {
  it("renders PaginationPills without runtime exception", async () => {
    const { PaginationPills } = await loadModule(
      "./src/components/navigators/PaginationPills.jsx"
    );
    const { React, renderToStaticMarkup } = await getReactAndRenderer();
    const html = renderToStaticMarkup(
      React.createElement(PaginationPills, {
        total: 30,
        pageSize: 10,
        page: 0,
        onPageChange: () => {},
      })
    );
    assert.ok(html.length > 0);
  });

  it("renders ShowNavigator without ReferenceError", async () => {
    const { ShowNavigator } = await loadModule(
      "./src/components/navigators/ShowNavigator.jsx"
    );
    const { React, renderToStaticMarkup } = await getReactAndRenderer();
    const html = renderToStaticMarkup(
      React.createElement(ShowNavigator, {
        selCategory: "巡演專場",
        selYear: "2024",
        selUnitId: "",
        selShow: "",
        unitPage: 0,
        setUnitPage: () => {},
        showPage: 0,
        setShowPage: () => {},
        unitsByCategory: { "巡演專場": [] },
        categoryStats: {},
        availableYears: ["2024"],
        yearStats: new Map(),
        filteredUnits: [],
        pagedUnits: [],
        current: null,
        unitData: new Map(),
        handleCategoryClick: () => {},
        handleSelectUnit: () => {},
        handleSelectShow: () => {},
      })
    );
    assert.ok(html.length > 0);
    assert.ok(html.includes("選擇演出類型"));
  });

  it("renders SongNavigator without ReferenceError", async () => {
    const { SongNavigator } = await loadModule(
      "./src/components/navigators/SongNavigator.jsx"
    );
    const { React, renderToStaticMarkup } = await getReactAndRenderer();
    const html = renderToStaticMarkup(
      React.createElement(SongNavigator, {
        songSortMode: "album",
        setSongSortMode: () => {},
        selAlbum: "Rejoice (2024)",
        setSelAlbum: () => {},
        selSong: "",
        songPage: 0,
        setSongPage: () => {},
        allUsedSongs: [],
        songsSortedByCount: [],
        filteredSongs: [],
        pagedSongs: [],
        trackShows: new Map(),
        handleSelectSong: () => {},
      })
    );
    assert.ok(html.length > 0);
    assert.ok(html.includes("歌曲分類方式"));
  });

  it("renders VenueNavigator without ReferenceError", async () => {
    const { VenueNavigator } = await loadModule(
      "./src/components/navigators/VenueNavigator.jsx"
    );
    const { React, renderToStaticMarkup } = await getReactAndRenderer();
    const html = renderToStaticMarkup(
      React.createElement(VenueNavigator, {
        venueSortMode: "region",
        setVenueSortMode: () => {},
        selRegion: "日本 - 關東",
        setSelRegion: () => {},
        selVenue: "",
        venuePage: 0,
        setVenuePage: () => {},
        allVenues: [],
        venuesSortedByCount: [],
        filteredVenues: [],
        pagedVenues: [],
        handleSelectVenue: () => {},
      })
    );
    assert.ok(html.length > 0);
    assert.ok(html.includes("場地分類方式"));
  });
});
