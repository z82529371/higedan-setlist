# ADR-0127: 小尺寸全生涯巡演足跡極大化地圖與行動端篩選抽屜架構 (Mobile Tour Journey Maximized Canvas & Filter Drawer Architecture)

## Status
已採納 (Accepted)

## Context
在 ADR-0125 與 ADR-0126 中，全生涯巡演足跡已升格為一級獨立頁面（`viewMode === "journey"`，`#/map/journey`），並支援行動端直式三聯幾何畫布（540×930）。然而在小尺寸行動螢幕（`< md` / `< 768px`）上實際觀看巡演動畫時，存在以下互動摩擦點：
1. **地圖尺寸被多餘邊界與頁首擠壓**：原本外層 article padding 與桌面式頁首圖標佔據大量空間，導致列島縮小。
2. **篩選工具在小螢幕折行散落**：年份下拉選單、專場巡演下拉選單與電視演出開關直接暴露在頁面上，佔據寶貴高度。
3. **行動端操作手勢與主資料庫（Archive）分裂**：主檔案庫採用底部懸浮圓鈕與滑出式篩選抽屜，而巡演頁面缺乏統一的行動端互動語彙。

## Decision
確立全生涯巡演足跡頁面（`JourneyPage`）之「票夾經典置中標題 ＋ 懸浮按鈕與播放器上下分層 ＋ 票夾規格懸浮控制列」架構：

1. **標題完全比照「票夾（TicketBook）」經典排版（置中、不標年份）**：
   - 頂部貼牢**紙膠帶（`SLIP_TAPE` / `washi-tape`）**。
   - 置中**黃色黑邊正方形圖標（🚐）**與等寬大寫字 `CONCERT TOUR JOURNEY // LIVE ARCHIVE`。
   - 核心大標題：`Official髭男dism 全生涯巡演足跡`（固定使用通用足跡標題，不隨年份變動，完全置中）。
   - 置中**巡演場次徽章**（`🚐 {count} STOPS`）。
2. **懸浮按鈕與播放器上下分層（Non-Overlapping Vertical Clearance）**：
   - 播放控制列維持完整舒適寬度，不強行左右擠壓縮小。
   - 頁面容器底部預留 `pb-24 sm:pb-20` 安全邊界，讓播放器自然位於懸浮按鈕上方，兩者上下分層、按鈕與時間軸 100% 互不重疊遮擋。
3. **懸浮控制列比照票夾規格（MobileFloatingControls with TicketBook Parity）**：
   - **右下角**：圓形 `🚐` 篩選按鈕（`mobile-journey-filter-fab`，點擊開啟底部抽屜）＋ 語系切換 FAB。
   - **左下角**：`← 返回檔案庫`（`mobile-archive-fab`）膠囊按鈕 ＋ `🏠 首頁` 膠囊按鈕。
4. **底部巡演篩選抽屜（JourneyFilterDrawer with Staged Commit）**：
   - 點擊右下角 `🚐` 圓鈕時自螢幕下方滑出抽屜，收納專場巡演、年份與電視演出開關，底部設有「確認套用」草稿隔離按鈕；頁面主體徹底淨空無零散下拉選單。
5. **專屬底座播放器與地圖一體化（Docked Player Transport）**：
   - 播放控制條緊貼直式地圖正下方一體化呈現（播放/暫停、時間軸拖曳、倍速 1×/2×/4×、鏡頭跟隨）。
6. **大尺寸全站單欄聚焦寬度與手帳背景透明度嚴格對齊（Desktop max-w-[960px] & Transparent Notebook-Grid Parity）**：
   - 桌面端嚴格廢除任何 1080px 任意特例寬度，單一外層容器採用 `<div className="mx-auto max-w-[960px] px-4 sm:px-6 pt-4 pb-24 sm:py-8 select-none">`，頂部返回工具列與主要收據卡片 100% 繼承 `max-w-[960px]` 限制。
   - 徹底移除 `min-h-screen bg-paper` 不透明遮罩，使全域手帳方眼格線（`.notebook-grid`）、紙質噪點與檯燈環境光自然貫穿透出，與首頁、主檔案庫、個人巡演票夾達成 100% 外框邊界與手帳質感一致性，並由 `site/tests/invariants/design-tokens.test.js` 自動化守衛。

## Consequences
- **Positive**: 手機端地圖達到物理極限最大化，列島、海外與沖繩島嶼觸控面積達到最高。
- **Positive**: 頁面完全淨空無雜質，篩選完整收納入底部抽屜，與主檔案庫操作體驗 100% 統一。
- **Positive**: 支援草稿隔離（Staged Commit），點擊確認套用才重算路線，避免誤觸引發頻繁運算。
- **Positive**: 全螢幕模式維持 100% 行動手勢縮放與小巴／飛機運鏡追隨。
