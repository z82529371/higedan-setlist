import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isIgnoredCmtText } from "../../scripts/lib/parse.js";

describe("3. MC / cmt Noise Filtering & Informational MC Retention (ADR-0005, ADR-0025)", () => {
  it("drops bare and numbered MC / OPENING / SE markers", () => {
    assert.equal(isIgnoredCmtText("MC"), true);
    assert.equal(isIgnoredCmtText("MC1"), true);
    assert.equal(isIgnoredCmtText("MC 2"), true);
    assert.equal(isIgnoredCmtText("MC-3"), true);
    assert.equal(isIgnoredCmtText("〜MC1〜"), true);
    assert.equal(isIgnoredCmtText("OPENING"), true);
    assert.equal(isIgnoredCmtText("SE:"), true);
  });

  it("preserves descriptive informational MCs as interludes", () => {
    assert.equal(isIgnoredCmtText("ピアノ弾きMC"), false);
    assert.equal(isIgnoredCmtText("機材トラブル説明"), false);
    assert.equal(isIgnoredCmtText("バースデーソング"), false);
    assert.equal(isIgnoredCmtText("ひ組のテーマ～八岐大蛇編～"), false);
  });
});
