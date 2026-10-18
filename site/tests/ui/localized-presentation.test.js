import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { resolve, assignCues, encoreStartOrderOf } from "../../src/lib/resolve.js";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

const { React, renderToStaticMarkup } = await getReactAndRenderer();

if (!globalThis.window) {
  globalThis.window = {
    location: { hash: "", pathname: "/" },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    innerHeight: 800,
  };
}
if (!globalThis.document) {
  globalThis.document = {
    body: { style: {} },
  };
}

describe("14. Localized Presentation & Domain Taxonomy (#17)", () => {
    it("formats dates and dual-times accurately across all 4 supported locales", async () => {
      const { showDate, formatShowTime } = await loadModule("/src/lib/domain.js");

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
      const { DICTIONARIES } = await loadModule("/src/lib/i18n.jsx");

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
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ShowNavigator } = await loadModule("/src/components/navigators/ShowNavigator.jsx");
      const { VenueNavigator } = await loadModule("/src/components/navigators/VenueNavigator.jsx");

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
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { TourSlip } = await loadModule("/src/components/slips/TourSlip.jsx");

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
      const { SongSlip } = await loadModule("/src/components/slips/SongSlip.jsx");
      const { VenueSlip } = await loadModule("/src/components/slips/VenueSlip.jsx");

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
