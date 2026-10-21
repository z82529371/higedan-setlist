# ADR-0119: PWA 現場離線瀏覽支援、Web App Manifest 與 Cache-First 快取架構（Progressive Web App Offline Support, Web App Manifest & Cache-First Service Worker Architecture）

## Status
Accepted

## Context
1. **現場演唱會無網路與基站壅塞環境痛點（Issue #44 / #39）**：
   在巨蛋、競技場或體育場等萬人大型演唱會現場，因成千上萬樂迷同時聚集，行動網路基地台極易過載癱瘓，常導致完全斷網或訊號微弱。樂迷在現場排隊驗票、確認開演時程、查閱場館交通或比對過往巡演曲目時，面臨網頁無法開啟或連線逾時之困境。
2. **純靜態單頁應用（SPA）與完整演出資料編譯特性**：
   本檔案庫所有歷史巡演、單一活動、曲目統計、場館辭典與個人票夾皆於建置期完整編譯至靜態 Bundle，無任何執行階段動態後端 API 相依。此特性賦予本站 100% 離線執行的絕佳條件。
3. **SSR 測試環境與用戶端隔離安全守護**：
   在 Vite SSR、Node.js 22 測試單例（`site/tests/helpers/vite-server.js`）與 CI 無介面環境中，任何未加保護的頂層 `window` 或 `navigator` 引用都會引發 `ReferenceError: navigator is not defined` 錯誤，必須建立嚴格的執行環境阻隔。

## Decision
1. **Web App Manifest 規範與沉浸式獨立視窗**：
   - 建立標準 `site/public/manifest.webmanifest`，設定 `display: "standalone"`、`name: "Official髭男dism Setlist 檔案庫"`、`short_name: "髭男 Setlist"`、官方標誌金主題色 `theme_color: "#d19f00"` 與日式暖米紙色底色 `background_color: "#f0eee8"`。
   - 配置標準與 maskable 雙規格 PNG 圖示（192x192 與 512x512）及 SVG 向量圖標，maskable 圖示嚴格確保核心鬍子標誌落於安全視區（Safe Zone）內且背景滿版延伸，避免行動裝置裁切成圓形或圓角時留白。
   - 在 `site/index.html` 宣告 `<link rel="manifest">`、`<meta name="theme-color">`、`<meta name="apple-mobile-web-app-capable">` 等行動端獨立視窗中繼標籤。
2. **Cache-First 輕量 Service Worker 快取架構（`site/public/sw.js`）**：
   - 採用版本化快取命名空間（`CACHE_NAME = "higedan-setlist-v1"`）。
   - **安裝階段（Install）**：預先快取核心應用外殼（HTML、Manifest、各尺寸圖示與 Favicon），並由 Vite 建置外掛（`pwaPrecachePlugin`）於打包時將編譯產生之帶有雜湊值（hash）的 JS/CSS bundle 自動注入預先快取清單，實現「初次安裝即離線完整具備」。
   - **啟用階段（Activate）**：列舉所有快取空間，自動刪除舊版本之過期快取，並透過 `clients.claim()` 立即接管既有客戶端。
   - **擷取階段（Fetch）**：實作 Cache-First 策略，優先自本機快取回傳以達秒級零延遲開啟；若快取未命中則向網路請求，並自動將合規的 200 回應動態寫入快取；若完全斷網且為導航請求（`mode === "navigate"`），自動回退至快取的 `index.html` 應用外殼。
3. **SSR-Safe 用戶端隔離註冊機制（`site/src/lib/pwa.js`）**：
   - 註冊邏輯封裝於 `registerServiceWorker(env = {})`，嚴格檢查 `typeof window !== "undefined"`、`typeof navigator !== "undefined"` 及 `'serviceWorker' in navigator`，確保在 Node.js SSR 與無介面測試環境中靜默略過，杜絕崩潰。
   - 於客戶端進入點 `site/src/main.jsx` 於視窗載入（`load`）後非同步背景註冊。
4. **自動化不變量測試守護（`site/tests/invariants/pwa-invariants.test.js`）**：
   - 驗證 `manifest.webmanifest` 語法、必要欄位值與圖示物理檔案尺寸解析度一致性。
   - 驗證 `index.html` 中之 Manifest 關聯與 Meta 宣告。
   - 驗證 `sw.js` 具備 Cache-First 語意、過期清理與 `dist/sw.js` 雜湊 Bundle 注入。
   - 驗證 SSR / Node.js 環境呼叫安全無拋錯。

## Consequences
- **Positive**: 萬人演唱會現場無訊號或飛航模式下，樂迷仍可秒開網站完整查閱所有巡演與歌單。
- **Positive**: 支援桌面與手機瀏覽器「加入主畫面」，呈現如同原生 App 之沉浸式無網址列介面。
- **Positive**: 註冊機制與 SSR 完全隔離，不變量測試提供長久品質防護。
