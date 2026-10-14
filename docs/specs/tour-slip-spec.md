# Specification: 巡演總覽大票與雙模切換架構 (Tour Summary Slip & Dual-Mode Toggle)

## Problem Statement

當前 Official 髭男 dism Setlist 檔案庫在演出檢索維度上，僅提供「單場演出票根（`ShowSlip`）」與「巡演母單差異（`diff.skip` / `diff.insert`）」。歌迷在瀏覽經典長篇巡演（如 Major 1st 的 *Hall Travelers* 或 2024–2025 的 *Rejoice Arena Tour*）時，只能看到特定某一場的孤立紀錄，缺乏站在「整趟巡演（Tour as a Whole）」高度的宏觀聚合視角：
1. **曲目穩定度與演化不可見**：無法一眼看出哪些歌是這趟巡演每場必唱的「100% 核心全勤曲」、哪些是雙日連開時交替的「A/B 輪替曲」。
2. **限定驚喜曲湮沒於單場中**：特定場次突襲加碼的非樣板曲（如橫濱限定曲、千秋樂特別曲）分散在各站 diff 中，難以全面縱覽。
3. **巡演整體缺乏獨立分享錨點**：社群分享時只能傳送某一場的網址（`#/show/:id`），缺乏代表整趟巡演的專屬深層連結（`#/tour/:unitId`）。

## Solution

建立第四大領域票券視圖——「**巡演總覽大票（Tour Summary Slip，`TourSlip.jsx`）**」，並在既有 `show` 檢索流內無縫提供單場票根與巡演大票的平滑切換：
1. **四級語意出賽頻率階層（Frequency Tiers）**：
   - 核心全勤（Core 100%）：`count === totalShows`。
   - 高頻常駐（Regular $\ge 70\%$）：絕大部分場次登場。
   - 雙日輪替（Rotating $30\% \sim 70\%$）：雙日 A/B 歌單互換曲。
   - 限定突襲（Rare / Surprise $< 30\%$）：少數場次突襲加碼。
2. **三態突襲與版本歸納**：
   - 原創突襲曲（Surprise Originals）：獨立專區呈現，標註演出場次直通連結。
   - 特別彈唱／翻唱過場（Interludes & Solos）：序號為 `—`，不計入正式曲目數。
   - 同曲特殊版本（Version Variations）：自彈自唱或特定站點 note 與主曲目合併計算累積次數，附註歷程標籤。
3. **經典手帳連續票券版型（Continuous Slip Flow）**：
   - 頂部巡演票頭（全名、起訖時間、站點數、跨都道府縣規模徽章、影音標註）。
   - 打孔撕裂線（`TicketPerforationDivider`）與復古條碼頁尾（`TicketBarcodeFooter`）。
   - 直式全國日程足跡表（超過 10 場預設折疊，可一鍵展開全部，每站可直達單場票根）。
4. **雙模切換與完備狀態機（`#/tour/:unitId`）**：
   - 票券頂部提供微型分段開關：`[ 📜 巡演總覽大票 ]` ⟷ `[ 🎫 單場即時票根 ]`。
   - 點巡演單元預設看總覽大票；點場次或外部分享直達單場票根。
   - 帶入無效巡演 ID 時 100% 優雅降級回首頁（`landing`）。

## User Stories

1. As a fan reviewing a tour, I want to see the complete consensus setlist with play frequency badges, so that I can understand which songs formed the backbone of the tour.
2. As a fan investigating rare live moments, I want surprise inserts listed in a dedicated section with links to the exact shows where they were played, so that I can discover unique tour highlights.
3. As a fan following a multi-city tour, I want a chronological itinerary of all tour stops with venue names and start times, so that I can retrace the band's travel footsteps.
4. As a fan switching between tour overview and single show view, I want a clean toggle at the top of the ticket slip, so that I can transition without scrolling away or losing context.
5. As a fan sharing a tour on social media, I want the URL `#/tour/:unitId` to directly open the tour summary slip, so that friends immediately see the full tour chronicles.
6. As a developer maintaining the codebase, I want tour statistics to be calculated by a pure function (`computeTourStatistics`) in `domain.js`, so that it can be tested in Node without modifying raw JSON data.
7. As a mobile fan, I want the tour slip to adhere strictly to the single-column focus stream (`max-w-[960px]`), so that it scrolls smoothly on a phone with zero horizontal overflow.

## Implementation Decisions

- **Domain Model Seam (`domain.js`)**: Export a pure, memoized helper `computeTourStatistics(tourUnitData)` that aggregates `tpl`, `shows`, `full`, and `songShows` into structured template tracks, surprise tracks, interludes, and itinerary.
- **Component Seam (`TourSlip.jsx`)**: Decompose into a dedicated slip module under `site/src/components/slips/TourSlip.jsx` (< 800 lines), reusing `TicketPerforationDivider` and `TicketBarcodeFooter`.
- **Router Seam (`useArchiveRoute.js`)**: Extend `parseRoute` to recognize `#/tour/:unitId`, sync active tour selection, and gracefully fall back to `landing` mode if the unit is invalid.
- **Layout Seam (`ArchiveLayout.jsx`)**: In `tab === "show"`, render `TourSlip` when `showSubMode === "tour"` and `current.isTour === true`, otherwise render `ShowSlip`.

## Out of Scope

- V1 PNG canvas image export for the entire tour slip (deferred to V2 passport cards to prevent mobile memory exhaustion).
- Adding a 4th standalone navigation tab (preserved inside `show` tab).
- Modifying underlying `data/tours/*.json` files.
