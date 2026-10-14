# ADR-0101: 前端巨石檔案模組化與架構分層重構決策 (Frontend Modularization and Component Hierarchy Architecture)

## Status
Accepted

## Context

1. **背景與痛點分析**：
   - 隨著 Official 髭男 dism Setlist 檔案庫在功能與領域複雜度上的持續演進（包含雙模首頁/檔案庫切換、八大演出型態、歌曲/場次雙向檢索、自彈自唱與版本差異註記、日曆懸浮視窗與離屏長圖匯出），核心前端代碼逐漸向兩個巨石檔案高度集中：
     - `site/src/components/slips.jsx` 膨脹至 **2,375 行**，將場次票券（`ShowSlip`）、歌曲票券（`SongSlip`）、場館票券（`VenueSlip`）以及所有打孔撕裂線、條碼裝飾混合在一起。
     - `site/src/App.jsx` 膨脹至 **2,091 行**，同時承載了全域狀態、URL Hash 雙向同步、深層連結穿透、三套巨型導航器渲染函式（佔 700+ 行）與行動端抽屜佈局。
   - **負面影響**：
     - 單檔超過兩千行造成嚴重的認知負荷（Cognitive Load），開發者與 Agent 難以快速定位問題。
     - 任何小幅度的 UI 調整或狀態變更皆容易波及不相關的視圖層，缺乏隔離度。
     - 巨石檔案的 Git Diffs 巨大且難以進行高質量的程式碼審查。

2. **經 `/grill-with-docs` 決策確認之邊界**：
   - 採「**全面分層解耦（視圖元件化 ＋ 邏輯 Hook 化 ＋ 佈局層隔離）**」模式。
   - 堅持**行為 100% 等價**（Zero Behavioral & Visual Regression）。
   - 堅持嚴格遵循專案領域約束（單欄聚焦流 `max-w-[960px]`、八大演出分類、自適應雙層分段分頁 `CHUNK_SIZE=50`, `PAGE_SIZE=10`）。
   - 保證向後相容：`components/slips/index.js` 導出相同介面，既有引用無痛遷移。

## Decision

1. **領域票券層拆分 (`site/src/components/slips/`)**：
   - `TicketCommon.jsx`：抽取共用裝飾元件與輔助函式（`TicketPerforationDivider` 票券打孔線、`TicketBarcodeFooter` 復古條碼頁尾、`getSourceLabel` 來源記錄轉換、`songFilterPillClass`）。
   - `ShowSlip.jsx`：場次票券主視圖（曲目序列、版本差異 `skip`/`insert`、安可標記、MC 備註、來源徽章與長圖匯出）。
   - `SongSlip.jsx`：歌曲票券主視圖（累積場次統計、首唱紀錄、專輯與年代矩陣）。
   - `VenueSlip.jsx`：場館票券主視圖（歷史舉辦足跡、歷年演出記錄清單）。
   - `index.js` 與 `slips.jsx`：對外提供統一導出入口，確保 100% 向後相容。

2. **專用導航控制群抽離 (`site/src/components/navigators/`)**：
   - `PaginationPills.jsx`：自適應雙層分段分頁膠囊（超過 50 筆啟用大區間，細分頁每頁 10 筆）。
   - `ShowNavigator.jsx`：演出場次專用導航器（八大分類膠囊 ＋ 年份篩選 ＋ 巡演單元/場次列表）。
   - `SongNavigator.jsx`：歌曲庫專用導航器（專輯分組／次數排序切換 ＋ 歌曲清單）。
   - `VenueNavigator.jsx`：場館專用導航器（地區分組／次數排序切換 ＋ 場館清單）。

3. **邏輯與狀態自訂 Hooks (`site/src/hooks/`)**：
   - `useArchiveFilter.js`：封裝八大分類過濾、年份過濾、專輯/地區分組與即時統計計算（`unitsByCategory`, `categoryStats`, `yearStats`, `filteredSongs`, `filteredVenues`）。
   - `useArchiveRoute.js`：封裝 URL Hash 雙向監聽、深層連結穿透（`#/song/:id`, `#/show/:id`, `#/venue/:name`）、行動端抽屜草稿狀態（`draftState`）與視窗高寬補償。

4. **佈局容器與頂層調度器收斂 (`site/src/components/layout/` & `App.jsx`)**：
   - `ArchiveStatusBar.jsx`：頂部全寬置頂動態狀態列。
   - `ArchiveHeader.jsx`：檔案庫大標題與三大查詢方向切換 Tabs。
   - `FilterDrawer.jsx`：行動端底部抽屜面板（含草稿確認與取消機制）。
   - `ArchiveLayout.jsx`：檔案庫模式專用版面容器（整合狀態列、標頭、導航切換、票券流與行動端抽屜）。
   - `App.jsx`：瘦身為純粹的 Top-level Coordinator 與雙模路由器，自 2,091 行劇降至約 110 行（遠低於 200 行上限），職責一目了然。

## Consequences

- **正面影響**：
  - **模組職責清晰（Single Responsibility）**：視圖（Slips）、導航（Navigators）、狀態（Hooks）、佈局（Layout）各自獨立，單檔行數全數控制在 200～800 行之健康範圍。
  - **修改邊界安全（Isolated Blast Radius）**：調整票券 UI 絕不影響導航邏輯；調整篩選演算法絕不破壞視圖 JSX。
  - **100% 綠燈回歸驗證**：重構後 `pnpm build` 與全套管道 Smoke Tests（11 個子測試）皆為 0 錯誤通過，完全無 DOM 打亂或深層連結失效之虞。
  - **大幅提升 AI Agent 與工程師之協作效率**：後續任務可精準鎖定單一子模組，大幅節省上下文 Token 消耗。

- **潛在限制與權衡**：
  - 模組數量增加，需要清晰的目錄分層與統一的 `index.js` 導出契約進行維護。
