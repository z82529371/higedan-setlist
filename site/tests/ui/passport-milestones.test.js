import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "../helpers/vite-server.js";

describe("25. Passport Dynamic Milestones Calculation & Summary Card (#37)", () => {
  describe("Seam 1: Domain Milestone Calculation Engine (passport-milestones.js)", () => {
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
      const { computePassportMilestones } = await loadModule("/src/lib/passport-milestones.js");

      const stats = computePassportMilestones({
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
      const { computePassportMilestones } = await loadModule("/src/lib/passport-milestones.js");

      const attendedShows = [
        { showKey: "show-1", attendedAt: "2024-11-30" },
        { showKey: "show-2", attendedAt: "2024-12-15" },
        { showKey: "show-3", attendedAt: "2025-08-16" },
      ];

      const stats = computePassportMilestones({
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

      assert.ok(stats.latestShow);
      assert.equal(stats.latestShow.showKey, "show-3");
      assert.equal(stats.latestShow.date, "2025-08-16");
    });

    it("gracefully handles orphaned shows, null fields, and non-song items", async () => {
      const { computePassportMilestones } = await loadModule("/src/lib/passport-milestones.js");

      const attendedShows = [
        { showKey: "unknown-orphan-1", attendedAt: "2022-01-01" },
        null,
        { showKey: "" },
      ];

      const stats = computePassportMilestones({
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
  });

  describe("Seam 2: Passport Milestone Dashboard Presentation (PassportPage.jsx)", () => {
    it("renders milestone dashboard with counters, top songs, first/latest shows, and generate card CTA", async () => {
      const { React, renderToStaticMarkup } = await (await import("../helpers/vite-server.js")).getReactAndRenderer();
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { PassportPage } = await loadModule("/src/components/passport/PassportPage.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/passport.js");

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
          React.createElement(PassportPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            allUsedSongs: mockAllUsedSongs,
            storage,
          })
        )
      );

      // Verify dashboard presence
      assert.ok(htmlZh.includes('data-testid="passport-milestones-dashboard"'), "Must render passport-milestones-dashboard");
      assert.ok(htmlZh.includes('data-testid="milestone-total-shows"'), "Must render milestone-total-shows");
      assert.ok(htmlZh.includes('data-testid="milestone-total-tours"'), "Must render milestone-total-tours");
      assert.ok(htmlZh.includes('data-testid="milestone-total-cities"'), "Must render milestone-total-cities");
      assert.ok(htmlZh.includes('data-testid="milestone-coverage"'), "Must render milestone-coverage");

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
          React.createElement(PassportPage, {
            unitData: mockUnitData,
            showById: mockShowById,
            unitIdByShowId: mockUnitIdByShowId,
            allUsedSongs: mockAllUsedSongs,
            storage,
          })
        )
      );
      assert.ok(htmlJa.includes('data-testid="passport-milestones-dashboard"'));

      storage.clear();
    });
  });

    it("renders milestone dashboard with zero stats even when no shows are attended (passport home entry)", async () => {
      const { React, renderToStaticMarkup } = await (await import("../helpers/vite-server.js")).getReactAndRenderer();
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { PassportPage } = await loadModule("/src/components/passport/PassportPage.jsx");
      const { getSafeStorage } = await loadModule("/src/lib/passport.js");

      const storage = getSafeStorage();
      storage.clear();

      const htmlEmpty = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(PassportPage, {
            unitData: new Map(),
            showById: new Map(),
            unitIdByShowId: new Map(),
            storage,
          })
        )
      );

      // Milestone dashboard is visible on passport home even with 0 check-ins
      assert.ok(htmlEmpty.includes('data-testid="passport-milestones-dashboard"'));
      assert.ok(htmlEmpty.includes('data-testid="milestone-total-shows"'));
      assert.ok(htmlEmpty.includes("0 場"));
      assert.ok(htmlEmpty.includes("0 巡演"));
      assert.ok(htmlEmpty.includes("0 城市"));
      assert.ok(htmlEmpty.includes("0%"));
      // Empty state prompt is also visible
      assert.ok(htmlEmpty.includes('data-testid="passport-empty-state"'));

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
        title: "Asia Tour 2024",
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
    };

    it("renders 540px milestone summary card modal with full milestone stats and download button", async () => {
      const { React, renderToStaticMarkup } = await (await import("../helpers/vite-server.js")).getReactAndRenderer();
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { MilestoneCardModal } = await loadModule("/src/components/passport/MilestoneCardModal.jsx");

      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(MilestoneCardModal, {
            isOpen: true,
            onClose: () => {},
            milestones: mockMilestones,
          })
        )
      );

      // Verify modal and card container
      assert.ok(html.includes('data-testid="milestone-card-modal"'), "Must render modal container");
      assert.ok(html.includes('data-testid="milestone-summary-card"'), "Must render summary card node");
      assert.ok(html.includes("540px"), "Summary card must specify 540px standard width (ADR-0100)");

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

      // Verify Top 3 songs
      assert.ok(html.includes('data-testid="milestone-card-top-songs"'));
      assert.ok(html.includes("Pretender"));
      assert.ok(html.includes("宿命"));
      assert.ok(html.includes("Subtitle"));

      // Verify First and Latest show history
      assert.ok(html.includes('data-testid="milestone-card-first-show"'));
      assert.ok(html.includes('data-testid="milestone-card-latest-show"'));
      assert.ok(html.includes("2024-11-30"));
      assert.ok(html.includes("2025-08-16"));

      // Verify download button
      assert.ok(html.includes('data-testid="download-summary-card-btn"'));


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
    });
  });
});
