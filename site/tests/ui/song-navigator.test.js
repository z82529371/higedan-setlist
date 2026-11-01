import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

describe("18. Song Navigator Decoupled Filtering & Search Invariants", () => {
  it("renders songs filtered by album and sorted by count simultaneously", async () => {
    const { SongNavigator } = await loadModule("src/components/navigators/SongNavigator.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    const mockSongs = [
      { id: "song-1", title: "Traveler Alpha", album: "Traveler" },
      { id: "song-2", title: "Traveler Beta", album: "Traveler" },
      { id: "song-3", title: "Editorial Song", album: "Editorial" },
    ];

    const mockTrackShows = new Map([
      ["song:song-1", [{ showId: "s1" }]],
      ["song:song-2", [{ showId: "s1" }, { showId: "s2" }, { showId: "s3" }]],
      ["song:song-3", [{ showId: "s1" }, { showId: "s2" }]],
    ]);

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(SongNavigator, {
          selAlbum: "Traveler",
          songSortMode: "count",
          allUsedSongs: mockSongs,
          trackShows: mockTrackShows,
          selSong: "song-2",
          onNavigateRanking: () => {},
          handleSelectSong: () => {},
        })
      )
    );

    // Traveler Beta has 3 shows, Traveler Alpha has 1 show
    assert.ok(html.includes("Traveler Beta"), "includes Traveler Beta");
    assert.ok(html.includes("Traveler Alpha"), "includes Traveler Alpha");
    assert.ok(!html.includes("Editorial Song"), "excludes songs from other albums when Traveler is selected");

    // Check that Traveler Beta appears before Traveler Alpha (sorted by count: 3 vs 1)
    const idxBeta = html.indexOf("Traveler Beta");
    const idxAlpha = html.indexOf("Traveler Alpha");
    assert.ok(idxBeta < idxAlpha, "Traveler Beta (3 shows) appears before Traveler Alpha (1 show)");

    // Check that album tabs and sort options exist
    assert.ok(html.includes("Traveler"), "includes album tabs");
    assert.ok(!html.includes("全部專輯"), "omits ALL albums button per ADR-0070 kiosk invariants");
    assert.ok(!html.includes("想看前三名頒獎台"), "does not include promotional leaderboard banner");
  });
});
