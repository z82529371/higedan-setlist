# ADR-0108: 行政地名多語在地化與場館一手真實邊界（Administrative Geography Localization & Venue Integrity Boundary）

## Status
Accepted

## Context
1. **多語系介面下的地名視覺割裂**：
   在導入 ADR-0107 多國語言在地化架構後，全站 UI 介面、導覽分類、演出類型與五大地理大區（`region`）皆已支援繁體中文（`zh-TW`）、日本語（`ja`）、English（`en`）與 한국어（`ko`）。
   然而，巡演日程足跡（`TourSlip`）中的各站城市（如 `#01 2024-09-28 橫濱 @ 橫濱Arena`）與場館詳情（`VenueSlip`）之副標題（如 `神奈川縣 · 橫濱`）仍直接輸出資料庫底層的繁體中文，導致日語使用者看到「橫濱」（非日本新字體「横浜」）、「愛媛縣」（非「愛媛県」），英語使用者看到無法閱讀與發音的漢字地名。
2. **實體領域真實與公有地理標籤之概念混淆**：
   若不釐清「地名（Geography）」的邊界，容易發生兩種極端偏差：
   - 極端 A：誤將場館名稱（`venue`）隨意英文化或意譯（例如將 `日本武道館` 私譯為 `Nippon Budokan`、將 `横浜アリーナ` 拆解多語），破壞歷史建築實體與票根一手文獻之真實性（違反 ADR-0107）。
   - 極端 B：因堅持一手真實而全面拒絕翻譯城市與都道府縣，造成海外歌迷在巡演日程與搜尋體驗上的長期割裂。
3. **儲存層架構穩定性（Single Source of Truth Invariant）**：
   全庫 422+ 筆場次歷史資料與校驗同步管線（`sync-data.mjs`、`validate-data.mjs`）皆高度依賴 [`data/venues.json`](../../data/venues.json) 作為權威單一真理來源（SSOT，ADR-0076）。若直接將儲存層欄位改為多語結構，將引發破壞性變更（Breaking Change）。

## Decision
1. **嚴格確立「行政地名」與「場館實體」之領域邊界**：
   - **行政地理標籤（`city` 城市、`prefecture` 都道府縣 / 國家行政區）**：屬於客觀之公共地理分類，**100% 納入四語在地化翻譯**。
   - **場館名稱（`venue`）**：屬於不可分割之一手歷史演出建築實體（如 `橫濱Arena`、`國立代代木競技場 第一體育館`、`台北小巨蛋`、`K-Arena`），**嚴格維持一手原始名，嚴禁民間意譯或多語拆分**。
2. **儲存層與展現層職責分離（Decoupled Storage & Presentation）**：
   - 底層 [`data/venues.json`](../../data/venues.json) 與歷史場次 JSON 維持現行繁體中文正體標籤作為單一真理來源，存儲結構 100% 保持穩定，完全不更動。
   - 地名翻譯完全收納於前端 UI 展現層，由獨立模組 [`site/src/lib/locales/geography.js`](../../site/src/lib/locales/geography.js) 提供 78 個城市與 47 個都道府縣／國別之四語對稱字典，注入各語系字典（`dict.cities` 與 `dict.prefectures`）。
3. **全站展示層與導航器全面在地化（Universal Presentation & Navigator Coverage）**：
   - **巡演日程足跡（`TourSlip`）**：各站巡演城市改以 `t("cities." + stop.city, stop.city)` 渲染（如 `en: [Yokohama]`、`ja: [横浜]`、`ko: [요코하마]`、`zh-TW: [橫濱]`）。
   - **場館詳情票券（`VenueSlip`）**：標頭地理副標改以 `（{t("prefectures." + pref, pref)} · {t("cities." + city, city)}）` 渲染，並在複製文字管線中注入在地化文字。
   - **場次篩選器（`ShowNavigator`）**：第 4 步場次切換按鈕渲染城市標籤時呼叫 `t("cities." + s.city, s.city)`（如韓文 `08-08 서울`、英文 `08-08 Seoul`）。
   - **場地篩選器（`VenueNavigator`）**：場地按鈕副標題渲染 `（{t("cities." + v.city, v.city)} · N場）`（如英文 `台北小巨蛋（Taipei · 2 shows）`）。
   - **場次票根標頭（`ShowMetadataBox`）與導覽**：票根標頭場館右側城市 `（{t("cities." + s.city, s.city)}）`、前一場／後一場步進導覽提示、以及 `ShowSlip` / `MemorialCardModal` 複製歌單與紀念卡片匯出字串全面統一在地化。
   - **歌曲與輔助展現層**：`SongSlip` 出賽清單、`SongMilestonesDrawer` 歌曲里程碑、`ArchiveStatusBar` 狀態列、`ArchiveLayout` 行動抽屜與麵包屑、以及 `CalendarModal` 日曆彈窗全面套用。
   - **全域搜尋結果（`SearchBox`）**：場次與場館候選副標改以在地化城市呈現。
4. **全域搜尋多語地名零阻力跨語檢索（Cross-Lingual Search Indexing）**：
   - `SearchBox` 引進 `matchGeography(needle, city, prefecture, region)`，無差別索引四語系之城市與行政區變體。使用者無論身處哪種介面語系，鍵入 `Yokohama`、`横浜`、`요코하마` 或 `橫濱` 均可即時精準檢索並命中對應場館。
5. **海外地名與特殊場次譯名標準**：
   - 台灣（台北）：`Taipei` / `Taiwan`（繁中：台北 / 台灣，日：台北 / 台湾，韓：타이베이 / 대만）。
   - 韓國（首爾）：`Seoul` / `South Korea`（繁中：首爾 / 韓國，日：ソウル / 韓国，韓：서울 / 한국）。
   - 韓國（高陽）：`Goyang` / `South Korea`（繁中：高陽 / 韓國，日：高陽 / 韓国，韓：고양 / 한국）。
   - 線上直播：`Livestream`（繁中：線上直播，日：配信ライブ，韓：온라인 라이브）。
6. **優雅安全回退不變量（Graceful Fallback Invariant）**：
   - 查表統一依循 `t("cities." + city, city)` 與 `t("prefectures." + pref, pref)`。若日後新增未知城鎮且尚未登錄字典，系統安全回退原字串，絕不報錯或破版。

## Consequences
- 解決了海外使用者在巡演足跡、場館大票與全域搜尋中面臨的繁體中文漢字視覺割裂，提供順暢自然的母語體驗。
- 守護了實體場館一手真實文獻的不可侵犯性，劃清了「建築實體一手真理」與「公共行政地理多語化」的架構Seam。
- `data/venues.json` 與歷史資料庫 100% 保持相容性，既有爬蟲管線與測試套件零負擔。
- 全量 88 項端對端與不變量測試（18 suites）於 2.6 秒內全數通過，Static Build 保持極速。
