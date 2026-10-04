# ADR-0066: 歌曲類型篩選按鈕平均分配、歌曲場次計數修正與場地列表 UI/UX 優化

- **日期**：2026-10-03
- **狀態**：已採納 (Accepted)
- **關聯**：[ADR-0062](0062-two-layer-song-shows-categorization-and-unit-grouping.md), [ADR-0064](0064-unified-ticket-bars-and-single-column-slip-layout.md), [ADR-0065](0065-all-category-year-filters-and-ticket-bar-count-indicators.md)

---

## 背景與問題陳述

1. **歌曲類型篩選按鈕未平均分配**：
   - 歌曲票根（`SongSlip`）頂部的演出類型篩選（巡演專場、特別專場、聯合專場、音樂祭、學園祭、電視演出、線上直播）原先採用 `flex flex-wrap gap-1.5`，按鈕寬度僅隨文字長度變化，導致右側留白不齊、各按鈕寬度不一，未能與頁面上其他分段按鈕保持平均分配的視覺對齊。
2. **歌曲選項按鈕場次計數遺漏 trackKey**：
   - 歌曲 Ticket Bar 選項按鈕上的演出場次說明，使用了 `trackShows.get(selSong)`，但 `trackShows` 的鍵值規格為 `trackKey("song", songId)`（如 `song:pretender`），導致 lookup 永遠回傳 `undefined`，按鈕顯示為 `0 場`。
3. **場地選單與票根體驗平鋪且資訊冗餘**：
   - 場地抽屜選單僅依地理分區陳列，缺乏「累積場次排行榜」視角；且分區標題缺少場地數量統計。
   - 下方場地票根（`VenueSlip`）原先將該場地的所有場次平鋪直敘，且每行演出重複顯示該場地名稱與城市（使用者已在該場地票根中），缺少巡演分組結構與折疊機制。

---

## 決策內容

1. **歌曲演出類型按鈕平均分配（Evenly Distributed）**：
   - 在桌面端（`md:`）採用 `md:flex md:flex-nowrap md:[&>*]:flex-1 gap-1.5`，所有可選類型均勻填滿票根卡片全寬，各按鈕寬度精確相等（`100% / N`）。
   - 在行動與平板端採用響應式等寬網格（`grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4`），避免窄螢幕文字溢出。
   - 按鈕樣式使用 `w-full flex items-center justify-center gap-1 text-center`，置中對齊類別名稱與次數。
2. **修復歌曲選項按鈕場次計數**：
   - 在 `App.jsx` 中將計數取值修正為 `trackShows.get(trackKey("song", selSong))`，正確顯示全檔案庫累積場次（例如 `Pretender ── 204 場`）。
3. **場地抽屜選單支援雙排序與處數統計**：
   - 抽屜頂部加入切換控制項（50% / 50% 平均分配）：
     - `📍 依分區地理`：分區標題顯示 `📍 {region}` 與 `{count} 處場地`。
     - `依累積場次`：依總演出場次降序排列，採用簡潔等寬灰字 `#1, #2...`（遵循無火 🔥、無特殊變色之設計原則），並在次標題標註分區。
4. **場地票根（VenueSlip）升級為巡演結構化分組**：
   - 依「活動 / 巡演」將該場地的場次分組收納，並以最新年份巡演優先倒序排序。
   - 每組巡演標題顯示活動類別徽章、巡演全名、該巡演在此場地的場次數，超過 3 場自動提供展開/收合切換。
   - 項目去重冗餘的場地名稱，聚焦於演出日期（`📅 2024-09-28`）、開演時間（`⏰ 18:00 開演`）、曲目數（`21 首曲目`）及「檢視歌單 →」按鈕。

---

## 影響與驗證

- **驗證方式**：
  - `node site/scripts/smoke-test.mjs`：11/11 測試全部通過。
  - `npm run build`（`pnpm sync && vite build`）：生產環境建置成功（149 modules transformed，0 errors）。
