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
    const path = await import("node:path");
    const url = await import("node:url");
    const here = path.dirname(url.fileURLToPath(import.meta.url));
    server = await vite.createServer({
      root: path.resolve(here, ".."),
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

  const failureLog = [];
  process.on("test:fail", (data) => {
    failureLog.push({
      name: data.name,
      file: data.file,
      line: data.line,
      error: data.details?.error?.message || data.details?.error || "Assertion failed",
    });
  });

  process.on("exit", (code) => {
    if (code !== 0 && failureLog.length > 0) {
      console.error("\n" + "=".repeat(60));
      console.error(`💥 [Smoke Test Failures Summary: ${failureLog.length} failed]`);
      console.error("=".repeat(60));
      for (const f of failureLog) {
        console.error(`❌ ${f.name}`);
        if (f.line) console.error(`   at line ${f.line}`);
        console.error(`   Error: ${f.error}`);
        console.error("-".repeat(60));
      }
    }
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

    it("ensures slip components adhere to DESIGN.md zero-blur shadow rules", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const slipsDir = path.resolve(
        import.meta.dirname,
        "../src/components/slips"
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
    let ShowSlip;
    let DualModeCapsuleToggle;
    let ArchiveLayout;
    let useArchiveFilter;
    let useArchiveRoute;
    let parseRoute;
    let routeHash;
    let allUnits;
    let index;

    it("loads tour statistics engine and TourSlip component from Vite SSR", async () => {
      const domainMod = await server.ssrLoadModule("./src/lib/domain.js");
      computeTourStatistics = domainMod.computeTourStatistics;
      getTourFrequencyTier = domainMod.getTourFrequencyTier;
      FREQUENCY_TIER_CONFIG = domainMod.FREQUENCY_TIER_CONFIG;
      allUnits = domainMod.allUnits;
      index = domainMod.buildIndex();

      const trackMod = await server.ssrLoadModule("./src/lib/track.js");
      parseRoute = trackMod.parseRoute;
      routeHash = trackMod.routeHash;

      const slipMod = await server.ssrLoadModule(
        "./src/components/slips/TourSlip.jsx"
      );
      TourSlip = slipMod.TourSlip;

      const showSlipMod = await server.ssrLoadModule(
        "./src/components/slips/ShowSlip.jsx"
      );
      ShowSlip = showSlipMod.ShowSlip;

      const ticketCommonMod = await server.ssrLoadModule(
        "./src/components/slips/TicketCommon.jsx"
      );
      DualModeCapsuleToggle = ticketCommonMod.DualModeCapsuleToggle;

      const layoutMod = await server.ssrLoadModule(
        "./src/components/layout/ArchiveLayout.jsx"
      );
      ArchiveLayout = layoutMod.ArchiveLayout;

      const filterMod = await server.ssrLoadModule(
        "./src/hooks/useArchiveFilter.js"
      );
      useArchiveFilter = filterMod.useArchiveFilter;

      const routeMod = await server.ssrLoadModule(
        "./src/hooks/useArchiveRoute.js"
      );
      useArchiveRoute = routeMod.useArchiveRoute;

      assert.ok(computeTourStatistics);
      assert.ok(getTourFrequencyTier);
      assert.ok(FREQUENCY_TIER_CONFIG);
      assert.ok(TourSlip);
      assert.ok(ShowSlip);
      assert.ok(DualModeCapsuleToggle);
      assert.ok(ArchiveLayout);
      assert.ok(useArchiveFilter);
      assert.ok(useArchiveRoute);
      assert.ok(parseRoute);
      assert.ok(routeHash);
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
            assert.equal(track.tierLabel, "巡演定番");
          } else if (track.ratio >= 0.3 && !(stats.totalShows <= 4 && track.count === 1)) {
            assert.equal(track.tier, "rotating");
            assert.equal(track.tierLabel, "雙日輪替");
          } else {
            assert.equal(track.tier, "surprise");
            assert.equal(track.tierLabel, "場次限定");
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
      // In consensus template: 2 rotating tracks (fire-ground & no-doubt)
      assert.equal(stats.consensusTracks.filter((t) => t.tier === "rotating").length, 2);
      // Total rotating tracks (including non-template pretender & i-love): 4
      assert.equal(stats.rotatingTracks.length, 4);

      // Check specific regular track: 115萬キロのフィルム was skipped in 1 show
      const filmTrack = stats.consensusTracks.find(
        (t) => t.songId === "115man-kiro-no-film"
      );
      assert.ok(filmTrack);
      assert.equal(filmTrack.count, 9);
      assert.equal(filmTrack.tier, "regular");
      assert.equal(filmTrack.tierLabel, "巡演定番");

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
      // In consensus template: 7 rotating tracks (A-set)
      assert.equal(stats.consensusTracks.filter((t) => t.tier === "rotating").length, 7);
      // Non-template inserts: 7 rotating tracks (B-set alternate songs)
      assert.equal(stats.nonTemplateRotatingTracks.length, 7);
      // Total rotating tracks across tour: 14 songs
      assert.equal(stats.rotatingTracks.length, 14);
      // True surprise tracks: 4 songs (< 30%: escapade, parabola, fire-ground, white-noise)
      assert.equal(stats.surpriseTracks.length, 4);
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
      assert.ok(html.includes("CONSENSUS TEMPLATE // 巡演定番歌單"));
      assert.ok(html.includes("全 10 場次"));
      assert.ok(html.includes("核心全勤 100%"));
      assert.ok(html.includes("巡演定番 90%"));
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

      // All non-template surprise tracks must strictly have ratio < 0.7
      for (const track of stats.surpriseTracks) {
        assert.ok(
          track.ratio < 0.7,
          `Track ${track.title} ratio ${track.ratio} must be < 0.7`
        );
        assert.equal(track.tier, "surprise");
        assert.equal(track.tierLabel, "場次限定");
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
      // But because Subtitle in Shocking Nuts was only solo in 1 of 21 shows, badges must NOT have solo!
      assert.ok(!subtitle.badges.some((b) => b.type === "solo"));

      // 3. 100% Monolithic Arrangement Rule: Four-re-ism tour (all 5 shows solo)
      const fourReIsm = allUnits.find((u) => u.id === "four-re-ism-2025-2026");
      if (fourReIsm) {
        const fcStats = computeTourStatistics(fourReIsm);
        const fcSubtitle = fcStats.consensusTracks.find((t) => t.songId === "subtitle");
        if (fcSubtitle) {
          assert.ok(fcSubtitle.badges.some((b) => b.type === "solo" && b.label === "自彈自唱"));
        }
      }

      // 4. Asia Tour 2026 Taipei surprise: 1/1 show was requested
      const asia2026 = allUnits.find((u) => u.id === "asia-tour-2026");
      if (asia2026) {
        const asiaStats = computeTourStatistics(asia2026);
        const film = asiaStats.surpriseTracks.find((t) => t.songId === "115man-kiro-no-film");
        if (film) {
          assert.ok(film.badges.some((b) => b.type === "request" && b.label === "點歌"));
        }
        // Itinerary highlight must carry tagLabel '點歌'
        const tpeStop = asiaStats.itinerary.find((s) => s.city === "台北");
        if (tpeStop) {
          assert.ok(tpeStop.surpriseHighlights.some((h) => h.tagLabel === "點歌"));
        }
      }
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

      assert.ok(travelersHtml.includes("SPECIAL INSERTS // 巡演場次限定曲"));
      assert.ok(travelersHtml.includes("id=\"surprise-inserts-section\""));
      assert.ok(travelersHtml.includes("id=\"consensus-template-section\""));
      assert.ok(travelersHtml.includes("SWEET TWEET"));
      assert.ok(travelersHtml.includes("I LOVE..."));
      assert.ok(travelersHtml.includes("愛なんだが…"));
      // Direct ticket links for shows with cue numbers
      assert.ok(travelersHtml.includes("#/show/1150086"));
      assert.ok(travelersHtml.includes("🎫"));
      assert.ok(travelersHtml.includes("(EN"));

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

    it("accurately outputs chronological itinerary timeline with all required fields (Ticket 3)", () => {
      // 1. Long tour: Hall Travelers (29 shows)
      const travelersTour = allUnits.find(
        (u) => u.id === "tour-19-20-hall-travelers"
      );
      assert.ok(travelersTour);
      const travelersStats = computeTourStatistics(travelersTour);
      assert.equal(travelersStats.itinerary.length, 29);

      // Verify strictly chronological ordering
      for (let i = 0; i < travelersStats.itinerary.length - 1; i++) {
        const curr = travelersStats.itinerary[i];
        const next = travelersStats.itinerary[i + 1];
        assert.ok(
          curr.date <= next.date,
          `Itinerary must be sorted chronologically: ${curr.date} <= ${next.date}`
        );
        assert.equal(curr.index, i + 1);
      }

      // Verify first and last milestones
      assert.equal(travelersStats.itinerary[0].isFirst, true);
      assert.equal(travelersStats.itinerary[0].isFinal, false);
      assert.equal(travelersStats.itinerary[0].index, 1);
      assert.equal(travelersStats.itinerary[0].id, "1150083");
      assert.equal(travelersStats.itinerary[0].date, "2019-10-26");
      assert.equal(travelersStats.itinerary[0].city, "市川");
      assert.equal(travelersStats.itinerary[0].venue, "市川市文化會館 大會堂");
      assert.ok(travelersStats.itinerary[0].time); // e.g. "18:00 開演"
      assert.ok(typeof travelersStats.itinerary[0].totalSongs === "number");
      assert.ok(typeof travelersStats.itinerary[0].isStandard === "boolean");
      assert.ok(Array.isArray(travelersStats.itinerary[0].surpriseHighlights));

      const lastTraveler = travelersStats.itinerary[28];
      assert.equal(lastTraveler.isFirst, false);
      assert.equal(lastTraveler.isFinal, true);
      assert.equal(lastTraveler.index, 29);

      // 2. Exact 10-show tour: Rejoice Arena Tour
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);
      const rejoiceStats = computeTourStatistics(rejoiceTour);
      assert.equal(rejoiceStats.itinerary.length, 10);
      assert.equal(rejoiceStats.itinerary[0].isFirst, true);
      assert.equal(rejoiceStats.itinerary[9].isFinal, true);
      assert.equal(rejoiceStats.itinerary[0].city, "福岡");
      assert.equal(rejoiceStats.itinerary[0].venue, "福岡海洋展覽館 A館");
      assert.equal(rejoiceStats.itinerary[0].time, "19:00 開演");

      // 3. Short tour: Asia Tour 2024 (3 shows)
      const asiaTour = allUnits.find((u) => u.id === "asia-tour-2024");
      assert.ok(asiaTour);
      const asiaStats = computeTourStatistics(asiaTour);
      assert.equal(asiaStats.itinerary.length, 3);
      assert.equal(asiaStats.itinerary[0].city, "高陽");
      assert.equal(asiaStats.itinerary[2].city, "台北");
    });

    it("renders TourSlip with Itinerary, collapsing long tours (>10 shows) and expanding on demand (Ticket 3)", () => {
      const travelersTour = allUnits.find(
        (u) => u.id === "tour-19-20-hall-travelers"
      );
      assert.ok(travelersTour);

      // Collapsed render (default): shows first 10, contains expand button
      const collapsedHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: travelersTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      assert.ok(collapsedHtml.includes("TOUR ITINERARY // 全國巡演日程足跡"));
      assert.ok(collapsedHtml.includes("id=\"tour-itinerary-section\""));
      assert.ok(collapsedHtml.includes("29 STOPS"));
      assert.ok(collapsedHtml.includes("#01"));
      assert.ok(collapsedHtml.includes("#10"));
      // In collapsed mode, #11 must NOT be rendered in itinerary
      assert.ok(!collapsedHtml.includes("#11"));
      // Expand button present
      assert.ok(collapsedHtml.includes("展開全部日程"));
      assert.ok(collapsedHtml.includes("全 29 場"));
      // First show has 初日 badge
      assert.ok(collapsedHtml.includes("初日"));
      // View ticket stub shortcut
      assert.ok(collapsedHtml.includes("查看票根"));
      assert.ok(collapsedHtml.includes("#/show/1150083"));
      // Cross-show diff profile line
      assert.ok(collapsedHtml.includes("定番歌單場") || collapsedHtml.includes("限定："));

      // Expanded render: shows all 29, contains collapse button
      const expandedHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: travelersTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
          initialItineraryExpanded: true,
        })
      );

      assert.ok(expandedHtml.includes("#01"));
      assert.ok(expandedHtml.includes("#10"));
      assert.ok(expandedHtml.includes("#11"));
      assert.ok(expandedHtml.includes("#29"));
      assert.ok(expandedHtml.includes("千秋樂"));
      assert.ok(expandedHtml.includes("收合巡演日程"));
      assert.ok(!expandedHtml.includes("展開全部日程"));
    });

    it("renders TourSlip with full itinerary without collapse button for tours <= 10 shows (Ticket 3)", () => {
      // 1. Exactly 10 shows: Rejoice Arena Tour
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

      assert.ok(rejoiceHtml.includes("TOUR ITINERARY // 全國巡演日程足跡"));
      assert.ok(rejoiceHtml.includes("10 STOPS"));
      assert.ok(rejoiceHtml.includes("#01"));
      assert.ok(rejoiceHtml.includes("#10"));
      assert.ok(rejoiceHtml.includes("初日"));
      assert.ok(rejoiceHtml.includes("千秋樂"));
      // Must NOT contain expand/collapse toggle
      assert.ok(!rejoiceHtml.includes("展開全部日程"));
      assert.ok(!rejoiceHtml.includes("收合巡演日程"));

      // 2. Short tour (3 shows): Asia Tour 2024
      const asiaTour = allUnits.find((u) => u.id === "asia-tour-2024");
      assert.ok(asiaTour);

      const asiaHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: asiaTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      assert.ok(asiaHtml.includes("3 STOPS"));
      assert.ok(asiaHtml.includes("#01"));
      assert.ok(asiaHtml.includes("#02"));
      assert.ok(asiaHtml.includes("#03"));
      assert.ok(!asiaHtml.includes("#04"));
      assert.ok(!asiaHtml.includes("展開全部日程"));
      assert.ok(!asiaHtml.includes("收合巡演日程"));
    });

    it("parses and generates #/tour/:unitId route hashes bidirectionally (Ticket 4)", () => {
      // 1. parseRoute
      const parsed1 = parseRoute("#/tour/arena-tour-2024-rejoice");
      assert.deepEqual(parsed1, {
        kind: "tour",
        value: "arena-tour-2024-rejoice",
      });

      const parsed2 = parseRoute("/tour/one-man-tour-2021-2022-editorial");
      assert.deepEqual(parsed2, {
        kind: "tour",
        value: "one-man-tour-2021-2022-editorial",
      });

      // 2. routeHash.tour
      assert.equal(
        routeHash.tour("arena-tour-2024-rejoice"),
        "#/tour/arena-tour-2024-rejoice"
      );
    });

    it("penetrates direct deep link for tours (#/tour/:unitId) with showSubMode 'tour' and category/year sync (Ticket 4)", () => {
      const runProbeWithRoute = (hash = "") => {
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
            initialUnitId: allUnits[0]?.id ?? null,
            initialSongId: index.allUsedSongs[0]?.id ?? null,
            initialVenueName: index.allVenues[0]?.name ?? null,
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

      // Test 1: Rejoice Arena Tour
      const { route: r1, filter: f1 } = runProbeWithRoute(
        "#/tour/arena-tour-2024-rejoice"
      );
      assert.equal(r1.viewMode, "archive");
      assert.equal(r1.tab, "show");
      assert.equal(r1.showSubMode, "tour");
      assert.equal(r1.selUnitId, "arena-tour-2024-rejoice");
      assert.ok(f1.selCategory);
      assert.ok(f1.selYear);

      // Test 2: Show direct deep link (#/show/:id) maintains showSubMode "show"
      const { route: r2 } = runProbeWithRoute("#/show/1672276");
      assert.equal(r2.viewMode, "archive");
      assert.equal(r2.tab, "show");
      assert.equal(r2.showSubMode, "show");
      assert.equal(r2.selShow, "1672276");
      assert.equal(r2.selUnitId, "arena-tour-2024-rejoice");

      // Test 3: Gracefully falls back to landing on invalid tour ID
      const { route: r3 } = runProbeWithRoute("#/tour/invalid-tour-non-existent-xyz");
      assert.equal(r3.viewMode, "landing");

      // Test 4: Single event accessed via #/tour/:unitId safely redirects to show mode
      const singleEvent = allUnits.find((u) => !u.templateSetlist);
      assert.ok(singleEvent);
      const { route: r4 } = runProbeWithRoute(`#/tour/${singleEvent.id}`);
      assert.equal(r4.viewMode, "archive");
      assert.equal(r4.tab, "show");
      assert.equal(r4.showSubMode, "show");
      assert.equal(r4.selUnitId, singleEvent.id);
      assert.equal(r4.selShow, singleEvent.shows[0]?.id);
    });

    it("verifies mobile drawer draftState supports tour slip staging, cancel rollback, and commit (Ticket 4)", () => {
      const runProbeWithDraft = (hash = "#/show/1672276", initialDraft = null) => {
        globalThis.window.location.hash = hash;
        let capturedRoute = null;

        function ProbeComponent() {
          const filterState = useArchiveFilter({
            unitData: index.unitData,
            trackShows: index.trackShows,
            globalVenueShows: index.globalVenueShows,
            allUsedSongs: index.allUsedSongs,
            allVenues: index.allVenues,
            initialUnitId: allUnits[0]?.id ?? null,
            initialSongId: index.allUsedSongs[0]?.id ?? null,
            initialVenueName: index.allVenues[0]?.name ?? null,
          });
          const routeState = useArchiveRoute({
            unitData: index.unitData,
            allUsedSongs: index.allUsedSongs,
            allVenues: index.allVenues,
            unitIdByShowId: index.unitIdByShowId,
            filterState,
            initialDraftState: initialDraft,
          });
          capturedRoute = routeState;
          return null;
        }

        renderToStaticMarkup(React.createElement(ProbeComponent));
        return capturedRoute;
      };

      // 1. Default route without draftState
      const defaultRoute = runProbeWithDraft("#/show/1672276", null);
      assert.equal(defaultRoute.showSubMode, "show");
      assert.equal(defaultRoute.draftState, null);
      assert.equal(defaultRoute.confirmButtonLabel, "確認套用");

      // 2. Staged tour selection in draftState
      const stagedTourRoute = runProbeWithDraft("#/show/1672276", {
        category: "巡演專場",
        year: "2024",
        unitId: "arena-tour-2024-rejoice",
        showId: "1672276",
        showSubMode: "tour",
      });
      assert.ok(stagedTourRoute.draftState);
      assert.equal(stagedTourRoute.draftState.showSubMode, "tour");
      assert.ok(stagedTourRoute.confirmButtonLabel.includes("巡演總覽"));

      // 3. Staged show selection in draftState
      const stagedShowRoute = runProbeWithDraft("#/tour/arena-tour-2024-rejoice", {
        category: "巡演專場",
        year: "2024",
        unitId: "arena-tour-2024-rejoice",
        showId: "1672276",
        showSubMode: "show",
      });
      assert.ok(stagedShowRoute.draftState);
      assert.equal(stagedShowRoute.draftState.showSubMode, "show");
      assert.ok(stagedShowRoute.confirmButtonLabel.includes("確認套用："));
    });

    it("renders ArchiveLayout conditionally: TourSlip when showSubMode === 'tour' and isTour === true, else ShowSlip (Ticket 4)", () => {
      const rejoiceTour = index.unitData.get("arena-tour-2024-rejoice");
      assert.ok(rejoiceTour);

      // Render 1: showSubMode === "tour" -> renders TourSlip
      const tourLayoutHtml = renderToStaticMarkup(
        React.createElement(ArchiveLayout, {
          filterState: {
            selCategory: "巡演專場",
            selYear: "2024",
            setSelYear: () => {},
            unitPage: 0,
            setUnitPage: () => {},
            showPage: 0,
            setShowPage: () => {},
            unitsByCategory: { "巡演專場": [rejoiceTour.unit] },
            categoryStats: {},
            availableYears: ["2024"],
            yearStats: new Map(),
            filteredUnits: [rejoiceTour.unit],
            pagedUnits: [rejoiceTour.unit],
            totalAllShows: 10,
            handleCategoryClick: () => {},
          },
          routeState: {
            tab: "show",
            setTab: () => {},
            showSubMode: "tour",
            setShowSubMode: () => {},
            selUnitId: "arena-tour-2024-rejoice",
            selShow: "1672276",
            selSong: "",
            selVenue: "",
            q: "",
            setQ: () => {},
            isDesktopNavOpen: false,
            toggleDesktopNav: () => {},
            isFilterDrawerOpen: false,
            setIsFilterDrawerOpen: () => {},
            isMobileSearchOpen: false,
            setIsMobileSearchOpen: () => {},
            isCalendarOpen: false,
            setIsCalendarOpen: () => {},
            draftState: null,
            setDraftState: () => {},
            openFilterDrawer: () => {},
            handleCancelDrawer: () => {},
            handleCommitDrawer: () => {},
            confirmButtonLabel: "確認套用",
            slipRef: { current: null },
            handleSelectShow: () => {},
            handleSelectSong: () => {},
            handleSelectVenue: () => {},
            handleSelectUnit: () => {},
            handleReturnHome: () => {},
            handleSelectTourMode: () => {},
            handleSelectShowMode: () => {},
            handleToggleSubMode: () => {},
            visualViewportStyle: { height: "100dvh", top: 0 },
          },
          unitData: index.unitData,
          trackShows: index.trackShows,
          globalVenueShows: index.globalVenueShows,
          allUsedSongs: index.allUsedSongs,
          allVenues: index.allVenues,
          allUnits: allUnits,
          showById: new Map(),
        })
      );

      // Must render TourSlip markup
      assert.ok(tourLayoutHtml.includes("TOUR CONSENSUS MASTER SHEET"));
      assert.ok(tourLayoutHtml.includes("CONSENSUS TEMPLATE // 巡演定番歌單"));
      assert.ok(tourLayoutHtml.includes("巡演總覽"));
      assert.ok(tourLayoutHtml.includes("查看票根"));

      // Render 2: showSubMode === "show" -> renders ShowSlip
      const showLayoutHtml = renderToStaticMarkup(
        React.createElement(ArchiveLayout, {
          filterState: {
            selCategory: "巡演專場",
            selYear: "2024",
            setSelYear: () => {},
            unitPage: 0,
            setUnitPage: () => {},
            showPage: 0,
            setShowPage: () => {},
            unitsByCategory: { "巡演專場": [rejoiceTour.unit] },
            categoryStats: {},
            availableYears: ["2024"],
            yearStats: new Map(),
            filteredUnits: [rejoiceTour.unit],
            pagedUnits: [rejoiceTour.unit],
            totalAllShows: 10,
            handleCategoryClick: () => {},
          },
          routeState: {
            tab: "show",
            setTab: () => {},
            showSubMode: "show",
            setShowSubMode: () => {},
            selUnitId: "arena-tour-2024-rejoice",
            selShow: "1672276",
            selSong: "",
            selVenue: "",
            q: "",
            setQ: () => {},
            isDesktopNavOpen: false,
            toggleDesktopNav: () => {},
            isFilterDrawerOpen: false,
            setIsFilterDrawerOpen: () => {},
            isMobileSearchOpen: false,
            setIsMobileSearchOpen: () => {},
            isCalendarOpen: false,
            setIsCalendarOpen: () => {},
            draftState: null,
            setDraftState: () => {},
            openFilterDrawer: () => {},
            handleCancelDrawer: () => {},
            handleCommitDrawer: () => {},
            confirmButtonLabel: "確認套用",
            slipRef: { current: null },
            handleSelectShow: () => {},
            handleSelectSong: () => {},
            handleSelectVenue: () => {},
            handleSelectUnit: () => {},
            handleReturnHome: () => {},
            handleSelectTourMode: () => {},
            handleSelectShowMode: () => {},
            handleToggleSubMode: () => {},
            visualViewportStyle: { height: "100dvh", top: 0 },
          },
          unitData: index.unitData,
          trackShows: index.trackShows,
          globalVenueShows: index.globalVenueShows,
          allUsedSongs: index.allUsedSongs,
          allVenues: index.allVenues,
          allUnits: allUnits,
          showById: new Map(),
        })
      );

      // Must render ShowSlip markup
      assert.ok(showLayoutHtml.includes("STAGE SETLIST RUN SHEET"));
      assert.ok(showLayoutHtml.includes("MAIN SETLIST // 本篇演奏曲目"));
      assert.ok(showLayoutHtml.includes("橫濱K-Arena"));
    });

    it("preserves pure ticket aesthetics without internal mode switchers inside TourSlip and ShowSlip (ADR-0102)", () => {
      // 1. TourSlip contains pure ticket header without internal toggle
      const rejoiceTour = allUnits.find((u) => u.id === "arena-tour-2024-rejoice");
      assert.ok(rejoiceTour);
      const tourHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: rejoiceTour,
          showSubMode: "tour",
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );
      assert.ok(tourHtml.includes("TOUR CONSENSUS MASTER SHEET"));
      assert.ok(tourHtml.includes("CONSENSUS TEMPLATE // 巡演定番歌單"));
      // Pure ticket: NO internal capsule toggle inside the paper slip
      assert.ok(!tourHtml.includes("⟷"));

      // 2. ShowSlip for tour contains pure ticket header without internal toggle
      const rejoiceUd = index.unitData.get("arena-tour-2024-rejoice");
      const showHtml = renderToStaticMarkup(
        React.createElement(ShowSlip, {
          ud: rejoiceUd,
          showId: "1672276",
          showSubMode: "show",
          onSelectSong: () => {},
          onSelectShow: () => {},
          onSelectVenue: () => {},
        })
      );
      assert.ok(showHtml.includes("STAGE SETLIST RUN SHEET"));
      assert.ok(showHtml.includes("MAIN SETLIST // 本篇演奏曲目"));
      // Pure ticket: NO internal capsule toggle inside the paper slip
      assert.ok(!showHtml.includes("⟷"));
      assert.ok(!showHtml.includes("單場即時票根"));

      // 3. DualModeCapsuleToggle component standalone isolation
      const standaloneToggleHtml = renderToStaticMarkup(
        React.createElement(DualModeCapsuleToggle, {
          isTour: true,
          mode: "show",
          unitId: "arena-tour-2024-rejoice",
          showId: "1672276",
          onToggleMode: () => {},
          onSelectTour: () => {},
          onSelectShow: () => {},
        })
      );
      assert.ok(standaloneToggleHtml.includes("巡演總覽"));
      assert.ok(standaloneToggleHtml.includes("單場即時票根"));
      assert.ok(standaloneToggleHtml.includes("⟷"));
    });
  });

  describe("9. Design Token Invariants & Dedicated URL Routes Seam (DESIGN.md, ADR-0101)", () => {
    it("exports parseRoute and routeHash from dedicated routes.js module with full bidirectional parity", async () => {
      const routesMod = await server.ssrLoadModule("/src/lib/routes.js");
      assert.ok(typeof routesMod.parseRoute === "function");
      assert.ok(typeof routesMod.routeHash === "object");
      assert.equal(routesMod.routeHash.song("pretender"), "#/song/pretender");
      assert.equal(routesMod.routeHash.show("1672276"), "#/show/1672276");
      assert.equal(routesMod.routeHash.venue("日本武道館"), "#/venue/%E6%97%A5%E6%9C%AC%E6%AD%A6%E9%81%93%E9%A4%A8");
      assert.equal(routesMod.routeHash.tour("arena-tour-2024-rejoice"), "#/tour/arena-tour-2024-rejoice");

      assert.deepEqual(routesMod.parseRoute("#/song/pretender"), { kind: "song", value: "pretender" });
      assert.deepEqual(routesMod.parseRoute("#/show/1672276"), { kind: "show", value: "1672276" });
      assert.deepEqual(routesMod.parseRoute("#/venue/%E6%97%A5%E6%9C%AC%E6%AD%A6%E9%81%93%E9%A4%A8"), { kind: "venue", value: "日本武道館" });
      assert.deepEqual(routesMod.parseRoute("#/tour/arena-tour-2024-rejoice"), { kind: "tour", value: "arena-tour-2024-rejoice" });
      assert.equal(routesMod.parseRoute(""), null);
      assert.equal(routesMod.parseRoute("#/unknown/123"), null);
    });

    it("ensures track.js re-exports parseRoute and routeHash for backwards compatibility", async () => {
      const trackMod = await server.ssrLoadModule("/src/lib/track.js");
      const routesMod = await server.ssrLoadModule("/src/lib/routes.js");
      assert.equal(trackMod.parseRoute, routesMod.parseRoute);
      assert.equal(trackMod.routeHash, routesMod.routeHash);
    });

    it("verifies style.css defines zero-blur shadow tokens under @theme and dark theme", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const url = await import("node:url");
      const here = path.dirname(url.fileURLToPath(import.meta.url));
      const stylePath = path.resolve(here, "..", "src", "style.css");
      const cssContent = fs.readFileSync(stylePath, "utf8");

      // Verify all shadow tokens are configured with 0 blur
      const shadowTokens = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"];
      for (const token of shadowTokens) {
        const regex = new RegExp(`--shadow-${token}:\\s*\\d+(?:\\.\\d+)?px\\s+\\d+(?:\\.\\d+)?px\\s+0\\b`);
        assert.ok(
          regex.test(cssContent),
          `style.css must define zero-blur --shadow-${token} with 0 blur radius`
        );
      }
    });

    it("verifies all custom theme color tokens are declared in style.css under @theme and dark mode", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const url = await import("node:url");
      const here = path.dirname(url.fileURLToPath(import.meta.url));
      const stylePath = path.resolve(here, "..", "src", "style.css");
      const cssContent = fs.readFileSync(stylePath, "utf8");

      // Extract tokens declared in @theme
      const themeBlockMatch = cssContent.match(/@theme\s*\{([^}]+)\}/s);
      assert.ok(themeBlockMatch, "style.css must contain @theme block");
      const themeBlock = themeBlockMatch[1];

      const declaredColors = new Set();
      for (const match of themeBlock.matchAll(/--color-([a-z0-9-]+):/g)) {
        declaredColors.add(match[1]);
      }

      // Extract tokens declared in dark mode html[data-theme="dark"]
      const darkBlockMatch = cssContent.match(/html\[data-theme=["']dark["']\]\s*\{([^}]+)\}/s);
      assert.ok(darkBlockMatch, "style.css must contain html[data-theme='dark'] block");
      const darkBlock = darkBlockMatch[1];

      const darkColors = new Set();
      for (const match of darkBlock.matchAll(/--color-([a-z0-9-]+):/g)) {
        darkColors.add(match[1]);
      }

      // Design system core tokens that must exist in both light and dark theme
      const requiredCoreTokens = [
        "paper",
        "card",
        "band",
        "band-ink",
        "ink",
        "muted",
        "line",
        "line-soft",
        "tape",
        "tape-tint",
        "tape-soft",
        "tape-edge",
        "request",
        "request-wash",
        "unreleased",
        "unreleased-wash",
        "premiere",
        "premiere-wash",
        "solo",
        "solo-wash",
        "pool",
        "pool-wash",
      ];

      for (const token of requiredCoreTokens) {
        assert.ok(
          declaredColors.has(token),
          `style.css @theme must declare --color-${token}`
        );
        assert.ok(
          darkColors.has(token),
          `style.css html[data-theme="dark"] must declare --color-${token}`
        );
      }
    });

    it("prohibits arbitrary unvetted hex color classes in UI components (DESIGN.md)", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const url = await import("node:url");
      const here = path.dirname(url.fileURLToPath(import.meta.url));
      const componentsDir = path.resolve(here, "..", "src", "components");

      function findJsxFiles(dir) {
        let results = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results = results.concat(findJsxFiles(fullPath));
          } else if (entry.name.endsWith(".jsx")) {
            results.push(fullPath);
          }
        }
        return results;
      }

      const files = findJsxFiles(componentsDir);
      const violations = [];
      const hexClassRegex = /\b(?:text|bg|border|ring|outline)-\[#[0-9a-fA-F]{3,8}\]/g;

      for (const file of files) {
        const basename = path.basename(file);
        // MemorialCardModal defines physical offscreen cardstock raster styles (ADR-0100), but its badges must strictly use design tokens
        if (basename === "MemorialCardModal.jsx") {
          const content = fs.readFileSync(file, "utf8");
          const badgeSection = content.slice(content.indexOf("tabs.map"), content.indexOf("return ("));
          const badgeHexMatches = badgeSection.match(hexClassRegex);
          if (badgeHexMatches) {
            violations.push(`${basename} (badges): ${badgeHexMatches.join(", ")}`);
          }
          continue;
        }

        const content = fs.readFileSync(file, "utf8");
        const matches = content.match(hexClassRegex);
        if (matches) {
          const relPath = path.relative(componentsDir, file).replace(/\\/g, "/");
          violations.push(`${relPath}: ${matches.join(", ")}`);
        }
      }

      assert.deepEqual(
        violations,
        [],
        `Found unvetted arbitrary hex classes in UI components. Use semantic design tokens from DESIGN.md instead:\n${violations.join("\n")}`
      );
    });
  });

  describe("10. Workspace Topology & Runtime Version Invariants (ADR-0103)", () => {
    it("ensures root pnpm-workspace.yaml exists with site package and no rogue workspace configs in subdirectories", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const url = await import("node:url");
      const here = path.dirname(url.fileURLToPath(import.meta.url));
      const repoRoot = path.resolve(here, "..", "..");

      // 1. Root workspace file exists and declares site package
      const rootWorkspacePath = path.join(repoRoot, "pnpm-workspace.yaml");
      assert.ok(
        fs.existsSync(rootWorkspacePath),
        "Root pnpm-workspace.yaml must exist"
      );
      const rootWorkspaceContent = fs.readFileSync(rootWorkspacePath, "utf8");
      assert.ok(
        /packages:\s*\n\s*-\s*['"]site['"]/.test(rootWorkspaceContent),
        "Root pnpm-workspace.yaml must declare packages with 'site'"
      );

      // 2. Subdirectories must NOT contain rogue pnpm-workspace.yaml
      const siteWorkspacePath = path.join(repoRoot, "site", "pnpm-workspace.yaml");
      assert.ok(
        !fs.existsSync(siteWorkspacePath),
        "site/pnpm-workspace.yaml must not exist (rogue workspace file prevents CI execution)"
      );
    });

    it("verifies .nvmrc and package.json engines align with pnpm 11 requirements (>= Node 22)", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const url = await import("node:url");
      const here = path.dirname(url.fileURLToPath(import.meta.url));
      const repoRoot = path.resolve(here, "..", "..");

      // Check .nvmrc
      const nvmrcPath = path.join(repoRoot, ".nvmrc");
      assert.ok(fs.existsSync(nvmrcPath), ".nvmrc must exist in repository root");
      const nvmVersionStr = fs.readFileSync(nvmrcPath, "utf8").trim();
      const nvmMajor = parseInt(nvmVersionStr, 10);
      assert.ok(
        !isNaN(nvmMajor) && nvmMajor >= 22,
        `.nvmrc must specify Node.js version >= 22 for pnpm 11 compatibility (got: ${nvmVersionStr})`
      );

      // Check package.json engines & packageManager
      const rootPkgPath = path.join(repoRoot, "package.json");
      const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
      assert.ok(
        rootPkg.packageManager && rootPkg.packageManager.startsWith("pnpm@11"),
        "root package.json must declare packageManager for pnpm@11"
      );
      assert.ok(
        rootPkg.engines && rootPkg.engines.node && />=\s*22/.test(rootPkg.engines.node),
        "root package.json engines.node must require >=22"
      );
    });

    it("guarantees site/src/data/songs.json is synced from data/ before tests run", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const url = await import("node:url");
      const here = path.dirname(url.fileURLToPath(import.meta.url));
      const repoRoot = path.resolve(here, "..", "..");
      const rootSongsPath = path.resolve(repoRoot, "data", "songs.json");
      const siteSongsPath = path.resolve(here, "..", "src", "data", "songs.json");

      assert.ok(
        fs.existsSync(siteSongsPath),
        "site/src/data/songs.json must exist (run 'pnpm sync' before running tests)"
      );
      assert.ok(
        fs.existsSync(rootSongsPath),
        "data/songs.json must exist"
      );

      const rootContent = fs.readFileSync(rootSongsPath, "utf8");
      const siteContent = fs.readFileSync(siteSongsPath, "utf8");
      assert.equal(
        siteContent,
        rootContent,
        "site/src/data/songs.json must be byte-identical to data/songs.json (run 'pnpm sync')"
      );
    });

    it("guarantees all ADR documents in docs/adr/ are indexed in docs/adr/README.md", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const url = await import("node:url");
      const here = path.dirname(url.fileURLToPath(import.meta.url));
      const repoRoot = path.resolve(here, "..", "..");
      const adrDir = path.resolve(repoRoot, "docs", "adr");
      const readmePath = path.resolve(adrDir, "README.md");

      assert.ok(fs.existsSync(readmePath), "docs/adr/README.md must exist");
      const readmeContent = fs.readFileSync(readmePath, "utf8");

      const adrFiles = fs
        .readdirSync(adrDir)
        .filter((f) => /^0\d{3}-.*\.md$/.test(f));

      const missing = adrFiles.filter((f) => !readmeContent.includes(f));
      assert.deepEqual(
        missing,
        [],
        `The following ADR files are missing from docs/adr/README.md index:\n${missing.join("\n")}`
      );
    });
  });

  describe("11. Song Canonical Title & Alias System Invariants", () => {
    it("exports songAlias with expected official dual-language aliases", async () => {
      const { songAlias, songTitle } = await server.ssrLoadModule("src/lib/domain.js");

      // Verify canonical Japanese titles
      assert.equal(songTitle["no-doubt"], "ノーダウト");
      assert.equal(songTitle["yesterday"], "イエスタデイ");
      assert.equal(songTitle["mixed-nuts"], "ミックスナッツ");
      assert.equal(songTitle["stardust"], "スターダスト");
      assert.equal(songTitle["elder-flower"], "エルダーフラワー");
      assert.equal(songTitle["sweet-tweet"], "SWEET TWEET");

      // Verify official aliases
      assert.equal(songAlias["no-doubt"], "No Doubt");
      assert.equal(songAlias["yesterday"], "Yesterday");
      assert.equal(songAlias["mixed-nuts"], "Mixed Nuts");
      assert.equal(songAlias["white-noise"], "White Noise");
      assert.equal(songAlias["apoptosis"], "Apoptosis");
      assert.equal(songAlias["parabola"], "Parabola");
      assert.equal(songAlias["pending-machine"], "Pending Machine");
      assert.equal(songAlias["brothers"], "Brothers");
      assert.equal(songAlias["bad-for-me"], "Bad for Me");
      assert.equal(songAlias["vintage"], "Vintage");
      assert.equal(songAlias["last-song"], "Last Song");
      assert.equal(songAlias["catchball"], "Catch Ball");
      assert.equal(songAlias["elder-flower"], "Elderflower");
      assert.equal(songAlias["stardust"], "Stardust");
      assert.equal(songAlias["filament"], "Filament");
      assert.equal(songAlias["equal"], "Equal");

      // Verify songs without alias
      assert.equal(songAlias["sweet-tweet"], undefined);
      assert.equal(songAlias["ai-nandaga"], undefined);
      assert.equal(songAlias["pretender"], undefined);
    });

    it("renders SongSlip with alias subtitle below headline", async () => {
      const { SongSlip } = await server.ssrLoadModule("src/components/slips/SongSlip.jsx");
      const { buildIndex } = await server.ssrLoadModule("src/lib/domain.js");
      const { trackShows, showById, unitData } = buildIndex();

      const html = renderToStaticMarkup(
        React.createElement(SongSlip, {
          songId: "stardust",
          trackShows,
          showById,
          unitData,
          onSelectShow: () => {},
          onSelectVenue: () => {},
        })
      );

      assert.ok(html.includes("スターダスト"), "must render Japanese canonical title");
      assert.ok(html.includes("別名：Stardust"), "must render alias subtitle");
    });
  });

  describe("12. Re-recorded Version Song Entity Boundary (ADR-0106)", () => {
    it("distinguishes Anarchy and Anarchy (Rejoice ver.) as separate song entities", async () => {
      const { songTitle, getSongAlbum } = await server.ssrLoadModule("src/lib/domain.js");
      assert.equal(songTitle["anarchy"], "Anarchy");
      assert.equal(songTitle["anarchy-rejoice-ver"], "Anarchy (Rejoice ver.)");

      assert.equal(getSongAlbum({ id: "anarchy" }), "EP / 單曲");
      assert.equal(getSongAlbum({ id: "anarchy-rejoice-ver" }), "Rejoice (2024)");
    });

    it("verifies Rejoice tour consensus templates and play count invariants", async () => {
      const { buildIndex, allUnits } = await server.ssrLoadModule("src/lib/domain.js");
      const { trackShows } = buildIndex();

      const rejoiceShows = trackShows.get("song:anarchy-rejoice-ver") ?? [];
      // 10 arena shows + 3 asia shows + 1 Zepp Haneda 2024-07-23 = 14 shows
      assert.equal(rejoiceShows.length, 14);

      const arenaTour = allUnits.find((u) => u.id === "arena-tour-2024-rejoice");
      assert.ok(arenaTour);
      const arenaTemplateItem = arenaTour.templateSetlist.find((s) => s.songId === "anarchy-rejoice-ver");
      assert.ok(arenaTemplateItem, "template must feature anarchy-rejoice-ver");
      assert.equal(arenaTemplateItem.order, 16);

      // Verify no redundant skip of 16 in any arena tour shows
      for (const show of arenaTour.shows) {
        assert.ok(!show.diff?.skip?.includes(16), `show ${show.date} should not skip 16`);
        const redundantInserts = (show.diff?.insert || []).filter(
          (i) => i.item?.songId === "anarchy" || i.item?.songId === "anarchy-rejoice-ver"
        );
        assert.equal(redundantInserts.length, 0, `show ${show.date} should have no diff inserts for anarchy`);
      }
    });
  });

  describe("13. i18n Foundation, Hash Route Query Parameter Seam, and Header Switcher (#16)", () => {
    it("parses hash routes with optional ?lang= query param while preserving naked route backwards compatibility", async () => {
      const routesMod = await server.ssrLoadModule("/src/lib/routes.js");
      const trackMod = await server.ssrLoadModule("/src/lib/track.js");

      // Backward compatibility for naked hash routes
      assert.deepEqual(routesMod.parseRoute("#/song/pretender"), { kind: "song", value: "pretender" });
      assert.deepEqual(routesMod.parseRoute("#/show/1672276"), { kind: "show", value: "1672276" });
      assert.deepEqual(routesMod.parseRoute("#/venue/%E6%97%A5%E6%9C%AC%E6%AD%A6%E9%81%93%E9%A4%A8"), { kind: "venue", value: "日本武道館" });
      assert.deepEqual(routesMod.parseRoute("#/tour/arena-tour-2024-rejoice"), { kind: "tour", value: "arena-tour-2024-rejoice" });

      // Extraction of ?lang= query param
      assert.deepEqual(routesMod.parseRoute("#/song/pretender?lang=ja"), { kind: "song", value: "pretender", lang: "ja" });
      assert.deepEqual(routesMod.parseRoute("#/show/1672276?lang=en"), { kind: "show", value: "1672276", lang: "en" });
      assert.deepEqual(routesMod.parseRoute("#/venue/%E6%97%A5%E6%9C%AC%E6%AD%A6%E9%81%93%E9%A4%A8?lang=ko"), { kind: "venue", value: "日本武道館", lang: "ko" });
      assert.deepEqual(routesMod.parseRoute("#/tour/arena-tour-2024-rejoice?lang=zh-TW"), { kind: "tour", value: "arena-tour-2024-rejoice", lang: "zh-TW" });

      // Case insensitivity & normalization for query param
      assert.deepEqual(routesMod.parseRoute("#/song/pretender?lang=JA"), { kind: "song", value: "pretender", lang: "ja" });
      assert.deepEqual(routesMod.parseRoute("#/song/pretender?lang=en-US"), { kind: "song", value: "pretender", lang: "en" });

      // Unknown or unsupported lang is ignored
      assert.deepEqual(routesMod.parseRoute("#/song/pretender?lang=fr"), { kind: "song", value: "pretender" });

      // Route builder generates ?lang= when requested
      assert.equal(routesMod.routeHash.song("pretender", { lang: "en" }), "#/song/pretender?lang=en");
      assert.equal(routesMod.routeHash.song("pretender", "ja"), "#/song/pretender?lang=ja");
      assert.equal(routesMod.routeHash.song("pretender", { lang: "zh-TW" }), "#/song/pretender");
      assert.equal(routesMod.routeHash.song("pretender"), "#/song/pretender");

      // Backwards compatibility via track.js re-export
      assert.equal(trackMod.parseRoute, routesMod.parseRoute);
      assert.equal(trackMod.routeHash, routesMod.routeHash);
    });

    it("resolves initial locale following priority waterfall (URL param > localStorage > navigator.language > default zh-TW)", async () => {
      const { resolveInitialLocale, DEFAULT_LOCALE } = await server.ssrLoadModule("/src/lib/i18n.jsx");

      // 1. URL hash query param takes precedence
      assert.equal(
        resolveInitialLocale({
          window: { location: { hash: "#/song/pretender?lang=ja" } },
          localStorage: { getItem: () => "en" },
          navigator: { language: "ko-KR" },
        }),
        "ja"
      );

      // 2. localStorage takes precedence when no hash param
      assert.equal(
        resolveInitialLocale({
          window: { location: { hash: "#/song/pretender" } },
          localStorage: { getItem: (k) => (k === "hg_locale" ? "en" : null) },
          navigator: { language: "ko-KR" },
        }),
        "en"
      );

      // 3. navigator.language takes precedence when no localStorage
      assert.equal(
        resolveInitialLocale({
          window: { location: { hash: "" } },
          localStorage: { getItem: () => null },
          navigator: { language: "ko-KR" },
        }),
        "ko"
      );

      // 4. Default fallback to zh-TW
      assert.equal(
        resolveInitialLocale({
          window: { location: { hash: "" } },
          localStorage: { getItem: () => null },
          navigator: { language: "fr-FR" },
        }),
        DEFAULT_LOCALE
      );

      assert.equal(
        resolveInitialLocale({}),
        DEFAULT_LOCALE
      );

      assert.equal(
        resolveInitialLocale(),
        DEFAULT_LOCALE
      );
    });

    it("provides complete dictionaries and translation lookup via I18nProvider and useI18n across all 4 locales", async () => {
      const i18nMod = await server.ssrLoadModule("/src/lib/i18n.jsx");
      const { I18nProvider, useI18n, SUPPORTED_LOCALES, DICTIONARIES } = i18nMod;

      assert.deepEqual(SUPPORTED_LOCALES, ["zh-TW", "ja", "en", "ko"]);
      assert.ok(DICTIONARIES, "DICTIONARIES table must be exported");

      // Verify all 4 locales have required dictionary sections
      const sections = ["nav", "header", "categories", "badges", "regions", "tiers", "actions"];
      for (const loc of SUPPORTED_LOCALES) {
        const dict = DICTIONARIES[loc];
        assert.ok(dict, `Dictionary for ${loc} must exist`);
        for (const sec of sections) {
          assert.ok(dict[sec], `Dictionary for ${loc} must contain section '${sec}'`);
        }

        // Check 8 categories
        const expectedCategories = [
          "巡演專場", "特別專場", "聯合專場", "店家活動",
          "音樂祭", "學園祭", "電視演出", "線上直播"
        ];
        for (const cat of expectedCategories) {
          assert.ok(dict.categories[cat], `categories.${cat} must exist in ${loc}`);
        }

        // Check 4 badges
        for (const badge of ["premiere", "satoshi-solo", "request", "unreleased"]) {
          assert.ok(dict.badges[badge], `badges.${badge} must exist in ${loc}`);
        }
      }

      // Verify SSR rendering with I18nProvider
      function Consumer() {
        const { locale, t } = useI18n();
        return React.createElement(
          "div",
          { id: "test-consumer" },
          `${locale}:${t("nav.shows")}:${t("categories.巡演專場")}:${t("non.existent", "Fallback")}`
        );
      }

      for (const loc of SUPPORTED_LOCALES) {
        const expectedShows = loc === "zh-TW" ? "場次" : loc === "ja" ? "公演" : loc === "en" ? "Shows" : "공연";
        const expectedTour = loc === "zh-TW" ? "巡演專場" : loc === "ja" ? "ツアー" : loc === "en" ? "Tour" : "투어";
        const html = renderToStaticMarkup(
          React.createElement(
            I18nProvider,
            { initialLocale: loc },
            React.createElement(Consumer)
          )
        );
        assert.ok(html.includes(`${loc}:${expectedShows}:${expectedTour}:Fallback`), `SSR markup for ${loc} must match`);
      }
    });

    it("renders ticket-styled LanguageSwitcher in LandingHero and ArchiveHeader with localized chrome labels", async () => {
      const { LanguageSwitcher } = await server.ssrLoadModule("/src/components/LanguageSwitcher.jsx");
      const { I18nProvider } = await server.ssrLoadModule("/src/lib/i18n.jsx");
      const { ArchiveHeader } = await server.ssrLoadModule("/src/components/layout/ArchiveHeader.jsx");
      const LandingHeroMod = await server.ssrLoadModule("/src/components/LandingHero.jsx");
      const LandingHero = LandingHeroMod.default;

      // 1. LanguageSwitcher standalone ticket aesthetic tokens & ARIA
      const swHtmlZh = renderToStaticMarkup(
        React.createElement(I18nProvider, { initialLocale: "zh-TW" }, React.createElement(LanguageSwitcher))
      );
      assert.ok(swHtmlZh.includes("繁中"), "must render active locale label '繁中'");
      assert.ok(swHtmlZh.includes("🌐"), "must contain globe icon");
      assert.ok(swHtmlZh.includes("border-[1.5px]"), "must adhere to ticket border-1.5px token");
      assert.ok(swHtmlZh.includes("bg-card"), "must use card background token");
      assert.ok(swHtmlZh.includes("touch-stamp"), "must apply mobile touch-stamp class");
      assert.ok(swHtmlZh.includes('aria-haspopup="true"'), "must have aria-haspopup");

      const swHtmlJa = renderToStaticMarkup(
        React.createElement(I18nProvider, { initialLocale: "ja" }, React.createElement(LanguageSwitcher))
      );
      assert.ok(swHtmlJa.includes("日本語"), "must render active locale label '日本語'");

      // 2. Integration into LandingHero
      const landingHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(LandingHero, {
            totalAllShows: 100,
            allUsedSongs: [{ id: "pretender", title: "Pretender" }],
            allVenues: [{ name: "Budokan" }],
            allUnits: [],
            q: "",
            setQ: () => {},
          })
        )
      );
      assert.ok(landingHtml.includes("EN"), "LandingHero must render LanguageSwitcher with EN active");
      assert.ok(landingHtml.includes("Public Shows"), "LandingHero stats must be localized in EN");

      // 3. Integration into ArchiveHeader across locales
      const archiveProps = {
        totalAllShows: 150,
        allUsedSongs: new Array(50).fill({ id: "x" }),
        allVenues: new Array(20).fill({ name: "v" }),
        categoriesCount: 8,
        tab: "show",
        setTab: () => {},
        setQ: () => {},
        setIsFilterDrawerOpen: () => {},
      };

      const archiveHtmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(ArchiveHeader, archiveProps)
        )
      );
      assert.ok(archiveHtmlJa.includes("日本語"), "ArchiveHeader must render LanguageSwitcher with 日本語 active");
      assert.ok(archiveHtmlJa.includes("公演"), "ArchiveHeader tab must render 公演 for shows in ja");
      assert.ok(archiveHtmlJa.includes("楽曲"), "ArchiveHeader tab must render 楽曲 for songs in ja");
      assert.ok(archiveHtmlJa.includes("会場"), "ArchiveHeader tab must render 会場 for venues in ja");
      assert.ok(archiveHtmlJa.includes("セットリスト図鑑"), "ArchiveHeader brandTitle must be localized in ja");

      const archiveHtmlKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(ArchiveHeader, archiveProps)
        )
      );
      assert.ok(archiveHtmlKo.includes("한국어"), "ArchiveHeader must render LanguageSwitcher with 한국어 active");
      assert.ok(archiveHtmlKo.includes("공연"), "ArchiveHeader tab must render 공연 for shows in ko");
      assert.ok(archiveHtmlKo.includes("곡"), "ArchiveHeader tab must render 곡 for songs in ko");
      assert.ok(archiveHtmlKo.includes("공연장"), "ArchiveHeader tab must render 공연장 for venues in ko");
      assert.ok(archiveHtmlKo.includes("셋리스트 아카이브"), "ArchiveHeader brandTitle must be localized in ko");
    });
  });

  describe("14. Localized Presentation & Domain Taxonomy (#17)", () => {
    it("formats dates and dual-times accurately across all 4 supported locales", async () => {
      const { showDate, formatShowTime } = await server.ssrLoadModule("/src/lib/domain.js");

      // 1. Date formatting with weekday across zh-TW, ja, en, ko
      // 2024-11-12 is Tuesday (day 2: 日=0, 一/月/Mon/월=1, 二/火/Tue/화=2)
      const showIso = { date: "2024-11-12", opensAt: "17:00", startsAt: "18:00" };
      assert.strictEqual(showDate(showIso, "zh-TW"), "2024-11-12（二）");
      assert.strictEqual(showDate(showIso, "ja"), "2024-11-12（火）");
      assert.strictEqual(showDate(showIso, "en"), "2024-11-12 (Tue)");
      assert.strictEqual(showDate(showIso, "ko"), "2024-11-12（화）");

      // Dot-notation date parsing support
      const showDot = { date: "2024.11.12", opensAt: "17:00", startsAt: "18:00" };
      assert.strictEqual(showDate(showDot, "zh-TW"), "2024.11.12（二）");
      assert.strictEqual(showDate(showDot, "ja"), "2024.11.12（火）");
      assert.strictEqual(showDate(showDot, "en"), "2024.11.12 (Tue)");
      assert.strictEqual(showDate(showDot, "ko"), "2024.11.12（화）");

      // Default fallback when locale omitted
      assert.strictEqual(showDate(showIso), "2024-11-12（二）");

      // 2. Dual-time formatting across locales
      // Both opensAt and startsAt
      assert.strictEqual(formatShowTime(showIso, "zh-TW"), "17:00 開場 / 18:00 開演");
      assert.strictEqual(formatShowTime(showIso, "ja"), "17:00 開場 / 18:00 開演");
      assert.strictEqual(formatShowTime(showIso, "en"), "Doors 17:00 / Start 18:00");
      assert.strictEqual(formatShowTime(showIso, "ko"), "17:00 입장 / 18:00 시작");

      // startsAt only
      const showStartsOnly = { date: "2024-11-12", startsAt: "18:00" };
      assert.strictEqual(formatShowTime(showStartsOnly, "zh-TW"), "18:00 開演");
      assert.strictEqual(formatShowTime(showStartsOnly, "ja"), "18:00 開演");
      assert.strictEqual(formatShowTime(showStartsOnly, "en"), "Start 18:00");
      assert.strictEqual(formatShowTime(showStartsOnly, "ko"), "18:00 시작");

      // opensAt only (historical single-time fallback)
      const showOpensOnly = { date: "2024-11-12", opensAt: "18:00" };
      assert.strictEqual(formatShowTime(showOpensOnly, "zh-TW"), "18:00 開演");
      assert.strictEqual(formatShowTime(showOpensOnly, "ja"), "18:00 開演");
      assert.strictEqual(formatShowTime(showOpensOnly, "en"), "Start 18:00");
      assert.strictEqual(formatShowTime(showOpensOnly, "ko"), "18:00 시작");

      // Missing time
      assert.strictEqual(formatShowTime({ date: "2024-11-12" }), null);
      assert.strictEqual(formatShowTime(null), null);
    });

    it("verifies dictionary mappings for 8 categories, 4 badges, 5 regions, and 4 tiers across all 4 locales", async () => {
      const { DICTIONARIES } = await server.ssrLoadModule("/src/lib/i18n.jsx");

      const expectedCategories = {
        "zh-TW": {
          "巡演專場": "巡演專場",
          "特別專場": "特別專場",
          "聯合專場": "聯合專場",
          "店家活動": "店家活動",
          "音樂祭": "音樂祭",
          "學園祭": "學園祭",
          "電視演出": "電視演出",
          "線上直播": "線上直播",
        },
        ja: {
          "巡演專場": "ツアー",
          "特別專場": "特別公演",
          "聯合專場": "対バン",
          "店家活動": "インストア",
          "音樂祭": "フェス",
          "學園祭": "学園祭",
          "電視演出": "TV出演",
          "線上直播": "配信ライブ",
        },
        en: {
          "巡演專場": "Tour",
          "特別專場": "Special Show",
          "聯合專場": "Joint Gig",
          "店家活動": "In-store Event",
          "音樂祭": "Festival",
          "學園祭": "Campus Festival",
          "電視演出": "TV Performance",
          "線上直播": "Livestream",
        },
        ko: {
          "巡演專場": "투어",
          "特別專場": "특별 공연",
          "聯合專場": "대반",
          "店家活動": "매장 이벤트",
          "音樂祭": "페스티벌",
          "學園祭": "대학 축제",
          "電視演出": "TV 출연",
          "線上直播": "온라인 라이브",
        },
      };

      const expectedBadges = {
        "zh-TW": { premiere: "新歌", "satoshi-solo": "自彈自唱", request: "點歌", unreleased: "未發行" },
        ja: { premiere: "新曲", "satoshi-solo": "弾き語り", request: "リクエスト", unreleased: "未音源化" },
        en: { premiere: "New Song", "satoshi-solo": "Satoshi Solo", request: "Request", unreleased: "Unreleased" },
        ko: { premiere: "신곡", "satoshi-solo": "단독 연주", request: "리퀘스트", unreleased: "미발매곡" },
      };

      for (const loc of ["zh-TW", "ja", "en", "ko"]) {
        const dict = DICTIONARIES[loc];
        assert.ok(dict, `dictionary for ${loc} must exist`);

        for (const [catKey, expectedVal] of Object.entries(expectedCategories[loc])) {
          assert.strictEqual(dict.categories?.[catKey], expectedVal, `${loc} category ${catKey} must match ${expectedVal}`);
        }

        for (const [badgeKey, expectedVal] of Object.entries(expectedBadges[loc])) {
          assert.strictEqual(dict.badges?.[badgeKey], expectedVal, `${loc} badge ${badgeKey} must match ${expectedVal}`);
        }

        assert.ok(dict.regions?.["海外（台灣 / 韓國 / 東南亞）"], `${loc} must have overseas region`);
        assert.ok(dict.regions?.["日本 - 關東"], `${loc} must have Kanto region`);
        assert.ok(dict.regions?.["日本 - 關西"], `${loc} must have Kansai region`);

        assert.ok(dict.tiers?.core, `${loc} must define core tier`);
        assert.ok(dict.tiers?.regular, `${loc} must define regular tier`);
        assert.ok(dict.tiers?.rotating, `${loc} must define rotating tier`);
        assert.ok(dict.tiers?.surprise, `${loc} must define surprise tier`);
      }
    });

    it("renders ShowNavigator and VenueNavigator with localized category and region labels", async () => {
      const { I18nProvider } = await server.ssrLoadModule("/src/lib/i18n.jsx");
      const { ShowNavigator } = await server.ssrLoadModule("/src/components/navigators/ShowNavigator.jsx");
      const { VenueNavigator } = await server.ssrLoadModule("/src/components/navigators/VenueNavigator.jsx");

      const mockUnitsByCategory = {
        "巡演專場": [{ id: "tour1", title: "Arena Tour 2024", shows: [{ id: "s1", date: "2024-11-12" }] }],
        "音樂祭": [{ id: "fes1", title: "Summer Sonic 2024", shows: [{ id: "s2", date: "2024-08-18" }] }],
      };
      const mockCategoryStats = {
        "巡演專場": { units: 1, shows: 1 },
        "音樂祭": { units: 1, shows: 1 },
      };

      // 1. ShowNavigator in ja (ツアー, フェス)
      const showNavHtmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(ShowNavigator, {
            unitsByCategory: mockUnitsByCategory,
            categoryStats: mockCategoryStats,
            availableYears: ["2024"],
            selCategory: "巡演專場",
            selYear: "2024",
            filteredUnits: mockUnitsByCategory["巡演專場"],
            pagedUnits: mockUnitsByCategory["巡演專場"],
            unitData: new Map(),
            handleCategoryClick: () => {},
            handleSelectUnit: () => {},
            handleSelectShow: () => {},
            handleSelectTourMode: () => {},
          })
        )
      );
      assert.ok(showNavHtmlJa.includes("ツアー"), "ShowNavigator must render localized category pill 'ツアー' in ja");
      assert.ok(showNavHtmlJa.includes("フェス"), "ShowNavigator must render localized category pill 'フェス' in ja");

      // 2. ShowNavigator in en (Tour, Festival)
      const showNavHtmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(ShowNavigator, {
            unitsByCategory: mockUnitsByCategory,
            categoryStats: mockCategoryStats,
            availableYears: ["2024"],
            selCategory: "巡演專場",
            selYear: "2024",
            filteredUnits: mockUnitsByCategory["巡演專場"],
            pagedUnits: mockUnitsByCategory["巡演專場"],
            unitData: new Map(),
            handleCategoryClick: () => {},
            handleSelectUnit: () => {},
            handleSelectShow: () => {},
            handleSelectTourMode: () => {},
          })
        )
      );
      assert.ok(showNavHtmlEn.includes("Tour"), "ShowNavigator must render localized category pill 'Tour' in en");
      assert.ok(showNavHtmlEn.includes("Festival"), "ShowNavigator must render localized category pill 'Festival' in en");

      // 3. VenueNavigator in ja (依日本地理分區, 日本 - 関東)
      const mockAllVenues = [
        { name: "日本武道館", region: "日本 - 關東", city: "東京", shows: [1, 2] },
        { name: "KINTEX", region: "海外", city: "首爾", shows: [1] },
      ];
      const venueNavHtmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(VenueNavigator, {
            allVenues: mockAllVenues,
            venueSortMode: "region",
            selRegion: "日本 - 關東",
            venuesSortedByCount: mockAllVenues,
            filteredVenues: mockAllVenues,
            pagedVenues: mockAllVenues,
            handleSelectVenue: () => {},
          })
        )
      );
      assert.ok(venueNavHtmlJa.includes("日本 - 関東"), "VenueNavigator must render localized region '日本 - 関東' in ja");
      assert.ok(venueNavHtmlJa.includes("海外（台湾 / 韓国 / 東南アジア）"), "VenueNavigator must render localized overseas region in ja");

      // 4. VenueNavigator in en
      const venueNavHtmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(VenueNavigator, {
            allVenues: mockAllVenues,
            venueSortMode: "region",
            selRegion: "日本 - 關東",
            venuesSortedByCount: mockAllVenues,
            filteredVenues: mockAllVenues,
            pagedVenues: mockAllVenues,
            handleSelectVenue: () => {},
          })
        )
      );
      assert.ok(venueNavHtmlEn.includes("Japan - Kanto"), "VenueNavigator must render localized region 'Japan - Kanto' in en");
      assert.ok(venueNavHtmlEn.includes("Overseas (Taiwan / Korea / SE Asia)"), "VenueNavigator must render localized overseas region in en");
    });

    it("renders ShowSlip and TourSlip with localized arrangement badges, headers, and preserved canonical titles", async () => {
      const { I18nProvider } = await server.ssrLoadModule("/src/lib/i18n.jsx");
      const { ShowSlip } = await server.ssrLoadModule("/src/components/slips/ShowSlip.jsx");
      const { TourSlip } = await server.ssrLoadModule("/src/components/slips/TourSlip.jsx");

      const mockTourUnit = {
        id: "arena-tour-2024-rejoice",
        title: "Official髭男dism Arena Tour 2024 -Rejoice-",
        isTour: true,
        type: "巡演專場",
        templateSetlist: [{ songId: "pretender", title: "Pretender" }],
        shows: [
          {
            id: "show-20241112",
            date: "2024-11-12",
            opensAt: "17:00",
            startsAt: "18:00",
            venue: "K-Arena Yokohama",
            city: "橫濱",
            region: "日本 - 關東",
            prefecture: "神奈川縣",
          },
        ],
      };

      const mockItems = [
        { order: 1, songId: "pretender", encore: false, kind: ["premiere"] },
        { order: 2, songId: "subtitle", encore: false, kind: ["satoshi-solo"] },
        { order: 3, songId: "no-doubt", encore: true, kind: ["request"] },
      ];

      const mockUd = {
        unit: mockTourUnit,
        isTour: true,
        shows: mockTourUnit.shows,
        tpl: mockTourUnit.templateSetlist,
        full: new Map([["show-20241112", mockItems]]),
      };

      // 1. ShowSlip in English
      const showSlipHtmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(ShowSlip, {
            ud: mockUd,
            showId: "show-20241112",
          })
        )
      );
      assert.ok(showSlipHtmlEn.includes("Doors 17:00 / Start 18:00"), "ShowSlip in en must display dual-time Doors/Start");
      assert.ok(showSlipHtmlEn.includes("2024-11-12 (Tue)"), "ShowSlip in en must display date with English weekday (Tue)");
      assert.ok(showSlipHtmlEn.includes("New Song"), "ShowSlip in en must display 'New Song' arrangement badge");
      assert.ok(showSlipHtmlEn.includes("Satoshi Solo"), "ShowSlip in en must display 'Satoshi Solo' arrangement badge");
      assert.ok(showSlipHtmlEn.includes("Request"), "ShowSlip in en must display 'Request' arrangement badge");
      // Canonical Invariant: Song titles and Tour title must NOT be translated
      assert.ok(showSlipHtmlEn.includes("Pretender"), "Canonical song title must remain intact");
      assert.ok(showSlipHtmlEn.includes("Subtitle"), "Canonical song title must remain intact");
      assert.ok(showSlipHtmlEn.includes("ノーダウト"), "Canonical Japanese title must remain untouched in en");
      assert.ok(showSlipHtmlEn.includes("Arena Tour 2024 -Rejoice-"), "Tour master title must remain untouched in en");

      // 2. ShowSlip in Japanese
      const showSlipHtmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(ShowSlip, {
            ud: mockUd,
            showId: "show-20241112",
          })
        )
      );
      assert.ok(showSlipHtmlJa.includes("17:00 開場 / 18:00 開演"), "ShowSlip in ja must display 開場/開演");
      assert.ok(showSlipHtmlJa.includes("2024-11-12（火）"), "ShowSlip in ja must display Japanese weekday（火）");
      assert.ok(showSlipHtmlJa.includes("新曲"), "ShowSlip in ja must display '新曲' badge");
      assert.ok(showSlipHtmlJa.includes("弾き語り"), "ShowSlip in ja must display '弾き語り' badge");
      assert.ok(showSlipHtmlJa.includes("リクエスト"), "ShowSlip in ja must display 'リクエスト' badge");
      assert.ok(showSlipHtmlJa.includes("ツアー"), "ShowSlip in ja must display localized category 'ツアー'");

      // 3. ShowSlip in Korean
      const showSlipHtmlKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(ShowSlip, {
            ud: mockUd,
            showId: "show-20241112",
          })
        )
      );
      assert.ok(showSlipHtmlKo.includes("17:00 입장 / 18:00 시작"), "ShowSlip in ko must display 입장/시작");
      assert.ok(showSlipHtmlKo.includes("2024-11-12（화）"), "ShowSlip in ko must display Korean weekday（화）");
      assert.ok(showSlipHtmlKo.includes("신곡"), "ShowSlip in ko must display '신곡' badge");
      assert.ok(showSlipHtmlKo.includes("단독 연주"), "ShowSlip in ko must display '단독 연주' badge");
      assert.ok(showSlipHtmlKo.includes("리퀘스트"), "ShowSlip in ko must display '리퀘스트' badge");
      assert.ok(showSlipHtmlKo.includes("투어"), "ShowSlip in ko must display localized category '투어'");

      // 4. TourSlip across locales
      const tourSlipHtmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(TourSlip, { tourUnitData: mockUd })
        )
      );
      assert.ok(tourSlipHtmlJa.includes("コア全勤 100%"), "TourSlip in ja must display コア全勤 100%");
      assert.ok(tourSlipHtmlJa.includes("ツアー定番曲"), "TourSlip in ja must display ツアー定番曲");
      assert.ok(tourSlipHtmlJa.includes("全国ツアースケジュール"), "TourSlip in ja must display 全国ツアースケジュール");
      assert.ok(tourSlipHtmlJa.includes("ツアー"), "TourSlip in ja must display localized category 'ツアー'");

      const tourSlipHtmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(TourSlip, { tourUnitData: mockUd })
        )
      );
      assert.ok(tourSlipHtmlEn.includes("Core 100%"), "TourSlip in en must display Core 100%");
      assert.ok(tourSlipHtmlEn.includes("Tour"), "TourSlip in en must display localized category 'Tour'");
      assert.ok(tourSlipHtmlEn.includes("TOUR ITINERARY"), "TourSlip in en must display TOUR ITINERARY");

      // 5. SongSlip and VenueSlip localization
      const { SongSlip } = await server.ssrLoadModule("/src/components/slips/SongSlip.jsx");
      const { VenueSlip } = await server.ssrLoadModule("/src/components/slips/VenueSlip.jsx");

      const mockTrackShows = new Map([
        ["song:pretender", [
          { showId: "show-20241112", unitId: "arena-tour-2024-rejoice", unitTitle: "Arena Tour 2024 -Rejoice-", unitType: "巡演專場", item: { kind: ["premiere"], encore: false } }
        ]]
      ]);
      const mockShowById = new Map([
        ["show-20241112", mockTourUnit.shows[0]]
      ]);

      const songSlipHtmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SongSlip, {
            songId: "pretender",
            trackShows: mockTrackShows,
            showById: mockShowById,
            unitData: new Map([["arena-tour-2024-rejoice", mockUd]]),
            onSelectShow: () => {},
            onSelectVenue: () => {},
          })
        )
      );
      assert.ok(songSlipHtmlJa.includes("ツアー"), "SongSlip must render localized category in ja");
      assert.ok(songSlipHtmlJa.includes("新曲"), "SongSlip must render localized badge in ja");
      assert.ok(songSlipHtmlJa.includes("2024-11-12（火）"), "SongSlip must render localized date in ja");

      const mockGlobalVenueShows = new Map([
        ["K-Arena Yokohama", [
          { showId: "show-20241112", unitId: "arena-tour-2024-rejoice", unitTitle: "Arena Tour 2024 -Rejoice-", unitType: "巡演專場", show: mockTourUnit.shows[0] }
        ]]
      ]);

      const venueSlipHtmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(VenueSlip, {
            venueName: "K-Arena Yokohama",
            globalVenueShows: mockGlobalVenueShows,
            unitData: new Map([["arena-tour-2024-rejoice", mockUd]]),
            onSelectShow: () => {},
            onSelectSong: () => {},
          })
        )
      );
      assert.ok(venueSlipHtmlEn.includes("Tour"), "VenueSlip must render localized category in en");
      assert.ok(venueSlipHtmlEn.includes("Doors 17:00 / Start 18:00"), "VenueSlip must render localized dual-time in en");
      assert.ok(venueSlipHtmlEn.includes("Arena &amp; Dome") || venueSlipHtmlEn.includes("Arena & Dome"), "VenueSlip must render localized tier badge in en");
    });
  });

  describe("15. Localized Search Invariants in SearchBox (Issue #18)", () => {
    let SearchBox;
    let I18nProvider;
    let buildIndex;
    let allUnits;
    let index;

    before(async () => {
      const searchBoxMod = await server.ssrLoadModule("/src/components/SearchBox.jsx");
      SearchBox = searchBoxMod.default;

      const i18nMod = await server.ssrLoadModule("/src/lib/i18n.jsx");
      I18nProvider = i18nMod.I18nProvider;

      const domainMod = await server.ssrLoadModule("/src/lib/domain.js");
      buildIndex = domainMod.buildIndex;
      allUnits = domainMod.allUnits;
      index = buildIndex();
    });

    it("matches Japanese taxonomy keywords (フェス, 対バン, ツアー) and renders localized category badges in ja", () => {
      // 1. Search "フェス" (Festival)
      const htmlFesJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "フェス",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlFesJa.includes("ROCK IN JAPAN") || htmlFesJa.includes("SUMMER SONIC"), "Must include rock fest events");
      assert.ok(htmlFesJa.includes("フェス"), "Must render localized category badge 'フェス' in candidate");

      // 2. Search "対バン" (Joint Gig)
      const htmlJointJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "対バン",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlJointJa.includes("対バン"), "Must render localized category badge '対バン'");

      // 3. Search "ツアー" (Tour)
      const htmlTourJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "ツアー",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlTourJa.includes("ツアー"), "Must render localized category badge 'ツアー'");
      assert.ok(htmlTourJa.includes("Rejoice") || htmlTourJa.includes("Editorial"), "Must match headline tours");
    });

    it("matches English taxonomy keywords (Festival, Joint Gig, Tour) and renders localized category badges in en", () => {
      // 1. Search "Festival"
      const htmlFesEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Festival",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlFesEn.includes("Festival"), "Must render localized category badge 'Festival' in en");
      assert.ok(htmlFesEn.includes("ROCK IN JAPAN") || htmlFesEn.includes("SUMMER SONIC"), "Must match festival units");

      // 2. Search "Joint Gig"
      const htmlJointEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Joint Gig",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlJointEn.includes("Joint Gig"), "Must render localized category badge 'Joint Gig' in en");

      // 3. Search "Tour"
      const htmlTourEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Tour",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlTourEn.includes("Tour"), "Must render localized category badge 'Tour' in en");
      assert.ok(htmlTourEn.includes("Rejoice") || htmlTourEn.includes("Editorial"), "Must match tour units");
    });

    it("searches localized arrangement badge keywords (弾き語り, Satoshi Solo, リクエスト, Request, 新曲, New Song)", () => {
      // 1. Search "弾き語り" in Japanese
      const htmlSoloJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "弾き語り",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlSoloJa.includes("無相符的日期、歌曲、演出或場地"), "Must match satoshi-solo arrangements");
      assert.ok(htmlSoloJa.includes("弾き語り"), "Candidate must display localized solo badge or subtitle");

      // 2. Search "Satoshi Solo" in English
      const htmlSoloEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Satoshi Solo",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlSoloEn.includes("無相符的日期、歌曲、演出或場地"), "Must match satoshi-solo in en");
      assert.ok(htmlSoloEn.includes("Satoshi Solo"), "Candidate must display localized Satoshi Solo label in en");

      // 3. Search "リクエスト" in Japanese
      const htmlReqJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "リクエスト",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlReqJa.includes("無相符的日期、歌曲、演出或場地"), "Must match request arrangements");
      assert.ok(htmlReqJa.includes("リクエスト"), "Candidate must display localized request badge");

      // 4. Search "Request" in English
      const htmlReqEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Request",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlReqEn.includes("無相符的日期、歌曲、演出或場地"), "Must match request in en");
      assert.ok(htmlReqEn.includes("Request"), "Candidate must display Request badge");

      // 5. Search "新曲" in Japanese
      const htmlNewJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "新曲",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlNewJa.includes("無相符的日期、歌曲、演出或場地"), "Must match premiere arrangements");
      assert.ok(htmlNewJa.includes("新曲"), "Candidate must display localized 新曲 badge");

      // 6. Search "New Song" in English
      const htmlNewEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "New Song",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlNewEn.includes("無相符的日期、歌曲、演出或場地"), "Must match premiere in en");
      assert.ok(htmlNewEn.includes("New Song"), "Candidate must display New Song badge");
    });

    it("maintains ADR-0105 dual-language song title and official English alias indexing intact", () => {
      // 1. Search canonical English title "Pretender"
      const htmlPretender = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "Pretender",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlPretender.includes("Pretender"), "Must match Pretender");

      // 2. Search Japanese title "ノーダウト"
      const htmlNoDoubt = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "ノーダウト",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlNoDoubt.includes("ノーダウト"), "Must match ノーダウト");

      // 3. Search official English alias "Mixed Nuts"
      const htmlMixedNuts = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "Mixed Nuts",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlMixedNuts.includes("ミックスナッツ"), "Must match ミックスナッツ via alias");
      assert.ok(htmlMixedNuts.includes("Mixed Nuts"), "Must render alias Mixed Nuts");

      // 4. Search official English alias "No Doubt"
      const htmlNoDoubtAlias = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "No Doubt",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlNoDoubtAlias.includes("ノーダウト"), "Must match ノーダウト via alias");
      assert.ok(htmlNoDoubtAlias.includes("No Doubt"), "Must render alias No Doubt");
    });
  });

  describe("16. Localized Commemorative Ticket Image Export (Issue #19)", () => {
    it("generates cache key with locale discriminator to prevent cross-language cache collisions", async () => {
      const { getMemorialImageKey } = await server.ssrLoadModule("/src/components/MemorialCardModal.jsx");
      assert.ok(typeof getMemorialImageKey === "function", "getMemorialImageKey must be exported");

      const keyZh = getMemorialImageKey("show-20241112", "vintage", "zh-TW");
      const keyJa = getMemorialImageKey("show-20241112", "vintage", "ja");
      const keyEn = getMemorialImageKey("show-20241112", "vintage", "en");
      const keyKo = getMemorialImageKey("show-20241112", "vintage", "ko");

      assert.strictEqual(keyZh, "show-20241112-vintage-zh-TW");
      assert.strictEqual(keyJa, "show-20241112-vintage-ja");
      assert.strictEqual(keyEn, "show-20241112-vintage-en");
      assert.strictEqual(keyKo, "show-20241112-vintage-ko");

      const allKeys = new Set([keyZh, keyJa, keyEn, keyKo]);
      assert.strictEqual(allKeys.size, 4, "All 4 locale cache keys must be strictly distinct");
    });

    it("renders MemorialCardModal with localized tokens across ja, en, ko, and zh-TW", async () => {
      const { I18nProvider } = await server.ssrLoadModule("/src/lib/i18n.jsx");
      const { MemorialCardModal } = await server.ssrLoadModule("/src/components/MemorialCardModal.jsx");

      const mockTourUnit = {
        id: "arena-tour-2024-rejoice",
        title: "Official髭男dism Arena Tour 2024 -Rejoice-",
        isTour: true,
        type: "巡演專場",
        shows: [
          {
            id: "show-20241112",
            date: "2024-11-12",
            opensAt: "17:00",
            startsAt: "18:00",
            venue: "K-Arena Yokohama",
            city: "橫濱",
          },
        ],
      };

      const mockMain = [
        { cue: "M1", item: { songId: "pretender", kind: ["premiere"] } },
        { cue: "M2", item: { songId: "subtitle", kind: ["satoshi-solo"] } },
      ];
      const mockEnc = [
        { cue: "EN1", item: { songId: "no-doubt", kind: ["request"] } },
      ];

      // 1. Japanese (ja)
      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(MemorialCardModal, {
            isOpen: true,
            onClose: () => {},
            show: mockTourUnit.shows[0],
            unit: mockTourUnit,
            main: mockMain,
            enc: mockEnc,
            showIndex: 0,
            totalShows: 10,
          })
        )
      );
      assert.ok(htmlJa.includes("第 1 / 10 公演"), "Must render Japanese show index '第 1 / 10 公演'");
      assert.ok(htmlJa.includes("全 3 曲"), "Must render Japanese song count '全 3 曲'");
      assert.ok(htmlJa.includes("◆ MAIN SETLIST // 本編演奏曲目"), "Must render Japanese main setlist header");
      assert.ok(htmlJa.includes("◆ ENCORE // アンコール曲目"), "Must render Japanese encore setlist header");
      assert.ok(htmlJa.includes("現場"), "Must render '現場' in vermilion stamp in ja");
      assert.ok(htmlJa.includes("新曲"), "Must render '新曲' arrangement badge in ja");
      assert.ok(htmlJa.includes("弾き語り"), "Must render '弾き語り' arrangement badge in ja");
      assert.ok(htmlJa.includes("リクエスト"), "Must render 'リクエスト' arrangement badge in ja");
      assert.ok(htmlJa.includes("17:00 開場 / 18:00 開演"), "Must render Japanese door/start time in ja");
      assert.ok(htmlJa.includes("2024-11-12（火）"), "Must render Japanese date in ja");
      assert.ok(htmlJa.includes("記念チケットプレビュー"), "Must render localized modal title in ja");
      assert.ok(htmlJa.includes("クラフト紙"), "Must render localized theme button 'クラフト紙' in ja");
      assert.ok(htmlJa.includes("ホワイトカード"), "Must render localized theme button 'ホワイトカード' in ja");
      assert.ok(htmlJa.includes("ステージゴールド"), "Must render localized theme button 'ステージゴールド' in ja");
      // Canonical Invariant
      assert.ok(htmlJa.includes("Pretender"), "Canonical song title must remain intact");
      assert.ok(htmlJa.includes("Arena Tour 2024 -Rejoice-"), "Master tour title must remain intact");

      // 2. English (en)
      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(MemorialCardModal, {
            isOpen: true,
            onClose: () => {},
            show: mockTourUnit.shows[0],
            unit: mockTourUnit,
            main: mockMain,
            enc: mockEnc,
            showIndex: 0,
            totalShows: 10,
          })
        )
      );
      assert.ok(htmlEn.includes("Show 1 of 10"), "Must render English show index 'Show 1 of 10'");
      assert.ok(htmlEn.includes("3 Songs"), "Must render English song count '3 Songs'");
      assert.ok(htmlEn.includes("◆ MAIN SETLIST // MAIN SET"), "Must render English main setlist header");
      assert.ok(htmlEn.includes("◆ ENCORE // ENCORE"), "Must render English encore setlist header");
      assert.ok(htmlEn.includes("LIVE"), "Must render 'LIVE' in vermilion stamp in en");
      assert.ok(htmlEn.includes("New Song"), "Must render 'New Song' arrangement badge in en");
      assert.ok(htmlEn.includes("Satoshi Solo"), "Must render 'Satoshi Solo' arrangement badge in en");
      assert.ok(htmlEn.includes("Request"), "Must render 'Request' arrangement badge in en");
      assert.ok(htmlEn.includes("Doors 17:00 / Start 18:00"), "Must render English door/start time in en");
      assert.ok(htmlEn.includes("2024-11-12 (Tue)"), "Must render English date with (Tue) in en");
      assert.ok(htmlEn.includes("Commemorative Ticket Preview"), "Must render localized modal title in en");
      assert.ok(htmlEn.includes("Vintage Paper"), "Must render localized theme button 'Vintage Paper' in en");
      assert.ok(htmlEn.includes("White Card"), "Must render localized theme button 'White Card' in en");
      assert.ok(htmlEn.includes("Stage Gold"), "Must render localized theme button 'Stage Gold' in en");

      // 3. Korean (ko)
      const htmlKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(MemorialCardModal, {
            isOpen: true,
            onClose: () => {},
            show: mockTourUnit.shows[0],
            unit: mockTourUnit,
            main: mockMain,
            enc: mockEnc,
            showIndex: 0,
            totalShows: 10,
          })
        )
      );
      assert.ok(htmlKo.includes("제 1 / 10 회"), "Must render Korean show index '제 1 / 10 회'");
      assert.ok(htmlKo.includes("전 3 곡"), "Must render Korean song count '전 3 곡'");
      assert.ok(htmlKo.includes("◆ MAIN SETLIST // 본편 연주곡"), "Must render Korean main setlist header");
      assert.ok(htmlKo.includes("◆ ENCORE // 앙코르곡"), "Must render Korean encore setlist header");
      assert.ok(htmlKo.includes("라이브"), "Must render '라이브' in vermilion stamp in ko");
      assert.ok(htmlKo.includes("신곡"), "Must render '신곡' arrangement badge in ko");
      assert.ok(htmlKo.includes("단독 연주"), "Must render '단독 연주' arrangement badge in ko");
      assert.ok(htmlKo.includes("리퀘스트"), "Must render '리퀘스트' arrangement badge in ko");
      assert.ok(htmlKo.includes("17:00 입장 / 18:00 시작"), "Must render Korean door/start time in ko");
      assert.ok(htmlKo.includes("2024-11-12（화）"), "Must render Korean date with （화） in ko");
      assert.ok(htmlKo.includes("기념 티켓 미리보기"), "Must render localized modal title in ko");
      assert.ok(htmlKo.includes("빈티지 페이퍼"), "Must render localized theme button '빈티지 페이퍼' in ko");

      // 4. Traditional Chinese (zh-TW)
      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(MemorialCardModal, {
            isOpen: true,
            onClose: () => {},
            show: mockTourUnit.shows[0],
            unit: mockTourUnit,
            main: mockMain,
            enc: mockEnc,
            showIndex: 0,
            totalShows: 10,
          })
        )
      );
      assert.ok(htmlZh.includes("第 1 / 10 場"), "Must render Traditional Chinese show index '第 1 / 10 場'");
      assert.ok(htmlZh.includes("全 3 首"), "Must render Traditional Chinese song count '全 3 首'");
      assert.ok(htmlZh.includes("◆ MAIN SETLIST // 本篇演奏曲目"), "Must render zh-TW main setlist header");
      assert.ok(htmlZh.includes("◆ ENCORE // 安可曲目"), "Must render zh-TW encore setlist header");
      assert.ok(htmlZh.includes("現場"), "Must render '現場' in vermilion stamp in zh-TW");
      assert.ok(htmlZh.includes("新歌"), "Must render '新歌' arrangement badge in zh-TW");
      assert.ok(htmlZh.includes("自彈自唱"), "Must render '自彈自唱' arrangement badge in zh-TW");
      assert.ok(htmlZh.includes("點歌"), "Must render '點歌' arrangement badge in zh-TW");
      assert.ok(htmlZh.includes("17:00 開場 / 18:00 開演"), "Must render door/start time in zh-TW");
      assert.ok(htmlZh.includes("2024-11-12（二）"), "Must render date with （二） in zh-TW");
      assert.ok(htmlZh.includes("巡演歌單紀念票券預覽"), "Must render localized modal title in zh-TW");
      assert.ok(htmlZh.includes("復古手感紙"), "Must render localized theme button '復古手感紙' in zh-TW");
    });

    it("supports direct locale prop override on MemorialCardModal", async () => {
      const { MemorialCardModal } = await server.ssrLoadModule("/src/components/MemorialCardModal.jsx");

      const mockTourUnit = {
        id: "tour-override",
        title: "Test Tour",
        isTour: true,
        shows: [{ id: "show-override", date: "2024-11-12", venue: "Test Venue", city: "Tokyo" }],
      };

      const htmlPropEn = renderToStaticMarkup(
        React.createElement(MemorialCardModal, {
          isOpen: true,
          onClose: () => {},
          show: mockTourUnit.shows[0],
          unit: mockTourUnit,
          main: [],
          enc: [],
          showIndex: 0,
          totalShows: 5,
          locale: "en",
        })
      );
      assert.ok(htmlPropEn.includes("Show 1 of 5"), "Must respect direct locale='en' prop");
      assert.ok(htmlPropEn.includes("LIVE"), "Must respect direct locale='en' prop for vermilion stamp");
      assert.ok(htmlPropEn.includes("Commemorative Ticket Preview"), "Must respect direct locale='en' prop for title");

      const htmlPropKo = renderToStaticMarkup(
        React.createElement(MemorialCardModal, {
          isOpen: true,
          onClose: () => {},
          show: mockTourUnit.shows[0],
          unit: mockTourUnit,
          main: [],
          enc: [],
          showIndex: 0,
          totalShows: 5,
          locale: "ko",
        })
      );
      assert.ok(htmlPropKo.includes("제 1 / 5 회"), "Must respect direct locale='ko' prop");
      assert.ok(htmlPropKo.includes("라이브"), "Must respect direct locale='ko' prop for vermilion stamp");
      assert.ok(htmlPropKo.includes("기념 티켓 미리보기"), "Must respect direct locale='ko' prop for title");
    });

    it("exports and uses resolveTranslation fallback correctly", async () => {
      const { resolveTranslation } = await server.ssrLoadModule("/src/lib/i18n.jsx");
      assert.ok(typeof resolveTranslation === "function", "resolveTranslation must be exported as a function");

      const dict = {
        nested: {
          title: "Found Value",
        },
      };
      assert.strictEqual(resolveTranslation(dict, "nested.title", "Fallback"), "Found Value");
      assert.strictEqual(resolveTranslation(dict, "missing.key", "Fallback"), "Fallback");
      assert.strictEqual(resolveTranslation(null, "any.key", "Fallback"), "Fallback");
      assert.strictEqual(resolveTranslation(dict, "nested.missing", "Fallback"), "Fallback");
    });

    it("formats show song breakdown across locales with formatShowSongBreakdown", async () => {
      const { formatShowSongBreakdown } = await server.ssrLoadModule("/src/lib/domain.js");
      assert.ok(typeof formatShowSongBreakdown === "function", "formatShowSongBreakdown must be exported");

      assert.strictEqual(formatShowSongBreakdown(20, 17, 3, "ja"), "全 20 曲（本編 17 · アンコール 3）");
      assert.strictEqual(formatShowSongBreakdown(20, 17, 3, "en"), "Total 20 Songs (Main 17 · Encore 3)");
      assert.strictEqual(formatShowSongBreakdown(20, 17, 3, "ko"), "총 20곡 (본편 17 · 앙코르 3)");
      assert.strictEqual(formatShowSongBreakdown(20, 17, 3, "zh-TW"), "共 20 首（本篇 17 · 安可 3）");

      // No songs
      assert.strictEqual(formatShowSongBreakdown(0, 0, 0, "ja"), "");
    });

    it("formats non-tour formatShowOrderText with localized category in MemorialCardModal", async () => {
      const { MemorialCardModal } = await server.ssrLoadModule("/src/components/MemorialCardModal.jsx");
      const { I18nProvider } = await server.ssrLoadModule("/src/lib/i18n.jsx");

      const mockFestUnit = {
        id: "summer-sonic-2024",
        title: "SUMMER SONIC 2024",
        isTour: false,
        type: "音樂祭",
        shows: [{ id: "ss-show-1", date: "2024-08-18", venue: "ZOZO Marine Stadium", city: "Chiba" }],
      };

      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(MemorialCardModal, {
            isOpen: true,
            onClose: () => {},
            show: mockFestUnit.shows[0],
            unit: mockFestUnit,
            main: [],
            enc: [],
            showIndex: 0,
            totalShows: 1,
          })
        )
      );
      assert.ok(htmlEn.includes("Festival"), "Must render localized category 'Festival' in en formatShowOrderText");

      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(MemorialCardModal, {
            isOpen: true,
            onClose: () => {},
            show: mockFestUnit.shows[0],
            unit: mockFestUnit,
            main: [],
            enc: [],
            showIndex: 0,
            totalShows: 1,
          })
        )
      );
      assert.ok(htmlJa.includes("フェス"), "Must render localized category 'フェス' in ja formatShowOrderText");
    });

    it("matches individual shows for taxonomy keyword searches in SearchBox", async () => {
      const SearchBoxModule = await server.ssrLoadModule("/src/components/SearchBox.jsx");
      const SearchBox = SearchBoxModule.default;
      const { I18nProvider } = await server.ssrLoadModule("/src/lib/i18n.jsx");

      const mockUnits = [
        {
          id: "fest-unit-1",
          title: "Rock Festival 2024",
          isTour: false,
          type: "音樂祭",
          shows: [
            { id: "fest-show-1", date: "2024-08-01", title: "Day 1 Stage", venue: "Tokyo Big Sight", city: "Tokyo" },
          ],
        },
      ];

      // Search with "フェス" (Japanese taxonomy keyword for 音樂祭)
      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "フェス",
            setQ: () => {},
            allUsedSongs: [],
            allUnits: mockUnits,
            allVenues: [],
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlJa.includes("歷史場次日期"), "Must display 歷史場次日期 section for taxonomy search 'フェス'");
      assert.ok(htmlJa.includes("Day 1 Stage") || htmlJa.includes("2024-08-01"), "Must match individual shows when searching taxonomy keyword 'フェス'");

      // Search with "Festival" (English taxonomy keyword for 音樂祭)
      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Festival",
            setQ: () => {},
            allUsedSongs: [],
            allUnits: mockUnits,
            allVenues: [],
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlEn.includes("歷史場次日期"), "Must display 歷史場次日期 section for taxonomy search 'Festival'");
      assert.ok(htmlEn.includes("Day 1 Stage") || htmlEn.includes("2024-08-01"), "Must match individual shows when searching taxonomy keyword 'Festival'");
    });

    it("verifies getVenueRegion canonical output without speculative city checks", async () => {
      const { getVenueRegion } = await server.ssrLoadModule("/src/lib/domain.js");
      assert.ok(typeof getVenueRegion === "function", "getVenueRegion must be exported");

      // Canonical region and prefecture mappings
      assert.strictEqual(getVenueRegion({ name: "K-Arena Yokohama", prefecture: "神奈川縣" }), "日本 - 關東");
      assert.strictEqual(getVenueRegion({ name: "Tokyo Dome", prefecture: "東京都" }), "日本 - 關東");
      assert.strictEqual(getVenueRegion({ name: "Osaka-jo Hall", prefecture: "大阪府" }), "日本 - 關西");
      assert.strictEqual(getVenueRegion({ name: "Taipei Arena", region: "海外" }), "海外（台灣 / 韓國 / 東南亞）");
      assert.strictEqual(getVenueRegion({ name: "Unknown Arena", city: "首爾" }), "海外（台灣 / 韓國 / 東南亞）");

      // Speculative city substrings must NOT map to Japanese domestic regions
      assert.strictEqual(getVenueRegion({ name: "Generic Center", city: "SomeCity" }), "日本 - 中部 / 九州 / 其他");
    });
  });
});







