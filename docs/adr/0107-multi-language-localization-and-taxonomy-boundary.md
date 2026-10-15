# ADR-0107: 多國語言在地化架構與實體領域邊界（Multi-Language Localization & Taxonomy Boundary）

## Status
Accepted

## Context
1. **海外巡演與國際歌迷擴展**：
   Official 髭男 dism 於 2024–2025 年展開大規模海外遠征（如台北小巨蛋、首爾 KINTEX、亞洲巡演），大量台灣、日本、韓國及歐美歌迷使用本歌單檔案庫。
2. **實體領域資料與 UI 分類層的混淆風險**：
   在導入多國語言支援時，若未建立清晰架構邊界，容易導致民間翻譯污染官方主檔（例如將官方日文原曲名私自英文化或意譯、將官方巡演名稱多語拆解、意譯歷史場館名稱）。
3. **靜態部署與極速架構要求**：
   本站採用純靜態 GitHub Pages / Cloudflare Pages 架構與 Node 22 SSR 快速驗證線（<60ms 執行時間）。導入重型外部 i18n 函式庫會造成 bundle 膨脹、SPA 路由與 hash 衝突，以及靜態 SSR 測試降速。

## Decision
1. **確立多國語言在地化邊界**：
   - **完全在地化範圍**（四語系：`zh-TW` 繁體中文、`ja` 日本語、`en` English、`ko` 한국어）：
     - UI Chrome、導覽列計數器、導覽步驟與操作按鈕。
     - 首頁（Landing Page）三大核心特色卡片（Spotlight Cards，眉標 `BI-DIRECTIONAL`、`TICKET STUB`、`PROVENANCE` 維持全域票券工單風格固定大寫英文，標題、內文與操作連結 100% 在地化，場館數採 `{venueCount}` 動態插值）、主要 CTA 與熱門探索（分流「編輯情境導覽快捷鈕」在地化 vs「實體曲名」官方主標題）。
     - 八大演出類型（巡演專場 / ツアー / Tour / 투어；特別專場 / 特別公演 / Special Show / 특별 공연；聯合專場 / 対バン / Joint Gig / 대반 等）。
     - 四大曲目特殊編制標籤（新歌 / 新曲 / New Song / 신곡；自彈自唱 / 弾き語り / Satoshi Solo / 단독 연주 等）。
     - 五大場館地理分區標籤與各類率（全勤、定番、輪替、限定）。
     - 日期星期與開場／開演雙軌演出時間格式化（Doors/Start, 開場/開演, 입장/시작）。
     - 紀念票卡（Memorial Card）長圖匯出之標題、計數、朱印與版籤。
   - **實體領域主檔嚴格維持官方一手真實（Immutable Primary Sources）**：
     - 歌曲主標題（`title`，以日本官方發行為主）與官方別名（`alias`）。
     - 官方巡演名稱（`title`）與主場館名稱（`venue`）。
     - 嚴格禁止機器翻譯或非官方民間意譯侵入領域實體。
2. **零依賴輕量 i18n 核心（<3KB gzipped）**：
   - 不引進第三方法定依賴，以原生 React Context (`I18nProvider`)、`useI18n()` 與同步靜態字典檔（`site/src/lib/locales/`）驅動，確保極速靜態構建與無縫 SSR 渲染。
3. **URL Hash 查詢參數縫合（`?lang=`）與狀態同步階層**：
   - 擴充 `parseRoute` 與 `routeHash` 解析與注入 `?lang=`（如 `#/song/pretender?lang=ja`），對歷史裸露 hash 路由 100% 向後相容。
   - 初始語系判定順序：(1) URL `?lang=` 參數 -> (2) `localStorage('hg_locale')` -> (3) 瀏覽器 `navigator.language` -> (4) 預設回退 `zh-TW`。
4. **票券美學語言切換器（`LanguageSwitcher`）**：
   - 於 Landing 頁頂部與全域標頭整合緊湊型票券切換鈕，具備 `1.5px border-ink/30`、深淺色對比、無模糊硬陰影與 ARIA 無障礙屬性，並符合 AAA 對比度。
5. **全域搜尋多語分類索引**：
   - 全域搜尋框（`SearchBox`）擴充索引各語系演出分類與特別標籤關鍵字，輸入日文、英文或韓文均可即時匹配對應巡演與場次，並與 ADR-0105 官方雙語別名索引無縫共存。
6. **紀念票券匯出快取隔離**：
   - 票卡渲染快取鍵納入語系識別碼 `${showKey}-${theme}-${locale}`，徹底杜絕切換語言後的跨語系快取污染。
7. **語系分支複製文字住 `lib/` 純函式（800 行模組化上限連動）**：
   - 四語 `locale === "en" / "ja" / "ko" / "zh-TW"` 三元分支天然膨脹行數，會撐破 ADR-0101 之 slip／navigator 單檔 800 行不變量。票根複製文字一律抽為 `site/src/lib/*-text.js` 純函式（如 `buildSongHistoryText`、`buildVenueHistoryText`，吃 `locale` 回傳字串陣列），slip 元件只留呼叫與剪貼簿寫入。`site/scripts/check-i18n.mjs` 認得此慣例（locale 三元分支視為合法在地化分支，不報錯）。

## Consequences
- 全面支援繁體中文、日語、英語、韓語四種語言，為海外歌迷提供無縫的母語體驗。
- 嚴格守護實體領域模型的歷史一手性與文獻真實度。
- 全站 static build 保持次秒級，全量 77 項端對端與不變量測試（17 suites）於 2.1 秒內全數通過。
- UI 層新增 `pnpm check:i18n`（含自測 fixtures）掃描 `components/`、`hooks/` 之裸 CJK 未經 `t()` 文案，漏翻在 CI 即紅燈；跨語系測試斷言一律走 `DICTIONARIES` 取期望文案，禁止寫死任一語系字串。
