# ADR-0137: PWA 版本更新提示、背景待命接管與無干擾互動式刷新架構 (PWA Version Update Notification, Waiting Lifecycle & Non-Intrusive Interactive Reload Architecture)

## Status
Accepted

## Context
1. **背景與痛點**：
   在 ADR-0134 中，我們為 PWA 實作了 Network-First 導航策略、Vite 建置雜湊注入快取名稱（Build Hash Invalidation）與 Cloudflare Pages 邊緣快取標頭。新版本發布後，當使用者重新開啟瀏覽器或新開分頁時，已能自動取得最新版本。
   然而，若使用者（尤其是手機行動端樂迷）已將網站開啟在前景或保留在瀏覽器背景分頁數天，當站點部署新巡演歌單或介面修復時：
   - 瀏覽器雖在背景下載了新版 Service Worker，但由於舊頁面記憶體中的 JavaScript 執行實例依然是舊版本，使用者無法感知已有新版釋出。
   - 舊版程式碼若在未刷新的情況下呼叫新部署產生的資產，或樂迷在等待最新歌單即時更新時，必須由使用者「盲目手動點擊瀏覽器重新整理」才能更新。
2. **核心需求與權衡**：
   - **版本控制（Version Control）感知**：使用者希望網站能有清晰的版本控制感知，當雲端有新版本部署時能主動提示。
   - **極致尊重樂迷（Non-Intrusive UX）**：
     - 不得使用霸道強制重整（`window.location.reload()`），避免打斷樂迷正在票夾打卡、填寫參戰紀錄或搜尋歌單的關鍵操作。
     - 提示必須是非阻斷式的浮動橫條（Floating Toast / Banner），提供「[ 立即更新 ]」與「[ 稍後 ]」雙按鈕。
     - 若樂迷點擊「稍後」，在當次工作階段（Session）中絕不反覆跳出騷擾。
   - **萬人演唱會現場節能與零後端約束**：
     - 不得使用頻繁無效的短輪詢計時器，避免耗費樂迷手機寶貴電力與演唱會現場擁擠的行動網路。
     - 檢查更新的觸發時機定為：初次載入 + 視窗切換回前景時（`visibilitychange: visible`），並施予防抖節流（15 分鐘）。
     - 文案嚴守 `CODING_STANDARDS.md` 規範，採用純粹、溫潤的樂迷語言，支援 `zh-TW`、`ja`、`ko`、`en` 四國語系，杜絕生硬工程術語。

## Decision
1. **Service Worker 生命週期改為待命接管（Waiting Lifecycle with Deferred Skip-Waiting）**：
   - 修改 `site/public/sw.js`：移除 `install` 階段無條件自動執行的 `self.skipWaiting()`。新 Service Worker 完成資源預先快取後，自然停留在 `waiting` 狀態。
   - 在 `sw.js` 增加 `message` 事件監聽：當收到 `{ type: "SKIP_WAITING" }` 訊息時，才觸發 `self.skipWaiting()` 進行接管。
2. **前景更新偵測與狀態發布（Client-side Update Detection & Subscription）**：
   - 在 `site/src/lib/pwa.js` 擴充更新生命週期處理：
     - 註冊成功後，監聽 `registration.onupdatefound`，當新 worker 的狀態轉為 `installed` 且當前已有控制器（`navigator.serviceWorker.controller`）時，發布更新就緒事件。
     - 若頁面載入時已存在 `registration.waiting`（例如先前已在背景下載好但尚未套用），立即識別並發布更新就緒事件。
     - 匯出 `subscribeUpdateAvailable(callback)` 與 `applyUpdate()` API，供 React 元件訂閱與操作。
3. **視窗喚醒自動檢查（Visibility Focus Update Trigger with Throttle）**：
   - 在 `site/src/lib/pwa.js` 中監聽 `document.addEventListener("visibilitychange", ...)`。
   - 當文件狀態轉為 `visible` 且距離上次檢查時間超過 15 分鐘（900,000ms）時，自動調用 `registration.update()`，確保手機切回前景秒級捕捉新版，同時徹底杜絕輪詢耗電。
4. **非阻斷式票券風提示元件（`UpdateNotificationToast`）**：
   - 在 `site/src/components/common/UpdateNotificationToast.jsx` 實作浮動提示元件，掛載於 `site/src/App.jsx` 根階層。
   - 採用票券深黑底金色細邊高對比質感，浮於螢幕底部中央。
   - 提供「[ 立即更新 ]」與「[ ✕ / 稍後 ]」：
     - 點擊「立即更新」：按鈕轉為「更新中...」禁用狀態，呼叫 `applyUpdate()` 向等待中的 Service Worker 發送 `SKIP_WAITING`。監聽 `navigator.serviceWorker` 的 `controllerchange` 事件後呼叫 `window.location.reload()`，自然保留當前 URL Hash（如 `#/tickets`、`#/tour/xxx`）。
     - 點擊「稍後」：在 React 記憶體狀態標記已忽略，當次工作階段（Session）不再反覆彈出。
   - 全面支援四語系（繁體中文、日本語、한국어、English）在地化文案。

## Consequences
- **Positive**: 徹底解決分頁長期不關閉時無法感知新版部署的問題，由使用者掌握重新整理的主導權。
- **Positive**: 嚴格保障樂迷在填寫票夾或查歌時的操作連貫性，絕無強制重載與強制彈窗。
- **Positive**: 視窗喚醒檢查機制不增加常駐定時器負擔，在萬人現場微弱網路與低電量條件下依然節能可靠。
- **Positive**: 延續 ADR-0123 零後端原則，完全基於 Web 標準 Service Worker 生命週期，無任何第三方 SDK 或伺服器相依。
