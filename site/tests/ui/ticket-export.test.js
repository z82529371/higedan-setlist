import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { resolve, assignCues, encoreStartOrderOf } from "../../src/lib/resolve.js";
import { loadModule, getReactAndRenderer, withHash } from "../helpers/vite-server.js";

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

describe("16. Localized Commemorative Ticket Image Export (Issue #19)", () => {
    it("generates cache key with locale discriminator to prevent cross-language cache collisions", async () => {
      const { getMemorialImageKey } = await loadModule("/src/components/MemorialCardModal.jsx");
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
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { MemorialCardModal } = await loadModule("/src/components/MemorialCardModal.jsx");

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
      const { MemorialCardModal } = await loadModule("/src/components/MemorialCardModal.jsx");

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
      const { resolveTranslation } = await loadModule("/src/lib/i18n.jsx");
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
      const { formatShowSongBreakdown } = await loadModule("/src/lib/domain.js");
      assert.ok(typeof formatShowSongBreakdown === "function", "formatShowSongBreakdown must be exported");

      assert.strictEqual(formatShowSongBreakdown(20, 17, 3, "ja"), "全 20 曲（本編 17 · アンコール 3）");
      assert.strictEqual(formatShowSongBreakdown(20, 17, 3, "en"), "Total 20 Songs (Main 17 · Encore 3)");
      assert.strictEqual(formatShowSongBreakdown(20, 17, 3, "ko"), "총 20곡 (본편 17 · 앙코르 3)");
      assert.strictEqual(formatShowSongBreakdown(20, 17, 3, "zh-TW"), "共 20 首（本篇 17 · 安可 3）");

      // No songs
      assert.strictEqual(formatShowSongBreakdown(0, 0, 0, "ja"), "");
    });

    it("formats non-tour formatShowOrderText with localized category in MemorialCardModal", async () => {
      const { MemorialCardModal } = await loadModule("/src/components/MemorialCardModal.jsx");
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

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
      const SearchBoxModule = await loadModule("/src/components/SearchBox.jsx");
      const SearchBox = SearchBoxModule.default;
      const { I18nProvider, DICTIONARIES } = await loadModule("/src/lib/i18n.jsx");

      // Rule: cross-locale assertions must resolve expected copy from
      // DICTIONARIES, never hardcode one locale's strings. Hardcoded copy
      // goes stale on the next translation pass and locks the bug in
      // (regression: this test once asserted zh-TW copy under ja/en renders).

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
      assert.ok(htmlJa.includes(DICTIONARIES.ja.search.groupShows), "Must display localized show-date section for taxonomy search 'フェス'");
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
      assert.ok(htmlEn.includes(DICTIONARIES.en.search.groupShows), "Must display localized show-date section for taxonomy search 'Festival'");
      assert.ok(htmlEn.includes("Day 1 Stage") || htmlEn.includes("2024-08-01"), "Must match individual shows when searching taxonomy keyword 'Festival'");
    });

    it("verifies getVenueRegion canonical output without speculative city checks", async () => {
      const { getVenueRegion } = await loadModule("/src/lib/domain.js");
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

    it("verifies complete slip and panel localization and dictionary symmetry across all 4 locales", async () => {
      const { DICTIONARIES, I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ShowSlipPanels } = await loadModule("/src/components/slips/ShowSlipPanels.jsx");

      const requiredSongKeys = [
        "coreStaple", "mainstayTrack", "rareGem", "phantomSpecial", "activeLive",
        "dormantRecent", "encoreStaple", "fullAttendanceBadge", "rotationBadge",
        "collapseHistory", "moreHistory", "onlySpecialVersions",
      ];
      const requiredVenueKeys = [
        "hostedShowsCount", "frequentTracks", "debutShow", "yearlyFreqDistribution",
        "spanningYears", "viewSetlist", "festivalsOutdoor", "campusStage",
        "livehouseHall", "collapseRecords", "moreRecords", "noShowsRecorded",
      ];
      const requiredPanelKeys = [
        "verifiedSources", "sourceRecord", "officialSiteRecord", "xRecord",
        "livefansRecord", "wikipediaRecord", "collapseTools", "moreTools",
        "badgeLegend", "albumBreakdown", "showComparison", "albumCompositionTitle",
        "legendPremiere", "legendUnreleased", "legendRequest", "legendSolo",
        "songUnit", "trackDiff", "diffWithPrevious", "diffAdded", "diffRemoved",
        "anyShowCompareTitle", "compareTarget", "compareIdentical", "thisShowExclusive",
        "otherShowExclusive", "none", "commonTracks",
      ];
      const requiredCommonKeys = [
        "expand", "collapse", "expandList", "collapseList", "expandAll", "collapseAll",
        "yearDistribution", "yearlyFreqDistribution",
      ];

      for (const [lang, dict] of Object.entries(DICTIONARIES)) {
        assert.ok(dict.slips, `Dictionary ${lang} must contain slips namespace`);
        for (const k of requiredSongKeys) {
          assert.ok(dict.slips.song?.[k], `Dictionary ${lang} missing slips.song.${k}`);
        }
        for (const k of requiredVenueKeys) {
          assert.ok(dict.slips.venue?.[k], `Dictionary ${lang} missing slips.venue.${k}`);
        }
        for (const k of requiredPanelKeys) {
          assert.ok(dict.slips.panels?.[k], `Dictionary ${lang} missing slips.panels.${k}`);
        }
        for (const k of requiredCommonKeys) {
          assert.ok(dict.slips.common?.[k], `Dictionary ${lang} missing slips.common.${k}`);
        }
      }

      // SSR Render ShowSlipPanels across 4 locales
      const renderPanels = (loc) =>
        renderToStaticMarkup(
          React.createElement(
            I18nProvider,
            { initialLocale: loc },
            React.createElement(ShowSlipPanels, {
              showLegend: true,
              showDiff: false,
              setlistDiff: null,
              prevShow: null,
              showAnalysis: true,
              albumBreakdown: [["Rejoice", 10]],
              mainCount: 8,
              encCount: 2,
              showCompare: false,
              showList: [],
              showId: "test",
              activeCompareId: "",
              setCompareShowId: () => {},
              customCompareDiff: null,
            })
          )
        );

      const htmlZh = renderPanels("zh-TW");
      assert.ok(htmlZh.includes("自彈自唱"), "zh-TW ShowSlipPanels must render 自彈自唱");
      assert.ok(htmlZh.includes("現場點歌"), "zh-TW ShowSlipPanels must render 現場點歌");
      assert.ok(htmlZh.includes("演出曲目專輯構成："), "zh-TW ShowSlipPanels must render album breakdown title");

      const htmlJa = renderPanels("ja");
      assert.ok(htmlJa.includes("弾き語り"), "ja ShowSlipPanels must render 弾き語り");
      assert.ok(htmlJa.includes("リクエスト曲"), "ja ShowSlipPanels must render リクエスト曲");
      assert.ok(htmlJa.includes("演奏曲のアルバム構成："), "ja ShowSlipPanels must render album breakdown title in ja");

      const htmlEn = renderPanels("en");
      assert.ok(htmlEn.includes("Satoshi Solo Piano"), "en ShowSlipPanels must render Satoshi Solo Piano");
      assert.ok(htmlEn.includes("Audience Request"), "en ShowSlipPanels must render Audience Request");
      assert.ok(htmlEn.includes("Setlist Album Breakdown:"), "en ShowSlipPanels must render album breakdown title in en");
      const htmlKo = renderPanels("ko");
      assert.ok(htmlKo.includes("단독 피아노 연주"), "ko ShowSlipPanels must render 단독 피아노 연주");
      assert.ok(htmlKo.includes("현장 신청곡"), "ko ShowSlipPanels must render 현장 신청곡");
      assert.ok(htmlKo.includes("연주곡 앨범 구성:"), "ko ShowSlipPanels must render album breakdown title in ko");
    });

    it("verifies App architecture wraps AppContent with I18nProvider for reactive localization", async () => {
      const appMod = await loadModule("/src/App.jsx");
      assert.ok(appMod.default, "App.jsx must export default App");
      assert.ok(appMod.AppContent, "App.jsx must export AppContent as inner component wrapped by I18nProvider");

      await withHash("#/show/1672276", async () => {
        const expectedLabels = {
          "zh-TW": "確認套用",
          ja: "適用を確定",
          en: "Apply",
          ko: "적용 확정",
        };

        for (const [loc, expectedLabel] of Object.entries(expectedLabels)) {
          let capturedRoute = null;
          const html = renderToStaticMarkup(
            React.createElement(appMod.default, {
              initialLocale: loc,
              probeRoute: (r) => {
                capturedRoute = r;
              },
            })
          );
          assert.ok(html.includes("Official髭男dism"), `App in ${loc} must render brand`);
          assert.ok(capturedRoute, `App in ${loc} must capture routeState via probeRoute`);
          assert.strictEqual(
            capturedRoute.confirmButtonLabel,
            expectedLabel,
            `App confirmButtonLabel in ${loc} must be '${expectedLabel}', got '${capturedRoute.confirmButtonLabel}'`
          );

          // Verify appendLang retains active locale across route transitions
          const showTarget = capturedRoute.appendLang("#/show/1672276");
          if (loc === "zh-TW") {
            assert.strictEqual(showTarget, "#/show/1672276", "Default locale zh-TW should not append ?lang=");
          } else {
            assert.strictEqual(showTarget, `#/show/1672276?lang=${loc}`, `${loc} must append ?lang=${loc}`);
          }
        }
      });
    });

    it("renders custom seat, notes, stamp, and privacy controls in MemorialCardModal (Issue #36)", async () => {
      const { MemorialCardModal } = await loadModule("/src/components/MemorialCardModal.jsx");
      const { MemoryStorageAdapter, recordAttendance } = await loadModule("/src/lib/ticket-book.js");
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

      const storage = new MemoryStorageAdapter();
      const mockShow = {
        id: "show-k-arena",
        date: "2024-11-12",
        venue: "K-Arena Yokohama",
        city: "橫濱",
      };
      const mockUnit = {
        id: "rejoice-tour",
        title: "Arena Tour 2024 -Rejoice-",
        isTour: true,
        shows: [mockShow],
      };

      // 1. Pre-record attendance with seat, notes, stampId
      recordAttendance(
        "show-k-arena",
        {
          date: "2024-11-12",
          seat: "Arena A Block Row 12 Seat 34",
          notes: "Incredible live rendition of Subtitle and Pretender!",
          stampId: "stamp-rejoice",
          includeSeat: true,
          includeNotes: true,
        },
        storage
      );

      // 2. Render MemorialCardModal with storage
      const htmlCustom = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(MemorialCardModal, {
            isOpen: true,
            onClose: () => {},
            show: mockShow,
            unit: mockUnit,
            main: [{ cue: "M1", item: { songId: "pretender" } }],
            enc: [],
            storage,
            initialCustomizerOpen: true,
          })
        )
      );

      // Verify custom inputs exist in drawer
      assert.ok(htmlCustom.includes('data-testid="memorial-seat-input"'), "Seat input must be rendered");
      assert.ok(htmlCustom.includes('data-testid="memorial-notes-input"'), "Notes input must be rendered");
      assert.ok(!htmlCustom.includes('data-testid="memorial-stamp-picker"'), "Stamp picker should not be rendered (single default stamp)");
      assert.ok(htmlCustom.includes('data-testid="memorial-include-seat-toggle"'), "Include seat toggle must be rendered");
      assert.ok(htmlCustom.includes('data-testid="memorial-include-notes-toggle"'), "Include notes toggle must be rendered");
      assert.ok(!htmlCustom.includes('data-testid="memorial-download-btn"'), "Download PNG button should not be rendered (native save)");

      // Verify ticket elements rendered on card
      assert.ok(htmlCustom.includes('data-testid="ticket-seat-badge"'), "Seat badge must be rendered on ticket");
      assert.ok(htmlCustom.includes("Arena A Block Row 12 Seat 34"), "Seat value must be rendered in ticket");
      assert.ok(htmlCustom.includes('data-testid="ticket-notes-memo"'), "Notes memo must be rendered on ticket");
      assert.ok(htmlCustom.includes("Incredible live rendition of Subtitle and Pretender!"), "Notes content must be rendered");
      assert.ok(htmlCustom.includes('data-testid="ticket-stamp"'), "Custom stamp must be rendered");
      assert.ok(htmlCustom.includes('data-stamp-id="default"'), "Stamp id must match default stamp");
      assert.ok(htmlCustom.includes("現場") || htmlCustom.includes("LIVE"), "Default stamp text must be rendered");
    });

    it("respects privacy controls by omitting seat or notes when toggled off (Issue #36)", async () => {
      const { MemorialCardModal } = await loadModule("/src/components/MemorialCardModal.jsx");
      const { MemoryStorageAdapter, recordAttendance } = await loadModule("/src/lib/ticket-book.js");
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

      const storage = new MemoryStorageAdapter();
      const mockShow = {
        id: "show-privacy",
        date: "2024-11-13",
        venue: "K-Arena Yokohama",
        city: "橫濱",
      };
      const mockUnit = {
        id: "rejoice-tour",
        title: "Arena Tour 2024 -Rejoice-",
        isTour: true,
        shows: [mockShow],
      };

      // Pre-record with includeSeat: false and includeNotes: false
      recordAttendance(
        "show-privacy",
        {
          date: "2024-11-13",
          seat: "Confidential VIP Seat 1",
          notes: "Private personal memo",
          stampId: "stamp-attended",
          includeSeat: false,
          includeNotes: false,
        },
        storage
      );

      const htmlPrivacy = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(MemorialCardModal, {
            isOpen: true,
            onClose: () => {},
            show: mockShow,
            unit: mockUnit,
            main: [{ cue: "M1", item: { songId: "pretender" } }],
            enc: [],
            storage,
            initialCustomizerOpen: true,
          })
        )
      );

      // Card must NOT contain seat badge or notes memo
      assert.ok(!htmlPrivacy.includes('data-testid="ticket-seat-badge"'), "Seat badge must be omitted when includeSeat is false");
      assert.ok(!htmlPrivacy.includes('data-testid="ticket-notes-memo"'), "Notes memo must be omitted when includeNotes is false");

      // But drawer controls still retain the values for editing
      assert.ok(htmlPrivacy.includes('value="Confidential VIP Seat 1"'), "Drawer seat input retains value");
      assert.ok(htmlPrivacy.includes("Private personal memo"), "Drawer notes textarea retains value");

      // Stamp is still rendered with default id
      assert.ok(htmlPrivacy.includes('data-testid="ticket-stamp"'), "Stamp is rendered");
      assert.ok(htmlPrivacy.includes('data-stamp-id="default"'), "Stamp id matches default canonical stamp");
    });

    it("renders clean one-click attendance on ShowSlip without inline sub-panel when attended", async () => {
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { MemoryStorageAdapter, recordAttendance } = await loadModule("/src/lib/ticket-book.js");
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

      const storage = new MemoryStorageAdapter();
      const showId = "show-slip-36";
      const mockShow = {
        id: showId,
        date: "2024-11-20",
        venue: "Budokan",
        city: "東京",
      };
      const mockUnit = {
        id: "budokan-tour",
        title: "Budokan Special",
        isTour: true,
        shows: [mockShow],
      };
      const mockUd = {
        unit: mockUnit,
        full: new Map([[showId, [{ songId: "pretender", cue: "M1" }]]]),
        isTour: true,
      };

      // 1. When not attended: no attendance box, button shows unattended
      const htmlUnattended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, {
            ud: mockUd,
            showId,
            storage,
          })
        )
      );
      assert.ok(!htmlUnattended.includes('data-testid="showslip-attendance-box"'), "Attendance box should not render when unattended");
      assert.ok(htmlUnattended.includes('data-testid="ticket-book-toggle-btn"'), "Ticket book toggle button exists");
      assert.ok(htmlUnattended.includes('data-attended="false"'), "Button state indicates unattended");
      assert.ok(htmlUnattended.includes('data-testid="generate-memorial-card-btn"'), "Generate memorial card button exists");

      // 2. When attended: clean button state toggle, no pop-up / inline sub-panel
      recordAttendance(
        showId,
        {
          date: "2024-11-20",
          seat: "Arena 1F Row 3",
          notes: "Unbelievable encore performance!",
          stampId: "default",
        },
        storage
      );

      const htmlAttended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, {
            ud: mockUd,
            showId,
            storage,
          })
        )
      );
      assert.ok(!htmlAttended.includes('data-testid="showslip-attendance-box"'), "Attendance box must NOT render when attended (one-click)");
      assert.ok(htmlAttended.includes('data-testid="ticket-book-toggle-btn"'), "Ticket book toggle button exists");
      assert.ok(htmlAttended.includes('data-attended="true"'), "Button state indicates attended");
      assert.ok(htmlAttended.includes('data-testid="generate-memorial-card-btn"'), "Memorial card button remains available");
    });
  });

