# ADR-0109: 測試架構抽離、領域模組化與無頭 SSR 單例最佳化（Modular Test Architecture & Headless SSR Singleton）

## Status
Accepted

## Context
1. **單一巨石測試腳本的維護瓶頸**：
   自專案早期建立常駐冒煙測試（ADR-0044）以來，隨歷次架構演進（ADR-0101 前端分層、ADR-0102 巡演總覽、ADR-0105/0106 曲名實體邊界、ADR-0107 多語系、ADR-0108 地名在地化），所有測試斷言全部疊加在單一腳本 `site/scripts/smoke-test.mjs` 中，膨脹至 4,000 餘行、17 個子套件、88 項斷言。
2. **工作區目錄職責混淆（ADR-0103 Monorepo 邊界）**：
   `site/scripts/` 目錄的本質為資料維護與管線維護工具（如 `sync-data.mjs`、`validate-data.mjs`、`check-i18n.mjs`），將全部自動化測試直接堆放在 scripts 目錄內混淆了維護邊界。
3. **無頭 SSR 伺服器重複開銷與執行分流需求**：
   原有測試在單一檔案內透過 `vite.createServer({ middlewareMode: true })` 啟動無頭 SSR 伺服器供 React 元件渲染。若直接粗暴拆分多個檔案，每個檔案各自啟動 Vite 會導致開銷爆炸；同時，純管線演算法（如 Bangkok 曲目重排、單調性解析）並不需要 Vite 與 React，卻被迫等待伺服器啟動。

## Decision
1. **建立專屬獨立測試目錄（`site/tests/`）**：
   - 嚴格遵守 ADR-0103 monorepo 邊界，在 `packages: ['site']` 下建立獨立 `tests/` 目錄，將測試自維護腳本中完全隔離。
2. **三層領域模組化分群（Three-Tier Domain Modularization）**：
   - **`site/tests/pipeline/`（純管線演算法與資料轉換）**：
     - `bangkok-reorder.test.js`（曼谷重排與模板錨定，ADR-0042）
     - `solo-covers.test.js`（成員 Solo 與正式標題曲翻唱分流，ADR-0043/0032）
     - `noise-filter.test.js`（MC 雜訊過濾與資訊性 MC 保留，ADR-0005/0025）
     - `resolve-monotonicity.test.js`（解析單調性、版本註記與安可邊界，ADR-0020/0028）
     - `canonical-titles.test.js`（歌曲主標題與官方雙語別名，ADR-0105）
     - `rerecorded-boundary.test.js`（官方再錄音版本實體邊界，ADR-0106）
   - **`site/tests/invariants/`（專案規範與代碼守衛）**：
     - `modularization.test.js`（800 行上限、八大分類不變量、卡紙圓角與無模糊陰影，ADR-0101）
     - `design-tokens.test.js`（設計 Token、主題色盤、Dedicated URL 路由接縫，DESIGN.md）
     - `workspace-topology.test.js`（Monorepo 工作區拓撲、Node 22 規範、songs.json 同步與 ADR 索引，ADR-0103）
   - **`site/tests/ui/`（React 元件渲染、SSR 整合與在地化）**：
     - `ssr-smoke.test.js`（導覽元件基礎 SSR 掛載煙霧測試）
     - `route-machine.test.js`（自訂 Hooks、URL Hash 路由狀態機與深層連結穿透，ADR-0101）
     - `tour-statistics.test.js`（巡演統計引擎、登場率分類、突襲插入曲與 TourSlip，ADR-0102）
     - `i18n-foundation.test.js`（四語系 i18n 核心基礎設施、?lang= 查詢參數與切換器，Issue #16）
     - `localized-presentation.test.js`（八大分類、四大標籤、五大分區在地化與對稱性，Issue #17）
     - `search-box.test.js`（全域搜尋框多語關鍵字與雙語別名檢索，Issue #18）
     - `ticket-export.test.js`（紀念票卡長圖匯出在地化與快取隔離，Issue #19）
     - `geography-localization.test.js`（行政地名四語在地化與場館一手真實邊界，ADR-0108）
3. **無頭 SSR 伺服器惰性單例與共用設施（`site/tests/helpers/`）**：
   - 建立 `site/tests/helpers/vite-server.js`：
     - 封裝 `getViteServer()` 惰性單例，配置 `hmr: false, ws: false`，杜絕 WebSocket 衝突與事件迴圈殘留。
     - 註冊自動 `after()` 與 `process.on('exit')` 清理機制，確保在測試結束時自動無縫關閉。
     - 匯出 `loadModule()`、`getReactAndRenderer()`、`renderComponent()` 與 `withHash()` 輔助工具。
   - 建立 `site/tests/helpers/mock-data.js`：封裝共用測試曲庫與字典對映。
4. **細粒度分流執行指令（Targeted Test Runners）**：
   - `site/package.json` 與 root `package.json` 新增：
     - `pnpm test:pipeline`：僅執行純管線演算法，毫秒級完成。
     - `pnpm test:invariants`：僅執行代碼規範與守衛，120ms 內完成。
     - `pnpm test:ui`：僅執行 UI、SSR 與多語系整合測試。
5. **100% 向後相容代理門面（Backward Compatibility Facade Seam）**：
   - 將原本的 `site/scripts/smoke-test.mjs` 改寫為輕量透明代理門面（<40 行），內部透過子程序轉發執行 `node --test tests/**/*.test.js`，保持與現有 CI 工作流（`.github/workflows/ci.yml`）、文檔連結與習慣直接調用 `smoke-test.mjs` 的行為完全一致。

## Consequences
- 成功將 4,000 行巨石檔案解構為 17 個單一職責、清晰映射 ADR 的模組化測試檔案。
- 零額外依賴第三方測試套件（如 Vitest 或 Jest），徹底發揮 Node.js 22 原生 `node:test` 的高速與輕量優勢。
- 開發純資料轉換算法時，可直接透過 `pnpm test:pipeline` 在 50ms 內獲得即時回饋，開發體驗顯著提升。
- CI 與本機 `pnpm test` / `pnpm check` 維持全綠燈，所有 88 項斷言與 17 個 Suite 完整通過。
