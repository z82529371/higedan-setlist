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

describe("17. Administrative Geography Localization & Venue Integrity Boundary (ADR-0108)", () => {
    let DICTIONARIES;
    let matchGeography;
    let TourSlip;
    let VenueSlip;
    let SearchBox;
    let I18nProvider;
    let ShowNavigator;
    let VenueNavigator;
    let ShowMetadataBox;

    before(async () => {
      const i18nMod = await loadModule("/src/lib/i18n.jsx");
      DICTIONARIES = i18nMod.DICTIONARIES;
      I18nProvider = i18nMod.I18nProvider;

      const geoMod = await loadModule("/src/lib/locales/geography.js");
      matchGeography = geoMod.matchGeography;

      const tourMod = await loadModule("/src/components/slips/TourSlip.jsx");
      TourSlip = tourMod.TourSlip;

      const venueMod = await loadModule("/src/components/slips/VenueSlip.jsx");
      VenueSlip = venueMod.VenueSlip;

      const searchMod = await loadModule("/src/components/SearchBox.jsx");
      SearchBox = searchMod.default;

      const showNavMod = await loadModule("/src/components/navigators/ShowNavigator.jsx");
      ShowNavigator = showNavMod.ShowNavigator;

      const venueNavMod = await loadModule("/src/components/navigators/VenueNavigator.jsx");
      VenueNavigator = venueNavMod.VenueNavigator;

      const metaMod = await loadModule("/src/components/slips/ShowMetadataBox.jsx");
      ShowMetadataBox = metaMod.ShowMetadataBox;
    });

    it("verifies dictionary completeness and 4-locale symmetry for all cities and prefectures", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const venuesPath = fs.existsSync(path.resolve(process.cwd(), "data", "venues.json"))
        ? path.resolve(process.cwd(), "data", "venues.json")
        : path.resolve(process.cwd(), "..", "data", "venues.json");
      const venuesRaw = JSON.parse(fs.readFileSync(venuesPath, "utf8"));

      const locales = ["zh-TW", "ja", "en", "ko"];

      // Check all 4 dictionaries have cities and prefectures
      for (const loc of locales) {
        const dict = DICTIONARIES[loc];
        assert.ok(dict.cities, `${loc} dictionary must have 'cities' namespace`);
        assert.ok(dict.prefectures, `${loc} dictionary must have 'prefectures' namespace`);
        assert.strictEqual(typeof dict.cities, "object");
        assert.strictEqual(typeof dict.prefectures, "object");
      }

      // Every city and prefecture in data/venues.json must be present in all 4 locales
      for (const [vKey, entry] of Object.entries(venuesRaw)) {
        if (entry.city) {
          for (const loc of locales) {
            const translated = DICTIONARIES[loc].cities[entry.city];
            assert.ok(
              translated,
              `City '${entry.city}' from venue '${vKey}' must be translated in '${loc}'`
            );
          }
        }
        if (entry.prefecture) {
          for (const loc of locales) {
            const translated = DICTIONARIES[loc].prefectures[entry.prefecture];
            assert.ok(
              translated,
              `Prefecture '${entry.prefecture}' from venue '${vKey}' must be translated in '${loc}'`
            );
          }
        }
      }

      // Check specific canonical translations
      assert.strictEqual(DICTIONARIES["zh-TW"].cities["橫濱"], "橫濱");
      assert.strictEqual(DICTIONARIES["ja"].cities["橫濱"], "横浜");
      assert.strictEqual(DICTIONARIES["en"].cities["橫濱"], "Yokohama");
      assert.strictEqual(DICTIONARIES["ko"].cities["橫濱"], "요코하마");

      assert.strictEqual(DICTIONARIES["zh-TW"].prefectures["神奈川縣"], "神奈川縣");
      assert.strictEqual(DICTIONARIES["ja"].prefectures["神奈川縣"], "神奈川県");
      assert.strictEqual(DICTIONARIES["en"].prefectures["神奈川縣"], "Kanagawa");
      assert.strictEqual(DICTIONARIES["ko"].prefectures["神奈川縣"], "가나가와현");

      // Overseas: Taipei & Goyang
      assert.strictEqual(DICTIONARIES["en"].cities["台北"], "Taipei");
      assert.strictEqual(DICTIONARIES["en"].prefectures["台灣"], "Taiwan");
      assert.strictEqual(DICTIONARIES["en"].cities["高陽"], "Goyang");
      assert.strictEqual(DICTIONARIES["en"].prefectures["韓國"], "South Korea");

      // Special livestream
      assert.strictEqual(DICTIONARIES["en"].cities["線上直播"], "Livestream");
      assert.strictEqual(DICTIONARIES["ja"].cities["線上直播"], "配信ライブ");
      assert.strictEqual(DICTIONARIES["ko"].cities["線上直播"], "온라인 라이브");
    });

    it("preserves primary source venue integrity in data and slips without translating venue names", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const venuesPath = fs.existsSync(path.resolve(process.cwd(), "data", "venues.json"))
        ? path.resolve(process.cwd(), "data", "venues.json")
        : path.resolve(process.cwd(), "..", "data", "venues.json");
      const venuesRaw = JSON.parse(fs.readFileSync(venuesPath, "utf8"));

      // Verify data/venues.json values have string venue names rather than multi-lingual objects
      for (const [key, val] of Object.entries(venuesRaw)) {
        assert.strictEqual(typeof val.venue, "string", `venue for ${key} must remain a string primitive`);
        assert.strictEqual(typeof val.city, "string", `city for ${key} must remain a string primitive`);
        assert.strictEqual(typeof val.prefecture, "string", `prefecture for ${key} must remain a string primitive`);
      }
    });

    it("renders TourSlip with localized itinerary cities across all 4 locales", () => {
      const mockTourUnit = {
        title: "Arena Tour 2024 -Rejoice-",
        type: "巡演專場",
        templateSetlist: [
          { cue: "M1", item: { songId: "pretender" } },
        ],
        shows: [
          {
            id: "show-yokohama-1",
            date: "2024-09-28",
            time: "17:00 / 18:00",
            doors: "17:00",
            start: "18:00",
            venue: "橫濱Arena",
            city: "橫濱",
            prefecture: "神奈川縣",
            region: "關東",
            diff: [],
          },
          {
            id: "show-taipei-1",
            date: "2024-12-14",
            venue: "台北小巨蛋",
            city: "台北",
            prefecture: "台灣",
            region: "海外",
            diff: [],
          },
        ],
      };

      const mockUd = {
        unit: mockTourUnit,
        stats: {
          totalShows: 2,
          coreCount: 1,
          regularCount: 0,
          rotatingCount: 0,
          surpriseCount: 0,
          prefecturesCount: 2,
          citiesCount: 2,
        },
        templateTracks: [
          { cue: "M1", item: { songId: "pretender" }, rate: 100, isCore: true },
        ],
        rotatingTracks: [],
        surpriseTracks: [],
        interludeItems: [],
        itinerary: [
          {
            idx: 1,
            showIndex: 1,
            date: "2024-09-28",
            venue: "橫濱Arena",
            city: "橫濱",
            isFirst: true,
            isFinal: false,
            id: "show-yokohama-1",
          },
          {
            idx: 2,
            showIndex: 2,
            date: "2024-12-14",
            venue: "台北小巨蛋",
            city: "台北",
            isFirst: false,
            isFinal: true,
            id: "show-taipei-1",
          },
        ],
      };

      // English
      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(TourSlip, { tourUnitData: mockUd })
        )
      );
      assert.ok(htmlEn.includes("[Yokohama]"), "TourSlip in en must render [Yokohama]");
      assert.ok(htmlEn.includes("[Taipei]"), "TourSlip in en must render [Taipei]");
      assert.ok(htmlEn.includes("Yokohama Arena"), "TourSlip in en must render localized venue name (ADR-0110)");

      // Japanese
      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(TourSlip, { tourUnitData: mockUd })
        )
      );
      assert.ok(htmlJa.includes("[横浜]"), "TourSlip in ja must render [横浜]");
      assert.ok(htmlJa.includes("[台北]"), "TourSlip in ja must render [台北]");

      // Korean
      const htmlKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(TourSlip, { tourUnitData: mockUd })
        )
      );
      assert.ok(htmlKo.includes("[요코하마]"), "TourSlip in ko must render [요코하마]");
      assert.ok(htmlKo.includes("[타이베이]"), "TourSlip in ko must render [타이베이]");

      // Traditional Chinese
      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TourSlip, { tourUnitData: mockUd })
        )
      );
      assert.ok(htmlZh.includes("[橫濱]"), "TourSlip in zh-TW must render [橫濱]");
      assert.ok(htmlZh.includes("[台北]"), "TourSlip in zh-TW must render [台北]");
    });

    it("renders VenueSlip headline with localized prefecture and city across locales", () => {
      const mockShows = [
        {
          show: {
            id: "show-1",
            date: "2024-09-28",
            venue: "橫濱Arena",
            city: "橫濱",
            prefecture: "神奈川縣",
            region: "關東",
          },
          unit: { title: "Tour 2024" },
          resolvedItems: [],
        },
      ];

      const mockGlobalVenueShows = new Map([
        ["橫濱Arena", mockShows],
      ]);

      // English
      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(VenueSlip, {
            venueName: "橫濱Arena",
            globalVenueShows: mockGlobalVenueShows,
          })
        )
      );
      assert.ok(htmlEn.includes("Kanagawa · Yokohama"), "VenueSlip in en must display Kanagawa · Yokohama");
      assert.ok(htmlEn.includes("Yokohama Arena"), "VenueSlip in en must render localized venue name (ADR-0110)");

      // Japanese
      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(VenueSlip, {
            venueName: "橫濱Arena",
            globalVenueShows: mockGlobalVenueShows,
          })
        )
      );
      assert.ok(htmlJa.includes("神奈川県 · 横浜"), "VenueSlip in ja must display 神奈川県 · 横浜");

      // Korean
      const htmlKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(VenueSlip, {
            venueName: "橫濱Arena",
            globalVenueShows: mockGlobalVenueShows,
          })
        )
      );
      assert.ok(htmlKo.includes("가나가와현 · 요코하마"), "VenueSlip in ko must display 가나가와현 · 요코하마");

      // Traditional Chinese
      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(VenueSlip, {
            venueName: "橫濱Arena",
            globalVenueShows: mockGlobalVenueShows,
          })
        )
      );
      assert.ok(htmlZh.includes("神奈川縣 · 橫濱"), "VenueSlip in zh-TW must display 神奈川縣 · 橫濱");
    });

    it("verifies matchGeography performs zero-friction cross-lingual searches in SearchBox", () => {
      // 1. Direct unit verification of matchGeography
      assert.strictEqual(matchGeography("yokohama", "橫濱", "神奈川縣", "關東"), true);
      assert.strictEqual(matchGeography("横浜", "橫濱", "神奈川縣", "關東"), true);
      assert.strictEqual(matchGeography("kanagawa", "橫濱", "神奈川縣", "關東"), true);
      assert.strictEqual(matchGeography("taipei", "台北", "台灣", "海外"), true);
      assert.strictEqual(matchGeography("goyang", "高陽", "韓國", "海外"), true);
      assert.strictEqual(matchGeography("livestream", "線上直播", "", "其他"), true);
      assert.strictEqual(matchGeography("xyznonexistent", "橫濱", "神奈川縣", "關東"), false);

      // 2. Integration with SearchBox
      const mockVenues = [
        {
          name: "橫濱Arena",
          city: "橫濱",
          prefecture: "神奈川縣",
          region: "關東",
          shows: [{ id: "1" }],
        },
        {
          name: "台北小巨蛋",
          city: "台北",
          prefecture: "台灣",
          region: "海外",
          shows: [{ id: "2" }],
        },
      ];

      // Search "Yokohama" in SearchBox
      const htmlSearchEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Yokohama",
            setQ: () => {},
            allUsedSongs: [],
            allUnits: [],
            allVenues: mockVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlSearchEn.includes("Yokohama Arena"), "SearchBox must match and display Yokohama Arena when querying Yokohama");
      assert.ok(htmlSearchEn.includes("Yokohama"), "SearchBox venue candidate must display localized city 'Yokohama'");

      // Search "横浜" in SearchBox
      const htmlSearchJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "横浜",
            setQ: () => {},
            allUsedSongs: [],
            allUnits: [],
            allVenues: mockVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlSearchJa.includes("横浜アリーナ"), "SearchBox must match and display 横浜アリーナ when querying 横浜");
      assert.ok(htmlSearchJa.includes("横浜"), "SearchBox venue candidate must display localized city '横浜'");
    });

    it("safely falls back to raw city and prefecture strings when encountering unmapped entries", async () => {
      const { resolveTranslation } = await loadModule("/src/lib/i18n.jsx");
      const testDict = DICTIONARIES["en"];

      const unknownCity = "未知虛擬市";
      const fallbackCity = resolveTranslation(testDict, "cities." + unknownCity, unknownCity);
      assert.strictEqual(fallbackCity, unknownCity, "Unmapped city must fall back to original string");

      const unknownPref = "未知虛擬縣";
      const fallbackPref = resolveTranslation(testDict, "prefectures." + unknownPref, unknownPref);
      assert.strictEqual(fallbackPref, unknownPref, "Unmapped prefecture must fall back to original string");
    });

    it("renders ShowNavigator, VenueNavigator, and ShowMetadataBox with localized cities across all 4 locales", () => {
      // 1. ShowNavigator: show button with city "首爾" in Korean and English
      const mockUnitWithSeoul = {
        id: "tour-asia-2024",
        title: "Asia Tour 2024",
        shows: [
          {
            id: "show-seoul-1",
            date: "2024-08-08",
            venue: "Olympic Hall",
            city: "首爾",
            prefecture: "韓國",
            region: "海外",
          },
          {
            id: "show-seoul-2",
            date: "2024-08-09",
            venue: "Olympic Hall",
            city: "首爾",
            prefecture: "韓國",
            region: "海外",
          },
        ],
        full: new Map([
          ["show-seoul-1", [{ songId: "pretender" }]],
          ["show-seoul-2", [{ songId: "pretender" }]],
        ]),
      };

      const htmlShowNavKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(ShowNavigator, {
            selCategory: "巡演專場",
            selYear: "2024",
            selUnitId: "tour-asia-2024",
            selShow: "show-seoul-1",
            unitPage: 0,
            showPage: 0,
            unitsByCategory: { "巡演專場": [mockUnitWithSeoul] },
            categoryStats: {},
            availableYears: ["2024"],
            yearStats: new Map(),
            filteredUnits: [mockUnitWithSeoul],
            pagedUnits: [mockUnitWithSeoul],
            current: mockUnitWithSeoul,
            unitData: new Map([["tour-asia-2024", mockUnitWithSeoul]]),
            handleCategoryClick: () => {},
            handleSelectUnit: () => {},
            handleSelectShow: () => {},
          })
        )
      );
      assert.ok(htmlShowNavKo.includes("서울"), "ShowNavigator in ko must display '서울' for 08-08 show");
      assert.ok(!htmlShowNavKo.includes("首爾"), "ShowNavigator in ko must not display untranslated '首爾'");

      const htmlShowNavEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(ShowNavigator, {
            selCategory: "巡演專場",
            selYear: "2024",
            selUnitId: "tour-asia-2024",
            selShow: "show-seoul-1",
            unitPage: 0,
            showPage: 0,
            unitsByCategory: { "巡演專場": [mockUnitWithSeoul] },
            categoryStats: {},
            availableYears: ["2024"],
            yearStats: new Map(),
            filteredUnits: [mockUnitWithSeoul],
            pagedUnits: [mockUnitWithSeoul],
            current: mockUnitWithSeoul,
            unitData: new Map([["tour-asia-2024", mockUnitWithSeoul]]),
            handleCategoryClick: () => {},
            handleSelectUnit: () => {},
            handleSelectShow: () => {},
          })
        )
      );
      assert.ok(htmlShowNavEn.includes("Seoul"), "ShowNavigator in en must display 'Seoul' for 08-08 show");
      assert.ok(!htmlShowNavEn.includes("首爾"), "ShowNavigator in en must not display untranslated '首爾'");

      // 2. VenueNavigator: venue button for "台北小巨蛋" with city "台北"
      const mockTaipeiVenue = {
        name: "台北小巨蛋",
        city: "台北",
        prefecture: "台灣",
        region: "海外",
        shows: [{ id: "show-1" }, { id: "show-2" }],
      };

      const htmlVenueNavEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(VenueNavigator, {
            venueSortMode: "count",
            setVenueSortMode: () => {},
            selRegion: "海外",
            setSelRegion: () => {},
            selVenue: "台北小巨蛋",
            venuePage: 0,
            setVenuePage: () => {},
            allVenues: [mockTaipeiVenue],
            venuesSortedByCount: [mockTaipeiVenue],
            filteredVenues: [mockTaipeiVenue],
            pagedVenues: [mockTaipeiVenue],
            handleSelectVenue: () => {},
          })
        )
      );
      assert.ok(htmlVenueNavEn.includes("Taipei"), "VenueNavigator in en must display 'Taipei'");
      assert.ok(!htmlVenueNavEn.includes("（台北"), "VenueNavigator in en must not display untranslated '（台北'");

      const htmlVenueNavKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(VenueNavigator, {
            venueSortMode: "count",
            setVenueSortMode: () => {},
            selRegion: "海外",
            setSelRegion: () => {},
            selVenue: "台北小巨蛋",
            venuePage: 0,
            setVenuePage: () => {},
            allVenues: [mockTaipeiVenue],
            venuesSortedByCount: [mockTaipeiVenue],
            filteredVenues: [mockTaipeiVenue],
            pagedVenues: [mockTaipeiVenue],
            handleSelectVenue: () => {},
          })
        )
      );
      assert.ok(htmlVenueNavKo.includes("타이베이"), "VenueNavigator in ko must display '타이베이'");

      // 3. ShowMetadataBox: show ticket stub header for "台北小巨蛋" with city "台北"
      const mockShowTaipei = {
        id: "show-taipei-1",
        date: "2024-12-14",
        venue: "台北小巨蛋",
        city: "台北",
        prefecture: "台灣",
        region: "海外",
      };
      const mockPrevShow = {
        id: "show-seoul-1",
        date: "2024-08-08",
        venue: "Olympic Hall",
        city: "首爾",
      };
      const mockNextShow = {
        id: "show-yokohama-1",
        date: "2024-12-28",
        venue: "橫濱Arena",
        city: "橫濱",
      };

      const htmlMetaEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(ShowMetadataBox, {
            s: mockShowTaipei,
            songCount: 20,
            mainCount: 16,
            encCount: 4,
            showList: [mockPrevShow, mockShowTaipei, mockNextShow],
            currentIdx: 1,
            prevShow: mockPrevShow,
            nextShow: mockNextShow,
          })
        )
      );
      assert.ok(htmlMetaEn.includes("Taipei"), "ShowMetadataBox in en must display 'Taipei'");
      assert.ok(!htmlMetaEn.includes("（台北）"), "ShowMetadataBox in en must not display untranslated '（台北）'");
      assert.ok(htmlMetaEn.includes("Seoul"), "ShowMetadataBox in en must display 'Seoul' for prev show");
      assert.ok(htmlMetaEn.includes("Yokohama"), "ShowMetadataBox in en must display 'Yokohama' for next show");

      const htmlMetaKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(ShowMetadataBox, {
            s: mockShowTaipei,
            songCount: 20,
            mainCount: 16,
            encCount: 4,
            showList: [mockPrevShow, mockShowTaipei, mockNextShow],
            currentIdx: 1,
            prevShow: mockPrevShow,
            nextShow: mockNextShow,
          })
        )
      );
      assert.ok(htmlMetaKo.includes("타이베이"), "ShowMetadataBox in ko must display '타이베이'");
      assert.ok(!htmlMetaKo.includes("（台北）"), "ShowMetadataBox in ko must not display untranslated '（台北）'");
      assert.ok(htmlMetaKo.includes("서울"), "ShowMetadataBox in ko must display '서울' for prev show");
      assert.ok(htmlMetaKo.includes("요코하마"), "ShowMetadataBox in ko must display '요코하마' for next show");
    });
  });
