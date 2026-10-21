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

describe("28. In-App Lead Drop Modal (Seam 2 & 3: UI & Modal)", () => {
  const mockShow = {
    id: "2012-07-07-matsue-aztic-canova",
    date: "2012-07-07",
    venue: "松江 AZTiC canova",
  };
  const unitTitle = "第7回 松江だんだん祭り";

  it("renders LeadDropModal correctly across all 4 locales with required evidence input", async () => {
    const { LeadDropModal } = await loadModule("src/components/slips/LeadDropModal.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    // 1. zh-TW
    const htmlZh = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(LeadDropModal, {
          isOpen: true,
          show: mockShow,
          unitTitle,
          questType: "setlist",
          onClose: () => {},
        })
      )
    );

    assert.ok(htmlZh.includes('data-testid="lead-drop-modal"'), "Must render modal container");
    assert.ok(htmlZh.includes('data-testid="lead-evidence-input"'), "Must render evidence input");
    assert.ok(htmlZh.includes('data-testid="lead-notes-input"'), "Must render notes textarea");
    assert.ok(htmlZh.includes('data-testid="lead-submit-btn"'), "Must render submit button");
    assert.ok(htmlZh.includes("2012-07-07"), "Must display show date");
    assert.ok(htmlZh.includes("第7回 松江だんだん祭り"), "Must display event title");
    assert.ok(htmlZh.includes("松江 AZTiC canova"), "Must display venue");
    assert.ok(htmlZh.includes("提供曲目情報線索"), "zh-TW must render modal header");
    assert.ok(htmlZh.includes("hgdnlive@gmail.com"), "Must mention official contact email for fallback");

    // 2. ja
    const htmlJa = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "ja" },
        React.createElement(LeadDropModal, {
          isOpen: true,
          show: mockShow,
          unitTitle,
          questType: "setlist",
          onClose: () => {},
        })
      )
    );
    assert.ok(htmlJa.includes("情報の手がかりを提供する"), "ja must render modal header");

    // 3. en
    const htmlEn = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "en" },
        React.createElement(LeadDropModal, {
          isOpen: true,
          show: mockShow,
          unitTitle,
          questType: "time",
          onClose: () => {},
        })
      )
    );
    assert.ok(htmlEn.includes("Provide Concert Time Lead"), "en must render time modal header");

    // 4. ko
    const htmlKo = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "ko" },
        React.createElement(LeadDropModal, {
          isOpen: true,
          show: mockShow,
          unitTitle,
          questType: "setlist",
          onClose: () => {},
        })
      )
    );
    assert.ok(htmlKo.includes("셋리스트 정보 단서 제보"), "ko must render modal header in Korean");
  });

  it("does not render when isOpen is false", async () => {
    const { LeadDropModal } = await loadModule("src/components/slips/LeadDropModal.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(LeadDropModal, {
          isOpen: false,
          show: mockShow,
          unitTitle,
          onClose: () => {},
        })
      )
    );

    assert.strictEqual(html, "", "Closed modal should render empty markup");
  });
});
