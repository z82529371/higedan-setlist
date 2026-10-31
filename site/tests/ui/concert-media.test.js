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

describe("33. Concert & Tour Media Digest Stage UI (ADR-0136)", () => {
  it("renders SongMediaStage for tour digest with YouTube embed, title and accessible controls", async () => {
    const { SongMediaStage } = await loadModule("src/components/slips/SongMediaStage.jsx");
    const { extractConcertMedia } = await loadModule("src/lib/song-media.js");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const digestMedia = extractConcertMedia({
      title: "Tour 19/20 -Hall Travelers-",
      media: {
        digest: {
          youtubeId: "y3L0pjZZqKo",
          title: "Official髭男dism Tour 19/20 -Hall Travelers- (2020.2.10 パシフィコ横浜)［Digest］",
        },
      },
    });

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongMediaStage, {
          mediaOverride: digestMedia,
          titleOverride: "Tour 19/20 -Hall Travelers-",
          onClose: () => {},
        })
      )
    );

    assert.match(html, /id="song-media-stage"/, "renders unified media stage container");
    assert.match(html, /https:\/\/www\.youtube\.com\/embed\/y3L0pjZZqKo/, "embeds YouTube player with correct video ID");
    assert.match(html, /🎬 巡演精華/, "renders localized tour digest badge");
    assert.match(html, /Tour 19\/20 -Hall Travelers-/, "renders custom title in stage header");
    assert.match(html, /前往 YouTube/, "renders compact Watch on YouTube text");
    assert.match(html, /YouTube.*↗/, "provides direct YouTube watch link");
    assert.match(html, /truncate shrink/, "ensures stage title truncates gracefully on narrow screens");
  });

  it("renders TourSlip always-on digest stage when media.digest is present (Zero DOM Pollution when absent)", async () => {
    const { TourSlip } = await loadModule("src/components/slips/TourSlip.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    // 1. Tour with Digest (Hall Travelers) -> Always-on stage
    const tourWithDigest = {
      id: "tour-19-20-hall-travelers",
      title: "Official髭男dism Tour 19/20 -Hall Travelers-",
      category: "ONE_MAN",
      media: {
        digest: {
          youtubeId: "y3L0pjZZqKo",
          title: "Hall Travelers Digest",
        },
      },
      shows: [{ id: "1", date: "2020-01-01", venue: "Venue A", city: "東京" }],
      templateSetlist: [{ songId: "hello", title: "HELLO" }],
    };

    const htmlWithDigest = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(TourSlip, { tourUnitData: tourWithDigest })
      )
    );
    assert.match(htmlWithDigest, /id="song-media-stage"/, "always renders media stage when digest is present");
    assert.match(htmlWithDigest, /🎬 巡演精華/, "renders single emoji localized digest badge");

    // 2. Tour without Digest (Early tour) -> Zero DOM pollution
    const tourWithoutDigest = {
      id: "free-live-tour-2015",
      title: "Free Live Tour 2015",
      category: "FREE_LIVE",
      shows: [{ id: "2", date: "2015-05-01", venue: "Venue B", city: "島根" }],
      templateSetlist: [{ songId: "sweet-tweet", title: "SWEET TWEET" }],
    };

    const htmlWithoutDigest = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(TourSlip, { tourUnitData: tourWithoutDigest })
      )
    );
    assert.doesNotMatch(htmlWithoutDigest, /id="song-media-stage"/, "does not render stage when media is null");
  });

  it("renders ShowSlip digest button for flagship concerts with media.digest", async () => {
    const { ShowSlip } = await loadModule("src/components/slips/ShowSlip.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const fullMap = new Map();
    fullMap.set("1263675", [{ songId: "hello", title: "HELLO" }]);

    const udWithDigest = {
      unit: {
        id: "online-live-2020-arena-travelers",
        title: "Official髭男dism ONLINE LIVE 2020 - Arena Travelers -",
        type: "線上直播",
        media: {
          digest: {
            youtubeId: "8q4AkXgjdGg",
            title: "Arena Travelers Online Digest",
          },
        },
        shows: [
          {
            id: "1263675",
            date: "2020-09-26",
            city: "線上直播",
            venue: "線上直播",
            title: "Official髭男dism ONLINE LIVE 2020 - Arena Travelers -",
          },
        ],
      },
      full: fullMap,
    };

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(ShowSlip, { ud: udWithDigest, showId: "1263675" })
      )
    );
    assert.match(html, /data-testid="show-digest-btn"/, "renders show digest button for flagship show");
    assert.match(html, /🎬/, "renders single emoji");
    assert.match(html, /演出精華/, "renders clean localized show digest button text");
    assert.match(html, /grid grid-cols-2/, "renders 2-column grid on mobile for primary actions");
    assert.match(html, /紀念小卡/, "renders short memorial card text for mobile viewports");
    assert.match(html, /產生紀念小卡/, "renders full memorial card text for desktop viewports");
    assert.match(html, /w-full sm:w-auto/, "renders responsive full-width more tools button on mobile");
  });
});
