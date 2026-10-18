import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeDiff } from "../../scripts/lib/consensus.js";
import { resolve, encoreStartOrderOf, assignCues } from "../../src/lib/resolve.js";
import { mockMaps } from "../helpers/mock-data.js";

describe("4. Resolve Algorithm Monotonicity & Encore Boundary (ADR-0020, ADR-0028)", () => {
  it("preserves inserts attached to skipped template anchors (ADR-0020)", () => {
    const template = [
      { order: 1, songId: "宿命", encore: false },
      { order: 2, songId: "pretender", encore: false },
      { order: 3, songId: "subtitle", encore: false },
    ];
    // Skip order 2, but attach an insert after 2
    const diff = {
      skip: [2],
      insert: [
        {
          after: 2,
          item: { songId: "laughter", encore: false },
        },
      ],
    };
    const restored = resolve(diff, template);
    const songIds = restored.map((x) => x.songId);
    // order 2 skipped, but laughter inserted after order 2 must still appear
    assert.deepEqual(songIds, ["宿命", "laughter", "subtitle"]);
  });

  it("handles version note diff (ADR-0028) by skip + insert replacement", () => {
    const template = [
      { order: 1, songId: "宿命", encore: false, note: "" },
    ];
    const pageSongs = [
      {
        domIndex: 1,
        playIndex: 1,
        title: "宿命",
        livefansId: "1002",
        subtitle: "The Blooming Universe アレンジ",
      },
    ];
    const { diff } = computeDiff(pageSongs, template, mockMaps);
    assert.deepEqual(diff.skip, [1]);
    assert.equal(diff.insert?.length, 1);
    assert.equal(diff.insert[0].item.songId, "宿命");
    assert.equal(
      diff.insert[0].item.note,
      "The Blooming Universe アレンジ"
    );

    const restored = resolve(diff, template);
    assert.equal(restored.length, 1);
    assert.equal(restored[0].songId, "宿命");
    assert.equal(restored[0].note, "The Blooming Universe アレンジ");
  });

  it("optimally aligns transposed songs via LCS without cascading skips", () => {
    const template = [
      { order: 1, songId: "宿命", encore: false },
      { order: 2, songId: "pretender", encore: false },
      { order: 3, songId: "subtitle", encore: false },
      { order: 4, songId: "laughter", encore: false },
    ];
    // Show moved laughter forward: [宿命, laughter, pretender, subtitle]
    const pageSongs = [
      { domIndex: 1, playIndex: 1, title: "宿命", livefansId: "1002" },
      { domIndex: 2, playIndex: 2, title: "Laughter", livefansId: "1005" },
      { domIndex: 3, playIndex: 3, title: "Pretender", livefansId: "1001" },
      { domIndex: 4, playIndex: 4, title: "Subtitle", livefansId: "1003" },
    ];

    const { diff } = computeDiff(pageSongs, template, mockMaps);
    // LCS matches [宿命, pretender, subtitle]. Only laughter (order 4) is skipped and re-inserted!
    assert.deepEqual(diff.skip, [4], "Should only skip the moved song, not cascading songs");
    assert.equal(diff.insert?.length, 1);
    assert.equal(diff.insert[0].after, 1);
    assert.equal(diff.insert[0].item.songId, "laughter");

    const restored = resolve(diff, template);
    assert.deepEqual(
      restored.map((x) => x.songId),
      ["宿命", "laughter", "pretender", "subtitle"]
    );
  });

  it("correctly identifies encore territory and cues", () => {
    const template = [
      { order: 1, songId: "宿命", encore: false },
      { order: 2, songId: "pretender", encore: false },
      { order: 3, songId: "subtitle", encore: true },
    ];
    assert.equal(encoreStartOrderOf(template), 3);

    const cues = assignCues(template, "M");
    assert.equal(cues[0].cue, "M1");
    assert.equal(cues[1].cue, "M2");
    assert.equal(cues[2].cue, "M3");
  });
});
