import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoZhTw, geoJa, geoEn, geoKo } from "../../src/lib/locales/geography.js";
import { projectLatLngToSvg } from "../../src/lib/venue-map.js";
import { PREFECTURE_PATHS } from "../../src/lib/japan-map-paths.js";

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

    const byPrefecture = new Map();
    for (const p of physicalVenues) {
      assert.ok(typeof p.address === "string" && p.address.trim().length > 0, `Physical venue ${p.canonical} must have non-empty official address`);
      if (p.country === "日本") {
        const expectedPrefJa = geoJa.prefectures[p.prefecture];
        assert.ok(
          p.address.startsWith(expectedPrefJa),
          `Japanese venue ${p.canonical} (${p.id}) address '${p.address}' must start with prefecture '${expectedPrefJa}'`
        );
      }
      assert.strictEqual(typeof p.lat, "number", `Physical venue ${p.canonical} must have numeric lat`);
      assert.strictEqual(typeof p.lng, "number", `Physical venue ${p.canonical} must have numeric lng`);
      assert.ok(p.lat >= 1.0 && p.lat <= 46.0, `Venue ${p.canonical} lat ${p.lat} out of valid range [1.0, 46.0]`);
      assert.ok(p.lng >= 100.0 && p.lng <= 146.0, `Venue ${p.canonical} lng ${p.lng} out of valid range [100.0, 146.0]`);
      assert.strictEqual(Number(p.lat.toFixed(4)), p.lat, `Venue ${p.canonical} lat ${p.lat} must have at most 4 decimal places`);
      assert.strictEqual(Number(p.lng.toFixed(4)), p.lng, `Venue ${p.canonical} lng ${p.lng} must have at most 4 decimal places`);
      assert.ok(p.prefecture && p.city, `Physical venue ${p.canonical} must have non-empty prefecture and city`);
      assert.strictEqual(p.hubId, `${p.prefecture}::${p.city}`, `Venue ${p.canonical} hubId must match prefecture::city`);

      if (!byPrefecture.has(p.hubId)) byPrefecture.set(p.hubId, []);
      byPrefecture.get(p.hubId).push(p);
    }

    // Ensure no venue within a city hub drifts > 0.45 deg (~45 km) from its city hub median
    for (const [hubId, list] of byPrefecture.entries()) {
      if (list.length < 2) continue;
      const lats = list.map((x) => x.lat).sort((a, b) => a - b);
      const lngs = list.map((x) => x.lng).sort((a, b) => a - b);
      const medLat = lats[Math.floor(lats.length / 2)];
      const medLng = lngs[Math.floor(lngs.length / 2)];
      for (const v of list) {
        assert.ok(
          Math.abs(v.lat - medLat) <= 0.45 && Math.abs(v.lng - medLng) <= 0.45,
          `Venue ${v.canonical} (${v.lat}, ${v.lng}) deviates excessively from hub ${hubId} median (${medLat}, ${medLng})`
        );
      }
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

  it("ensures all 347 physical venues project within their prefecture/country SVG boundaries and overseas venues adhere to sub-national geographic placement (ADR-0124, ADR-0147)", () => {
    const physicalVenues = profiles.filter((p) => !p.isVirtual);
    const boundsByPref = new Map();

    for (const p of PREFECTURE_PATHS) {
      const nums = p.path.match(/[-+]?\d*\.?\d+/g).map(Number);
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      boundsByPref.set(p.prefecture, {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      });
    }

    const outOfBounds = [];
    const margin = 12; // 12px projection margin for coastal/promontory livehouses

    for (const v of physicalVenues) {
      const pt = projectLatLngToSvg(v.lat, v.lng, {
        prefecture: v.prefecture,
        city: v.city,
        region: v.region,
      });

      assert.ok(pt, `Projected point must not be null for venue: ${v.canonical}`);

      const b = boundsByPref.get(v.prefecture);
      assert.ok(b, `Missing bounding box for prefecture: ${v.prefecture}`);

      if (
        pt.x < b.minX - margin ||
        pt.x > b.maxX + margin ||
        pt.y < b.minY - margin ||
        pt.y > b.maxY + margin
      ) {
        outOfBounds.push({ name: v.canonical, pref: v.prefecture, pt, b });
      }

      // Sub-national placement invariants (ADR-0147 aligned thresholds):
      if (v.canonical === "台北小巨蛋") {
        assert.ok(
          pt.x >= 198 && pt.x <= 203,
          `台北小巨蛋 x=${pt.x} must project to Taipei Basin longitude [198, 203]`
        );
        assert.ok(
          pt.y >= 63 && pt.y <= 67,
          `台北小巨蛋 y=${pt.y} must project to Taipei Basin latitude [63, 67], not Eastern or Southern Taiwan`
        );
      }
      if (v.canonical === "KSPO DOME (奧林匹克體操競技場)" || v.canonical === "HYUNDAI CARD UNDERSTAGE") {
        assert.ok(
          pt.y >= 58 && pt.y <= 66,
          `Seoul venue ${v.canonical} y=${pt.y} must project to Northwest South Korea [58, 66]`
        );
      }
      if (v.canonical === "KINTEX Hall 5") {
        assert.ok(
          pt.y >= 56 && pt.y <= 64,
          `Goyang venue ${v.canonical} y=${pt.y} must project to Northwest South Korea [56, 64]`
        );
      }
    }

    assert.strictEqual(
      outOfBounds.length,
      0,
      `All 347 physical venues must project within their regional SVG boundaries. Out of bounds: ${JSON.stringify(outOfBounds)}`
    );
  });
});

