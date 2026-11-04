import { describe, it } from "node:test";
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
    matchMedia: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
  };
}

describe("37. Song Jacket Hover Card in Setlists (ADR-0145)", () => {
  it("renders SongJacketHoverCard with mini vinyl sleeve when open for released song", async () => {
    const { SongJacketHoverCard } = await loadModule("src/components/slips/SongJacketHoverCard.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongJacketHoverCard, {
          songId: "pretender",
          title: "Pretender",
          href: "#/song/pretender",
          className: "test-link font-medium",
          forceOpen: true,
        })
      )
    );

    assert.ok(html.includes('data-testid="song-jacket-hover-container"'), "Must render hover card container");
    assert.ok(html.includes('data-testid="song-jacket-hover-sleeve"'), "Must render mini vinyl sleeve popup when forceOpen is true");
    assert.ok(html.includes('href="#/song/pretender"'), "Must preserve href link");
    assert.ok(html.includes("Pretender"), "Must display song title");
    assert.ok(html.includes("c03d59ccf637e7ce5754e370"), "Must include official Spotify CDN cover image URL");
    assert.ok(html.includes("點擊檢視單曲歷史"), "Must include localized guidance hint");
  });

  it("renders pure clean link without hover container or sleeve for unreleased song (fuusen)", async () => {
    const { SongJacketHoverCard } = await loadModule("src/components/slips/SongJacketHoverCard.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongJacketHoverCard, {
          songId: "fuusen",
          title: "風船",
          href: "#/song/fuusen",
          className: "test-link",
          forceOpen: true,
        })
      )
    );

    assert.ok(!html.includes('data-testid="song-jacket-hover-container"'), "Must not render hover container for unreleased song");
    assert.ok(!html.includes('data-testid="song-jacket-hover-sleeve"'), "Must not render sleeve popup for unreleased song");
    assert.ok(html.includes('href="#/song/fuusen"'), "Must still render standard clean link");
    assert.ok(html.includes("風船"), "Must render song title");
  });

  it("integrates SongJacketHoverCard inside ShowSlip setlist items", async () => {
    const { ShowSlip } = await loadModule("src/components/slips/ShowSlip.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const mockUnitData = {
      unit: {
        id: "tour-2024",
        title: "Rejoice Tour 2024",
        type: "巡演專場",
        isTour: true,
        shows: [
          {
            id: "2024-09-01-pia-arena-mm",
            date: "2024-09-01",
            venue: "Pia Arena MM",
            city: "橫濱",
          },
        ],
      },
      full: new Map([
        [
          "2024-09-01-pia-arena-mm",
          [
            { order: 1, songId: "pretender", title: "Pretender", encore: false },
            { order: 2, songId: "fuusen", title: "風船", encore: false },
          ],
        ],
      ]),
    };

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(ShowSlip, {
          showId: "2024-09-01-pia-arena-mm",
          ud: mockUnitData,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      )
    );

    // pretender has cover -> hover container rendered
    assert.ok(
      html.includes('data-testid="song-jacket-hover-container"'),
      "ShowSlip must render SongJacketHoverCard for released song with cover"
    );
    assert.ok(html.includes("Pretender"), "ShowSlip must display Pretender");
  });

  it("integrates SongJacketHoverCard inside TourTrackItem for consensus tracks", async () => {
    const { TourTrackItem } = await loadModule("src/components/slips/TourTrackItem.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const mockTrack = {
      order: 1,
      cue: "M1",
      songId: "pretender",
      title: "Pretender",
      tier: "staple",
      tierLabel: "固定曲目",
      pct: 100,
      playedCount: 20,
    };

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(TourTrackItem, {
          track: mockTrack,
          totalShows: 20,
          onSelectSong: () => {},
        })
      )
    );

    assert.ok(
      html.includes('data-testid="song-jacket-hover-container"'),
      "TourTrackItem must render SongJacketHoverCard for clickable track with cover"
    );
    assert.ok(html.includes("Pretender"), "TourTrackItem must display Pretender");
  });

  it("integrates SongJacketHoverCard inside TourSurpriseTrackItem for rotational tracks", async () => {
    const { TourSurpriseTrackItem } = await loadModule("src/components/slips/TourTrackItem.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const mockTrack = {
      order: 10,
      songId: "subtitle",
      title: "Subtitle",
      tier: "rotation",
      tierLabel: "輪替曲目",
      pct: 35,
      playedCount: 7,
      shows: [],
    };

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(TourSurpriseTrackItem, {
          track: mockTrack,
          totalShows: 20,
          onSelectSong: () => {},
        })
      )
    );

    assert.ok(
      html.includes('data-testid="song-jacket-hover-container"'),
      "TourSurpriseTrackItem must render SongJacketHoverCard for clickable track with cover"
    );
    assert.ok(html.includes("Subtitle"), "TourSurpriseTrackItem must display Subtitle");
  });
});
