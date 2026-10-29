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

describe("26. Ticket Book Tour Footprint Commemorative Postcard & Pure PNG Export (Issue #56, ADR-0129, ADR-0131, ADR-0133)", () => {
  const mockShows = [
    {
      id: "show-1",
      date: "2024-11-30",
      city: "高陽",
      venue: "KINTEX Hall 5",
      title: "Official髭男dism Asia Tour 2024 - Rejoice -",
      shortTitle: "Rejoice Asia Tour",
      prefecture: "京畿道",
    },
    {
      id: "show-2",
      date: "2024-12-15",
      city: "台北",
      venue: "台北小巨蛋",
      title: "Official髭男dism Asia Tour 2024 - Rejoice -",
      shortTitle: "Rejoice Asia Tour",
      prefecture: "台北市",
    },
    {
      id: "show-3",
      date: "2025-08-16",
      city: "大阪",
      venue: "舞洲體育園區",
      title: "SUMMER SONIC 2025",
      shortTitle: "Summer Sonic 2025",
      prefecture: "大阪府",
    },
  ];

  describe("Seam 1: FootprintCardModal 540px Postcard & Interactive Journey Preview", () => {
    it("renders 540px footprint postcard modal with map, clean single PNG export button, and omits distance entirely", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { FootprintCardModal } = await loadModule("/src/components/ticket-book/FootprintCardModal.jsx");
      const { MemoryStorageAdapter, setTicketBookHolderName } = await loadModule("/src/lib/ticket-book.js");

      const storage = new MemoryStorageAdapter();
      setTicketBookHolderName("DaisukiFan", storage);

      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(FootprintCardModal, {
            isOpen: true,
            onClose: () => {},
            attendedShows: mockShows,
            storage,
          })
        )
      );

      // Verify modal and postcard container
      assert.ok(html.includes('data-testid="footprint-card-modal"'), "Must render modal container");
      assert.ok(html.includes('data-testid="footprint-postcard"'), "Must render footprint postcard node");
      assert.ok(html.includes("540px"), "Postcard must specify 540px standard width in class (ADR-0100 & ADR-0129)");
      assert.ok(!html.includes("540PX"), "Must never show technical '540PX' label in user-facing UI");
      assert.ok(
        html.includes("#f8f7f4") || html.includes("rgb(248, 247, 244)"),
        "Footprint postcard must have solid cardstock background #f8f7f4"
      );

      // Speed selector and replay button removed for cleaner UI
      assert.ok(!html.includes('data-testid="footprint-speed-'), "Must not render speed selector buttons");
      assert.ok(!html.includes('data-testid="footprint-replay-btn"'), "Must not render replay button");

      // Verify holder input in drawer and badge on postcard
      assert.ok(html.includes('data-testid="footprint-holder-input"'), "Must render holder input");
      assert.ok(html.includes('data-testid="footprint-holder-badge"'), "Must render holder badge when name is set");
      assert.ok(html.includes("DaisukiFan"), "Must display holder name in badge");

      // Verify Central Map Layer is present
      assert.ok(html.includes('data-testid="footprint-map-card"'), "Must render central map card");

      // Verify Expedition Postmark with 參戰紀念 text & Metrics in footer
      assert.ok(html.includes('data-testid="footprint-postmark"'), "Must render vintage postmark stamp");
      assert.ok(html.includes("參戰紀念"), "Postmark stamp text must be authentic '參戰紀念'");
      assert.ok(html.includes('data-testid="footprint-stat-prefectures"'), "Must render conquered prefectures stat");
      assert.ok(html.includes('data-testid="footprint-stat-shows"'), "Must render total attended shows stat");

      // ADR-0131 INVARIANT: Distance is strictly omitted from footprint card
      assert.ok(
        !html.includes('data-testid="footprint-stat-distance"'),
        "ADR-0131 Invariant: Must strictly omit distance stat from footprint postcard"
      );
      assert.ok(
        !html.includes("累計遠征距離"),
        "ADR-0131 Invariant: Must not display cumulative travel distance text on footprint card"
      );

      // Verify First and Latest show history
      assert.ok(html.includes('data-testid="footprint-first-show"'), "Must render first show record");
      assert.ok(html.includes('data-testid="footprint-latest-show"'), "Must render latest show record");
      assert.ok(html.includes("2024-11-30"), "Must display earliest show date");
      assert.ok(html.includes("2025-08-16"), "Must display latest show date");

      // Verify Single Clean Primary Save PNG Button (ADR-0133)
      assert.ok(html.includes('data-testid="footprint-save-png-btn"'), "Must render clean primary save PNG button");
      assert.ok(!html.includes('data-testid="footprint-record-video-btn"'), "Must not render video record button");

      // Verify ADR-0100 & DESIGN.md card radius rule (radius <= 8px on slips, no rounded-[12px])
      assert.ok(html.includes("rounded-[8px]"), "Postcard must use rounded-[8px] (DESIGN.md slip radius <= 8px)");
      assert.ok(!html.includes("rounded-[12px]"), "Postcard must not use rounded-[12px]");

      // Verify AAA contrast (>= 7:1) and zero arbitrary unvetted hex colors
      assert.ok(!html.includes("text-[#"), "Must not use arbitrary unvetted hex colors");
      assert.ok(html.includes("text-ink"), "Small badge/label text must use high-contrast ink tokens (text-ink)");

      // Verify returns null when isOpen is false
      const closedHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(FootprintCardModal, {
            isOpen: false,
            onClose: () => {},
            attendedShows: mockShows,
            storage,
          })
        )
      );
      assert.equal(closedHtml, "", "Must return empty markup when isOpen is false");
    });
  });

  describe("Seam 2: 4-Locale Authenticity for '參戰紀念' Postmark & Save Button", () => {
    it("renders authentic postmark text and save button across all 4 locales", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { FootprintCardModal } = await loadModule("/src/components/ticket-book/FootprintCardModal.jsx");
      const { MemoryStorageAdapter } = await loadModule("/src/lib/ticket-book.js");

      const storage = new MemoryStorageAdapter();

      const locales = [
        { loc: "zh-TW", expectedPostmark: "參戰紀念", expectedBtn: "儲存明信片 (PNG)" },
        { loc: "ja", expectedPostmark: "参戦記念", expectedBtn: "ポストカードを保存 (PNG)" },
        { loc: "en", expectedPostmark: "LIVE MEMORIAL", expectedBtn: "Save Postcard (PNG)" },
        { loc: "ko", expectedPostmark: "참전 기념", expectedBtn: "엽서 저장 (PNG)" },
      ];

      for (const { loc, expectedPostmark, expectedBtn } of locales) {
        const html = renderToStaticMarkup(
          React.createElement(
            I18nProvider,
            { initialLocale: loc },
            React.createElement(FootprintCardModal, {
              isOpen: true,
              onClose: () => {},
              attendedShows: mockShows,
              storage,
            })
          )
        );

        assert.ok(
          html.includes(expectedPostmark),
          `Must render localized postmark text '${expectedPostmark}' in ${loc}`
        );
        assert.ok(
          html.includes(expectedBtn),
          `Must render localized save button '${expectedBtn}' in ${loc}`
        );
      }
    });
  });

  describe("Seam 3: TicketBookFootprintMap Integration & Empty Guards", () => {
    it("strictly hides 'Save Footprint Card' trigger button when 0 physical shows are attended", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookFootprintMap } = await loadModule("/src/components/ticket-book/TicketBookFootprintMap.jsx");

      // 0 shows
      const emptyHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookFootprintMap, {
            attendedShows: [],
          })
        )
      );
      assert.ok(
        !emptyHtml.includes('data-testid="open-footprint-card-btn"'),
        "Must hide 'Save Footprint Card' button when 0 physical shows"
      );

      // Only virtual livestream shows (strictly non-physical)
      const virtualOnlyHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(TicketBookFootprintMap, {
            attendedShows: [
              {
                id: "virt-1",
                venue: "線上直播",
                isVirtual: true,
                date: "2020-09-26",
              },
            ],
          })
        )
      );
      assert.ok(
        !virtualOnlyHtml.includes('data-testid="open-footprint-card-btn"'),
        "Must hide 'Save Footprint Card' button when only virtual livestream shows"
      );
    });

    it("renders 'Save Footprint Card' trigger button across all 4 locales when physical shows exist", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { TicketBookFootprintMap } = await loadModule("/src/components/ticket-book/TicketBookFootprintMap.jsx");

      const locales = [
        { loc: "zh-TW", expectedText: "儲存足跡卡" },
        { loc: "ja", expectedText: "足跡カードを保存" },
        { loc: "en", expectedText: "Save Footprint Card" },
        { loc: "ko", expectedText: "발자취 카드 저장" },
      ];

      for (const { loc, expectedText } of locales) {
        const html = renderToStaticMarkup(
          React.createElement(
            I18nProvider,
            { initialLocale: loc },
            React.createElement(TicketBookFootprintMap, {
              attendedShows: mockShows,
            })
          )
        );

        assert.ok(
          html.includes(expectedText),
          `Must render localized button '${expectedText}' in ${loc}`
        );
      }
    });
  });
});
