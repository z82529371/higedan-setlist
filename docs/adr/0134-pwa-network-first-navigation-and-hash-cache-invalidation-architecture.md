# ADR-0134: PWA 網路優先導航策略、建置雜湊快取版本化與邊緣標頭架構 (PWA Network-First Navigation, Dynamic Hash Cache Invalidation & Cloudflare Edge Headers Architecture)

## Status
Accepted

## Context
1. **版本更新後被迫強制重新整理痛點（Issue / 樂迷反饋）**：
   在 ADR-0119 實作 Service Worker 離線快取後，樂迷與維護者發現在網站部署新版本（例如更新最新巡演歌單、修復場館資訊或介面功能）後，使用者正常打開網站或重新整理時，瀏覽器依然頑固顯示舊版本，必須強制按下 `Ctrl + R` 或 `Ctrl + F5` 略過 Service Worker 才能看到最新內容。
2. **根本原因剖析**：
   - **無差別 Cache-First 策略**：原 `site/public/sw.js` 對所有 GET 請求（包括根路徑 `/` 與 `index.html` 導航請求）皆直接讀取快取；只要本機已快取過 `index.html`，Service Worker 永不發送網路請求，使得舊 HTML 永遠加載舊的 Vite 雜湊腳本。
   - **快取空間名稱靜態寫死**：原 `CACHE_NAME` 寫死為 `"higedan-setlist-v1"`，新版本釋出時雖然靜態資產帶有新 Hash，但快取桶名未變，既無法靈敏觸發 Service Worker 位元組差異比對，亦無法在啟用（`activate`）時自動清空前版快取，導致大量陳舊資產長期滯留於行動端儲存空間。
   - **缺少邊緣與瀏覽器 HTTP 快取標頭規範**：站點託管於 Cloudflare Pages，但未設定 `_headers` 規則，導致部分行動瀏覽器（如 iOS Safari）底層將 HTML 鎖入硬碟啟發式快取。
3. **萬人演唱會現場離線初衷之守護（ADR-0119 Invariant）**：
   若單純將導航改為標準 Network-First（`fetch().catch()`），當樂迷在萬人演唱會現場遭遇行動網路基地台壅塞癱瘓時，瀏覽器 TCP 連線逾時可長達 15 至 30 秒，將造成樂迷長時間白屏等待，嚴重破壞 ADR-0119「現場即時秒開」之承諾。

## Decision
1. **導航請求雙軌化：Network-First 附加 1.8 秒超時自動降級（Network-First with 1.8s Timeout Fallback）**：
   - 對於頁面導航（`event.request.mode === "navigate"` 或 `pathname === "/"`、`"/index.html"`、`Accept: text/html`），採用**網路優先**策略。正常連線下（5G/4G/Wi-Fi）次秒級向邊緣驗證取得最新 `index.html` 並動態同步本機快取，使用者只要一般進入網站即可秒看最新版，徹底免除 `Ctrl + R`。
   - **現場弱網超時守護**：封裝 `fetchWithTimeout(request, 1800)`。若在現場遭遇基站壅塞導致 1.8 秒內無法完成網路響應，Service Worker 立即中斷並降級回退讀取快取的 `/index.html`，保證白屏等待不超過 1.8 秒。
   - **帶 Hash 靜態資產維持 Cache-First**：針對 `/assets/*.js`、`/assets/*.css` 與圖片，因 Vite 編譯後具有唯一 Content Hash，依然維持 Cache-First 瞬開與節省流量。
2. **Vite 建置外掛自動注入動態雜湊版號（Build Hash Cache Invalidation）**：
   - 升級 `site/vite.config.js` 之 `pwaPrecachePlugin`，打包時自動擷取主入口 chunk（`assets/index-[hash].js`）之 Content Hash，並在編譯輸出之 `dist/sw.js` 中將 `CACHE_NAME` 動態改寫為 `"higedan-setlist-" + buildHash`。
   - 每次版本部署只要程式碼或資料有變更，`sw.js` 檔案內容必然產生位元組級差異，促使瀏覽器在背景立即捕捉新版本安裝；在 `activate` 事件觸發時，透過 `caches.delete()` 自動清理所有不相符的舊版快取空間（`higedan-setlist-*`）。
3. **Cloudflare Pages 標準 HTTP 快取標頭規範（`site/public/_headers`）**：
   - 新增 `site/public/_headers` 檔案，由 Vite 建置時自動複製至發布根目錄：
     - `/index.html` 與 `/`：配置 `Cache-Control: public, max-age=0, must-revalidate`，要求瀏覽器與 CDN 每次都透過 ETag 驗證，確保部署秒級穿透。
     - `/sw.js`：配置 `Cache-Control: public, max-age=0, must-revalidate`，確保背景 Service Worker 比對永不讀取陳舊快取。
     - `/assets/*`：配置 `Cache-Control: public, max-age=31536000, immutable`，實現 1 年永久不可變快取。
4. **用戶端非侵入式接管與導航主動比對**：
   - 遵守靜態架構極致尊重使用者原則，背景啟用新 Service Worker 後不調用 `window.location.reload()`，杜絕打斷樂迷正在票夾打卡或搜尋之操作；使用者下次重開或切換即自然套用。
   - 在 `site/src/lib/pwa.js` 之 `registerServiceWorker()` 成功後，主動呼叫 `registration.update()`，確保樂迷每次造訪網站皆能第一時間啟動背景更新檢查。

## Consequences
- **Positive**: 徹底消滅「必須按 Ctrl + R 才能看到新版」的使用者困擾，日常版本部署對樂迷而言完全透明自動。
- **Positive**: 在萬人演唱會基站癱瘓時，1.8 秒內自動回退至離線快取，毫無保留地延續了 ADR-0119 的離線可用初衷。
- **Positive**: Vite 自動雜湊快取版號與 Cloudflare Pages 標頭嚴格聯防，終結孤兒快取對使用者行動裝置空間的佔用。
