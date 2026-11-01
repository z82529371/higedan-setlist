import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "../helpers/vite-server.js";

describe("16. Ranking Route Machine & Deep Linking Invariants", () => {
  it("parses and builds #/ranking route hash with language queries", async () => {
    const { parseRoute, buildRouteHash, routeHash } = await loadModule("src/lib/routes.js");

    // Parsing #/ranking
    assert.deepEqual(parseRoute("#/ranking"), { kind: "ranking", value: null });
    assert.deepEqual(parseRoute("/ranking"), { kind: "ranking", value: null });
    assert.deepEqual(parseRoute("#/ranking?lang=ja"), { kind: "ranking", value: null, lang: "ja" });
    assert.deepEqual(parseRoute("#/ranking?lang=en"), { kind: "ranking", value: null, lang: "en" });

    // Building #/ranking
    assert.equal(buildRouteHash("ranking"), "#/ranking");
    assert.equal(buildRouteHash("ranking", null, { lang: "ja" }), "#/ranking?lang=ja");
    assert.equal(routeHash.ranking(), "#/ranking");
    assert.equal(routeHash.ranking({ lang: "ko" }), "#/ranking?lang=ko");
  });

  it("initializes viewMode to ranking when URL hash is #/ranking", async () => {
    globalThis.window = {
      location: { hash: "#/ranking", pathname: "/" },
      addEventListener: () => {},
      removeEventListener: () => {},
      scrollTo: () => {},
      innerHeight: 800,
    };
    globalThis.document = {
      body: { style: {} },
    };

    const { loadModule, getReactAndRenderer } = await import("../helpers/vite-server.js");
    const { useArchiveRoute } = await loadModule("src/hooks/useArchiveRoute.js");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();

    let capturedRouteState = null;
    function TestConsumer() {
      capturedRouteState = useArchiveRoute({
        unitData: new Map(),
        allUsedSongs: [],
        allVenues: [],
        unitIdByShowId: new Map(),
        filterState: {},
      });
      return React.createElement("div", null, capturedRouteState.viewMode);
    }

    renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(TestConsumer, null)
      )
    );

    assert.ok(capturedRouteState);
    assert.equal(capturedRouteState.viewMode, "ranking");
    assert.equal(typeof capturedRouteState.handleSelectRanking, "function");
  });
});
