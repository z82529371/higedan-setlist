import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const eventsDir = path.resolve(__dirname, "..", "..", "..", "data", "events");

function loadTvUnits() {
  const units = [];
  for (const file of fs.readdirSync(eventsDir)) {
    if (!file.endsWith(".json")) continue;
    const fullPath = path.join(eventsDir, file);
    const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    if (data.type === "電視演出") {
      units.push({ file: `events/${file}`, data });
    }
  }
  return units;
}

describe("TV Broadcast (電視演出) Schema Invariants", () => {
  const tvUnits = loadTvUnits();

  it("ensures TV broadcast units and shows omit physical location fields (venue, city, region, prefecture)", () => {
    assert.ok(tvUnits.length > 0, "Expected at least one 電視演出 event file");
    const forbiddenLocationFields = ["venue", "city", "region", "prefecture"];

    for (const { file, data } of tvUnits) {
      for (const field of forbiddenLocationFields) {
        assert.strictEqual(
          data[field],
          undefined,
          `${file}: 電視演出 unit must not define '${field}'`
        );
      }

      for (const show of data.shows || []) {
        for (const field of forbiddenLocationFields) {
          assert.strictEqual(
            show[field],
            undefined,
            `${file} (${show.id}): 電視演出 show must not define '${field}'`
          );
        }
      }
    }
  });

  it("ensures TV broadcast shows use startsAt and never opensAt", () => {
    for (const { file, data } of tvUnits) {
      for (const show of data.shows || []) {
        assert.strictEqual(
          show.opensAt,
          undefined,
          `${file} (${show.id}): 電視演出 show must not define 'opensAt'; use 'startsAt'`
        );
        if (show.startsAt !== undefined) {
          assert.match(
            show.startsAt,
            /^\d{2}:\d{2}$/,
            `${file} (${show.id}): startsAt must use HH:MM format, got "${show.startsAt}"`
          );
        }
      }
    }
  });

  it("ensures TV broadcast shortTitle omits (YYYY.MM.DD) date suffixes", () => {
    for (const { file, data } of tvUnits) {
      if (typeof data.shortTitle === "string") {
        assert.doesNotMatch(
          data.shortTitle,
          /\(\d{4}\.\d{2}\.\d{2}\)/,
          `${file}: shortTitle must not contain a (YYYY.MM.DD) date suffix, got "${data.shortTitle}"`
        );
      }
    }
  });
});
