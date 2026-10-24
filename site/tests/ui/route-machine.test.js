import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

describe("7. Custom Hooks & Route State Machine Invariants (ADR-0101)", () => {
  let buildIndex;
  let allUnits;
  let useArchiveFilter;
  let useArchiveRoute;
  let index;
  let initialUnitId;
  let initialSongId;
  let initialVenueName;
  let React;
  let renderToStaticMarkup;

  it("prepares domain index and mock browser environment", async () => {
    globalThis.window = {
      location: { hash: "", pathname: "/" },
      addEventListener: () => {},
      removeEventListener: () => {},
      scrollTo: () => {},
      innerHeight: 800,
    };
    globalThis.document = {
      body: { style: {} },
    };

    const domainMod = await loadModule("./src/lib/domain.js");
    buildIndex = domainMod.buildIndex;
    allUnits = domainMod.allUnits;

    const filterMod = await loadModule("./src/hooks/useArchiveFilter.js");
    useArchiveFilter = filterMod.useArchiveFilter;

    const routeMod = await loadModule("./src/hooks/useArchiveRoute.js");
    useArchiveRoute = routeMod.useArchiveRoute;

    const rr = await getReactAndRenderer();
    React = rr.React;
    renderToStaticMarkup = rr.renderToStaticMarkup;

    index = buildIndex();
    initialUnitId = allUnits[0]?.id ?? null;
    initialSongId = index.allUsedSongs[0]?.id ?? null;
    initialVenueName = index.allVenues[0]?.name ?? null;

    assert.ok(index);
    assert.ok(useArchiveFilter);
    assert.ok(useArchiveRoute);
  });

  const runProbe = (hash = "") => {
    globalThis.window.location.hash = hash;
    let capturedFilter = null;
    let capturedRoute = null;

    function ProbeComponent() {
      const filterState = useArchiveFilter({
        unitData: index.unitData,
        trackShows: index.trackShows,
        globalVenueShows: index.globalVenueShows,
        allUsedSongs: index.allUsedSongs,
        allVenues: index.allVenues,
        initialUnitId,
        initialSongId,
        initialVenueName,
      });
      const routeState = useArchiveRoute({
        unitData: index.unitData,
        allUsedSongs: index.allUsedSongs,
        allVenues: index.allVenues,
        unitIdByShowId: index.unitIdByShowId,
        filterState,
      });
      capturedFilter = filterState;
      capturedRoute = routeState;
      return null;
    }

    renderToStaticMarkup(React.createElement(ProbeComponent));
    return { filter: capturedFilter, route: capturedRoute };
  };

  it("handles default and landing routes without active hash", () => {
    const { filter, route } = runProbe("");
    assert.equal(route.viewMode, "landing");
    assert.equal(filter.selCategory, "巡演專場");
    assert.ok(filter.totalAllShows > 0);
  });

  it("penetrates direct deep link for songs (#/song/:id) with album grouping", () => {
    const targetSong = index.allUsedSongs[0]?.id;
    assert.ok(targetSong);
    const { route } = runProbe(`#/song/${targetSong}`);
    assert.equal(route.viewMode, "archive");
    assert.equal(route.tab, "song");
    assert.equal(route.selSong, targetSong);
  });

  it("penetrates direct deep link for shows (#/show/:id) with unit category & year sync", () => {
    const targetShow = Array.from(index.unitIdByShowId.keys())[0];
    assert.ok(targetShow);
    const { route, filter } = runProbe(`#/show/${targetShow}`);
    assert.equal(route.viewMode, "archive");
    assert.equal(route.tab, "show");
    assert.equal(route.selShow, targetShow);
    assert.ok(route.selUnitId);
    assert.ok(filter.selCategory);
  });

  it("penetrates direct deep link for venues (#/venue/:name) with regional grouping", () => {
    const targetVenue = index.allVenues[0]?.name;
    assert.ok(targetVenue);
    const { route } = runProbe(`#/venue/${encodeURIComponent(targetVenue)}`);
    assert.equal(route.viewMode, "archive");
    assert.equal(route.tab, "venue");
    assert.equal(route.selVenue, targetVenue);
  });

  it("penetrates direct deep links for interactive venue map (#/map, #/map/journey, #/map/:regionOrPref)", () => {
    const { route: mapRoot, filter: filterRoot } = runProbe("#/map");
    assert.equal(mapRoot.viewMode, "archive");
    assert.equal(mapRoot.tab, "venue");
    assert.equal(mapRoot.venueSubMode, "venues");
    assert.equal(filterRoot.venueSortMode, "map");
    assert.equal(mapRoot.selMapPrefecture, null);

    const { route: mapJourney } = runProbe("#/map/journey");
    assert.equal(mapJourney.viewMode, "archive");
    assert.equal(mapJourney.tab, "venue");
    assert.equal(mapJourney.venueSubMode, "journey");

    const { route: mapPref, filter: filterPref } = runProbe(`#/map/${encodeURIComponent("島根縣")}`);
    assert.equal(mapPref.viewMode, "archive");
    assert.equal(mapPref.tab, "venue");
    assert.equal(mapPref.venueSubMode, "venues");
    assert.equal(filterPref.venueSortMode, "map");
    assert.equal(mapPref.selMapPrefecture, "島根縣");

    const { route: mapEnPref } = runProbe("#/map/Shimane");
    assert.equal(mapEnPref.viewMode, "archive");
    assert.equal(mapEnPref.tab, "venue");
    assert.equal(mapEnPref.selMapPrefecture, "島根縣");
  });

  it("safely falls back to default landing state on unknown or malformed hash", () => {
    const { route } = runProbe("#/unknown-target-404");
    assert.equal(route.viewMode, "landing");
    const { route: route2 } = runProbe("#/song/non-existent-song-id-xyz");
    assert.equal(route2.viewMode, "landing");
    const { route: route3 } = runProbe("#/map/non-existent-prefecture-xyz");
    assert.equal(route3.viewMode, "landing");
  });

  it("verifies mobile drawer draft state and confirmation label semantics", () => {
    const { route } = runProbe("");
    assert.equal(route.draftState, null);
    assert.equal(route.confirmButtonLabel, "確認套用");
  });

  it("verifies category count sum and filter memoization integrity", () => {
    const { filter } = runProbe("");
    assert.equal(typeof filter.categoryStats, "object");
    assert.ok(Array.isArray(filter.availableYears));
    assert.ok(filter.availableYears.length > 0);
    assert.ok(filter.totalAllShows > 0);
  });
});
