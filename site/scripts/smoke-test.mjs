// Persistent smoke tests for the setlist pipeline:
// 1. Bangkok reordering (missing idx + template anchoring, ADR-0042)
// 2. Member-cover to interlude vs formal cover title track (ADR-0043, ADR-0032)
// 3. MC / cmt filtering & descriptive interlude retention (ADR-0005, ADR-0025)
// 4. Resolve monotonicity, skip-anchor safety & cue assignment (ADR-0020, ADR-0028)
// Run with: `pnpm test` (or `node scripts/smoke-test.mjs`)

import { test, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isMemberSoloText,
  isIgnoredCmtText,
  domScrambleInfo,
  cleanTitleKey,
} from "./lib/parse.js";
import {
  computeDiff,
  mapPageSongsToEventSetlist,
} from "./lib/consensus.js";
import {
  resolve,
  assignCues,
  encoreStartOrderOf,
} from "../src/lib/resolve.js";

const mockMaps = {
  livefansIdToId: {
    "1001": "pretender",
    "1002": "宿命",
    "1003": "subtitle",
    "1004": "white-noise",
    "1005": "laughter",
  },
  titleToId: {
    pretender: "pretender",
    宿命: "宿命",
    subtitle: "subtitle",
    whitenoise: "white-noise",
    laughter: "laughter",
  },
  validSongIds: new Set([
    "pretender",
    "宿命",
    "subtitle",
    "white-noise",
    "laughter",
  ]),
};

describe("Pipeline Smoke Tests", () => {
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
      // In Bangkok, Pretender has null playIndex and DOM order placed it after track 8,
      // but in template it is track 2.
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
      // Pretender must NOT be skipped from template!
      assert.ok(!diff.skip?.includes(2), "Pretender should NOT be in diff.skip");
      // Interlude must be present as an insert
      assert.ok(
        (diff.insert ?? []).some((ins) => ins.item.note?.includes("ひ組のテーマ")),
        "Interlude should be inserted"
      );

      // Resolving must produce all 3 songs in template order + interlude
      const restored = resolve(diff, template);
      const songIds = restored.filter((x) => x.songId).map((x) => x.songId);
      assert.deepEqual(songIds, ["宿命", "pretender", "subtitle"]);
    });
  });

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
});
