import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PERFORMANCE_CATEGORIES, CATEGORY_ORDER } from "../../src/lib/constants.js";

describe("5. Frontend Modularization Invariants (ADR-0101)", () => {
  it("preserves canonical 8 performance categories and category order", () => {
    assert.equal(PERFORMANCE_CATEGORIES.length, 8);
    assert.deepEqual(PERFORMANCE_CATEGORIES, [
      "巡演專場",
      "特別專場",
      "聯合專場",
      "店家活動",
      "音樂祭",
      "學園祭",
      "電視演出",
      "線上直播",
    ]);
    assert.deepEqual(PERFORMANCE_CATEGORIES, CATEGORY_ORDER);
  });

  it("ensures all modularized slip and navigator components stay under 800 lines", () => {
    const checkDirs = [
      "../../src/components/slips",
      "../../src/components/navigators",
    ];
    for (const dir of checkDirs) {
      const fullDir = path.resolve(import.meta.dirname, dir);
      const files = fs.readdirSync(fullDir).filter((f) => f.endsWith(".jsx"));
      for (const file of files) {
        const content = fs.readFileSync(path.join(fullDir, file), "utf-8");
        const lineCount = content.split(/\r?\n/).length;
        assert.ok(
          lineCount <= 800,
          `File ${file} exceeds 800 lines (current: ${lineCount})`
        );
      }
    }
  });

  it("ensures slip and ticket-book components adhere to DESIGN.md card radius (<= 8px) rules", () => {
    const componentDirs = [
      path.resolve(import.meta.dirname, "../../src/components/slips"),
      path.resolve(import.meta.dirname, "../../src/components/ticket-book"),
    ];
    const bannedNamedRadiusRegex = /\brounded(?:-[tblr])?-(?:xl|2xl|3xl)\b/g;
    const arbitraryRadiusRegex = /\brounded(?:-[tblr])?-\[(\d+)px\]/g;

    for (const dir of componentDirs) {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jsx"));
      for (const file of files) {
        const fileContent = fs.readFileSync(path.join(dir, file), "utf-8");
        const namedMatches = fileContent.match(bannedNamedRadiusRegex);
        assert.equal(
          namedMatches,
          null,
          `File ${file} contains banned large radius (> 8px) classes: ${namedMatches?.join(", ")}`
        );

        let m;
        while ((m = arbitraryRadiusRegex.exec(fileContent)) !== null) {
          const px = parseInt(m[1], 10);
          assert.ok(
            px <= 8,
            `File ${file} contains banned arbitrary large radius (${m[0]} > 8px, DESIGN.md invariant)`
          );
        }
      }
    }
  });

  it("ensures slip components adhere to DESIGN.md closed palette rules", () => {
    const slipsDir = path.resolve(
      import.meta.dirname,
      "../../src/components/slips"
    );
    const files = fs.readdirSync(slipsDir).filter((f) => f.endsWith(".jsx"));
    const bannedPaletteRegex =
      /\b(?:text|bg|border)-(?:blue|sky|cyan|indigo|teal|purple|violet)(?:-\w+)?\b/g;

    for (const file of files) {
      const content = fs.readFileSync(path.join(slipsDir, file), "utf-8");
      const matches = content.match(bannedPaletteRegex);
      assert.equal(
        matches,
        null,
        `File ${file} contains banned raw SaaS palette classes: ${matches?.join(", ")}`
      );
    }
  });

  it("ensures slip components adhere to DESIGN.md zero-blur shadow rules", () => {
    const slipsDir = path.resolve(
      import.meta.dirname,
      "../../src/components/slips"
    );
    const files = fs.readdirSync(slipsDir).filter((f) => f.endsWith(".jsx"));
    const bannedBlurryShadowRegex =
      /\bshadow-(?:sm|md|lg|xl|2xl)\b|\bshadow\b(?!\S)/g;

    for (const file of files) {
      const content = fs.readFileSync(path.join(slipsDir, file), "utf-8");
      const matches = content.match(bannedBlurryShadowRegex);
      assert.equal(
        matches,
        null,
        `File ${file} contains banned blurry drop-shadow classes: ${matches?.join(", ")}`
      );
    }
  });
});
