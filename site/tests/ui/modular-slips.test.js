import { describe, it } from "node:test";
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

describe("23. Modular Slips & Crowdsourced Setlist Quest (#45, #40)", () => {
  describe("Subtest 1: Pure Function Mailto Builders (lib/feedback.js)", () => {
    it("builds valid mailto URLs with encoded subject and structured body across locales", async () => {
      const {
        ARCHIVE_FEEDBACK_EMAIL,
        buildSetlistSubject,
        buildSetlistBody,
        buildSetlistMailto,
        buildTimeSubject,
        buildTimeBody,
        buildTimeMailto,
      } = await loadModule("/src/lib/feedback.js");

      assert.strictEqual(ARCHIVE_FEEDBACK_EMAIL, "hgdnlive@gmail.com");

      const mockShow = {
        id: "2012-07-07-matsue-aztic-canova",
        date: "2012-07-07",
        venue: "松江 AZTiC canova",
      };
      const unitTitle = "第7回 松江だんだん祭り";

      // 1. Setlist Subject Format: [Official髭男dism 現場情報] YYYY-MM-DD 活動名稱 @ 場館
      const subjectZh = buildSetlistSubject({ show: mockShow, unitTitle, locale: "zh-TW" });
      assert.strictEqual(
        subjectZh,
        "[Official髭男dism 現場情報] 2012-07-07 第7回 松江だんだん祭り @ 松江 AZTiC canova"
      );

      const subjectJa = buildSetlistSubject({ show: mockShow, unitTitle, locale: "ja" });
      assert.strictEqual(
        subjectJa,
        "[Official髭男dism 現場情報] 2012-07-07 第7回 松江だんだん祭り @ 松江 AZTiC canova"
      );

      // 2. Setlist Body Structure across 4 locales
      const bodyZh = buildSetlistBody({ show: mockShow, unitTitle, locale: "zh-TW" });
      assert.ok(bodyZh.includes(mockShow.id), "zh-TW body must include show ID");
      assert.ok(bodyZh.includes("2012-07-07"), "zh-TW body must include date");
      assert.ok(bodyZh.includes("第7回 松江だんだん祭り"), "zh-TW body must include unit title");
      assert.ok(bodyZh.includes("松江 AZTiC canova"), "zh-TW body must include venue");
      assert.ok(bodyZh.includes("1. "), "zh-TW body must provide main setlist placeholders");
      assert.ok(bodyZh.includes("EN1. "), "zh-TW body must provide encore placeholders");
      assert.ok(bodyZh.includes("Flyer"), "zh-TW body must mention flyer/ticket stub attachments");

      const bodyJa = buildSetlistBody({ show: mockShow, unitTitle, locale: "ja" });
      assert.ok(bodyJa.includes(mockShow.id), "ja body must include show ID");
      assert.ok(bodyJa.includes("【セットリスト (Setlist)】"), "ja body must include Japanese setlist section");
      assert.ok(bodyJa.includes("フライヤー"), "ja body must mention flyers in Japanese");

      const bodyEn = buildSetlistBody({ show: mockShow, unitTitle, locale: "en" });
      assert.ok(bodyEn.includes(mockShow.id), "en body must include show ID");
      assert.ok(bodyEn.includes("[Setlist]"), "en body must include English setlist section");
      assert.ok(bodyEn.includes("ticket stubs"), "en body must mention ticket stubs in English");

      const bodyKo = buildSetlistBody({ show: mockShow, unitTitle, locale: "ko" });
      assert.ok(bodyKo.includes(mockShow.id), "ko body must include show ID");
      assert.ok(bodyKo.includes("【셋리스트 (Setlist)】"), "ko body must include Korean setlist section");
      assert.ok(bodyKo.includes("티켓 부표"), "ko body must mention ticket stubs in Korean");

      // 3. Complete Mailto URL Construction
      const mailtoUrl = buildSetlistMailto({ show: mockShow, unitTitle, locale: "zh-TW" });
      assert.ok(mailtoUrl.startsWith("mailto:hgdnlive@gmail.com?"), "Mailto URL must target official feedback email");
      assert.ok(mailtoUrl.includes("subject="), "Mailto URL must include encoded subject");
      assert.ok(mailtoUrl.includes("body="), "Mailto URL must include encoded body");

      const parsedUrl = new URL(mailtoUrl);
      assert.strictEqual(parsedUrl.protocol, "mailto:");
      assert.strictEqual(parsedUrl.pathname, "hgdnlive@gmail.com");
      assert.strictEqual(
        parsedUrl.searchParams.get("subject"),
        "[Official髭男dism 現場情報] 2012-07-07 第7回 松江だんだん祭り @ 松江 AZTiC canova"
      );
      assert.ok(parsedUrl.searchParams.get("body").includes("2012-07-07-matsue-aztic-canova"));
      assert.ok(
        mailtoUrl.includes("%0D%0A"),
        "Mailto URL body must use RFC 6068 CRLF line breaks (%0D%0A) for cross-client reliability"
      );

      // 4. Missing Time Subject & Mailto
      const timeSubjectZh = buildTimeSubject({ show: mockShow, unitTitle, locale: "zh-TW" });
      assert.strictEqual(
        timeSubjectZh,
        "[Official髭男dism 開演時間情報] 2012-07-07 第7回 松江だんだん祭り @ 松江 AZTiC canova"
      );
      const timeMailto = buildTimeMailto({ show: mockShow, unitTitle, locale: "zh-TW" });
      assert.ok(timeMailto.startsWith("mailto:hgdnlive@gmail.com?"));
      const parsedTimeUrl = new URL(timeMailto);
      assert.strictEqual(
        parsedTimeUrl.searchParams.get("subject"),
        "[Official髭男dism 開演時間情報] 2012-07-07 第7回 松江だんだん祭り @ 松江 AZTiC canova"
      );
      assert.ok(parsedTimeUrl.searchParams.get("body").includes("Doors"));
      assert.ok(
        timeMailto.includes("%0D%0A"),
        "Time Mailto URL body must use RFC 6068 CRLF line breaks (%0D%0A) for cross-client reliability"
      );
    });
  });

  describe("Subtest 2: Headless React SSR ShowSlip Quest Callout Card", () => {
    const mockEmptyUnitData = {
      isTour: false,
      unit: {
        id: "event-2012-matsue-fest",
        title: "第7回 松江だんだん祭り",
        type: "聯合專場",
        shows: [
          {
            id: "2012-07-07-matsue-aztic-canova",
            date: "2012-07-07",
            venue: "松江 AZTiC canova",
            city: "松江",
          },
        ],
      },
      full: new Map([["2012-07-07-matsue-aztic-canova", []]]),
    };

    const mockPopulatedUnitData = {
      isTour: false,
      unit: {
        id: "event-2024-rejoice",
        title: "Official髭男dism one-man tour 2024 - Rejoice",
        type: "巡演專場",
        shows: [
          {
            id: "2024-11-12-k-arena",
            date: "2024-11-12",
            venue: "K-Arena橫濱",
            city: "橫濱",
            startsAt: "18:00",
            opensAt: "17:00",
          },
        ],
      },
      full: new Map([
        [
          "2024-11-12-k-arena",
          [
            { songId: "pretender", encore: false, kind: [] },
            { songId: "subtitle", encore: false, kind: [] },
            { songId: "宿命", encore: true, kind: [] },
          ],
        ],
      ]),
    };

    it("renders Crowdsourced Setlist Quest card on empty show slips across all 4 locales", async () => {
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

      // 1. zh-TW
      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, {
            ud: mockEmptyUnitData,
            showId: "2012-07-07-matsue-aztic-canova",
          })
        )
      );

      assert.ok(htmlZh.includes('data-testid="setlist-quest-card"'), "zh-TW must render setlist-quest-card");
      assert.ok(htmlZh.includes('data-testid="quest-mailto-btn"'), "zh-TW must render quest-mailto-btn");
      assert.ok(htmlZh.includes("歌單情報協尋中"), "zh-TW must render quest headline");
      assert.ok(htmlZh.includes("提供本場曲目情報"), "zh-TW must render submit button label");
      assert.ok(htmlZh.includes('type="button"'), "zh-TW must render modal trigger button instead of broken mailto link");

      // 2. ja
      const htmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(ShowSlip, {
            ud: mockEmptyUnitData,
            showId: "2012-07-07-matsue-aztic-canova",
          })
        )
      );

      assert.ok(htmlJa.includes('data-testid="setlist-quest-card"'), "ja must render setlist-quest-card");
      assert.ok(htmlJa.includes("セットリスト情報募集中"), "ja must render quest headline in Japanese");
      assert.ok(htmlJa.includes("セットリスト情報を提供する"), "ja must render submit button label in Japanese");

      // 3. en
      const htmlEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(ShowSlip, {
            ud: mockEmptyUnitData,
            showId: "2012-07-07-matsue-aztic-canova",
          })
        )
      );

      assert.ok(htmlEn.includes('data-testid="setlist-quest-card"'), "en must render setlist-quest-card");
      assert.ok(htmlEn.includes("Seeking Setlist Information"), "en must render quest headline in English");
      assert.ok(htmlEn.includes("Submit Setlist Information"), "en must render submit button label in English");

      // 4. ko
      const htmlKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(ShowSlip, {
            ud: mockEmptyUnitData,
            showId: "2012-07-07-matsue-aztic-canova",
          })
        )
      );

      assert.ok(htmlKo.includes('data-testid="setlist-quest-card"'), "ko must render setlist-quest-card");
      assert.ok(htmlKo.includes("셋리스트 정보 제보 안내"), "ko must render quest headline in Korean");
      assert.ok(htmlKo.includes("본 공연 셋리스트 제보하기"), "ko must render submit button label in Korean");
    });

    it("does NOT render Crowdsourced Setlist Quest card when show setlist is complete", async () => {
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, {
            ud: mockPopulatedUnitData,
            showId: "2024-11-12-k-arena",
          })
        )
      );

      assert.strictEqual(
        html.includes('data-testid="setlist-quest-card"'),
        false,
        "Populated show slip must NOT render setlist quest card"
      );
      assert.ok(html.includes("MAIN SETLIST"), "Populated show slip must render main setlist");
    });
  });

  describe("Subtest 3: Missing Time Quest Prompt in ShowMetadataBox", () => {
    const mockShowWithoutTimes = {
      isTour: false,
      unit: {
        id: "event-2015-livehouse",
        title: "LIVE 2015",
        type: "聯合專場",
        shows: [
          {
            id: "2015-05-01-shibuya",
            date: "2015-05-01",
            venue: "Shibuya eggman",
            city: "東京",
            // missing opensAt and startsAt
          },
        ],
      },
      full: new Map([
        [
          "2015-05-01-shibuya",
          [
            { songId: "sweet-tweet", encore: false, kind: [] },
          ],
        ],
      ]),
    };

    it("renders friendly missing time report link when show has songs but lacks start time", async () => {
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, {
            ud: mockShowWithoutTimes,
            showId: "2015-05-01-shibuya",
          })
        )
      );

      assert.ok(
        htmlZh.includes('data-testid="report-time-btn"'),
        "Show with songs but missing time must render report-time-btn"
      );
      assert.ok(htmlZh.includes("提供開演時間"), "Must display localized report time copy in zh-TW");
      assert.ok(htmlZh.includes('type="button"'), "Must render modal trigger button instead of broken mailto link");
    });

    it("does NOT render missing time report link when show already has opening/start times", async () => {
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

      const mockShowWithTimes = {
        isTour: false,
        unit: {
          id: "event-2015-livehouse",
          title: "LIVE 2015",
          type: "聯合專場",
          shows: [
            {
              id: "2015-05-01-shibuya",
              date: "2015-05-01",
              venue: "Shibuya eggman",
              city: "東京",
              startsAt: "19:00",
            },
          ],
        },
        full: new Map([
          [
            "2015-05-01-shibuya",
            [
              { songId: "sweet-tweet", encore: false, kind: [] },
            ],
          ],
        ]),
      };

      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, {
            ud: mockShowWithTimes,
            showId: "2015-05-01-shibuya",
          })
        )
      );

      assert.strictEqual(
        html.includes('data-testid="report-time-btn"'),
        false,
        "Show with existing time must NOT render report-time-btn"
      );
      assert.ok(html.includes("19:00 開演"), "Show must render formatted time");
    });
  });
});
