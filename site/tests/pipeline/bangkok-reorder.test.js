import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { domScrambleInfo } from "../../scripts/lib/parse.js";
import { computeDiff } from "../../scripts/lib/consensus.js";
import { resolve } from "../../src/lib/resolve.js";
import { mockMaps } from "../helpers/mock-data.js";

describe("1. Bangkok Reordering & Missing-Idx Template Anchoring (ADR-0042)", () => {
  const template = [
    { order: 1, songId: "宿命", encore: false },
    { order: 2, songId: "pretender", encore: false },
    { order: 3, songId: "subtitle", encore: false },
  ];

  it("detects DOM scramble when a song has null playIndex or inversions", () => {
    const pageSongs = [
      { domIndex: 1, playIndex: 1, title: "宿命" },
      { domIndex: 2, playIndex: null, title: "Pretender", isCmt: false }, // missing idx
      { domIndex: 3, playIndex: 2, title: "Subtitle" },
    ];
    const scramble = domScrambleInfo(pageSongs);
    assert.equal(scramble.isScrambled, true);
    assert.equal(scramble.missingCount, 1);
  });

  it("correctly anchors null-idx song to template without generating fake skip", () => {
    const pageSongs = [
      { domIndex: 1, playIndex: 1, title: "宿命", livefansId: "1002" },
      { domIndex: 2, playIndex: 3, title: "Subtitle", livefansId: "1003" },
      { domIndex: 3, playIndex: null, title: "Pretender", livefansId: "1001" }, // null idx at DOM end
      {
        domIndex: 4,
        playIndex: null,
        title: "ひ組のテーマ～八岐大蛇編～",
        type: "interlude",
        isCmt: true,
        subtitle: "ひ組のテーマ～八岐大蛇編～",
      },
    ];

    const { diff, status } = computeDiff(pageSongs, template, mockMaps);
    assert.equal(status, "DIFF_CALCULATED");
    assert.ok(!diff.skip?.includes(2), "Pretender should NOT be in diff.skip");
    assert.ok(
      (diff.insert ?? []).some((ins) => ins.item.note?.includes("ひ組のテーマ")),
      "Interlude should be inserted"
    );

    const restored = resolve(diff, template);
    const songIds = restored.filter((x) => x.songId).map((x) => x.songId);
    assert.deepEqual(songIds, ["宿命", "pretender", "subtitle"]);
  });
});
