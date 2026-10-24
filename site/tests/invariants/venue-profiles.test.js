import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoZhTw, geoJa, geoEn, geoKo } from "../../src/lib/locales/geography.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const dataDir = path.resolve(root, "data");

describe("19. Venue Master Profiles & Invariant Gates (ADR-0111, ADR-0124)", () => {
  const profilesPath = path.resolve(dataDir, "venue-profiles.json");
  assert.ok(fs.existsSync(profilesPath), "data/venue-profiles.json must exist");

  const profilesData = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
  const profiles = profilesData.venues ?? [];
  const profileByCanon = new Map(profiles.map((p) => [p.canonical, p]));

  it("ensures all 339+ profiles have non-empty canonical and native names", () => {
    assert.ok(profiles.length >= 339, `Expected >= 339 venue profiles, found ${profiles.length}`);
    for (const p of profiles) {
      assert.ok(p.canonical && typeof p.canonical === "string", `Venue must have valid canonical name: ${JSON.stringify(p)}`);
      assert.ok(p.native && typeof p.native === "string", `Venue must have valid native name: ${p.canonical}`);
      assert.ok(p.names && typeof p.names === "object", `Venue must have names object: ${p.canonical}`);
      assert.ok(p.names["zh-TW"], `Venue must have zh-TW name: ${p.canonical}`);
    }
  });

  it("ensures 100% coverage: every venue in tours and events exists in venue-profiles.json", () => {
    const toursDir = path.resolve(dataDir, "tours");
    const eventsDir = path.resolve(dataDir, "events");

    const usedVenues = new Set();

    for (const dir of [toursDir, eventsDir]) {
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
        const content = JSON.parse(fs.readFileSync(path.resolve(dir, file), "utf8"));
        const shows = content.shows ?? [];
        for (const s of shows) {
          if (s.venue) usedVenues.add(s.venue);
        }
      }
    }

    const missingInProfiles = [];
    for (const v of usedVenues) {
      if (!profileByCanon.has(v)) {
        missingInProfiles.push(v);
      }
    }

    assert.strictEqual(
      missingInProfiles.length,
      0,
      `All ${usedVenues.size} used venues in shows must be registered in venue-profiles.json. Missing: ${missingInProfiles.join(", ")}`
    );
  });

  it("ensures Japanese venues contain authentic native characters without forbidden Traditional Chinese glyphs", () => {
    // Forbidden Taiwan Traditional Chinese characters that should be Shinjitai in Japan
    const forbiddenTc = /[縣體廣濱藝區臺國專禮錄會廳]/;

    const violativeVenues = [];
    for (const p of profiles) {
      if (p.prefecture === "台灣") continue;
      if (forbiddenTc.test(p.native)) {
        violativeVenues.push({ canonical: p.canonical, native: p.native });
      }
    }

    assert.strictEqual(
      violativeVenues.length,
      0,
      `Japanese venue native names must not contain forbidden Traditional Chinese characters: ${JSON.stringify(violativeVenues)}`
    );
  });

  it("ensures venue profiles are free of circuit festival leakage, brackets, unescaped HTML entities, and address placeholders", () => {
    // Venues should never contain circuit livehouse lists [...] or crawler 'at' connection strings
    const bracketRegex = /\[.*\]/;
    const atRegex = /\bat\b/i;
    const htmlEntityRegex = /&#\d+;|&amp;|&quot;/i;
    const violations = [];

    for (const p of profiles) {
      const textsToCheck = [
        p.native,
        p.canonical,
        p.names?.ja,
        p.names?.en,
        p.names?.ko,
        p.names?.["zh-TW"],
      ].filter(Boolean);

      for (const text of textsToCheck) {
        if (bracketRegex.test(text)) {
          violations.push({ id: p.id, text, reason: "circuit festival / bracket leakage" });
        }
        if (atRegex.test(text)) {
          violations.push({ id: p.id, text, reason: "crawler 'at' leakage or inverted stage naming" });
        }
        if (htmlEntityRegex.test(text)) {
          violations.push({ id: p.id, text, reason: "unescaped HTML entity" });
        }
      }

      if (p.native === "港区六本木") {
        violations.push({ id: p.id, text: p.native, reason: "address instead of venue name" });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Venue profiles must not contain formatting defects or circuit leakage: ${JSON.stringify(violations, null, 2)}`
    );
  });

  it("ensures 347 physical venues have valid WGS84 lat/lng (4 decimals) and hubId, and 2 livestream venues have isVirtual=true (ADR-0124)", () => {
    const virtualVenues = profiles.filter((p) => p.isVirtual === true);
    const physicalVenues = profiles.filter((p) => !p.isVirtual);

    assert.strictEqual(virtualVenues.length, 2, `Expected exactly 2 virtual venues, found ${virtualVenues.length}`);
    assert.strictEqual(physicalVenues.length, 347, `Expected 347 physical venues, found ${physicalVenues.length}`);

    for (const v of virtualVenues) {
      assert.strictEqual(v.lat, null, `Virtual venue ${v.canonical} must have lat: null`);
      assert.strictEqual(v.lng, null, `Virtual venue ${v.canonical} must have lng: null`);
      assert.strictEqual(v.hubId, null, `Virtual venue ${v.canonical} must have hubId: null`);
      assert.strictEqual(v.address, null, `Virtual venue ${v.canonical} must have address: null`);
    }

    for (const p of physicalVenues) {
      assert.ok(typeof p.address === "string" && p.address.trim().length > 0, `Physical venue ${p.canonical} must have non-empty official address`);
      assert.strictEqual(typeof p.lat, "number", `Physical venue ${p.canonical} must have numeric lat`);
      assert.strictEqual(typeof p.lng, "number", `Physical venue ${p.canonical} must have numeric lng`);
      assert.ok(p.lat >= 1.0 && p.lat <= 46.0, `Venue ${p.canonical} lat ${p.lat} out of valid range [1.0, 46.0]`);
      assert.ok(p.lng >= 100.0 && p.lng <= 146.0, `Venue ${p.canonical} lng ${p.lng} out of valid range [100.0, 146.0]`);
      assert.strictEqual(Number(p.lat.toFixed(4)), p.lat, `Venue ${p.canonical} lat ${p.lat} must have at most 4 decimal places`);
      assert.strictEqual(Number(p.lng.toFixed(4)), p.lng, `Venue ${p.canonical} lng ${p.lng} must have at most 4 decimal places`);
      assert.ok(p.prefecture && p.city, `Physical venue ${p.canonical} must have non-empty prefecture and city`);
      assert.strictEqual(p.hubId, `${p.prefecture}::${p.city}`, `Venue ${p.canonical} hubId must match prefecture::city`);
    }
  });

  it("ensures all physical venue cities and prefectures (including 越前) exist in 4-locale geography.js dictionaries", () => {
    assert.strictEqual(geoZhTw.cities["越前"], "越前");
    assert.strictEqual(geoJa.cities["越前"], "越前");
    assert.strictEqual(geoEn.cities["越前"], "Echizen");
    assert.strictEqual(geoKo.cities["越前"], "에치젠");

    const physicalVenues = profiles.filter((p) => !p.isVirtual);
    for (const p of physicalVenues) {
      for (const [loc, dict] of [
        ["zh-TW", geoZhTw],
        ["ja", geoJa],
        ["en", geoEn],
        ["ko", geoKo],
      ]) {
        assert.ok(dict.prefectures[p.prefecture], `Prefecture '${p.prefecture}' (${p.canonical}) missing in ${loc}`);
        assert.ok(dict.cities[p.city], `City '${p.city}' (${p.canonical}) missing in ${loc}`);
      }
    }
  });
});

