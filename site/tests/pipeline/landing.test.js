import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findLatestTourUnit,
  formatLatestTourPromptLabel,
  findPlayableShowPool,
  pickRandomPlayableShow,
  buildFeaturedTicketDeck,
} from "../../src/lib/landing.js";

describe("Landing page domain helpers (site/src/lib/landing.js)", () => {
  describe("findLatestTourUnit", () => {
    it("selects the tour unit with the most recent show date among 巡演專場 units", () => {
      const units = [
        {
          id: "arena-tour-2024-rejoice",
          title: "OFFICIAL HIGE DANDISM Arena Tour 2024 - Rejoice -",
          type: "巡演專場",
          shows: [{ id: "rejoice-1", date: "2024-12-15" }],
        },
        {
          id: "asia-tour-2026",
          title: "OFFICIAL HIGE DANDISM ASIA TOUR 2026",
          type: "巡演專場",
          shows: [{ id: "asia-1", date: "2026-08-22" }],
        },
        {
          id: "some-festival-2026",
          title: "Summer Sonic 2026",
          type: "音樂祭",
          shows: [{ id: "fest-1", date: "2026-09-01" }],
        },
      ];

      const latest = findLatestTourUnit(units);
      assert.equal(latest?.id, "asia-tour-2026");
    });

    it("falls back to first tour unit when shows have no dates, and returns null for empty input", () => {
      assert.equal(findLatestTourUnit([]), null);
      const fallback = findLatestTourUnit([
        { id: "tour-a", title: "Tour A", type: "巡演專場", shows: [] },
      ]);
      assert.equal(fallback?.id, "tour-a");
    });
  });

  describe("formatLatestTourPromptLabel", () => {
    it("strips redundant OFFICIAL HIGE DANDISM prefix for compact ticket prompt chips", () => {
      assert.equal(
        formatLatestTourPromptLabel({ title: "OFFICIAL HIGE DANDISM ASIA TOUR 2026" }),
        "ASIA TOUR 2026"
      );
      assert.equal(
        formatLatestTourPromptLabel({ title: "Official髭男dism LIVE at STADIUM 2025" }),
        "LIVE at STADIUM 2025"
      );
      assert.equal(
        formatLatestTourPromptLabel({ shortTitle: "Rejoice 2024", title: "OFFICIAL HIGE DANDISM Arena Tour 2024 - Rejoice -" }),
        "Rejoice 2024"
      );
    });
  });

  describe("findPlayableShowPool & pickRandomPlayableShow", () => {
    const sampleUnits = [
      {
        id: "tour-template",
        title: "Template Tour",
        type: "巡演專場",
        templateSetlist: [{ songId: "pretender" }],
        shows: [
          { id: "show-from-template", date: "2025-05-17" },
          { id: "stub-explicit-empty", date: "2025-05-18", setlist: [] },
        ],
      },
      {
        id: "event-direct",
        title: "Direct Event",
        type: "音樂祭",
        shows: [
          { id: "show-direct-setlist", date: "2024-08-10", setlist: [{ songId: "subtitle" }] },
          { id: "stub-no-setlist", date: "2024-08-11" },
          { id: "stub-interlude-only", date: "2024-08-12", setlist: [{ type: "interlude", title: "SE" }] },
        ],
      },
    ];

    it("strictly excludes stub shows (存根場次) with no resolved tracks while keeping template-backed and direct-setlist shows", () => {
      const pool = findPlayableShowPool(sampleUnits);
      const ids = pool.map((entry) => entry.showId);
      assert.deepEqual(ids, ["show-from-template", "show-direct-setlist"]);
    });

    it("deterministically picks a playable show using injected randomFn and returns null when pool is empty", () => {
      const first = pickRandomPlayableShow(sampleUnits, () => 0.0);
      assert.deepEqual(first, {
        unitId: "tour-template",
        showId: "show-from-template",
        date: "2025-05-17",
      });

      const second = pickRandomPlayableShow(sampleUnits, () => 0.99);
      assert.deepEqual(second, {
        unitId: "event-direct",
        showId: "show-direct-setlist",
        date: "2024-08-10",
      });

      assert.equal(pickRandomPlayableShow([{ id: "empty", shows: [{ id: "stub-1" }] }]), null);
    });
  });

  describe("buildFeaturedTicketDeck", () => {
    it("prioritizes themed tours newest-first, extracts first 3 non-interlude preview tracks, and excludes stub shows", () => {
      const units = [
        {
          id: "plain-event",
          title: "Plain Festival",
          type: "音樂祭",
          shows: [{ id: "ev-1", date: "2026-09-01", setlist: [{ songId: "pretender" }] }],
        },
        {
          id: "asia-tour-2026",
          title: "OFFICIAL HIGE DANDISM ASIA TOUR 2026",
          type: "巡演專場",
          theme: { light: "#d96b0b", lightInk: "#000000", dark: "#f08524", darkInk: "#000000" },
          shows: [
            {
              id: "asia-tour-2026-taipei-0830",
              date: "2026-08-30",
              city: "台北",
              venue: "台北小巨蛋",
              setlist: [
                { type: "interlude", title: "SE" },
                { songId: "pretender" },
                { songId: "subtitle" },
                { songId: "cry-baby" },
                { songId: "same-blue" },
              ],
            },
            {
              id: "asia-tour-2026-bangkok-0906",
              date: "2026-09-06",
              city: "曼谷",
              venue: "UOB LIVE",
              setlist: [{ songId: "pretender" }],
            },
            { id: "asia-stub", date: "2026-08-23", setlist: [] },
          ],
        },
      ];

      const deck = buildFeaturedTicketDeck(units, {
        pretender: "Pretender",
        subtitle: "Subtitle",
        "cry-baby": "Cry Baby",
      });

      assert.equal(deck.length, 2);
      assert.equal(deck[0].unitId, "asia-tour-2026");
      assert.equal(deck[0].showId, "asia-tour-2026-taipei-0830");
      assert.equal(deck[0].tourLabel, "ASIA TOUR 2026");
      assert.equal(deck[0].totalTracks, 4);
      assert.deepEqual(
        deck[0].previewTracks.map((t) => `${t.cue}:${t.title}`),
        ["M01:Pretender", "M02:Subtitle", "M03:Cry Baby"]
      );
    });
  });
});
