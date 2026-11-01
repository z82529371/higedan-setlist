import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "../helpers/vite-server.js";

describe("15. Leaderboard Hall & Concert Ranking Pipeline Invariants", () => {
  it("computes accurate all-time song rankings, sub-boards, and top venues", async () => {
    const { computeRankings } = await loadModule("src/lib/ranking.js");

    const mockSongs = [
      { id: "song-a", title: "Song Alpha" },
      { id: "song-b", title: "Song Beta" },
      { id: "song-c", title: "Song Gamma" },
    ];

    const mockTrackShows = new Map([
      [
        "song:song-a",
        [
          { showId: "s1", unitType: "巡演專場" },
          { showId: "s2", unitType: "巡演專場" },
          { showId: "s3", unitType: "音樂節" },
        ],
      ],
      [
        "song:song-b",
        [
          { showId: "s1", unitType: "巡演專場" },
          { showId: "s4", unitType: "音樂節" },
        ],
      ],
      [
        "song:song-c",
        [
          { showId: "s5", unitType: "音樂節" },
        ],
      ],
    ]);

    const mockShowById = new Map([
      ["s1", { id: "s1", date: "2019-05-01" }],
      ["s2", { id: "s2", date: "2024-11-01" }],
      ["s3", { id: "s3", date: "2022-08-15" }],
      ["s4", { id: "s4", date: "2023-08-20" }],
      ["s5", { id: "s5", date: "2021-07-10" }],
    ]);

    const mockVenues = [
      { name: "Venue 1", shows: [{ id: "s1" }, { id: "s2" }, { id: "s3" }] },
      { name: "Venue 2", shows: [{ id: "s4" }] },
      { name: "Venue 3", shows: [{ id: "s5" }] },
    ];

    const result = computeRankings({
      allUsedSongs: mockSongs,
      allVenues: mockVenues,
      trackShows: mockTrackShows,
      showById: mockShowById,
    });

    // 1. All-time songs
    assert.equal(result.allTimeSongs.length, 3);
    assert.equal(result.allTimeSongs[0].id, "song-a");
    assert.equal(result.allTimeSongs[0].count, 3);
    assert.equal(result.allTimeSongs[0].rank, 1);
    assert.equal(result.allTimeSongs[0].firstYear, "2019");
    assert.equal(result.allTimeSongs[0].latestYear, "2024");
    assert.equal(result.allTimeSongs[0].percent, 100);

    assert.equal(result.allTimeSongs[1].id, "song-b");
    assert.equal(result.allTimeSongs[1].count, 2);
    assert.equal(result.allTimeSongs[1].rank, 2);
    assert.equal(result.allTimeSongs[1].firstYear, "2019");
    assert.equal(result.allTimeSongs[1].latestYear, "2023");
    assert.equal(Math.round(result.allTimeSongs[1].percent), 67);

    // 2. One-man tour sub-board
    assert.equal(result.oneManSongs.length, 2);
    assert.equal(result.oneManSongs[0].id, "song-a");
    assert.equal(result.oneManSongs[0].count, 2);
    assert.equal(result.oneManSongs[1].id, "song-b");
    assert.equal(result.oneManSongs[1].count, 1);

    // 3. Festival sub-board
    assert.equal(result.festivalSongs.length, 3);
    // All 3 have 1 festival show
    assert.ok(result.festivalSongs.every((s) => s.count === 1));

    // 4. Top venues
    assert.equal(result.topVenues.length, 3);
    assert.equal(result.topVenues[0].name, "Venue 1");
    assert.equal(result.topVenues[0].count, 3);
    assert.equal(result.topVenues[0].rank, 1);
    assert.equal(result.topVenues[0].percent, 100);
    // Venues 2 and 3 both have count 1, so tie-breaking via name.localeCompare occurs
    assert.equal(result.topVenues[1].name, "Venue 2");
    assert.equal(result.topVenues[2].name, "Venue 3");
  });

  it("computes rankings against production dataset without runtime errors", async () => {
    const { computeRankings } = await loadModule("src/lib/ranking.js");
    const { buildIndex } = await loadModule("src/lib/domain.js");

    const index = buildIndex();
    const result = computeRankings({
      allUsedSongs: index.allUsedSongs,
      allVenues: index.allVenues,
      trackShows: index.trackShows,
      showById: index.showById,
    });

    assert.ok(result.allTimeSongs.length > 50, "allTimeSongs populated");
    assert.ok(result.oneManSongs.length > 30, "oneManSongs populated");
    assert.ok(result.festivalSongs.length > 20, "festivalSongs populated");
    assert.ok(result.topVenues.length > 20, "topVenues populated");

    // Verify top venue has rank 1 and positive count
    assert.equal(result.topVenues[0].rank, 1);
    assert.ok(result.topVenues[0].count > 0);
  });
});
