import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "../helpers/vite-server.js";

describe("25. TicketBook Dynamic Milestones Calculation & Summary Card (#37)", () => {
  describe("Seam 1: Domain Milestone Calculation Engine (ticket-book-milestones.js)", () => {
    const mockShow1 = {
      id: "show-1",
      date: "2024-11-30",
      city: "高陽",
      venue: "KINTEX Hall 5",
      title: "Official髭男dism Asia Tour 2024 - Rejoice -",
    };
    const mockShow2 = {
      id: "show-2",
      date: "2024-12-15",
      city: "台北",
      venue: "台北小巨蛋",
      title: "Official髭男dism Asia Tour 2024 - Rejoice -",
    };
    const mockShow3 = {
      id: "show-3",
      date: "2025-08-16",
      city: "大阪",
      venue: "舞洲體育園區",
      title: "SUMMER SONIC 2025",
    };

    const mockUnitTour = {
      id: "asia-tour-2024",
      title: "Official髭男dism Asia Tour 2024 - Rejoice -",
      shortTitle: "Rejoice Asia Tour",
      type: "巡演專場",
      shows: [mockShow1, mockShow2],
    };
    const mockUnitEvent = {
      id: "summer-sonic-2025",
      title: "SUMMER SONIC 2025",
      shortTitle: "Summer Sonic 2025",
      type: "音樂祭",
      shows: [mockShow3],
    };

    const mockUnitData = new Map([
      [
        "asia-tour-2024",
        {
          unit: mockUnitTour,
          isTour: true,
          full: new Map([
            [
              "show-1",
              [
                { order: 1, songId: "pretender" },
                { order: 2, songId: "shukumei" },
                { order: 3, songId: "subtitle" },
              ],
            ],
            [
              "show-2",
              [
                { order: 1, songId: "pretender" },
                { order: 2, songId: "shukumei" },
                { order: 3, songId: "mixed-nuts" },
              ],
            ],
          ]),
        },
      ],
      [
        "summer-sonic-2025",
        {
          unit: mockUnitEvent,
          isTour: false,
          full: new Map([
            [
              "show-3",
              [
                { order: 1, songId: "pretender" },
                { order: 2, songId: "same-blue" },
              ],
            ],
          ]),
        },
      ],
    ]);

    const mockShowById = new Map([
      ["show-1", mockShow1],
      ["show-2", mockShow2],
      ["show-3", mockShow3],
    ]);

    const mockUnitIdByShowId = new Map([
      ["show-1", "asia-tour-2024"],
      ["show-2", "asia-tour-2024"],
      ["show-3", "summer-sonic-2025"],
    ]);

    const mockAllUsedSongs = [
      { id: "pretender", title: "Pretender" },
      { id: "shukumei", title: "宿命" },
      { id: "subtitle", title: "Subtitle" },
      { id: "mixed-nuts", title: "ミックスナッツ" },
      { id: "same-blue", title: "Same Blue" },
      { id: "cry-baby", title: "Cry Baby" },
      { id: "i-love", title: "I LOVE..." },
      { id: "115-man-kilo-no-film", title: "115万キロのフィルム" },
      { id: "white-noise", title: "ホワイトノイズ" },
      { id: "tatakau-koto-kara-nigenaide", title: "戦うことから逃げないで" },
    ];

    it("returns zero milestones for empty attendance records", async () => {
      const { computeTicketBookMilestones } = await loadModule("/src/lib/ticket-book-milestones.js");

      const stats = computeTicketBookMilestones({
        attendedShows: [],
        unitData: mockUnitData,
        showById: mockShowById,
        unitIdByShowId: mockUnitIdByShowId,
        allUsedSongs: mockAllUsedSongs,
      });

      assert.equal(stats.totalShows, 0);
      assert.equal(stats.totalTours, 0);
      assert.equal(stats.totalVenues, 0);
      assert.equal(stats.totalCities, 0);
      assert.equal(stats.unlockedSongCount, 0);
      assert.equal(stats.totalCatalogSongs, 10);
      assert.equal(stats.coveragePercentage, 0);
      assert.deepEqual(stats.topSongs, []);
      assert.equal(stats.earliestShow, null);
      assert.equal(stats.latestShow, null);
    });

    it("correctly aggregates milestones, coverage, top 3 songs, and earliest/latest shows", async () => {
      const { computeTicketBookMilestones } = await loadModule("/src/lib/ticket-book-milestones.js");

      const attendedShows = [
        { showKey: "show-1", attendedAt: "2024-11-30" },
        { showKey: "show-2", attendedAt: "2024-12-15" },
        { showKey: "show-3", attendedAt: "2025-08-16" },
      ];

      const stats = computeTicketBookMilestones({
        attendedShows,
        unitData: mockUnitData,
        showById: mockShowById,
        unitIdByShowId: mockUnitIdByShowId,
        allUsedSongs: mockAllUsedSongs,
      });

      // Total Shows: 3
      assert.equal(stats.totalShows, 3);
      // Tours: 1 (asia-tour-2024 isTour=true, summer-sonic isTour=false)
      assert.equal(stats.totalTours, 1);
      // Venues: 3 ("KINTEX Hall 5", "台北小巨蛋", "舞洲體育園區")
      assert.equal(stats.totalVenues, 3);
      // Cities: 3 ("高陽", "台北", "大阪")
      assert.equal(stats.totalCities, 3);
      // Unlocked songs: 5 out of 10 ("pretender", "shukumei", "subtitle", "mixed-nuts", "same-blue")
      assert.equal(stats.unlockedSongCount, 5);
      assert.equal(stats.totalCatalogSongs, 10);
      assert.equal(stats.coveragePercentage, 50);

      // Top 3 songs:
      // Pretender: 3 times
      // Shukumei: 2 times
      // 3rd place: 1 time
      assert.equal(stats.topSongs.length, 3);
      assert.equal(stats.topSongs[0].songId, "pretender");
      assert.equal(stats.topSongs[0].count, 3);
      assert.equal(stats.topSongs[0].title, "Pretender");

      assert.equal(stats.topSongs[1].songId, "shukumei");
      assert.equal(stats.topSongs[1].count, 2);
      assert.equal(stats.topSongs[1].title, "宿命");

      assert.equal(stats.topSongs[2].count, 1);

      // Earliest and Latest
      assert.ok(stats.earliestShow);
      assert.equal(stats.earliestShow.showKey, "show-1");
      assert.equal(stats.earliestShow.date, "2024-11-30");
      assert.equal(stats.earliestShow.shortTitle, "Rejoice Asia Tour");

      assert.ok(stats.latestShow);
      assert.equal(stats.latestShow.showKey, "show-3");
      assert.equal(stats.latestShow.date, "2025-08-16");
      assert.equal(stats.latestShow.shortTitle, "Summer Sonic 2025");
    });

    it("gracefully handles orphaned shows, null fields, and non-song items", async () => {
      const { computeTicketBookMilestones } = await loadModule("/src/lib/ticket-book-milestones.js");

      const attendedShows = [
        { showKey: "unknown-orphan-1", attendedAt: "2022-01-01" },
        null,
        { showKey: "" },
      ];

      const stats = computeTicketBookMilestones({
        attendedShows,
        unitData: mockUnitData,
        showById: mockShowById,
        unitIdByShowId: mockUnitIdByShowId,
      });

      assert.equal(stats.totalShows, 3);
      assert.equal(stats.totalTours, 0);
      assert.equal(stats.totalVenues, 0);
      assert.equal(stats.totalCities, 0);
      assert.equal(stats.unlockedSongCount, 0);
      assert.equal(stats.coveragePercentage, 0);
      assert.equal(stats.earliestShow?.showKey, "unknown-orphan-1");
      assert.equal(stats.latestShow?.showKey, "unknown-orphan-1");
    });

    it("excludes unreleased songs from coverage denominator and numerator while preserving top songs qualification", async () => {
      const { computeTicketBookMilestones } = await loadModule("/src/lib/ticket-book-milestones.js");

      // Catalog with 4 released songs and 2 unreleased songs
      const catalog = [
        { id: "pretender", title: "Pretender" },
        { id: "shukumei", title: "宿命" },
        { id: "subtitle", title: "Subtitle" },
        { id: "mixed-nuts", title: "ミックスナッツ" },
        { id: "fuusen", title: "風船", unreleased: true },
        { id: "akegata-no-getaway", title: "明け方のゲッタウェイ", unreleased: true },
      ];

      const testShowById = new Map([
        [
          "special-show",
          {
            id: "special-show",
            date: "2024-05-01",
            venue: "Club Live",
            city: "東京",
            setlist: [
              { songId: "pretender" },
              { songId: "fuusen" }, // unreleased
              { songId: "akegata-no-getaway" }, // unreleased
            ],
          },
        ],
      ]);

      const testUnitData = new Map([
        [
          "special-event",
          {
            unit: { id: "special-event", title: "FC Special Live", isTour: false },
            isTour: false,
          },
        ],
      ]);

      const stats = computeTicketBookMilestones({
        attendedShows: [{ showKey: "special-show", attendedAt: "2024-05-01" }],
        unitData: testUnitData,
        showById: testShowById,
        unitIdByShowId: new Map([["special-show", "special-event"]]),
        allUsedSongs: catalog,
      });

      // 1. Total catalog songs (denominator) excludes the 2 unreleased songs (4 instead of 6)
      assert.equal(stats.totalCatalogSongs, 4, "Denominator must only count released songs");

      // 2. Unlocked songs (numerator) only counts 'pretender' (1 instead of 3)
      assert.equal(stats.unlockedSongCount, 1, "Numerator must only count released songs");
      assert.equal(stats.coveragePercentage, 25, "Coverage is 1/4 = 25%");

      // 3. Top songs retains unreleased songs based on actual live counts
      const topSongIds = stats.topSongs.map((s) => s.songId);
      assert.ok(topSongIds.includes("fuusen"), "Unreleased song 'fuusen' must be eligible for topSongs");
      assert.ok(topSongIds.includes("akegata-no-getaway"), "Unreleased song 'akegata-no-getaway' must be eligible for topSongs");

      // 4. attendedShowsList includes the show
      assert.equal(stats.attendedShowsList.length, 1);
      assert.equal(stats.attendedShowsList[0].showKey, "special-show");
    });

    it("excludes collaboration singles from coverage denominator and numerator and checklist album groups while preserving top songs qualification", async () => {
      const { computeTicketBookMilestones } = await loadModule("/src/lib/ticket-book-milestones.js");

      // Catalog with 2 released songs, 2 collaboration singles, and 1 unreleased song
      const catalog = [
        { id: "pretender", title: "Pretender" },
        { id: "subtitle", title: "Subtitle" },
        { id: "koi-no-saichu", title: "恋の最chu!" }, // collaboration single
        { id: "bukiyou-na-futari-de", title: "不器用な二人で" }, // collaboration single
        { id: "fuusen", title: "風船", unreleased: true }, // unreleased
      ];

      const testShowById = new Map([
        [
          "collab-show",
          {
            id: "collab-show",
            date: "2016-08-01",
            venue: "Live House",
            city: "東京",
            setlist: [
              { songId: "pretender" },
              { songId: "koi-no-saichu" }, // collaboration single
              { songId: "fuusen" }, // unreleased
            ],
          },
        ],
      ]);

      const testUnitData = new Map([
        [
          "collab-event",
          {
            unit: { id: "collab-event", title: "Special Joint Event", isTour: false },
            isTour: false,
          },
        ],
      ]);

      const stats = computeTicketBookMilestones({
        attendedShows: [{ showKey: "collab-show", attendedAt: "2016-08-01" }],
        unitData: testUnitData,
        showById: testShowById,
        unitIdByShowId: new Map([["collab-show", "collab-event"]]),
        allUsedSongs: catalog,
      });

      // 1. Total catalog songs (denominator) excludes both unreleased and collaboration songs (2 instead of 5)
      assert.equal(stats.totalCatalogSongs, 2, "Denominator must exclude collaboration singles and unreleased songs");

      // 2. Unlocked songs (numerator) only counts 'pretender' (1 instead of 3)
      assert.equal(stats.unlockedSongCount, 1, "Numerator must exclude collaboration singles");
      assert.equal(stats.coveragePercentage, 50, "Coverage is 1/2 = 50%");

      // 3. Checklist album groups must NOT contain '合作單曲'
      const albumNames = stats.albumGroups.map((g) => g.album);
      assert.ok(!albumNames.includes("合作單曲"), "Album groups must not include '合作單曲'");
      assert.ok(!albumNames.includes("未發行曲目"), "Album groups must not include '未發行曲目'");

      // 4. Top songs retains collaboration and unreleased songs based on actual live counts
      const topSongIds = stats.topSongs.map((s) => s.songId);
      assert.ok(topSongIds.includes("koi-no-saichu"), "Collaboration song 'koi-no-saichu' must remain in topSongs if played");
      assert.ok(topSongIds.includes("fuusen"), "Unreleased song 'fuusen' must remain in topSongs if played");
    });

    it("excludes virtual livestream venues and cities from totalVenues and totalCities while counting attendance and unlocked songs", async () => {
      const { computeTicketBookMilestones } = await loadModule("/src/lib/ticket-book-milestones.js");

      const catalog = [
        { id: "pretender", title: "Pretender" },
        { id: "subtitle", title: "Subtitle" },
      ];

      const testShowById = new Map([
        [
          "physical-show",
          {
            id: "physical-show",
            date: "2024-12-15",
            venue: "台北小巨蛋",
            city: "台北",
            setlist: [{ songId: "pretender" }],
          },
        ],
        [
          "livestream-show-1",
          {
            id: "livestream-show-1",
            date: "2020-09-26",
            venue: "線上直播",
            city: "線上直播",
            setlist: [{ songId: "subtitle" }],
          },
        ],
        [
          "livestream-show-2",
          {
            id: "livestream-show-2",
            date: "2020-08-06",
            venue: "線上直播 (YouTube / Twitter / LINE)",
            city: "線上直播",
            setlist: [{ songId: "pretender" }],
          },
        ],
      ]);

      const stats = computeTicketBookMilestones({
        attendedShows: [
          { showKey: "physical-show", attendedAt: "2024-12-15" },
          { showKey: "livestream-show-1", attendedAt: "2020-09-26" },
          { showKey: "livestream-show-2", attendedAt: "2020-08-06" },
        ],
        unitData: new Map(),
        showById: testShowById,
        unitIdByShowId: new Map(),
        allUsedSongs: catalog,
      });

      assert.equal(stats.totalShows, 3);
      assert.equal(stats.unlockedSongCount, 2);
      assert.equal(stats.totalVenues, 1);
      assert.equal(stats.totalCities, 1);
    });

    it("computes albumGroups with songs, counts, and completion percentages excluding unreleased tracks", async () => {
      const { computeTicketBookMilestones } = await loadModule("/src/lib/ticket-book-milestones.js");

      const attendedShows = [
        { showKey: "show-1", attendedAt: "2024-11-30" },
        { showKey: "show-2", attendedAt: "2024-12-15" },
        { showKey: "show-3", attendedAt: "2025-08-16" },
      ];

      const stats = computeTicketBookMilestones({
        attendedShows,
        unitData: mockUnitData,
        showById: mockShowById,
        unitIdByShowId: mockUnitIdByShowId,
        allUsedSongs: mockAllUsedSongs,
      });

      assert.ok(Array.isArray(stats.albumGroups), "stats.albumGroups must be an array");
      assert.ok(stats.albumGroups.length > 0, "albumGroups should not be empty");

      // Rejoice (2024): 3 songs (subtitle, mixed-nuts, white-noise), 2 unlocked -> 66.7%
      const rejoice = stats.albumGroups.find((g) => g.album === "Rejoice (2024)");
      assert.ok(rejoice, "Rejoice group must exist");
      assert.equal(rejoice.totalSongs, 3);
      assert.equal(rejoice.unlockedCount, 2);
      assert.equal(rejoice.completionPercentage, 66.7);

      const subtitleSong = rejoice.songs.find((s) => s.id === "subtitle");
      assert.ok(subtitleSong);
      assert.equal(subtitleSong.unlocked, true);
      assert.equal(subtitleSong.count, 1);

      const whiteNoiseSong = rejoice.songs.find((s) => s.id === "white-noise");
      assert.ok(whiteNoiseSong);
      assert.equal(whiteNoiseSong.unlocked, false);
      assert.equal(whiteNoiseSong.count, 0);

      // Traveler (2019): 2 songs (pretender, shukumei), 2 unlocked -> 100%
      const traveler = stats.albumGroups.find((g) => g.album === "Traveler (2019)");
      assert.ok(traveler, "Traveler group must exist");
      assert.equal(traveler.totalSongs, 2);
      assert.equal(traveler.unlockedCount, 2);
      assert.equal(traveler.completionPercentage, 100);

      // Editorial (2021): 2 songs (cry-baby, i-love), 0 unlocked -> 0%
      const editorial = stats.albumGroups.find((g) => g.album === "Editorial (2021)");
      assert.ok(editorial, "Editorial group must exist");
      assert.equal(editorial.totalSongs, 2);
      assert.equal(editorial.unlockedCount, 0);
      assert.equal(editorial.completionPercentage, 0);

      // Verify unreleased album or unreleased songs are NOT in albumGroups
      const unreleasedGroup = stats.albumGroups.find((g) => g.album === "未發行曲目");
      assert.equal(unreleasedGroup, undefined, "Unreleased group must never be present in albumGroups");
    });
  });

  describe("Seam 2: TicketBook Milestone Dashboard Presentation (TicketBookPage.jsx)", () => {
    it("renders milestone dashboard with counters, top songs, first/latest shows, and generate card CTA", async () => {
      const { React, renderToStaticMarkup } = await (await import("../helpers/vite-server.js")).getReactAndRenderer();
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookPage } = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      const mockShow1 = {
        id: "show-1",
        date: "2024-11-30",
        city: "高陽",
        venue: "KINTEX Hall 5",
        title: "Asia Tour 2024",
      };
      const mockShow2 = {
        id: "show-2",
        date: "2024-12-15",
        city: "台北",
        venue: "台北小巨蛋",
        title: "Asia Tour 2024",
      };
      const mockUnitTour = {
        id: "asia-tour-2024",
        title: "Asia Tour 2024",
        shortTitle: "Rejoice",
        type: "巡演專場",
        shows: [mockShow1, mockShow2],
      };
      const mockUnitData = new Map([
        [
          "asia-tour-2024",
          {
            unit: mockUnitTour,
            isTour: true,
            full: new Map([
              [
                "show-1",
                [
                  { order: 1, songId: "pretender" },
                  { order: 2, songId: "shukumei" },
                ],
              ],
              [
                "show-2",
                [
                  { order: 1, songId: "pretender" },
                  { order: 2, songId: "subtitle" },
                ],
              ],
            ]),
          },
        ],
      ]);
      const mockShowById = new Map([
        ["show-1", mockShow1],
        ["show-2", mockShow2],
      ]);
      const mockUnitIdByShowId = new Map([
        ["show-1", "asia-tour-2024"],
        ["show-2", "asia-tour-2024"],
      ]);
      const mockAllUsedSongs = [
        { id: "pretender", title: "Pretender" },
        { id: "shukumei", title: "宿命" },
        { id: "subtitle", title: "Subtitle" },
        { id: "mixed-nuts", title: "ミックスナッツ" },
      ];

      recordAttendance("show-1", { date: "2024-11-30" }, storage);
      recordAttendance("show-2", { date: "2024-12-15" }, storage);

      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            allUsedSongs: mockAllUsedSongs,
            storage,
          })
        )
      );

      // Verify dashboard presence
      assert.ok(htmlZh.includes('data-testid="ticket-book-milestones-dashboard"'), "Must render ticket-book-milestones-dashboard");
      assert.ok(htmlZh.includes('data-testid="milestone-total-shows"'), "Must render milestone-total-shows");
      assert.ok(htmlZh.includes('data-testid="milestone-total-tours"'), "Must render milestone-total-tours");
      assert.ok(htmlZh.includes('data-testid="milestone-total-cities"'), "Must render milestone-total-cities");
      assert.ok(htmlZh.includes('data-testid="milestone-coverage"'), "Must render milestone-coverage");
      assert.ok(htmlZh.includes('data-testid="milestone-coverage-bar"'), "Must render milestone-coverage-bar progress bar");
      assert.ok(htmlZh.includes('data-testid="milestone-coverage-cta"'), "Must render milestone-coverage-cta button badge");
      assert.ok(htmlZh.includes("查看圖鑑 ↗"), "Must render zh-TW CTA text");

      // Verify Top 3 Songs block
      assert.ok(htmlZh.includes('data-testid="milestone-top-songs"'), "Must render milestone-top-songs block");
      assert.ok(htmlZh.includes("Pretender"), "Must list Pretender in top songs");

      // Verify First & Latest shows
      assert.ok(htmlZh.includes('data-testid="milestone-first-show"'), "Must render milestone-first-show");
      assert.ok(htmlZh.includes('data-testid="milestone-latest-show"'), "Must render milestone-latest-show");

      // Verify Generate Summary Card CTA button
      assert.ok(htmlZh.includes('data-testid="generate-summary-card-btn"'), "Must render generate-summary-card-btn");

      // Verify localized labels in ja
      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            allUsedSongs: mockAllUsedSongs,
            storage,
          })
        )
      );
      assert.ok(htmlJa.includes('data-testid="ticket-book-milestones-dashboard"'));
      assert.ok(htmlJa.includes("図鑑を見る ↗"), "Must render ja CTA text");

      storage.clear();
    });

    it("renders milestone coverage as interactive checklist trigger and filters timeline by song when selected", async () => {
      const { React, renderToStaticMarkup } = await (await import("../helpers/vite-server.js")).getReactAndRenderer();
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookPage } = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      const mockShow1 = {
        id: "show-1",
        date: "2024-11-30",
        city: "高陽",
        venue: "KINTEX Hall 5",
        title: "Asia Tour 2024",
      };
      const mockShow2 = {
        id: "show-2",
        date: "2024-12-15",
        city: "台北",
        venue: "台北小巨蛋",
        title: "Asia Tour 2024",
      };
      const mockUnitTour = {
        id: "asia-tour-2024",
        title: "Asia Tour 2024",
        shortTitle: "Rejoice",
        type: "巡演專場",
        shows: [mockShow1, mockShow2],
      };
      const mockUnitData = new Map([
        [
          "asia-tour-2024",
          {
            unit: mockUnitTour,
            isTour: true,
            full: new Map([
              [
                "show-1",
                [
                  { order: 1, songId: "pretender" },
                  { order: 2, songId: "shukumei" },
                ],
              ],
              [
                "show-2",
                [
                  { order: 1, songId: "pretender" },
                  { order: 2, songId: "subtitle" },
                ],
              ],
            ]),
          },
        ],
      ]);
      const mockShowById = new Map([
        ["show-1", mockShow1],
        ["show-2", mockShow2],
      ]);
      const mockUnitIdByShowId = new Map([
        ["show-1", "asia-tour-2024"],
        ["show-2", "asia-tour-2024"],
      ]);
      const mockAllUsedSongs = [
        { id: "pretender", title: "Pretender" },
        { id: "shukumei", title: "宿命" },
        { id: "subtitle", title: "Subtitle" },
        { id: "mixed-nuts", title: "ミックスナッツ" },
      ];

      recordAttendance("show-1", { date: "2024-11-30" }, storage);
      recordAttendance("show-2", { date: "2024-12-15" }, storage);

      // Render with initialFilterSongId="shukumei" (only show-1 played shukumei)
      const htmlFiltered = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            allUsedSongs: mockAllUsedSongs,
            initialFilterSongId: "shukumei",
            storage,
          })
        )
      );

      // Verify active song filter badge is displayed
      assert.ok(htmlFiltered.includes('data-testid="ticket-book-active-song-filter"'), "Must render active song filter chip");
      assert.ok(htmlFiltered.includes("宿命"), "Must display filtered song title");
      assert.ok(htmlFiltered.includes('data-testid="clear-song-filter-btn"'), "Must render clear song filter button");

      // Verify timeline filtering: show-1 is included, show-2 is filtered out
      assert.ok(htmlFiltered.includes('data-testid="timeline-item-show-1"'), "show-1 played shukumei and must be present");
      assert.ok(!htmlFiltered.includes('data-testid="timeline-item-show-2"'), "show-2 did not play shukumei and must be filtered out");

      storage.clear();
    });
  });

    it("renders milestone dashboard with zero stats even when no shows are attended (ticket-book home entry)", async () => {
      const { React, renderToStaticMarkup } = await (await import("../helpers/vite-server.js")).getReactAndRenderer();
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookPage } = await loadModule("/src/components/ticket-book/TicketBookPage.jsx");
      const { getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      const htmlEmpty = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookPage, {
            unitData: new Map(),
            showById: new Map(),
            unitIdByShowId: new Map(),
            storage,
          })
        )
      );

      // Milestone dashboard is visible on ticket-book home even with 0 check-ins
      assert.ok(htmlEmpty.includes('data-testid="ticket-book-milestones-dashboard"'));
      assert.ok(htmlEmpty.includes('data-testid="milestone-total-shows"'));
      assert.ok(htmlEmpty.includes("0 場"));
      assert.ok(htmlEmpty.includes("0 巡演"));
      assert.ok(htmlEmpty.includes("0 城市"));
      assert.ok(htmlEmpty.includes("0%"));
      // Empty state prompt is also visible
      assert.ok(htmlEmpty.includes('data-testid="ticket-book-empty-state"'));

      storage.clear();
    });
  describe("Seam 3: Milestone Summary Card Component & 540px Export Modal (MilestoneCardModal.jsx)", () => {
    const mockMilestones = {
      totalShows: 3,
      totalTours: 1,
      totalVenues: 3,
      totalCities: 3,
      unlockedSongCount: 5,
      totalCatalogSongs: 10,
      coveragePercentage: 50,
      topSongs: [
        { rank: 1, songId: "pretender", title: "Pretender", count: 3 },
        { rank: 2, songId: "shukumei", title: "宿命", count: 2 },
        { rank: 3, songId: "subtitle", title: "Subtitle", count: 1 },
      ],
      earliestShow: {
        showKey: "show-1",
        date: "2024-11-30",
        title: "Official髭男dism Asia Tour 2024 - Rejoice",
        shortTitle: "Asia Tour 2024",
        venue: "KINTEX Hall 5",
        city: "高陽",
      },
      latestShow: {
        showKey: "show-3",
        date: "2025-08-16",
        title: "Summer Sonic 2025",
        venue: "舞洲體育園區",
        city: "大阪",
      },
      attendedShowsList: [
        {
          showKey: "show-1",
          date: "2024-11-30",
          title: "Asia Tour 2024",
          venue: "KINTEX Hall 5",
          city: "高陽",
        },
        {
          showKey: "show-2",
          date: "2024-12-15",
          title: "Asia Tour 2024",
          venue: "台北小巨蛋",
          city: "台北",
        },
        {
          showKey: "show-3",
          date: "2025-08-16",
          title: "Summer Sonic 2025",
          venue: "舞洲體育園區",
          city: "大阪",
        },
      ],
    };

    it("renders 540px milestone summary card modal with full milestone stats and download button", async () => {
      const { React, renderToStaticMarkup } = await (await import("../helpers/vite-server.js")).getReactAndRenderer();
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { MilestoneCardModal } = await loadModule("/src/components/ticket-book/MilestoneCardModal.jsx");
      const { MemoryStorageAdapter, setTicketBookHolderName } = await loadModule("/src/lib/ticket-book.js");

      const storage = new MemoryStorageAdapter();
      setTicketBookHolderName("HigedanFan99", storage);

      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(MilestoneCardModal, {
            isOpen: true,
            onClose: () => {},
            milestones: mockMilestones,
            storage,
          })
        )
      );

      // Verify modal and card container
      assert.ok(html.includes('data-testid="milestone-card-modal"'), "Must render modal container");
      assert.ok(html.includes('data-testid="milestone-summary-card"'), "Must render summary card node");
      assert.ok(html.includes("540px"), "Summary card must specify 540px standard width (ADR-0100)");
      assert.ok(
        html.includes("#f8f7f4") || html.includes("rgb(248, 247, 244)"),
        "Milestone card must have solid cardstock background #f8f7f4 to prevent transparent export"
      );

      // Verify holder input in drawer and badge on card
      assert.ok(html.includes('data-testid="milestone-holder-input"'), "Must render milestone holder input");
      assert.ok(html.includes('data-testid="milestone-holder-badge"'), "Must render holder badge when name is set");
      assert.ok(html.includes("HigedanFan99"), "Must display holder name in badge");

      // Verify milestone stats in card
      assert.ok(html.includes('data-testid="milestone-card-total-shows"'));
      assert.ok(html.includes('data-testid="milestone-card-total-tours"'));
      assert.ok(html.includes('data-testid="milestone-card-total-cities"'));
      assert.ok(html.includes('data-testid="milestone-card-coverage"'));

      // Verify values
      assert.ok(html.includes("3 場"));
      assert.ok(html.includes("1 巡演"));
      assert.ok(html.includes("3 城市"));
      assert.ok(html.includes("50%"));

      // Verify Top 3 songs is omitted from milestone card to keep layout clean for footprint list
      assert.ok(!html.includes('data-testid="milestone-card-top-songs"'), "Top songs should be omitted from card for focused footprint sharing");

      // Verify First and Latest show history
      assert.ok(html.includes('data-testid="milestone-card-first-show"'));
      assert.ok(html.includes('data-testid="milestone-card-latest-show"'));
      assert.ok(html.includes("2024-11-30"));
      assert.ok(html.includes("2025-08-16"));

      // Verify Atomic Show Date Invariant (whitespace-nowrap shrink-0)
      assert.ok(html.includes("whitespace-nowrap shrink-0"), "Milestone card dates must have whitespace-nowrap shrink-0 to prevent bracket wrap");
      assert.ok(html.includes("Asia Tour 2024"), "Must render shortTitle for concise tour titles in 540px milestone card");
      assert.ok(!html.includes("Official髭男dism Asia Tour 2024 - Rejoice"), "Must omit redundant full title prefix when shortTitle is present");

      // Verify Attended Chronicle Footprint list
      assert.ok(html.includes('data-testid="milestone-card-attended-list"'), "Chronicle attended list must be rendered");
      assert.ok(html.includes("參戰足跡全紀錄"), "zh-TW attendedListTitle must be rendered");

      // Verify native save hint notice
      assert.ok(html.includes("長按小卡") || html.includes("另存圖片"), "Native save hint notice must be present");


      // Verify ADR-0100 & DESIGN.md card radius rule (radius <= 8px on slips, no rounded-[12px])
      assert.ok(html.includes("rounded-[8px]"), "Summary card must use rounded-[8px] (DESIGN.md slip radius <= 8px)");
      assert.ok(!html.includes("rounded-[12px]"), "Summary card must not use rounded-[12px]");

      // Verify AAA contrast (>= 7:1) and zero arbitrary unvetted hex colors
      assert.ok(!html.includes("text-[#"), "Must not use arbitrary unvetted hex colors");
      assert.ok(html.includes("text-ink"), "Small badge/label text must use high-contrast ink tokens (text-ink) for AAA contrast >= 7:1");

      // Verify returns null when isOpen is false
      const closedHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(MilestoneCardModal, {
            isOpen: false,
            onClose: () => {},
            milestones: mockMilestones,
          })
        )
      );
      assert.equal(closedHtml, "");

      // Verify holder badge is omitted when holder name is empty
      const emptyHolderStorage = new MemoryStorageAdapter();
      const emptyHolderHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(MilestoneCardModal, {
            isOpen: true,
            onClose: () => {},
            milestones: mockMilestones,
            storage: emptyHolderStorage,
          })
        )
      );
      assert.ok(!emptyHolderHtml.includes('data-testid="milestone-holder-badge"'), "Holder badge omitted when holder name is empty");
    });
  });

  describe("Seam 4: Live Song Checklist Component & Interactions (LiveSongChecklistDrawer.jsx)", () => {
    it("renders live song checklist drawer with album grouping, completion progress, and stamp badges", async () => {
      const { React, renderToStaticMarkup } = await (await import("../helpers/vite-server.js")).getReactAndRenderer();
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { LiveSongChecklistDrawer } = await loadModule("/src/components/ticket-book/LiveSongChecklistDrawer.jsx");

      const mockMilestones = {
        unlockedSongCount: 5,
        totalCatalogSongs: 10,
        coveragePercentage: 50,
        albumGroups: [
          {
            album: "Rejoice (2024)",
            totalSongs: 3,
            unlockedCount: 2,
            completionPercentage: 66.7,
            songs: [
              { id: "subtitle", title: "Subtitle", album: "Rejoice (2024)", unlocked: true, count: 1 },
              { id: "mixed-nuts", title: "ミックスナッツ", album: "Rejoice (2024)", unlocked: true, count: 1 },
              { id: "white-noise", title: "ホワイトノイズ", album: "Rejoice (2024)", unlocked: false, count: 0 },
            ],
          },
          {
            album: "Traveler (2019)",
            totalSongs: 2,
            unlockedCount: 2,
            completionPercentage: 100,
            songs: [
              { id: "pretender", title: "Pretender", album: "Traveler (2019)", unlocked: true, count: 3 },
              { id: "shukumei", title: "宿命", album: "Traveler (2019)", unlocked: true, count: 2 },
            ],
          },
        ],
      };

      // 1. Closed state returns null
      const closedHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(LiveSongChecklistDrawer, {
            isOpen: false,
            onClose: () => {},
            milestones: mockMilestones,
          })
        )
      );
      assert.equal(closedHtml, "");

      // 2. Open state (Default / All filter)
      const openHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(LiveSongChecklistDrawer, {
            isOpen: true,
            onClose: () => {},
            milestones: mockMilestones,
          })
        )
      );

      // Verify drawer container and header
      assert.ok(openHtml.includes('data-testid="live-song-checklist-drawer"'), "Must render drawer container");
      assert.ok(openHtml.includes('data-testid="song-checklist-close-btn"'), "Must render close button");
      assert.ok(openHtml.includes("現場曲庫解鎖成就圖鑑"), "Must render zh-TW checklist title");
      assert.ok(openHtml.includes("共已解鎖 5 / 10 首"), "Must render overall unlocked progress");

      // Verify filter tabs
      assert.ok(openHtml.includes('data-testid="checklist-filter-all"'), "Must render All filter tab");
      assert.ok(openHtml.includes('data-testid="checklist-filter-unlocked"'), "Must render Unlocked filter tab");
      assert.ok(openHtml.includes('data-testid="checklist-filter-locked"'), "Must render Locked filter tab");

      // Verify album groups and completion
      assert.ok(openHtml.includes("Rejoice (2024)"));
      assert.ok(openHtml.includes("2 / 3"));
      assert.ok(openHtml.includes("Traveler (2019)"));
      assert.ok(openHtml.includes("COMPLETE") || openHtml.includes("100%"), "100% complete album must show complete badge");

      // Verify unlocked song stamp badge & button
      assert.ok(openHtml.includes('data-testid="checklist-song-pretender"'));
      assert.ok(openHtml.includes("已解鎖"), "Unlocked song must display unlocked badge");
      assert.ok(openHtml.includes("3 次"), "Pretender count must be 3 次");

      // Verify locked song stamp badge & deep link
      assert.ok(openHtml.includes('data-testid="checklist-song-white-noise"'));
      assert.ok(openHtml.includes("尚未在現場解鎖"), "Locked song must display not yet heard badge");
      assert.ok(openHtml.includes("#/song/white-noise"), "Locked song must link to #/song/:id");

      // Verify DESIGN.md tokens & contrast invariants
      assert.ok(!openHtml.includes("text-[#"), "Must not use arbitrary hex colors");
      assert.ok(openHtml.includes("text-ink"), "Must use high-contrast ink tokens");
      assert.ok(openHtml.includes("rounded-t-[8px]"), "Drawer must follow DESIGN.md card radius <= 8px");
      assert.ok(!openHtml.includes("rounded-t-[14px]"), "Drawer must not use rounded-t-[14px]");

      // 3. Filtered state: only unlocked
      const unlockedHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(LiveSongChecklistDrawer, {
            isOpen: true,
            initialFilter: "unlocked",
            onClose: () => {},
            milestones: mockMilestones,
          })
        )
      );
      assert.ok(unlockedHtml.includes('data-testid="checklist-song-pretender"'));
      assert.ok(!unlockedHtml.includes('data-testid="checklist-song-white-noise"'), "Locked songs must be hidden in unlocked filter");

      // 4. Filtered state: only locked
      const lockedHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(LiveSongChecklistDrawer, {
            isOpen: true,
            initialFilter: "locked",
            onClose: () => {},
            milestones: mockMilestones,
          })
        )
      );
      assert.ok(lockedHtml.includes('data-testid="checklist-song-white-noise"'));
      assert.ok(!lockedHtml.includes('data-testid="checklist-song-pretender"'), "Unlocked songs must be hidden in locked filter");

      // 5. Empty filter state displays polite empty notice
      const allLockedMilestones = {
        unlockedSongCount: 0,
        totalCatalogSongs: 2,
        coveragePercentage: 0,
        albumGroups: [
          {
            album: "Rejoice (2024)",
            totalSongs: 2,
            unlockedCount: 0,
            completionPercentage: 0,
            songs: [
              { id: "subtitle", title: "Subtitle", album: "Rejoice (2024)", unlocked: false, count: 0 },
              { id: "mixed-nuts", title: "ミックスナッツ", album: "Rejoice (2024)", unlocked: false, count: 0 },
            ],
          },
        ],
      };
      const emptyHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(LiveSongChecklistDrawer, {
            isOpen: true,
            initialFilter: "unlocked",
            onClose: () => {},
            milestones: allLockedMilestones,
          })
        )
      );
      assert.ok(emptyHtml.includes('data-testid="checklist-empty-state"'), "Must render checklist-empty-state when 0 songs match filter");
      assert.ok(emptyHtml.includes("目前篩選條件下無符合的曲目"), "Must render empty notice text");
    });
  });
});
