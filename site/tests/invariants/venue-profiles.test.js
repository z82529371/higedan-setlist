import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const dataDir = path.resolve(root, "data");

describe("19. Venue Master Profiles & Invariant Gates (ADR-0111)", () => {
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
});
