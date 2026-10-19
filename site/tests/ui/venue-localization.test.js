import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
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

describe("18. Official Venue Localization & Cross-Lingual Presentation (ADR-0110)", () => {
  let venuesMod;
  let localizeVenue;
  let getNativeVenue;
  let resolveVenueCanonical;
  let matchVenue;
  let domainMod;
  let formatShowVenueCity;
  let songHistoryMod;
  let venueHistoryMod;
  let i18nMod;
  let I18nProvider;
  let VenueNavigator;
  let ShowMetadataBox;
  let TourSlip;
  let VenueSlip;
  let SearchBox;

  before(async () => {
    venuesMod = await loadModule("/src/lib/locales/venues.js");
    localizeVenue = venuesMod.localizeVenue;
    getNativeVenue = venuesMod.getNativeVenue;
    resolveVenueCanonical = venuesMod.resolveVenueCanonical;
    matchVenue = venuesMod.matchVenue;

    domainMod = await loadModule("/src/lib/domain.js");
    formatShowVenueCity = domainMod.formatShowVenueCity;

    songHistoryMod = await loadModule("/src/lib/song-history-text.js");
    venueHistoryMod = await loadModule("/src/lib/venue-history-text.js");

    i18nMod = await loadModule("/src/lib/i18n.jsx");
    I18nProvider = i18nMod.I18nProvider;

    const vnMod = await loadModule("/src/components/navigators/VenueNavigator.jsx");
    VenueNavigator = vnMod.VenueNavigator;

    const smbMod = await loadModule("/src/components/slips/ShowMetadataBox.jsx");
    ShowMetadataBox = smbMod.ShowMetadataBox;

    const tsMod = await loadModule("/src/components/slips/TourSlip.jsx");
    TourSlip = tsMod.TourSlip;

    const vsMod = await loadModule("/src/components/slips/VenueSlip.jsx");
    VenueSlip = vsMod.VenueSlip;

    const sbMod = await loadModule("/src/components/SearchBox.jsx");
    SearchBox = sbMod.default || sbMod.SearchBox;
  });

  describe("Subtest 1: Pure Function Localization & Graceful Fallback (venues.js)", () => {
    it("localizes overseas venue '台北小巨蛋' across all 4 locales", () => {
      assert.strictEqual(localizeVenue("台北小巨蛋", "zh-TW"), "台北小巨蛋");
      assert.strictEqual(localizeVenue("台北小巨蛋", "ja"), "台北アリーナ");
      assert.strictEqual(localizeVenue("台北小巨蛋", "en"), "Taipei Arena");
      assert.strictEqual(localizeVenue("台北小巨蛋", "ko"), "타이베이 아레나");
    });

    it("localizes Japanese arena '橫濱Arena' across all 4 locales", () => {
      assert.strictEqual(localizeVenue("橫濱Arena", "zh-TW"), "橫濱Arena");
      assert.strictEqual(localizeVenue("橫濱Arena", "ja"), "横浜アリーナ");
      assert.strictEqual(localizeVenue("橫濱Arena", "en"), "Yokohama Arena");
      assert.strictEqual(localizeVenue("橫濱Arena", "ko"), "요코하마 아레나");
    });

    it("restores authentic Japanese kanji for '愛媛縣縣民文化會館' in ja and en", () => {
      assert.strictEqual(localizeVenue("愛媛縣縣民文化會館", "zh-TW"), "愛媛縣縣民文化會館");
      assert.strictEqual(localizeVenue("愛媛縣縣民文化會館", "ja"), "愛媛県県民文化会館");
      assert.strictEqual(localizeVenue("愛媛縣縣民文化會館", "en"), "Ehime Prefectural Cultural Center");
      // ADR-0111: In Korean without Korean translation, must fall back to native Japanese, NOT Traditional Chinese
      assert.strictEqual(localizeVenue("愛媛縣縣民文化會館", "ko"), "愛媛県県民文化会館");
    });

    it("verifies getNativeVenue returns authentic native names (ADR-0111)", () => {
      assert.strictEqual(getNativeVenue("愛媛縣縣民文化會館"), "愛媛県県民文化会館");
      assert.strictEqual(getNativeVenue("橫濱Arena"), "横浜アリーナ");
      assert.strictEqual(getNativeVenue("台北小巨蛋"), "台北小巨蛋");
      assert.strictEqual(getNativeVenue("米子市公會堂"), "米子市公会堂");
    });

    it("resolves cross-lingual inbound route strings to canonical key (ADR-0111)", () => {
      assert.strictEqual(resolveVenueCanonical("横浜アリーナ"), "橫濱Arena");
      assert.strictEqual(resolveVenueCanonical("Yokohama Arena"), "橫濱Arena");
      assert.strictEqual(resolveVenueCanonical("yokohama arena"), "橫濱Arena");
      assert.strictEqual(resolveVenueCanonical("橫濱Arena"), "橫濱Arena");
      assert.strictEqual(resolveVenueCanonical("台北アリーナ"), "台北小巨蛋");
      assert.strictEqual(resolveVenueCanonical("Taipei Arena"), "台北小巨蛋");
      assert.strictEqual(resolveVenueCanonical("타이베이 아레나"), "台北小巨蛋");
      assert.strictEqual(resolveVenueCanonical("NonexistentVenue"), null);
    });

    it("gracefully falls back to authentic native venue string when no official localization exists", () => {
      const indieVenue = "松江 canova (地下空間)";
      assert.strictEqual(localizeVenue(indieVenue, "en"), indieVenue);
      assert.strictEqual(localizeVenue(indieVenue, "ko"), indieVenue);
      assert.strictEqual(localizeVenue(null, "en"), "");
      assert.strictEqual(localizeVenue(undefined, "en"), "");
    });

    it("matches search needle across all language variants in matchVenue", () => {
      assert.ok(matchVenue("Taipei Arena", "台北小巨蛋"));
      assert.ok(matchVenue("台北アリーナ", "台北小巨蛋"));
      assert.ok(matchVenue("타이베이 아레나", "台北小巨蛋"));
      assert.ok(matchVenue("taipei", "台北小巨蛋"));

      assert.ok(matchVenue("Yokohama Arena", "橫濱Arena"));
      assert.ok(matchVenue("横浜アリーナ", "橫濱Arena"));
      assert.ok(matchVenue("요코하마", "橫濱Arena"));

      assert.ok(matchVenue("Budokan", "日本武道館"));
      assert.ok(matchVenue("Nippon Budokan", "日本武道館"));
      assert.ok(matchVenue("武道館", "日本武道館"));

      assert.ok(!matchVenue("NonexistentVenueQuery", "日本武道館"));
    });
  });

  describe("Subtest 2: Domain Formatting & Export Sync (domain.js & lib/*-text.js)", () => {
    it("formats show venue and city with localized venue in formatShowVenueCity", () => {
      const mockShow = {
        venue: "台北小巨蛋",
        city: "台北",
      };
      const tMock = (k, fb) => (k === "cities.台北" ? "Taipei" : fb);
      const enResult = formatShowVenueCity(mockShow, tMock, "en");
      assert.strictEqual(enResult, "Taipei Arena (Taipei)");

      const tJaMock = (k, fb) => (k === "cities.台北" ? "台北" : fb);
      const jaResult = formatShowVenueCity(mockShow, tJaMock, "ja");
      assert.strictEqual(jaResult, "台北アリーナ（台北）");
    });

    it("outputs localized venue names in buildVenueHistoryText", () => {
      const enText = venueHistoryMod.buildVenueHistoryText({
        venueName: "台北小巨蛋",
        venuePref: "Taiwan",
        venueCity: "Taipei",
        showsCount: 2,
        topSongs: [],
        sortedShows: [],
        locale: "en",
      });
      assert.ok(enText.some((line) => line.includes("Taipei Arena")), "enText must contain 'Taipei Arena'");

      const jaText = venueHistoryMod.buildVenueHistoryText({
        venueName: "橫濱Arena",
        venuePref: "神奈川県",
        venueCity: "横浜",
        showsCount: 6,
        topSongs: [],
        sortedShows: [],
        locale: "ja",
      });
      assert.ok(jaText.some((line) => line.includes("横浜アリーナ")), "jaText must contain '横浜アリーナ'");
    });

    it("outputs localized venue names in buildSongHistoryText", () => {
      const mockShow = {
        date: "2024-12-14",
        venue: "台北小巨蛋",
      };
      const enLines = songHistoryMod.buildSongHistoryText({
        songTitle: "Pretender",
        appearancesCount: 1,
        firstShow: mockShow,
        firstApp: { unitTitle: "Rejoice Tour" },
        latestShow: mockShow,
        latestApp: { unitTitle: "Rejoice Tour" },
        specialVersionCounts: {},
        locale: "en",
      });
      assert.ok(enLines.some((l) => l.includes("Taipei Arena")), "en song history must contain 'Taipei Arena'");
    });
  });

  describe("Subtest 3: SSR Component Localization (VenueNavigator, ShowMetadataBox, TourSlip, VenueSlip, SearchBox)", () => {
    it("renders VenueNavigator buttons with localized venue names across locales", () => {
      const mockVenue = {
        name: "台北小巨蛋",
        city: "台北",
        prefecture: "台灣",
        region: "海外（台灣 / 韓國 / 東南亞）",
        shows: [{}],
      };

      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(VenueNavigator, {
            allVenues: [mockVenue],
            venuesSortedByCount: [mockVenue],
            filteredVenues: [mockVenue],
            pagedVenues: [mockVenue],
            venueSortMode: "count",
            venuePage: 0,
          })
        )
      );
      assert.ok(htmlEn.includes("Taipei Arena"), "VenueNavigator in en must render 'Taipei Arena'");

      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(VenueNavigator, {
            allVenues: [mockVenue],
            venuesSortedByCount: [mockVenue],
            filteredVenues: [mockVenue],
            pagedVenues: [mockVenue],
            venueSortMode: "count",
            venuePage: 0,
          })
        )
      );
      assert.ok(htmlJa.includes("台北アリーナ"), "VenueNavigator in ja must render '台北アリーナ'");
    });

    it("renders ShowMetadataBox with localized venue name", () => {
      const mockShow = {
        id: "show-1",
        date: "2024-12-14",
        venue: "台北小巨蛋",
        city: "台北",
        prefecture: "台灣",
      };

      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(ShowMetadataBox, {
            s: mockShow,
            unit: { title: "Rejoice Tour", type: "巡演專場" },
          })
        )
      );
      assert.ok(htmlEn.includes("Taipei Arena"), "ShowMetadataBox in en must render 'Taipei Arena'");

      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(ShowMetadataBox, {
            s: mockShow,
            unit: { title: "Rejoice Tour", type: "巡演專場" },
          })
        )
      );
      assert.ok(htmlJa.includes("台北アリーナ"), "ShowMetadataBox in ja must render '台北アリーナ'");
    });

    it("renders TourSlip stops with localized venue names", () => {
      const mockTour = {
        title: "Arena Tour 2024 -Rejoice-",
        type: "巡演專場",
        templateSetlist: [],
        shows: [
          {
            id: "show-yokohama",
            date: "2024-09-28",
            venue: "橫濱Arena",
            city: "橫濱",
            prefecture: "神奈川縣",
            diff: [],
          },
          {
            id: "show-taipei",
            date: "2024-12-14",
            venue: "台北小巨蛋",
            city: "台北",
            prefecture: "台灣",
            diff: [],
          },
        ],
      };

      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(TourSlip, { tourUnitData: mockTour })
        )
      );
      assert.ok(htmlEn.includes("Yokohama Arena"), "TourSlip in en must render 'Yokohama Arena'");
      assert.ok(htmlEn.includes("Taipei Arena"), "TourSlip in en must render 'Taipei Arena'");

      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(TourSlip, { tourUnitData: mockTour })
        )
      );
      assert.ok(htmlJa.includes("横浜アリーナ"), "TourSlip in ja must render '横浜アリーナ'");
      assert.ok(htmlJa.includes("台北アリーナ"), "TourSlip in ja must render '台北アリーナ'");
    });

    it("renders VenueSlip header with localized venue name", () => {
      const mockShows = [
        {
          showId: "show-1",
          unitId: "rejoice-tour",
          unitTitle: "Rejoice Tour",
          unitType: "巡演專場",
          show: {
            id: "show-1",
            date: "2024-12-14",
            venue: "台北小巨蛋",
            city: "台北",
            prefecture: "台灣",
          },
          unit: { title: "Rejoice Tour" },
          resolvedItems: [],
        },
      ];

      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(VenueSlip, {
            venueName: "台北小巨蛋",
            globalVenueShows: new Map([["台北小巨蛋", mockShows]]),
          })
        )
      );
      assert.ok(htmlEn.includes("Taipei Arena"), "VenueSlip in en must render 'Taipei Arena'");
      assert.ok(htmlEn.includes("data-testid=\"venue-native-subtitle\""), "VenueSlip in en must render native subtitle");
      assert.ok(htmlEn.includes("Native: 台北小巨蛋"), "VenueSlip in en must display 'Native: 台北小巨蛋'");

      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(VenueSlip, {
            venueName: "台北小巨蛋",
            globalVenueShows: new Map([["台北小巨蛋", mockShows]]),
          })
        )
      );
      assert.ok(htmlJa.includes("台北アリーナ"), "VenueSlip in ja must render '台北アリーナ'");

      // ADR-0111: Test Japanese arena with authentic native subtitle & map queries
      const mockYokohamaShows = [
        {
          unitId: "arena-tour",
          unitTitle: "Arena Tour",
          unitType: "巡演專場",
          show: {
            id: "show-yokohama",
            date: "2024-11-20",
            venue: "橫濱Arena",
            city: "橫濱",
            prefecture: "神奈川縣",
          },
          unit: { title: "Arena Tour" },
          resolvedItems: [],
        },
      ];

      const htmlYokohamaEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(VenueSlip, {
            venueName: "橫濱Arena",
            globalVenueShows: new Map([["橫濱Arena", mockYokohamaShows]]),
          })
        )
      );
      assert.ok(htmlYokohamaEn.includes("Yokohama Arena"), "VenueSlip in en must render 'Yokohama Arena'");
      assert.ok(htmlYokohamaEn.includes("Native: 横浜アリーナ"), "VenueSlip in en must display 'Native: 横浜アリーナ'");
      assert.ok(htmlYokohamaEn.includes(encodeURIComponent("横浜アリーナ")), "Google Maps & LiveFans query must use native name '横浜アリーナ'");

      const htmlYokohamaZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(VenueSlip, {
            venueName: "橫濱Arena",
            globalVenueShows: new Map([["橫濱Arena", mockYokohamaShows]]),
          })
        )
      );
      assert.ok(htmlYokohamaZh.includes("橫濱Arena"), "VenueSlip in zh-TW must render '橫濱Arena'");
      assert.ok(htmlYokohamaZh.includes("原名：横浜アリーナ"), "VenueSlip in zh-TW must display '原名：横浜アリーナ'");

      // When localized name equals native name (e.g. 台北小巨蛋 in zh-TW), no redundant subtitle
      const htmlTaipeiZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(VenueSlip, {
            venueName: "台北小巨蛋",
            globalVenueShows: new Map([["台北小巨蛋", mockShows]]),
          })
        )
      );
      assert.ok(!htmlTaipeiZh.includes("data-testid=\"venue-native-subtitle\""), "VenueSlip must not render subtitle when localized equals native");
    });

    it("matches cross-lingual venue queries in SearchBox and renders localized venue name", () => {
      const mockVenues = [
        {
          name: "台北小巨蛋",
          city: "台北",
          prefecture: "台灣",
          region: "海外（台灣 / 韓國 / 東南亞）",
          shows: [{}],
        },
      ];

      // Query by English name in en locale
      const htmlSearchEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Taipei Arena",
            setQ: () => {},
            allVenues: mockVenues,
            allUsedSongs: [],
            allUnits: [],
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlSearchEn.includes("Taipei Arena"), "SearchBox must find and display 'Taipei Arena' in en");

      // Query by Japanese name in ja locale
      const htmlSearchJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "台北アリーナ",
            setQ: () => {},
            allVenues: mockVenues,
            allUsedSongs: [],
            allUnits: [],
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlSearchJa.includes("台北アリーナ"), "SearchBox must find and display '台北アリーナ' in ja");
    });
  });
});
