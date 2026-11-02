import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

describe("Live Releases UI & Route Seam (ADR-0142)", () => {
  it("verifies routes.js supports #/releases bidirectionally", async () => {
    const { parseRoute, routeHash } = await loadModule("./src/lib/routes.js");
    assert.deepEqual(parseRoute("#/releases"), { kind: "releases", value: null });
    assert.deepEqual(parseRoute("/releases"), { kind: "releases", value: null });
    assert.deepEqual(parseRoute("#/releases?lang=ja"), { kind: "releases", value: null, lang: "ja" });

    assert.equal(routeHash.releases(), "#/releases");
    assert.equal(routeHash.releases({ lang: "ja" }), "#/releases?lang=ja");
  });

  it("renders LiveReleaseSection on recorded show and returns null for unreleased show", async () => {
    const { React, renderToStaticMarkup } = await getReactAndRenderer();
    const { LiveReleaseSection } = await loadModule("./src/components/slips/LiveReleaseSection.jsx");
    const { I18nProvider } = await loadModule("./src/lib/i18n.jsx");

    const mockRelease = {
      id: "editorial-saitama-2022",
      title: "Official髭男dism one-man tour 2021-2022 -Editorial- @ SAITAMA SUPER ARENA",
      shortTitle: "Editorial 埼玉超級競技場",
      releaseDate: "2022-10-05",
      releaseType: "standalone",
      formats: ["bluray", "dvd", "streaming_audio"],
      catalogNumbers: ["PCXP-50896", "PCBP-54456"],
      recordings: [{ showId: "1353361", coverage: "full" }],
      streaming: { spotifyAlbumId: "0G9M787GjA51s23e98wX0T" },
    };

    // Render with releases
    const rendered = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(LiveReleaseSection, { releases: [mockRelease], showId: "1353361" })
      )
    );

    assert.ok(rendered.includes("Editorial 埼玉超級競技場") || rendered.includes("one-man tour 2021-2022 -Editorial-"));
    assert.ok(rendered.includes("PCXP-50896"));
    assert.ok(rendered.includes("Blu-ray"));
    assert.ok(rendered.includes("獨立影音發行") || rendered.includes("獨立"));
    assert.ok(rendered.includes("全場收錄"));
    assert.ok(rendered.includes('id="show-releases"'));

    // Render with empty releases (Zero DOM pollution)
    const emptyRendered = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(LiveReleaseSection, { releases: [] })
      )
    );
    assert.equal(emptyRendered, "");
  });

  it("renders ReleasesPage in SSR with collection of releases", async () => {
    const { React, renderToStaticMarkup } = await getReactAndRenderer();
    const { ReleasesPage } = await loadModule("./src/components/releases/ReleasesPage.jsx");
    const { I18nProvider } = await loadModule("./src/lib/i18n.jsx");

    const rendered = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(ReleasesPage, {})
      )
    );

    assert.ok(rendered.includes("Editorial"));
    assert.ok(rendered.includes("SHOCKING NUTS"));
    assert.ok(rendered.includes("Blu-ray"));
  });

  it("renders status-bar-releases-btn in ArchiveStatusBar when handleSelectReleases is present", async () => {
    const { React, renderToStaticMarkup } = await getReactAndRenderer();
    const { ArchiveStatusBar } = await loadModule("./src/components/layout/ArchiveStatusBar.jsx");
    const { I18nProvider } = await loadModule("./src/lib/i18n.jsx");

    const rendered = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(ArchiveStatusBar, {
          totalShows: 500,
          tab: "tour",
          handleSelectReleases: () => {},
          storage: { getItem: () => null, setItem: () => {} },
          slipRef: { current: null },
        })
      )
    );

    assert.ok(rendered.includes('data-testid="status-bar-releases-btn"'));
    assert.ok(rendered.includes("作品"));
  });
});
