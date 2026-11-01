import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

const { React, renderToStaticMarkup } = await getReactAndRenderer();

if (!globalThis.window) {
  globalThis.window = {
    location: { hash: "", pathname: "/", reload: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
if (!globalThis.document) {
  globalThis.document = {
    body: { style: {} },
    addEventListener: () => {},
  };
}

describe("29. PWA Version Update Notification Toast (ADR-0137)", () => {
  it("does not render when there is no pending update and forceShow is false", async () => {
    const { UpdateNotificationToast } = await loadModule("src/components/common/UpdateNotificationToast.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const html = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { initialLocale: "zh-TW" },
        React.createElement(UpdateNotificationToast, { forceShow: false })
      )
    );

    assert.equal(html, "", "Must render nothing when no update is queued");
  });

  it("renders non-blocking update toast with ticket aesthetic across all 4 locales when forceShow is true", async () => {
    const { UpdateNotificationToast } = await loadModule("src/components/common/UpdateNotificationToast.jsx");
    const { I18nProvider } = await loadModule("src/lib/i18n.jsx");

    const locales = [
      { code: "zh-TW", expectedMsg: "巡演歌單與功能已有新版本", expectedBtn: "立即更新", expectedDismiss: "稍後" },
      { code: "ja", expectedMsg: "ツアーセトリと新機能が更新されました", expectedBtn: "今すぐ更新", expectedDismiss: "あとで" },
      { code: "ko", expectedMsg: "투어 세트리스트와 새로운 기능이 업데이트되었습니다", expectedBtn: "지금 업데이트", expectedDismiss: "나중에" },
      { code: "en", expectedMsg: "Tour setlists & features updated", expectedBtn: "Update Now", expectedDismiss: "Later" },
    ];

    for (const { code, expectedMsg, expectedBtn, expectedDismiss } of locales) {
      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: code },
          React.createElement(UpdateNotificationToast, { forceShow: true })
        )
      );

      assert.ok(html.includes('data-testid="pwa-update-toast"'), `[${code}] Must render toast container`);
      assert.ok(html.includes('data-testid="pwa-update-refresh-btn"'), `[${code}] Must render refresh button`);
      assert.ok(html.includes('data-testid="pwa-update-dismiss-btn"'), `[${code}] Must render dismiss button`);
      assert.ok(
        html.includes(expectedMsg) || html.includes(expectedMsg.replace("&", "&amp;")),
        `[${code}] Must contain localized message: ${expectedMsg}`
      );
      assert.ok(html.includes(expectedBtn), `[${code}] Must contain localized refresh button: ${expectedBtn}`);
      assert.ok(html.includes(expectedDismiss), `[${code}] Must contain localized dismiss button: ${expectedDismiss}`);
    }
  });
});
