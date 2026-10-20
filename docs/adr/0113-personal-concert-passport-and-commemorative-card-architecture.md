# ADR-0113: 個人巡演護照、打卡持久化、動態生涯指標與自製小卡領域架構（Personal Concert Passport, Attendance Persistence, Dynamic Milestones & Commemorative Card Architecture）

## Status
Accepted

## Context
1. **樂迷參與軌跡斷層痛點**：
   專案過往架構完整建立了官方演出與歌單紀錄（巡演大票、單場票根、歌曲歷史、場館歷程），但整體體驗仍停留在「客觀資料庫檢索」，缺乏歌迷個人的參與軌跡（Personal Concert Passport）。樂迷無法在站上標記「我參加過這場演出」、無法記錄個人專屬座位號碼與觀演心得短語、無法統計個人現場解鎖的歌曲覆蓋率，亦無法產出帶有個人座席與印章的實體感紀念票券圖卡供社群分享。
2. **純前端無後端與極致隱私邊界**：
   本站為純靜態部署（Cloudflare Pages / GitHub Pages），秉持零後端維護成本與極致隱私原則（不收集任何個人資料、免登入帳號、無外部中心化資料庫）。需要一套完全在客戶端運行的安全資料模型與存儲抽象層。
3. **Storage 配額與極端環境降級安全**：
   經容量調研（Issue #28），樂迷極限參戰 150 場僅佔 LocalStorage 5MB 配額的 1.17%（具備 85 倍安全裕度）。但在 Safari 無痕模式、本機磁碟滿載或無頭 Node.js SSR 測試環境下，原生 `localStorage` 會拋出配額例外或缺少 `window`。因此必須設計防崩潰的抽象適配器（`SafeStorage` / `MemoryStorageAdapter`）。
4. **雙向打卡與跨組件反應式同步**：
   歌迷在 `ShowSlip`（單場票券）點擊打卡後，全域導航列（`ArchiveHeader`）、行動端抽屜（`FilterDrawer`）與護照專頁（`PassportPage`）的計數徽章與狀態必須零延遲即時同步。
5. **動態指標運算與離屏渲染管線**：
   歌曲解鎖率（Live Repertoire Coverage %）、高頻現場神曲排行等指標必須由前端即時交叉比對靜態資料庫動態產出；小卡匯出需延續 `ADR-0100` 的離屏隔離渲染與真透明圓角 PNG 管線。

## Decision
1. **純前端 LocalStorage 資料模型與抽象層（`site/src/lib/storage.js` & `site/src/lib/passport.js`）**：
   - 採用 `hg_passport_v1` 作為版本化儲存鍵。
   - 定義標準 Payload：`{ version: 1, updatedAt: string, attendedShows: Record<showKey, PassportShowEntry> }`。
   - `PassportShowEntry` 規格包含 `showKey`、`attendedAt`、`seat`（<= 50 字元）、`notes`（<= 300 字元）、`stampId`、`includeSeat`、`includeNotes`、`favorite`、`isOrphaned`、`updatedAt`。
   - 建立 `SafeStorage` 包裝與 `MemoryStorageAdapter`，在 Node.js SSR 或 Safari 拋錯時自動降級至記憶體模式，永不阻斷頁面渲染。
   - 透過自訂事件 `hg:passport-updated` 與瀏覽器 `storage` 事件，實現跨組件與跨分頁的即時反應式同步。
2. **專屬護照中心路由與時間軸管理（`site/src/components/passport/PassportPage.jsx`）**：
   - 於 `site/src/lib/routes.js` 註冊一級路由 `#/passport`，支援前進、後退與雙向深層連結導航。
   - 提供年份過濾器與即時關鍵字搜尋（巡演、場館、城市、座席、筆記），以反向時序（由新至舊）呈現已參戰時間軸。
   - 提供 0 場次參戰引導探索的 Empty State，以及直達 `#/show/:id` 票根跳轉與一鍵移除打卡功能。
3. **即時動態生涯里程碑運算引擎（`site/src/lib/passport-milestones.js`）**：
   - 純函數 `computePassportMilestones` 即時交叉比對靜態主檔：
     - 累計參戰總場次、跨越巡演數、打卡場館數與不重複城市數。
     - 歌曲解鎖率（Coverage）：已參戰場次出現過的不重複官方曲目集合除以官方歌曲總數。
     - 現場神曲排行（Top 3）：個人已參戰場次中演唱次數最高之曲目排行。
     - 最早與最近參戰時間點極值。
4. **雙模態自製紀念小卡生成器（`MemorialCardModal` & `MilestoneCardModal`）**：
   - **單場客製小卡（440px 寬度）**：基於 `MemorialCardModal` 擴充客製化抽屜，支援座席、心得短語、隱私開關與 6 款特色向量印章（`stamps.js`）。
   - **生涯總結圖卡（540px 寬度）**：`MilestoneCardModal` 整合票券手撕膠帶、齒孔分割線、生涯里程碑數據與典藏條碼頁尾，一鍵離屏渲染匯出高品質透明 PNG。
   - 嚴格遵守 `DESIGN.md` 票券美學與高對比墨水規範（AAA >= 7:1），杜絕未審查十六進位色碼。
5. **四語系在地化覆蓋（`ja`、`zh-TW`、`ko`、`en`）**：
   - 字典新增 `passport.*` 完整命名空間，支援多語時間軸篩選、自訂小卡介面與生涯總結文字。
   - 遵守 `check-i18n` 守衛規範，零硬編碼 CJK 字串。

## Consequences
- **Positive**: 賦予樂迷完整的現場參戰回憶收納體驗與社群分享能力，極大提升網站黏著度與互動溫度。
- **Positive**: 嚴守純靜態、零後端與極致隱私邊界，無維護負擔與伺服器資安風險。
- **Positive**: 3-tier 測試體系（`site/tests/ui/passport.test.js`、`passport-page.test.js`、`passport-milestones.test.js`、`ticket-export.test.js`）提供 100% 覆蓋保障。
- **Neutral**: 備份匯出/還原（Issue #38）經 UX 評估暫緩，將護照介面維持在最純粹簡潔的樂迷體驗，未來視需求再行評估輕量化方案。
