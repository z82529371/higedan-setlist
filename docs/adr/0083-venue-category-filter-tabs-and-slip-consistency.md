# ADR-0083: 場地票券演出類型分流標籤列與雙票券體驗一致性規範 (VenueSlip Category Filter Tabs and Slip Consistency)

* **狀態**：已採納 (Accepted)
* **日期**：2026-10-11
* **關聯**：[ADR-0062](0062-two-layer-song-shows-categorization-and-unit-grouping.md), [ADR-0066](0066-song-category-buttons-and-venue-ui-ux-optimization.md), [ADR-0082](0082-mobile-first-bottom-sheet-navigation-and-rwd-architecture.md)
* **影響層面**：前台單據系統 (`site/src/components/slips.jsx`)、全站領域模型 (`CONTEXT.md`)

---

## 背景與問題陳述

在既有系統設計中：
1. **歌曲票券（SongSlip）**：已具備演出類型篩選標籤按鈕（`全部`、`巡演專場`、`特別專場`、`音樂祭`、`學園祭` 等），樂迷可依演出屬性自由分流查閱該歌曲的歷史登台足跡。
2. **場地票券（VenueSlip）**：雖然在 [ADR-0066](0066-song-category-buttons-and-venue-ui-ux-optimization.md) 中已升級為依巡演/活動進行結構化分組，但所有演出類型直接混雜陳列，缺乏如歌曲頁一般的演出類型分類按鈕。當一座知名場館（如日本武道館、NHK大廳、橫濱體育館）累積數十場演出（涵蓋專場巡演、音樂祭、聯合出演等）時，樂迷難以快速挑選出特定類型的歷史歷程。
3. **心智模型與操作一致性斷層**：使用者在歌曲分頁體驗了類型分流標籤列後，切換至場地分頁卻失去此能力，形成單據互動體驗的非對稱性。

---

## 決策內容

### 1. 鏡像歌曲頁模式的動態收斂標籤（Dynamic Tab Convergence，無「全部」按鈕）
- **完全鏡像 SongSlip：不設「全部」按鈕**：
  - 貫徹全站 [ADR-0070](0070-beginner-proof-single-column-kiosk-architecture.md)「拔除全部選項、預設精準命中首項」的極簡導航哲學。
  - 標籤列**不設「全部」選項**，根據該場館實際舉辦過的演出記錄，依官方全域分類順序（`CATEGORY_ORDER`）僅列出**實際在該場地有出演記錄**的分類（例如某場館僅辦過專場與音樂祭，則僅出現 `[巡演專場 (6)] [音樂祭 (2)]`）。
  - 進入場館時預設選取優先級最高的第一項（`availableTypes[0]`，通常為 `巡演專場`），避免資訊混雜堆疊。
  - 自動排除場次為 0 的分類，杜絕使用者點入空狀態的負面操作體驗。

### 2. 標籤篩選範疇（Filter Scope Isolation）
- **局部過濾、全局概況保留**：
  - **下半部（巡演／活動群組列表）**：即時依選中類型過濾顯示，並重新計算各群組的折疊狀態（`collapsedMap`）。
  - **上半部（場館全景基本履歷卡）**：累計總場次、場館量級 Tier 徽章、常唱曲目 Top 5、首次登台/最新出演里程碑、年度分佈頻率抽屜維持該場地的全景生涯統計，不隨標籤跳動。這符合與 `SongSlip` 100% 相同的心智模型。
- **場館切換時重設狀態**：
  - 當使用者挑選不同場館時（`venueName` 變更），`selectedType` 自動重設回該場館的第一項（`availableTypes[0]`）。

### 3. RWD 響應式佈局與設計系統共用
- **佈局對齊**：
  - 採用與 `SongSlip` 相同的響應式排版：桌面端平均分配填滿容器全寬（`md:flex md:flex-nowrap md:[&>*]:flex-1 gap-1.5`），行動端與平板採彈性等寬網格（`grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4`）。
  - 樣式完全共用 `songFilterPillClass`，確保按鈕選中態（品牌金 `bg-band`、立體陰影、粗體字）與未選中態（紙張底色、細邊框）全站一致。

### 4. 活動標題與群組卡片自適應行尾佈局架構（Responsive Header with Line-End Metadata on Desktop）
- **徹底解決橫向擠壓問題並拔除冗餘徽章**：
  - 原先在同一行橫向硬塞「類型徽章、長巡演名稱、共 N 場、★ 全勤徽章、▼ 展開按鈕」，導致標題被壓縮擠碎。
  - 上方標籤列已高亮選中該分類（如 `巡演專場`），因此下方每張卡片不再重複顯示冗餘的 `[巡演專場]` 徽章，徹底消除重複雜訊。
  - **大尺寸螢幕（Desktop / `sm:`）**：空間充裕時保持單行排版，左側由活動名稱自然延伸展開，右側行尾（Line-End）依序並排 `共 N 場` 數據、`★ 全勤 ({場數}/{總場數})` / `🔄 輪替` 徽章與 `▼ 展開` 按鈕，一覽無遺、極具節奏感。
  - **小尺寸窄螢幕（Mobile / `< sm:`）**：自動切換為上下兩層，第 1 層專供活動名稱 100% 全寬自然折行，第 2 層安放各數據徽章與展開鈕，徹底消除小螢幕橫向硬擠現象。
- **里程碑卡片支援雙行展開**：
  - 首次登台與最新出演的活動名稱由單行 `truncate` 升級為 `break-words line-clamp-2 leading-snug`，提供充足視覺空間。

### 5. 雙票券標頭資訊降噪與智慧門檻過濾（Dual Slip Header Decluttering & Smart Threshold Pruning）
- **分層架構分離（Identity vs Actions）**：
  - **Level 3a 身份宣告列**：
    - `VenueSlip`：場次統計（`共舉辦過 N 場演出`）、場地階層徽章（`venueTier`）與跨年足跡（`📅 2024 ～ 2026`）獨立為單一凝聚列。
    - `SongSlip`：演出總場次（`共出演 N 場`）、稀有／定番度徽章、近年封箱徽章、特殊版本場數與舞台角色定位（`🎯 {positionText}`，在手機端完整保留不隱藏、自然折行），組成純粹之歌曲身份列。
  - **Level 3b 操作工具列**：將動作型按鈕自成一列，左側置放複製操作（`📋 複製歷程`），右側靠攏導航與外部服務連結（`▾ 年度分佈`、`🗺️ Google Maps` / `▶ YouTube`、`🎧 Spotify`、`🎫 LiveFans`），徹底消除標籤與功能按鈕混排的凌亂與橫向擠壓。
- **智慧門檻過濾規則（Smart Thresholds）**：
  1. **首演／最新里程碑（Milestone Performances）門檻**：
    - `VenueSlip`：`sortedShows.length >= 3 && firstApp.showId !== latestApp.showId`。
    - `SongSlip`：`sortedAppearances.length >= 2 && firstApp.showId !== latestApp.showId`。當歌曲僅有 1 場演出時，首次披露與最新出演完全相同，直接由下方單一卡片呈現，隱藏冗餘之雙里程碑以節省垂直高度。
  2. **場地常唱曲目（Top Songs）降噪門檻**：設定 `venueShows.length >= 4 && topSongs.some(s => s.count >= 2)`。針對僅演出 1~3 場之海外巡演或小型場地，所有曲目演唱次數均為 1 次或全數相同（毫無統計排行意義），精準抑制偽統計雜訊。
  3. **年度分佈抽屜門檻**：雙單據統一限定跨越 `yearBreakdown.length >= 3` 個日曆年才提供展開按鈕，過濾短期無展開價值的年份分佈。

### 6. 場次單據工具列解構與全平台來源可及性（ShowSlip Action Toolbar & Mobile Source Availability）
- **雙列解構架構**：
  - **層級 A 核心行動與來源列（Primary Actions & Sources Row）**：
    - 左側：`[📸 產生紀念小卡]`（品牌金底突顯核心視覺匯出行動）+ `[📋 複製歌單]`（標準純文字複製與即時反饋）。
    - 右側：外部資料來源連結（`🔗 LiveFans` / `🔗 官方`），徹底解除原先在手機端的 `hidden sm:flex` 隱藏限制，在桌面與行動端皆 100% 完整露出且具備充足觸控熱區，行動端自適應流暢折行。
  - **層級 B 分析抽屜按鈕列（Secondary Analysis Reel）**：
    - 獨立為次級分析列，整齊容納 `[▾ 記號圖例]`、`[▾ 曲目更換 (N首)]`、`[▾ 專輯分佈]` 與 `[▾ ⚖️ 雙場對比]` 等抽屜開關，不再與外部來源連結同列搶佔寬度與互相擠壓。

---

## 影響與驗證

1. **單據系統對稱性**：`SongSlip` 與 `VenueSlip` 達成完整架構對稱，使用者在兩大維度（歌曲視角、場地視角）皆享有相同的分流操作體驗。
2. **自動化驗證**：
   - 執行 `node site/scripts/smoke-test.mjs`：11/11 測試套件全數通過。
   - 執行 `npm --prefix site run build`：Vite 生產環境打包無錯誤（321 modules transformed，0 errors）。
