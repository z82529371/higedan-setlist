import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

describe("ReleasesPage Dual-Track & Studio Discography UI (ADR-0144)", () => {
  it("renders segmented dual tabs for live releases and studio discography", async () => {
    const { ReleasesPage } = await loadModule("src/components/releases/ReleasesPage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(ReleasesPage, null)
      )
    );

    assert.ok(html.includes("現場影音"));
    assert.ok(html.includes("錄音室作品"));
    // Default tab is live
    assert.ok(html.includes("CONCERT ARCHIVE // LIVE RELEASES"));
  });

  it("renders studio discography when initialTab is discography", async () => {
    const { ReleasesPage } = await loadModule("src/components/releases/ReleasesPage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(ReleasesPage, { initialTab: "discography" })
      )
    );

    assert.ok(html.includes("CONCERT ARCHIVE // STUDIO DISCOGRAPHY"));
    assert.ok(html.includes("錄音室作品全集"));
    assert.ok(html.includes("Pretender"));
    assert.ok(html.includes("PCCA-04784"));
    // Sub-filters for discography
    assert.ok(html.includes("實體單曲"));
    assert.ok(html.includes("數位單曲"));
    assert.ok(html.includes("正規專輯"));
  });

  it("auto-expands and links tracks when deep-linked with initialTargetId", async () => {
    const { ReleasesPage } = await loadModule("src/components/releases/ReleasesPage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(ReleasesPage, {
          initialTab: "discography",
          initialTargetId: "single-pretender",
        })
      )
    );

    // Deep-linked Pretender tracks should be expanded
    assert.ok(html.includes("#/song/pretender"));
    assert.ok(html.includes("#/song/amazing"));
    assert.ok(html.includes("Pretender (Instrumental)"));
    assert.ok(html.includes("演出票根"));
  });

  it("renders multi-lingual labels properly in Japanese", async () => {
    const { ReleasesPage } = await loadModule("src/components/releases/ReleasesPage.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "ja" },
        React.createElement(ReleasesPage, {
          initialTab: "discography",
          initialTargetId: "single-pretender",
        })
      )
    );

    assert.ok(html.includes("ライブ映像"));
    assert.ok(html.includes("ディスコグラフィ"));
    assert.ok(html.includes("公式ディスコグラフィ"));
    assert.ok(html.includes("CDシングル"));
    assert.ok(html.includes("ライブ履歴"));
  });
});
