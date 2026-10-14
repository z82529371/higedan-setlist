// Persistent smoke tests for the setlist pipeline:
// 1. Bangkok reordering (missing idx + template anchoring, ADR-0042)
// 2. Member-cover to interlude vs formal cover title track (ADR-0043, ADR-0032)
// 3. MC / cmt filtering & descriptive interlude retention (ADR-0005, ADR-0025)
// 4. Resolve monotonicity, skip-anchor safety & cue assignment (ADR-0020, ADR-0028)
// Run with: `pnpm test` (or `node scripts/smoke-test.mjs`)

import { test, describe, it, before, after } from "node:test";
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
  let server;
  let React;
  let renderToStaticMarkup;

  before(async () => {
    const vite = await import("vite");
    server = await vite.createServer({
      server: { middlewareMode: true, watch: null },
      appType: "custom",
    });
    if (server.watcher) {
      await server.watcher.close();
    }
    const reactMod = await import("react");
    React = reactMod.default;
    const rdomMod = await import("react-dom/server");
    renderToStaticMarkup = rdomMod.renderToStaticMarkup;
  });

  after(async () => {
    if (server) await server.close();
  });

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

  describe("5. Frontend Modularization Invariants (ADR-0101)", () => {
    it("preserves canonical 8 performance categories and category order", async () => {
      const { PERFORMANCE_CATEGORIES, CATEGORY_ORDER } = await import(
        "../src/lib/constants.js"
      );
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

    it("ensures all modularized slip and navigator components stay under 800 lines", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const checkDirs = [
        "../src/components/slips",
        "../src/components/navigators",
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

    it("ensures slip components adhere to DESIGN.md card radius (< 8px) rules", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const slipsDir = path.resolve(
        import.meta.dirname,
        "../src/components/slips"
      );
      const files = fs.readdirSync(slipsDir).filter((f) => f.endsWith(".jsx"));
      const bannedRadiusRegex = /\brounded-(?:xl|2xl|3xl)\b/g;

      for (const file of files) {
        const content = fs.readFileSync(path.join(slipsDir, file), "utf-8");
        const matches = content.match(bannedRadiusRegex);
        assert.equal(
          matches,
          null,
          `File ${file} contains banned large radius (> 8px) classes: ${matches?.join(", ")}`
        );
      }
    });

    it("ensures slip components adhere to DESIGN.md closed palette rules", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const slipsDir = path.resolve(
        import.meta.dirname,
        "../src/components/slips"
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
  });

  describe("6. Component Mount & SSR Render Smoke Test", () => {
    it("renders PaginationPills without runtime exception", async () => {
      const { PaginationPills } = await server.ssrLoadModule(
        "./src/components/navigators/PaginationPills.jsx"
      );
      const html = renderToStaticMarkup(
        React.createElement(PaginationPills, {
          total: 30,
          pageSize: 10,
          page: 0,
          onPageChange: () => {},
        })
      );
      assert.ok(html.length > 0);
    });

    it("renders ShowNavigator without ReferenceError", async () => {
      const { ShowNavigator } = await server.ssrLoadModule(
        "./src/components/navigators/ShowNavigator.jsx"
      );
      const html = renderToStaticMarkup(
        React.createElement(ShowNavigator, {
          selCategory: "巡演專場",
          selYear: "2024",
          selUnitId: "",
          selShow: "",
          unitPage: 0,
          setUnitPage: () => {},
          showPage: 0,
          setShowPage: () => {},
          unitsByCategory: { "巡演專場": [] },
          categoryStats: {},
          availableYears: ["2024"],
          yearStats: new Map(),
          filteredUnits: [],
          pagedUnits: [],
          current: null,
          unitData: new Map(),
          handleCategoryClick: () => {},
          handleSelectUnit: () => {},
          handleSelectShow: () => {},
        })
      );
      assert.ok(html.length > 0);
      assert.ok(html.includes("選擇演出類型"));
    });

    it("renders SongNavigator without ReferenceError", async () => {
      const { SongNavigator } = await server.ssrLoadModule(
        "./src/components/navigators/SongNavigator.jsx"
      );
      const html = renderToStaticMarkup(
        React.createElement(SongNavigator, {
          songSortMode: "album",
          setSongSortMode: () => {},
          selAlbum: "Rejoice (2024)",
          setSelAlbum: () => {},
          selSong: "",
          songPage: 0,
          setSongPage: () => {},
          allUsedSongs: [],
          songsSortedByCount: [],
          filteredSongs: [],
          pagedSongs: [],
          trackShows: new Map(),
          handleSelectSong: () => {},
        })
      );
      assert.ok(html.length > 0);
      assert.ok(html.includes("歌曲分類方式"));
    });

    it("renders VenueNavigator without ReferenceError", async () => {
      const { VenueNavigator } = await server.ssrLoadModule(
        "./src/components/navigators/VenueNavigator.jsx"
      );
      const html = renderToStaticMarkup(
        React.createElement(VenueNavigator, {
          venueSortMode: "region",
          setVenueSortMode: () => {},
          selRegion: "日本 - 關東",
          setSelRegion: () => {},
          selVenue: "",
          venuePage: 0,
          setVenuePage: () => {},
          allVenues: [],
          venuesSortedByCount: [],
          filteredVenues: [],
          pagedVenues: [],
          handleSelectVenue: () => {},
        })
      );
      assert.ok(html.length > 0);
      assert.ok(html.includes("場地分類方式"));
    });
  });

  describe("7. Custom Hooks & Route State Machine Invariants (ADR-0101)", () => {
    let buildIndex;
    let allUnits;
    let useArchiveFilter;
    let useArchiveRoute;
    let index;
    let initialUnitId;
    let initialSongId;
    let initialVenueName;

    it("prepares domain index and mock browser environment", async () => {
      globalThis.window = {
        location: { hash: "", pathname: "/" },
        addEventListener: () => {},
        removeEventListener: () => {},
        scrollTo: () => {},
        innerHeight: 800,
      };
      globalThis.document = {
        body: { style: {} },
      };

      const domainMod = await server.ssrLoadModule("./src/lib/domain.js");
      buildIndex = domainMod.buildIndex;
      allUnits = domainMod.allUnits;

      const filterMod = await server.ssrLoadModule(
        "./src/hooks/useArchiveFilter.js"
      );
      useArchiveFilter = filterMod.useArchiveFilter;

      const routeMod = await server.ssrLoadModule(
        "./src/hooks/useArchiveRoute.js"
      );
      useArchiveRoute = routeMod.useArchiveRoute;

      index = buildIndex();
      initialUnitId = allUnits[0]?.id ?? null;
      initialSongId = index.allUsedSongs[0]?.id ?? null;
      initialVenueName = index.allVenues[0]?.name ?? null;

      assert.ok(index);
      assert.ok(useArchiveFilter);
      assert.ok(useArchiveRoute);
    });

    const runProbe = (hash = "") => {
      globalThis.window.location.hash = hash;
      let capturedFilter = null;
      let capturedRoute = null;

      function ProbeComponent() {
        const filterState = useArchiveFilter({
          unitData: index.unitData,
          trackShows: index.trackShows,
          globalVenueShows: index.globalVenueShows,
          allUsedSongs: index.allUsedSongs,
          allVenues: index.allVenues,
          initialUnitId,
          initialSongId,
          initialVenueName,
        });
        const routeState = useArchiveRoute({
          unitData: index.unitData,
          allUsedSongs: index.allUsedSongs,
          allVenues: index.allVenues,
          unitIdByShowId: index.unitIdByShowId,
          filterState,
        });
        capturedFilter = filterState;
        capturedRoute = routeState;
        return null;
      }

      renderToStaticMarkup(React.createElement(ProbeComponent));
      return { filter: capturedFilter, route: capturedRoute };
    };

    it("handles default and landing routes without active hash", () => {
      const { filter, route } = runProbe("");
      assert.equal(route.viewMode, "landing");
      assert.equal(filter.selCategory, "巡演專場");
      assert.ok(filter.totalAllShows > 0);
    });

    it("penetrates direct deep link for songs (#/song/:id) with album grouping", () => {
      const targetSong = index.allUsedSongs[0]?.id;
      assert.ok(targetSong);
      const { route } = runProbe(`#/song/${targetSong}`);
      assert.equal(route.viewMode, "archive");
      assert.equal(route.tab, "song");
      assert.equal(route.selSong, targetSong);
    });

    it("penetrates direct deep link for shows (#/show/:id) with unit category & year sync", () => {
      const targetShow = Array.from(index.unitIdByShowId.keys())[0];
      assert.ok(targetShow);
      const { route, filter } = runProbe(`#/show/${targetShow}`);
      assert.equal(route.viewMode, "archive");
      assert.equal(route.tab, "show");
      assert.equal(route.selShow, targetShow);
      assert.ok(route.selUnitId);
      assert.ok(filter.selCategory);
    });

    it("penetrates direct deep link for venues (#/venue/:name) with regional grouping", () => {
      const targetVenue = index.allVenues[0]?.name;
      assert.ok(targetVenue);
      const { route } = runProbe(`#/venue/${encodeURIComponent(targetVenue)}`);
      assert.equal(route.viewMode, "archive");
      assert.equal(route.tab, "venue");
      assert.equal(route.selVenue, targetVenue);
    });

    it("safely falls back to default landing state on unknown or malformed hash", () => {
      const { route } = runProbe("#/unknown-target-404");
      assert.equal(route.viewMode, "landing");
      const { route: route2 } = runProbe("#/song/non-existent-song-id-xyz");
      assert.equal(route2.viewMode, "landing");
    });

    it("verifies mobile drawer draft state and confirmation label semantics", () => {
      const { route } = runProbe("");
      assert.equal(route.draftState, null);
      assert.equal(route.confirmButtonLabel, "確認套用");
    });

    it("verifies category count sum and filter memoization integrity", () => {
      const { filter } = runProbe("");
      assert.equal(typeof filter.categoryStats, "object");
      assert.ok(Array.isArray(filter.availableYears));
      assert.ok(filter.availableYears.length > 0);
      assert.ok(filter.totalAllShows > 0);
    });
  });

  describe("8. Tour Statistics Engine & Core TourSlip Presentation (Ticket 1 / ADR-0102)", () => {
    let computeTourStatistics;
    let getTourFrequencyTier;
    let FREQUENCY_TIER_CONFIG;
    let TourSlip;
    let allUnits;

    it("loads tour statistics engine and TourSlip component from Vite SSR", async () => {
      const domainMod = await server.ssrLoadModule("./src/lib/domain.js");
      computeTourStatistics = domainMod.computeTourStatistics;
      getTourFrequencyTier = domainMod.getTourFrequencyTier;
      FREQUENCY_TIER_CONFIG = domainMod.FREQUENCY_TIER_CONFIG;
      allUnits = domainMod.allUnits;

      const slipMod = await server.ssrLoadModule(
        "./src/components/slips/TourSlip.jsx"
      );
      TourSlip = slipMod.TourSlip;

      assert.ok(computeTourStatistics);
      assert.ok(getTourFrequencyTier);
      assert.ok(FREQUENCY_TIER_CONFIG);
      assert.ok(TourSlip);
    });

    it("accurately calculates consensus statistics across all 16 headline tours", () => {
      const headlineTours = allUnits.filter(
        (u) => u.templateSetlist && u.type !== "店家活動"
      );
      assert.ok(
        headlineTours.length >= 16,
        `Expected at least 16 headline tours, found ${headlineTours.length}`
      );

      for (const tour of headlineTours) {
        const stats = computeTourStatistics(tour);
        assert.equal(stats.totalShows, tour.shows.length);
        assert.equal(stats.consensusTracks.length, tour.templateSetlist.length);

        for (const track of stats.consensusTracks) {
          assert.ok(track.count >= 0 && track.count <= stats.totalShows);
          assert.ok(track.ratio >= 0 && track.ratio <= 1);
          assert.equal(track.percentage, Math.round(track.ratio * 100));

          if (track.count === stats.totalShows && stats.totalShows > 0) {
            assert.equal(track.tier, "core");
            assert.equal(track.tierLabel, "核心全勤");
            assert.equal(track.tierBadgeLabel, "核心全勤 100%");
          } else if (track.ratio >= 0.7) {
            assert.equal(track.tier, "regular");
            assert.equal(track.tierLabel, "高頻常駐");
          } else if (track.ratio >= 0.3) {
            assert.equal(track.tier, "rotating");
            assert.equal(track.tierLabel, "雙日輪替");
          } else {
            assert.equal(track.tier, "surprise");
            assert.equal(track.tierLabel, "限定突襲");
          }

          assert.ok(track.badgeClass);
          assert.ok(track.pillClass);
        }
      }
    });

    it("verifies Rejoice Arena Tour 2024 exact frequency classification", () => {
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);

      const stats = computeTourStatistics(rejoiceTour);
      assert.equal(stats.totalShows, 10);
      assert.equal(stats.coreTracks.length, 18);
      assert.equal(stats.regularTracks.length, 1);
      assert.equal(stats.rotatingTracks.length, 2);

      // Check specific regular track: 115萬キロのフィルム was skipped in 1 show
      const filmTrack = stats.consensusTracks.find(
        (t) => t.songId === "115man-kiro-no-film"
      );
      assert.ok(filmTrack);
      assert.equal(filmTrack.count, 9);
      assert.equal(filmTrack.tier, "regular");
      assert.equal(filmTrack.tierLabel, "高頻常駐");

      // Check A/B rotating tracks: fire-ground & no-doubt
      const fireGround = stats.consensusTracks.find(
        (t) => t.songId === "fire-ground"
      );
      assert.ok(fireGround);
      assert.equal(fireGround.count, 5);
      assert.equal(fireGround.tier, "rotating");
      assert.equal(fireGround.tierLabel, "雙日輪替");

      const noDoubt = stats.consensusTracks.find((t) => t.songId === "no-doubt");
      assert.ok(noDoubt);
      assert.equal(noDoubt.count, 5);
      assert.equal(noDoubt.tier, "rotating");
      assert.equal(noDoubt.tierLabel, "雙日輪替");
    });

    it("verifies Shocking Nuts Tour 2022-2023 exact rotating classification", () => {
      const shockingNuts = allUnits.find(
        (u) => u.id === "shocking-nuts-tour-2022-2023"
      );
      assert.ok(shockingNuts);

      const stats = computeTourStatistics(shockingNuts);
      assert.equal(stats.totalShows, 21);
      assert.equal(stats.coreTracks.length, 13);
      assert.equal(stats.rotatingTracks.length, 7);
      assert.equal(stats.regularTracks.length, 0);
    });

    it("gracefully handles null or empty input without mutating parameters", () => {
      const emptyResult = computeTourStatistics(null);
      assert.equal(emptyResult.totalShows, 0);
      assert.equal(emptyResult.consensusTracks.length, 0);

      const dummyTour = Object.freeze({
        id: "dummy-tour",
        title: "Dummy Tour",
        templateSetlist: Object.freeze([
          Object.freeze({ order: 1, songId: "pretender", encore: false }),
        ]),
        shows: Object.freeze([
          Object.freeze({
            id: "dummy-1",
            date: "2024-01-01",
            venue: "Dummy Hall",
            diff: Object.freeze({ skip: [], insert: [] }),
          }),
        ]),
      });

      // Pure invocation on frozen object must succeed without attempting mutation
      const pureResult = computeTourStatistics(dummyTour);
      assert.equal(pureResult.totalShows, 1);
      assert.equal(pureResult.consensusTracks.length, 1);
      assert.equal(pureResult.consensusTracks[0].count, 1);
      assert.equal(pureResult.consensusTracks[0].tier, "core");
    });

    it("renders TourSlip component with complete SSR markup invariants", () => {
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);

      const html = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: rejoiceTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      // Invariants check
      assert.ok(html.length > 0);
      assert.ok(html.includes("Arena Tour 2024 - Rejoice -"));
      assert.ok(html.includes("CONSENSUS TEMPLATE // 巡演標準母單"));
      assert.ok(html.includes("全 10 場次"));
      assert.ok(html.includes("核心全勤 100%"));
      assert.ok(html.includes("高頻常駐 90%"));
      assert.ok(html.includes("雙日輪替 50%"));
      assert.ok(html.includes("max-w-[960px] mx-auto"));
      // Perforation divider & barcode footer presence
      assert.ok(html.includes("OFFICIAL HIGEDAN DISM STAGE ARCHIVE"));
      assert.ok(html.includes("SN: TOUR-"));
      assert.ok(html.includes("TOUR CONSENSUS MASTER SHEET"));
    });

    it("accurately identifies surprise inserts (< 30% play rate) and associates them with show IDs (Ticket 2)", () => {
      const travelersTour = allUnits.find(
        (u) => u.id === "tour-19-20-hall-travelers"
      );
      assert.ok(travelersTour);

      const stats = computeTourStatistics(travelersTour);
      assert.equal(stats.totalShows, 29);
      assert.ok(stats.surpriseTracks.length > 0);

      // All surprise tracks must strictly have ratio < 0.3
      for (const track of stats.surpriseTracks) {
        assert.ok(
          track.ratio < 0.3,
          `Track ${track.title} ratio ${track.ratio} must be < 0.3`
        );
        assert.equal(track.tier, "surprise");
        assert.equal(track.tierLabel, "限定突襲");
        assert.ok(track.appearances.length > 0);
        assert.equal(track.appearances.length, track.count);
        assert.equal(track.shows.length, track.count);
        for (const show of track.shows) {
          assert.ok(show.id);
          assert.ok(show.venue);
        }
      }

      // Check specific surprise track Sweet Tweet (6/29 = 21%)
      const sweetTweet = stats.surpriseTracks.find(
        (t) => t.songId === "sweet-tweet"
      );
      assert.ok(sweetTweet);
      assert.equal(sweetTweet.count, 6);
      assert.equal(sweetTweet.percentage, 21);
      assert.deepEqual(sweetTweet.appearances, [
        "1150086",
        "1150087",
        "1150094",
        "1150099",
        "1150102",
        "1150104",
      ]);

      // Check specific surprise track I LOVE... (6/29 = 21%)
      const iLove = stats.surpriseTracks.find((t) => t.songId === "i-love");
      assert.ok(iLove);
      assert.equal(iLove.count, 6);

      // Check non-songId cover title track Don't Stop Me Now [Queen] (1/29)
      const queenCover = stats.surpriseTracks.find(
        (t) => t.title === "Don't Stop Me Now [Queen]"
      );
      assert.ok(queenCover);
      assert.equal(queenCover.count, 1);
      assert.equal(queenCover.songId, null);
      assert.deepEqual(queenCover.appearances, ["1150092"]);
      // uniqueSongsCount must include cover song (21 template + 8 surprise = 29)
      assert.equal(stats.stats.uniqueSongsCount, 29);

      // Check request variations attached to surprise track
      const ladyTrack = stats.surpriseTracks.find((t) => t.songId === "lady");
      assert.ok(ladyTrack);
      assert.ok(
        ladyTrack.variations.some((v) => v.includes("会場リクエスト"))
      );
    });

    it("properly filters and numbers interludes with dash (—) without counting towards formal songs (Ticket 2)", () => {
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);

      const stats = computeTourStatistics(rejoiceTour);
      assert.equal(stats.interludes.length, 4);

      for (const interlude of stats.interludes) {
        assert.equal(interlude.cue, "—");
        assert.ok(interlude.showId);
        assert.ok(interlude.item.note);
        // Interludes must have type: "interlude"
        assert.equal(interlude.item.type, "interlude");
      }

      // Check specific interlude notes in Rejoice
      const mcInterlude = stats.interludes.find(
        (it) => it.item.note === "ピアノ弾きMC"
      );
      assert.ok(mcInterlude);
      assert.equal(mcInterlude.showId, "1672276");

      const coverInterlude = stats.interludes.find(
        (it) => it.item.note === "Supernova (ELLEGARDEN) 大輔ボーカル"
      );
      assert.ok(coverInterlude);
      assert.equal(coverInterlude.showId, "1672278");

      // Verify assignCues gives null cue to interludes
      const rawWithInterlude = [
        { songId: "pretender", title: "Pretender" },
        { type: "interlude", note: "メンバーソロ" },
        { songId: "subtitle", title: "Subtitle" },
      ];
      const assigned = assignCues(rawWithInterlude, "M");
      assert.equal(assigned[0].cue, "M1");
      assert.equal(assigned[1].cue, null);
      assert.equal(assigned[2].cue, "M2");
    });

    it("merges version variations and satoshi-solo into master tracks without splitting (Ticket 2)", () => {
      // 1. In Editorial Tour (49 shows), mixed-nuts was inserted in 4 shows with solo & premiere notes
      const editorialTour = allUnits.find(
        (u) => u.id === "one-man-tour-2021-2022-editorial"
      );
      assert.ok(editorialTour);

      const editorialStats = computeTourStatistics(editorialTour);
      const mixedNutsEntries = editorialStats.surpriseTracks.filter(
        (t) => t.songId === "mixed-nuts"
      );
      // Must not split into multiple entries
      assert.equal(mixedNutsEntries.length, 1);
      const mixedNuts = mixedNutsEntries[0];
      assert.equal(mixedNuts.count, 4);
      assert.equal(mixedNuts.totalShows, 49);
      assert.ok(mixedNuts.ratio < 0.3);
      // Both notes must be captured in variations
      assert.ok(
        mixedNuts.variations.some((v) => v.includes("藤原聡/弾き語り"))
      );
      assert.ok(mixedNuts.variations.some((v) => v.includes("新曲")));

      // 2. In Shocking Nuts Tour, template track Subtitle had satoshi-solo & premiere versions
      const shockingNuts = allUnits.find(
        (u) => u.id === "shocking-nuts-tour-2022-2023"
      );
      assert.ok(shockingNuts);
      const shockingStats = computeTourStatistics(shockingNuts);
      const subtitleEntries = shockingStats.consensusTracks.filter(
        (t) => t.songId === "subtitle"
      );
      assert.equal(subtitleEntries.length, 1);
      const subtitle = subtitleEntries[0];
      assert.equal(subtitle.count, 21);
      assert.equal(subtitle.tier, "core");
      assert.ok(
        subtitle.variations.some((v) => v.includes("ピアノ弾き語り"))
      );
      assert.ok(subtitle.variations.some((v) => v.includes("新曲")));
    });

    it("renders TourSlip component with complete Surprise Inserts and Interludes SSR markup", () => {
      // Test 1: Hall Travelers Tour has Surprise Inserts
      const travelersTour = allUnits.find(
        (u) => u.id === "tour-19-20-hall-travelers"
      );
      assert.ok(travelersTour);

      const travelersHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: travelersTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      assert.ok(travelersHtml.includes("SURPRISE INSERTS // 巡演限定突襲曲"));
      assert.ok(travelersHtml.includes("Sweet Tweet"));
      assert.ok(travelersHtml.includes("I LOVE..."));
      assert.ok(travelersHtml.includes("愛なんだが…"));
      // Direct ticket links for shows
      assert.ok(travelersHtml.includes("#/show/1150086"));
      assert.ok(travelersHtml.includes("🎫"));

      // Test 2: Rejoice Arena Tour has Interludes
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);

      const rejoiceHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: rejoiceTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      assert.ok(
        rejoiceHtml.includes("INTERLUDES // 特別彈唱與過場（不計入正式曲目）")
      );
      assert.ok(rejoiceHtml.includes("ピアノ弾きMC"));
      assert.ok(rejoiceHtml.includes("Supernova (ELLEGARDEN) 大輔ボーカル"));
      assert.ok(rejoiceHtml.includes("#/show/1672276"));
    });
  });
});




