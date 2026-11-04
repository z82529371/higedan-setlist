import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute, buildRouteHash, routeHash } from "../../src/lib/routes.js";

test("Releases Route & Deep-Link Query Parsing (ADR-0144)", async (t) => {
  await t.test("parses #/releases with tab and id query parameters", () => {
    const route = parseRoute("#/releases?tab=discography&id=single-pretender");
    assert.ok(route);
    assert.equal(route.kind, "releases");
    assert.equal(route.tab, "discography");
    assert.equal(route.id, "single-pretender");
  });

  await t.test("parses #/releases with language parameter preserved", () => {
    const route = parseRoute("#/releases?tab=discography&id=single-pretender&lang=ja");
    assert.ok(route);
    assert.equal(route.kind, "releases");
    assert.equal(route.tab, "discography");
    assert.equal(route.id, "single-pretender");
    assert.equal(route.lang, "ja");
  });

  await t.test("builds route hash with tab and id parameters", () => {
    const hash = routeHash.releases({ tab: "discography", id: "single-pretender" });
    assert.equal(hash, "#/releases?tab=discography&id=single-pretender");

    const hashWithLang = routeHash.releases({
      tab: "discography",
      id: "single-pretender",
      lang: "ja",
    });
    assert.equal(hashWithLang, "#/releases?tab=discography&id=single-pretender&lang=ja");

    const plainHash = routeHash.releases();
    assert.equal(plainHash, "#/releases");
  });
});
