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
  };
}

describe("33. Song Media Stage & SongSlip In-Place Integration (UI SSR)", () => {
  const mockPretenderMedia = {
    songId: "pretender",
    hasMedia: true,
    hasLive: true,
    hasMv: true,
    defaultTrack: "live",
    live: {
      youtubeId: "bJXIYp2f0pc",
      title: "one-man tour 2019 @ 日本武道館",
      showId: "1078251",
      start: 0,
    },
    mv: {
      youtubeId: "TQ8WlA2GXbk",
      title: "Pretender",
      start: 0,
    },
  };

  it("renders SongMediaStage as null when song has no media (Zero DOM pollution)", async () => {
    const { SongMediaStage } = await loadModule("src/components/slips/SongMediaStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongMediaStage, {
          songId: "50pct",
          mediaOverride: { hasMedia: false },
        })
      )
    );

    assert.strictEqual(html, "", "Stage must render null when song has no media");
  });

  it("renders SongMediaStage with in-place iframe embed, dual tabs, show deep-link, and mobile layout", async () => {
    const { SongMediaStage } = await loadModule("src/components/slips/SongMediaStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const htmlZh = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongMediaStage, {
          songId: "pretender",
          mediaOverride: mockPretenderMedia,
        })
      )
    );

    // Verifies stage test id
    assert.ok(htmlZh.includes('data-testid="song-media-stage"'), "Must render in-place stage");
    // Verifies youtube embed iframe
    assert.ok(htmlZh.includes("youtube.com/embed/bJXIYp2f0pc"), "Must load youtube embed URL");
    // Verifies dual tabs
    assert.ok(htmlZh.includes("🎪 現場 Live"), "Must render live tab");
    assert.ok(htmlZh.includes("🎬 官方 MV"), "Must render MV tab");
    // Verifies show deep-link badge
    assert.ok(htmlZh.includes("前往該場次票根 →"), "Must render show deep link button");
    assert.ok(htmlZh.includes("one-man tour 2019 @ 日本武道館"), "Must display live venue title");
    // Verifies responsive mobile label
    assert.ok(htmlZh.includes("YouTube ↗"), "Must include mobile-optimized compact YouTube label");

    // Japanese locale check
    const htmlJa = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "ja" },
        React.createElement(SongMediaStage, {
          songId: "pretender",
          mediaOverride: mockPretenderMedia,
        })
      )
    );
    assert.ok(htmlJa.includes("🎪 ライブ映像"), "Must render Japanese live tab");
    assert.ok(htmlJa.includes("🎬 公式 MV"), "Must render Japanese MV tab");
    assert.ok(htmlJa.includes("この公演のチケットを見る →"), "Must render Japanese show link");
  });

  it("renders SongMediaStage with live excerpt badge and time interval when end is defined", async () => {
    const { SongMediaStage } = await loadModule("src/components/slips/SongMediaStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const mockExcerptMedia = {
      songId: "shukumei",
      hasMedia: true,
      hasLive: true,
      hasMv: false,
      defaultTrack: "live",
      live: {
        youtubeId: "2gN8QjN4N5U",
        title: "Arena Tour Teaser",
        start: 195,
        end: 225,
        isExcerpt: true,
        durationSeconds: 30,
        timeRangeText: "03:15 ~ 03:45",
      },
      mv: null,
    };

    const htmlZh = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongMediaStage, {
          songId: "shukumei",
          mediaOverride: mockExcerptMedia,
        })
      )
    );

    assert.ok(htmlZh.includes("🎪 現場精華"), "Must label live tab as 現場精華 for excerpt");
    assert.ok(htmlZh.includes("03:15 ~ 03:45"), "Must render time interval badge");
    assert.ok(htmlZh.includes("start=195&amp;end=225"), "Must include start and end parameters in iframe URL");
  });

  it("renders SongMediaStage with multi-live version selector sub-bar when multiple concerts exist", async () => {
    const { SongMediaStage } = await loadModule("src/components/slips/SongMediaStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const mockMultiLiveMedia = {
      songId: "pretender",
      hasMedia: true,
      hasLive: true,
      hasMultipleLives: true,
      hasMv: true,
      defaultTrack: "live",
      lives: [
        {
          youtubeId: "bJXIYp2f0pc",
          title: "one-man tour 2019 @ 日本武道館",
          shortTitle: "2019 武道館",
          showId: "1078251",
          start: 0,
        },
        {
          youtubeId: "h8rZAMiRTTo",
          title: "LIVE at STADIUM 2025 @ 日産スタジアム",
          shortTitle: "2025 日產",
          showId: "1735839",
          start: 0,
        },
      ],
      live: {
        youtubeId: "bJXIYp2f0pc",
        title: "one-man tour 2019 @ 日本武道館",
        shortTitle: "2019 武道館",
        showId: "1078251",
        start: 0,
      },
      mv: {
        youtubeId: "TQ8WlA2GXbk",
        title: "Pretender",
        start: 0,
      },
    };

    const htmlZh = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongMediaStage, {
          songId: "pretender",
          mediaOverride: mockMultiLiveMedia,
        })
      )
    );

    assert.ok(htmlZh.includes('data-testid="song-media-live-selector"'), "Must render multi-live selector");
    assert.ok(htmlZh.includes("場次版本："), "Must render live versions label");
    assert.ok(htmlZh.includes("2019 武道館"), "Must render 2019 武道館 pill");
    assert.ok(htmlZh.includes("2025 日產"), "Must render 2025 日產 pill");
  });

  it("renders SongMediaStage with multi-mv version selector sub-bar when multiple MVs exist", async () => {
    const { SongMediaStage } = await loadModule("src/components/slips/SongMediaStage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const mockMultiMvMedia = {
      songId: "rashisa",
      hasMedia: true,
      hasLive: false,
      hasMultipleLives: false,
      hasMv: true,
      hasMultipleMvs: true,
      defaultTrack: "mv",
      lives: [],
      live: null,
      mvs: [
        {
          youtubeId: "keOnleW2eak",
          title: "Official髭男dism - らしさ [Official Video]",
          shortTitle: "官方 MV",
          subType: "mv",
        },
        {
          youtubeId: "CWZ0lTUs5Mk",
          title: "「らしさ」✕ 劇場アニメ「ひゃくえむ。」コラボレーション MV",
          shortTitle: "動畫版 MV",
          subType: "anime",
        },
      ],
      mv: {
        youtubeId: "keOnleW2eak",
        title: "Official髭男dism - らしさ [Official Video]",
        shortTitle: "官方 MV",
        subType: "mv",
      },
    };

    const htmlZh = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongMediaStage, {
          songId: "rashisa",
          mediaOverride: mockMultiMvMedia,
          initialTrack: "mv",
        })
      )
    );

    assert.ok(htmlZh.includes('data-testid="song-media-mv-selector"'), "Must render multi-mv selector");
    assert.ok(htmlZh.includes("MV 版本："), "Must render mv versions label");
    assert.ok(htmlZh.includes("官方 MV"), "Must render 官方 MV pill");
    assert.ok(htmlZh.includes("動畫版 MV"), "Must render 動畫版 MV pill");
    assert.ok(htmlZh.includes("🎨"), "Must render palette icon for anime MV");
  });

  it("renders SongSlip with in-place media stage for populated songs and fallback search for unpopulated songs", async () => {
    const { SongSlip } = await loadModule("src/components/slips/SongSlip.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const mockTrackShows = new Map();
    const mockShowById = new Map();

    // 1. Populated song: pretender has Live -> renders in-place stage and toolbar button
    const htmlPretender = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongSlip, {
          songId: "pretender",
          trackShows: mockTrackShows,
          showById: mockShowById,
          unitData: [],
        })
      )
    );
    assert.ok(htmlPretender.includes("🎬 現場影片"), "Populated song must render 🎬 現場影片 button");
    assert.ok(htmlPretender.includes('data-testid="song-media-stage"'), "Populated song must render in-place stage");
    assert.ok(htmlPretender.includes("youtube.com/embed/"), "Must embed youtube player in-place");

    // 2. Unpopulated song: travelers has no media -> renders fallback "▶ YouTube" and zero stage DOM
    const htmlUnpopulated = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongSlip, {
          songId: "travelers",
          trackShows: mockTrackShows,
          showById: mockShowById,
          unitData: [],
        })
      )
    );
    assert.ok(htmlUnpopulated.includes("▶ YouTube"), "Unpopulated song must render ▶ YouTube search link");
    assert.ok(htmlUnpopulated.includes("youtube.com/results?search_query="), "Must contain search query url");
    assert.ok(!htmlUnpopulated.includes('data-testid="song-media-stage"'), "Unpopulated song must not render stage");
  });
});
