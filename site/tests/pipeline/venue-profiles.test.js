import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const dataDir = path.resolve(root, "data");

describe("13. Venue Master Profiles & Coverage Gate Pipeline (ADR-0111)", () => {
  const profilesPath = path.resolve(dataDir, "venue-profiles.json");
  assert.ok(fs.existsSync(profilesPath), "data/venue-profiles.json must exist");

  const profilesData = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
  const profiles = profilesData.venues ?? [];
  const profileByCanon = new Map(profiles.map((p) => [p.canonical, p]));

  it("pipeline gate: every venue in tours and events has 100% native coverage", () => {
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

    const missingNative = [];
    for (const v of usedVenues) {
      const p = profileByCanon.get(v);
      if (!p || !p.native || typeof p.native !== "string" || !p.native.trim()) {
        missingNative.push(v);
      }
    }

    assert.strictEqual(
      missingNative.length,
      0,
      `All ${usedVenues.size} used venues must have 100% native name coverage. Missing: ${missingNative.join(", ")}`
    );
  });
});
