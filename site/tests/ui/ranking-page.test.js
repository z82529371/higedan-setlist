import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

describe("17. Ranking Page Component Invariants", () => {
  it("renders Leaderboard Top 3 Podium and ranks list via SSR", async () => {
    const { RankingPage } = await loadModule("src/components/ranking/RankingPage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    const mockSongs = [
      { id: "pretender", title: "Pretender", album: "Traveler" },
      { id: "shukumei", title: "宿命", album: "Traveler" },
      { id: "stand-by-you", title: "Stand By You", album: "Traveler" },
      { id: "cry-baby", title: "Cry Baby", album: "Editorial" },
      { id: "subtitle", title: "Subtitle", album: "Rejoice" },
    ];

    const mockTrackShows = new Map([
      ["song:pretender", [{ showId: "s1", unitType: "巡演專場" }, { showId: "s2", unitType: "音樂節" }, { showId: "s3", unitType: "巡演專場" }]],
      ["song:shukumei", [{ showId: "s1", unitType: "巡演專場" }, { showId: "s2", unitType: "音樂節" }]],
      ["song:stand-by-you", [{ showId: "s1", unitType: "巡演專場" }]],
      ["song:cry-baby", [{ showId: "s2", unitType: "音樂節" }]],
      ["song:subtitle", [{ showId: "s3", unitType: "巡演專場" }]],
    ]);

    const mockShowById = new Map([
      ["s1", { id: "s1", date: "2019-07-01" }],
      ["s2", { id: "s2", date: "2021-08-01" }],
      ["s3", { id: "s3", date: "2024-09-01" }],
    ]);

    const mockVenues = [
      { name: "日本武道館", country: "日本", prefecture: "東京都", shows: [{ id: "s1" }, { id: "s2" }] },
      { name: "橫濱競技場", country: "日本", prefecture: "神奈川縣", shows: [{ id: "s3" }] },
    ];

    let selectedSong = null;
    let selectedVenue = null;

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(RankingPage, {
          allUsedSongs: mockSongs,
          allVenues: mockVenues,
          trackShows: mockTrackShows,
          showById: mockShowById,
          onSelectSong: (id) => { selectedSong = id; },
          onSelectVenue: (name) => { selectedVenue = name; },
          onReturnArchive: () => {},
          onReturnHome: () => {},
          onSelectTickets: () => {},
        })
      )
    );

    // Assert that #1 Pretender appears in podium
    assert.ok(html.includes("Pretender"), "renders Pretender");
    assert.ok(html.includes("宿命"), "renders 宿命");
    assert.ok(html.includes("Stand By You"), "renders Stand By You");
    // Assert podium badges exist
    assert.ok(html.includes("🥇") || html.includes("#01") || html.includes("#1"), "contains #1 gold medal or badge");
    assert.ok(!html.includes("登場率"), "does not explicitly show the label '登場率'");
    assert.ok(!html.includes("第 1 名"), "omits redundant 第 1 名 label in podium badge");
    assert.ok(!html.includes("名次"), "omits redundant 名次 in table header");
    assert.ok(html.includes("%"), "renders direct percentage");
  });

  it("renders RankingPage with full production domain dataset without runtime errors", async () => {
    const { RankingPage } = await loadModule("src/components/ranking/RankingPage.jsx");
    const { buildIndex } = await loadModule("src/lib/domain.js");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    const index = buildIndex();
    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(RankingPage, {
          allUsedSongs: index.allUsedSongs,
          allVenues: index.allVenues,
          trackShows: index.trackShows,
          showById: index.showById,
          onSelectSong: () => {},
          onSelectVenue: () => {},
          onReturnArchive: () => {},
          onReturnHome: () => {},
          onSelectTickets: () => {},
        })
      )
    );

    assert.ok(html.includes("STATISTICS"));
    assert.ok(html.includes("演出排行"));
    assert.ok(!html.includes("歷史演出之王"));
    assert.ok(!html.includes("人氣王"));
    assert.ok(html.includes("#01"));
    // Mobile Floating Controls Invariant (Ticket Book & Footprint parity)
    assert.ok(html.includes("data-testid=\"mobile-ranking-back-archive-fab\""), "renders mobile return archive button");
    assert.ok(html.includes("data-testid=\"mobile-ranking-back-home-fab\""), "renders mobile return home button");
    assert.ok(!html.includes("data-testid=\"mobile-ranking-fab\""), "does not render redundant mobile ranking button to itself");
    assert.ok(!html.includes("開啟篩選抽屜"), "does not render archive filter drawer button");
  });
});
