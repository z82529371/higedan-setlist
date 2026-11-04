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

describe("36. Official Album Jacket SSOT & Cover Lightbox UI (ADR-0143)", () => {
  it("renders AlbumJacketCard with official cover image for released song (same-blue)", async () => {
    const { AlbumJacketCard } = await loadModule("src/components/slips/AlbumJacketCard.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { getSongSpotify } = await loadModule("src/lib/song-spotify.js");

    const spotify = getSongSpotify("same-blue");
    assert.ok(spotify.coverUrl, "same-blue must have coverUrl");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(AlbumJacketCard, {
          title: "Same Blue",
          coverUrl: spotify.coverUrl,
          onOpenLightbox: () => {},
        })
      )
    );

    assert.ok(html.includes('data-testid="song-album-jacket-btn"'), "Must render interactive button for album jacket");
    assert.ok(html.includes('src="https://image-cdn-ak.spotifycdn.com/image/'), "Must render Spotify CDN image source");
    assert.ok(html.includes("Same Blue"), "Must include song title in alt/title attribute");
    assert.ok(html.includes("🔍"), "Must include zoom preview indicator");
  });

  it("renders AlbumJacketCard with retro vinyl placeholder for unreleased songs (fuusen)", async () => {
    const { AlbumJacketCard } = await loadModule("src/components/slips/AlbumJacketCard.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(AlbumJacketCard, {
          title: "風船",
          coverUrl: null,
          onOpenLightbox: () => {},
        })
      )
    );

    assert.ok(!html.includes('data-testid="song-album-jacket-btn"'), "Must not render interactive button for unreleased song");
    assert.ok(html.includes('role="img"'), "Must render accessible img role for vinyl placeholder");
    assert.ok(html.includes("<svg"), "Must render SVG concentric grooves");
    assert.ok(html.includes("未正式發行作品（黑膠唱片）"), "Must render localized vinyl placeholder aria label");
  });

  it("renders CoverLightboxModal with high-res 640x640 Retina image, caption, and Spotify button when isOpen is true", async () => {
    const { CoverLightboxModal } = await loadModule("src/components/slips/CoverLightboxModal.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { getSongSpotify, buildSpotifyTrackUrl } = await loadModule("src/lib/song-spotify.js");

    const spotify = getSongSpotify("same-blue");
    const trackUrl = buildSpotifyTrackUrl(spotify.trackId);

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(CoverLightboxModal, {
          isOpen: true,
          onClose: () => {},
          title: "Same Blue",
          alias: "",
          album: "Rejoice",
          coverUrl: spotify.coverUrl,
          highResCoverUrl: spotify.highResCoverUrl,
          spotifyTrackUrl: trackUrl,
        })
      )
    );

    assert.ok(html.includes('data-testid="cover-lightbox-modal"'), "Must render modal container");
    assert.ok(html.includes('role="dialog"'), "Must have dialog role for accessibility");
    assert.ok(html.includes("ab67616d0000b273"), "Must display high-res Retina b273 image URL");
    assert.ok(html.includes("Same Blue"), "Must display song title in caption");
    assert.ok(html.includes("Rejoice"), "Must display album in caption");
    assert.ok(html.includes(trackUrl), "Must link to official Spotify track");
    assert.ok(html.includes('data-testid="cover-lightbox-close-btn"'), "Must include close button");
  });

  it("renders CoverLightboxModal as null when isOpen is false", async () => {
    const { CoverLightboxModal } = await loadModule("src/components/slips/CoverLightboxModal.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(CoverLightboxModal, {
          isOpen: false,
          onClose: () => {},
          title: "Same Blue",
          coverUrl: "https://example.com/cover.jpg",
        })
      )
    );

    assert.equal(html, "", "Must render null when closed");
  });

  it("integrates AlbumJacketCard seamlessly inside SongSlip header", async () => {
    const { SongSlip } = await loadModule("src/components/slips/SongSlip.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const mockTrackShows = new Map();
    const mockShowById = new Map();

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(SongSlip, {
          songId: "same-blue",
          trackShows: mockTrackShows,
          showById: mockShowById,
          unitData: {},
          onSelectShow: () => {},
          onSelectVenue: () => {},
        })
      )
    );

    assert.ok(html.includes('data-testid="song-album-jacket-btn"'), "SongSlip header must contain AlbumJacketCard");
    assert.ok(html.includes("ab67616d00001e02"), "SongSlip header must contain official Spotify cover image");
  });

  it("prioritizes first-release single cover over album cover and resolves dual provenance (ADR-0143)", async () => {
    const { getSongSpotify } = await loadModule("src/lib/song-spotify.js");
    const { getSongReleaseProvenance } = await loadModule("src/lib/song-release.js");
    const { CoverLightboxModal } = await loadModule("src/components/slips/CoverLightboxModal.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    // 1. Pretender must resolve to 2nd Single cover (Taipei neon tape c03d59cc), NOT Traveler album (fc273337)
    const pretenderSpotify = getSongSpotify("pretender");
    assert.ok(
      pretenderSpotify.coverUrl.includes("c03d59ccf637e7ce5754e370"),
      `Expected single cover c03d59cc, got ${pretenderSpotify.coverUrl}`
    );

    // 2. Dual provenance must show both Single debut and parent album
    const pretenderProvZh = getSongReleaseProvenance("pretender", "zh-TW");
    assert.equal(pretenderProvZh, "2nd Single《Pretender》(2019) · 収録專輯《Traveler》");

    const pretenderProvJa = getSongReleaseProvenance("pretender", "ja");
    assert.equal(pretenderProvJa, "2nd Single《Pretender》(2019) · 収録アルバム《Traveler》");

    const subtitleProvZh = getSongReleaseProvenance("subtitle", "zh-TW");
    assert.equal(subtitleProvZh, "8th Digital Single《Subtitle》(2022) · 収録專輯《Rejoice》");

    const sameBlueProvJa = getSongReleaseProvenance("same-blue", "ja");
    assert.equal(sameBlueProvJa, "14th Digital Single《Same Blue》(2024) · アルバム未収録");

    const unreleasedProv = getSongReleaseProvenance("fuusen", "zh-TW");
    assert.equal(unreleasedProv, "未正式發行作品（Demo / 現場限定）");

    // 3. Render modal with dual provenance
    const modalHtml = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(CoverLightboxModal, {
          isOpen: true,
          onClose: () => {},
          title: "Pretender",
          provenance: pretenderProvZh,
          coverUrl: pretenderSpotify.coverUrl,
          highResCoverUrl: pretenderSpotify.highResCoverUrl,
          spotifyTrackUrl: "https://open.spotify.com/track/0peJAyrJ03wHnagMFlpgun",
        })
      )
    );

    assert.ok(modalHtml.includes("2nd Single《Pretender》(2019) · 収録專輯《Traveler》"));
  });
});
