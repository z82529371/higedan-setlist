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
  };
}
if (!globalThis.document) {
  globalThis.document = {
    body: { style: {} },
    getElementById: () => null,
  };
}

describe("34. Spotify Audio Stage & SongSlip In-Place Integration (UI SSR, ADR-0138)", () => {
  it("renders SpotifyAudioStage as null when song has no spotify data (fuusen)", async () => {
    const { SpotifyAudioStage } = await loadModule("src/components/slips/SpotifyAudioStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SpotifyAudioStage, { songId: "fuusen" })
      )
    );
    assert.equal(html, "", "Must render null with zero DOM footprint when unreleased");
  });

  it("renders compact Spotify embed player for studio-only track (sanitizer)", async () => {
    const { SpotifyAudioStage } = await loadModule("src/components/slips/SpotifyAudioStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SpotifyAudioStage, { songId: "sanitizer" })
      )
    );

    assert.ok(html.includes('id="song-spotify-stage"'), "Must render #song-spotify-stage container");
    assert.ok(html.includes("https://open.spotify.com/embed/track/4eCYeVfzGsS6jq8aX43yDr"), "Must embed sanitizer track");
    assert.ok(html.includes("https://open.spotify.com/track/4eCYeVfzGsS6jq8aX43yDr"), "Must provide direct Spotify link");
    assert.ok(
      html.includes('scrolling="no"') && html.includes("h-[152px]"),
      "Must lock player height to exact 152px and specify scrolling=no to eliminate scrollbar and whitespace"
    );
  });

  it("renders dual track switcher and multi-live selector pills for songs with live tracks (pretender)", async () => {
    const { SpotifyAudioStage } = await loadModule("src/components/slips/SpotifyAudioStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const htmlStudio = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SpotifyAudioStage, { songId: "pretender", initialTrack: "studio" })
      )
    );

    assert.ok(htmlStudio.includes("錄音室原曲"), "Must render studio tab button");
    assert.ok(htmlStudio.includes("現場 Live"), "Must render live tab button");

    const htmlLive = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SpotifyAudioStage, {
          songId: "pretender",
          initialTrack: "live",
          onSelectShow: () => {},
        })
      )
    );

    assert.ok(htmlLive.includes('data-testid="song-spotify-live-selector"'), "Must render live selector pills");
    assert.ok(htmlLive.includes("one-man tour 2019"), "Must render 2019 tour pill");
    assert.ok(htmlLive.includes("前往該場次票根"), "Must render show deep link button");
  });

  it("renders across 4 locales with full i18n parity", async () => {
    const { SpotifyAudioStage } = await loadModule("src/components/slips/SpotifyAudioStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const locales = [
      { code: "zh-TW", title: "Spotify 官方音源舞台", studio: "錄音室原曲" },
      { code: "ja", title: "Spotify 公式音源ステージ", studio: "スタジオ原曲" },
      { code: "en", title: "Spotify Official Audio Stage", studio: "Studio Version" },
      { code: "ko", title: "Spotify 공식 음원 무대", studio: "스튜디오 원곡" },
    ];

    for (const { code, title, studio } of locales) {
      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: code },
          React.createElement(SpotifyAudioStage, { songId: "pretender" })
        )
      );
      assert.ok(html.includes(title), `Locale ${code} must render correct stage title`);
      assert.ok(html.includes(studio), `Locale ${code} must render correct studio tab text`);
    }
  });

  it("renders in-place within SongSlip for released and unreleased songs", async () => {
    const { SongSlip } = await loadModule("src/components/slips/SongSlip.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const mockTrackShows = new Map();
    const mockShowById = new Map();

    const htmlPretender = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongSlip, {
          songId: "pretender",
          trackShows: mockTrackShows,
          showById: mockShowById,
        })
      )
    );

    assert.ok(htmlPretender.includes('id="song-spotify-stage"'), "SongSlip must include Spotify stage for Pretender");

    const htmlFuusen = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongSlip, {
          songId: "fuusen",
          trackShows: mockTrackShows,
          showById: mockShowById,
        })
      )
    );

    assert.ok(!htmlFuusen.includes('id="song-spotify-stage"'), "SongSlip must not include Spotify stage for unreleased Fuusen");
    assert.ok(htmlFuusen.includes("open.spotify.com/search"), "SongSlip must fall back to search URL for Fuusen");
  });

  it("supports collapsible stage toggling (collapsing hides player body to save mobile vertical space)", async () => {
    const { SpotifyAudioStage } = await loadModule("src/components/slips/SpotifyAudioStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    // Expanded stage (default)
    const htmlExpanded = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SpotifyAudioStage, { songId: "pretender", collapsed: false })
      )
    );
    assert.ok(htmlExpanded.includes("收合 ▴"), "Expanded stage must show collapse toggle button");
    assert.ok(htmlExpanded.includes("<iframe"), "Expanded stage must render embed iframe");
    assert.ok(htmlExpanded.includes("錄音室原曲"), "Expanded stage must render track switcher");

    // Collapsed stage
    const htmlCollapsed = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SpotifyAudioStage, { songId: "pretender", collapsed: true })
      )
    );
    assert.ok(htmlCollapsed.includes("展開 ▾"), "Collapsed stage must show expand toggle button");
    assert.ok(!htmlCollapsed.includes("<iframe"), "Collapsed stage must not render embed iframe");
    assert.ok(!htmlCollapsed.includes("錄音室原曲"), "Collapsed stage must not render track switcher");
    assert.ok(htmlCollapsed.includes("Spotify 官方音源舞台"), "Collapsed stage must retain header title");
    assert.ok(htmlCollapsed.includes("Spotify ↗"), "Collapsed stage must retain direct outbound link");
  });
});
