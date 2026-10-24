import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const srcDir = path.resolve(import.meta.dirname, "../../src");
const componentsDir = path.resolve(srcDir, "components");

describe("11. Administrative Geography & Venue Entity Invariants (ADR-0108)", () => {
  it("guarantees data/venues.json defines canonical 'prefecture' and 'city' without deprecated 'pref'", () => {
    const venuesPath = path.resolve(repoRoot, "data/venues.json");
    const raw = JSON.parse(fs.readFileSync(venuesPath, "utf8"));

    for (const [key, v] of Object.entries(raw)) {
      assert.strictEqual(typeof v.venue, "string", `Venue '${key}' must have string .venue`);
      assert.strictEqual(typeof v.city, "string", `Venue '${key}' must have string .city`);
      assert.strictEqual(typeof v.prefecture, "string", `Venue '${key}' must have string .prefecture`);
      assert.strictEqual(typeof v.region, "string", `Venue '${key}' must have string .region`);
      assert.strictEqual(v.pref, undefined, `Venue '${key}' must not define deprecated .pref property`);
    }
  });

  it("guarantees domain.js exports formatShowPlace and formatShowVenueCity and maps .prefecture", () => {
    const domainPath = path.resolve(srcDir, "lib/domain.js");
    const content = fs.readFileSync(domainPath, "utf8");

    assert.ok(
      content.includes("export function formatShowPlace("),
      "domain.js must export formatShowPlace"
    );
    assert.ok(
      content.includes("export function formatShowVenueCity("),
      "domain.js must export formatShowVenueCity"
    );
    assert.ok(
      /prefecture:\s*firstShow\?\.prefecture\b/.test(content),
      "domain.js venuesList must map canonical 'prefecture'"
    );
  });

  it("guarantees no JSX or JS file accesses deprecated .pref property on venue objects", () => {
    function scanFiles(dir) {
      const files = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...scanFiles(fullPath));
        } else if (entry.name.endsWith(".jsx") || entry.name.endsWith(".js")) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const allCodeFiles = scanFiles(srcDir);
    for (const filePath of allCodeFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      // Check for .pref access on venue identifiers
      const invalidPrefRegex = /\b(?:venue|currentVenueObj|v)\.pref\b(?!\w)/;
      assert.ok(
        !invalidPrefRegex.test(content),
        `File ${path.relative(repoRoot, filePath)} accesses deprecated property '.pref'. Use '.prefecture'.`
      );
    }
  });

  it("guarantees no components directly render unlocalized city without t(\"cities.\") or formatShowPlace", () => {
    function scanComponents(dir) {
      const files = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...scanComponents(fullPath));
        } else if (entry.name.endsWith(".jsx")) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const componentFiles = scanComponents(componentsDir);
    for (const filePath of componentFiles) {
      const relPath = path.relative(repoRoot, filePath);
      const content = fs.readFileSync(filePath, "utf8");

      // 1. Raw JSX interpolation like {s.city} or {show.city} or {v.city} without t(...) or helper
      const rawCityJsxChild = />\s*\{[a-zA-Z0-9_]+\.city\}\s*</g;
      const matchChild = rawCityJsxChild.exec(content);
      assert.ok(
        !matchChild,
        `File ${relPath} directly renders raw city without localization: "${matchChild?.[0]}". Use t("cities." + ...) or formatShowPlace.`
      );

      // 2. Raw JSX interpolation in parens like （{s.city}） without t(...)
      const rawCityParen = /（\s*\{[a-zA-Z0-9_]+\.city\}\s*）/g;
      const matchParen = rawCityParen.exec(content);
      assert.ok(
        !matchParen,
        `File ${relPath} directly renders raw city in parens: "${matchParen?.[0]}". Use t("cities." + ...).`
      );
    }
  });
});
