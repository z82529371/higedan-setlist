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

describe("Tour Era Accent & Official Site Link UI (ADR-0149)", () => {
  it("renders official tour site link on TourSlip when officialUrl is present and omits it when absent", async () => {
    const { TourSlip } = await loadModule("src/components/slips/TourSlip.jsx");
    const { buildIndex } = await loadModule("src/lib/domain.js");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const { unitData } = buildIndex();
    const asia2026 = unitData.get("asia-tour-2026");
    const free2015 = unitData.get("free-live-tour-2015");
    assert.ok(asia2026, "asia-tour-2026 must exist in synced unitData");
    assert.ok(free2015, "free-live-tour-2015 must exist in synced unitData");

    const htmlWithUrl = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(TourSlip, {
          tourUnitData: asia2026,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      )
    );

    assert.match(htmlWithUrl, /data-testid="official-tour-site-link"/);
    assert.match(htmlWithUrl, /href="https:\/\/fc\.higedan\.com\/feature\/asiatour2026"/);
    assert.match(htmlWithUrl, /官方特設頁/);

    const htmlWithoutUrl = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(TourSlip, {
          tourUnitData: free2015,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      )
    );

    assert.doesNotMatch(htmlWithoutUrl, /data-testid="official-tour-site-link"/);
  });

  it("renders official site link on ShowSlip for standalone event with officialUrl", async () => {
    const { ShowSlip } = await loadModule("src/components/slips/ShowSlip.jsx");
    const { buildIndex } = await loadModule("src/lib/domain.js");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const { unitData } = buildIndex();
    const unofficial2025 = unitData.get("unofficial-2025");
    assert.ok(unofficial2025, "unofficial-2025 must exist in synced unitData");
    const showId = unofficial2025.unit.shows[0].id;

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "ja" },
        React.createElement(ShowSlip, {
          ud: unofficial2025,
          showId,
          onSelectSong: () => {},
          onSelectShow: () => {},
          onSelectVenue: () => {},
        })
      )
    );

    assert.match(html, /data-testid="official-tour-site-link"/);
    assert.match(html, /href="https:\/\/event\.higedan\.com\/feature\/live_2025"/);
    assert.match(html, /公式特設サイト/);
  });

  it("applies tour era accent color to MemorialCardModal top bar when themed and falls back to gold when unthemed", async () => {
    const { MemorialCardModal } = await loadModule("src/components/MemorialCardModal.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const sampleShow = {
      id: "show-test-1",
      date: "2026-08-29",
      city: "台北",
      venue: "台北小巨蛋",
    };

    const themedUnit = {
      id: "asia-tour-2026",
      title: "OFFICIAL HIGE DANDISM ASIA TOUR 2026",
      type: "巡演專場",
      isTour: true,
      theme: {
        light: "#d96b0b",
        lightInk: "#000000",
        dark: "#f08524",
        darkInk: "#000000",
        source: "https://fc.higedan.com/feature/asiatour2026",
      },
    };

    const htmlThemed = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(MemorialCardModal, {
          isOpen: true,
          onClose: () => {},
          show: sampleShow,
          unit: themedUnit,
          main: [],
          enc: [],
        })
      )
    );

    assert.match(htmlThemed, /data-testid="memorial-top-accent-bar"/);
    assert.match(htmlThemed, /data-era-accent="#d96b0b"/);
    assert.match(htmlThemed, /background-color:#d96b0b/);

    const htmlUnthemed = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(MemorialCardModal, {
          isOpen: true,
          onClose: () => {},
          show: sampleShow,
          unit: { id: "free-live-tour-2015", title: "Free Live Tour 2015", type: "巡演專場", isTour: true },
          main: [],
          enc: [],
        })
      )
    );

    assert.match(htmlUnthemed, /data-era-accent=""/);
  });
});
