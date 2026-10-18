import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isMemberSoloText } from "../../scripts/lib/parse.js";
import { computeDiff } from "../../scripts/lib/consensus.js";
import { resolve, assignCues } from "../../src/lib/resolve.js";
import { mockMaps } from "../helpers/mock-data.js";

describe("2. Member Solo Cover vs Formal Title Track Cover (ADR-0043, ADR-0032)", () => {
  it("recognizes all member solo names (including 﨑 variant)", () => {
    assert.equal(isMemberSoloText("楢崎Guitarにて弾き語り"), true);
    assert.equal(isMemberSoloText("楢﨑さんGuitarにて弾き語り"), true);
    assert.equal(isMemberSoloText("小笹大輔ギターソロ"), true);
    assert.equal(isMemberSoloText("松浦Dr"), true);
    assert.equal(isMemberSoloText("藤原聡 弾き語り"), false); // Satoshi is formal, not member-solo interlude
    assert.equal(isMemberSoloText(""), false);
  });

  it("turns member-solo cover into interlude without title or cue number", () => {
    const template = [
      { order: 1, songId: "宿命", encore: false },
      { order: 2, songId: "subtitle", encore: false },
    ];
    const pageSongs = [
      { domIndex: 1, playIndex: 1, title: "宿命", livefansId: "1002" },
      {
        domIndex: 2,
        playIndex: 2,
        title: "思ひで [鈴木常吉]",
        subtitle: "楢﨑 誠",
        livefansId: "9999", // Unregistered cover song ID
      },
      { domIndex: 3, playIndex: 3, title: "Subtitle", livefansId: "1003" },
    ];

    const { diff } = computeDiff(pageSongs, template, mockMaps);
    const soloInsert = diff.insert?.find(
      (ins) => ins.item.type === "interlude"
    );
    assert.ok(soloInsert, "Solo cover must be recorded as type: 'interlude'");
    assert.ok(
      !soloInsert.item.title,
      "Solo cover must NOT carry title track identity"
    );
    assert.ok(
      soloInsert.item.note.includes("思ひで") &&
        soloInsert.item.note.includes("楢﨑"),
      "Solo cover note should merge title and member name"
    );

    // Cue assignment check: interludes must NOT receive M-number
    const restored = resolve(diff, template);
    const cues = assignCues(restored, "M");
    const interludeCue = cues.find((c) => c.item.type === "interlude");
    assert.equal(interludeCue.cue, null);
    assert.equal(cues[0].cue, "M1");
    assert.equal(cues[2].cue, "M2");
  });

  it("keeps formal non-member cover in title track with proper cue numbering", () => {
    const template = [
      { order: 1, songId: "宿命", encore: false },
      { order: 2, songId: "subtitle", encore: false },
    ];
    const pageSongs = [
      { domIndex: 1, playIndex: 1, title: "宿命", livefansId: "1002" },
      {
        domIndex: 2,
        playIndex: 2,
        title: "プラネタリウム [大塚愛]",
        livefansId: "8888", // Non-member cover
      },
      { domIndex: 3, playIndex: 3, title: "Subtitle", livefansId: "1003" },
    ];

    const { diff } = computeDiff(pageSongs, template, mockMaps);
    const coverInsert = diff.insert?.find(
      (ins) => ins.item.title === "プラネタリウム [大塚愛]"
    );
    assert.ok(coverInsert, "Formal cover must retain title property");

    const restored = resolve(diff, template);
    const cues = assignCues(restored, "M");
    assert.equal(cues[0].cue, "M1");
    assert.equal(cues[1].cue, "M2");
    assert.equal(cues[1].item.title, "プラネタリウム [大塚愛]");
    assert.equal(cues[2].cue, "M3");
  });
});
