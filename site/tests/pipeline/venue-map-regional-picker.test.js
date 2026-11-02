import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  JAPAN_47_PREFECTURES,
  OVERSEAS_COUNTRIES,
  JAPAN_8_REGIONS,
  getRegionIdForPrefecture,
  SANIN_SANCTUARY_PREFECTURES,
} from "../../src/lib/venue-map.js";

describe("ADR-0141: Venue Map Regional Prefecture Grouping Invariants", () => {
  it("covers all 47 Japanese prefectures across the 8 regions with zero duplicates or omissions", () => {
    const allPrefecturesInRegions = [];
    const regionIds = new Set();

    for (const reg of JAPAN_8_REGIONS) {
      assert.ok(reg.id, "Region must have id");
      assert.ok(reg.labelKey, "Region must have labelKey");
      assert.ok(!regionIds.has(reg.id), `Duplicate region id: ${reg.id}`);
      regionIds.add(reg.id);

      if (reg.id !== "overseas") {
        allPrefecturesInRegions.push(...reg.prefectures);
      }
    }

    assert.equal(allPrefecturesInRegions.length, 47, "Must contain exactly 47 prefectures");
    const uniquePrefs = new Set(allPrefecturesInRegions);
    assert.equal(uniquePrefs.size, 47, "Must have 47 unique prefectures");

    for (const pref of JAPAN_47_PREFECTURES) {
      assert.ok(uniquePrefs.has(pref), `Prefecture ${pref} missing from JAPAN_8_REGIONS`);
    }
  });

  it("accurately places the 4 unvisited prefectures (岩手, 三重, 和歌山, 宮崎) into their official regions", () => {
    assert.equal(getRegionIdForPrefecture("岩手縣"), "tohoku");
    assert.equal(getRegionIdForPrefecture("三重縣"), "kinki");
    assert.equal(getRegionIdForPrefecture("和歌山縣"), "kinki");
    assert.equal(getRegionIdForPrefecture("宮崎縣"), "kyushu");
  });

  it("accurately places San'in sanctuary prefectures (島根, 鳥取) into Chugoku", () => {
    assert.equal(getRegionIdForPrefecture("島根縣"), "chugoku");
    assert.equal(getRegionIdForPrefecture("鳥取縣"), "chugoku");
    assert.ok(SANIN_SANCTUARY_PREFECTURES.has("島根縣"));
    assert.ok(SANIN_SANCTUARY_PREFECTURES.has("鳥取縣"));
  });

  it("includes all 4 Asian overseas countries in overseas region", () => {
    const overseasRegion = JAPAN_8_REGIONS.find((r) => r.id === "overseas");
    assert.ok(overseasRegion, "Must have overseas region");
    assert.equal(overseasRegion.isOverseas, true);
    for (const country of OVERSEAS_COUNTRIES) {
      assert.ok(overseasRegion.prefectures.includes(country), `Missing overseas country: ${country}`);
      assert.equal(getRegionIdForPrefecture(country), "overseas");
    }
  });

  it("returns null for unknown or empty prefecture query", () => {
    assert.equal(getRegionIdForPrefecture(""), null);
    assert.equal(getRegionIdForPrefecture(null), null);
    assert.equal(getRegionIdForPrefecture("火星"), null);
  });
});
