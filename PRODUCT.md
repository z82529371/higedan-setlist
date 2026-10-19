# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Official 髭男 dism（髭男）歌迷、巡演現場觀眾與音樂愛好者。
- 在參與演唱會前/後、聆聽專輯或探索樂團歷史時，需要快速雙向檢索歌曲演出歷程（如哪些場次唱過某首歌、版本差異、初披露、自彈自唱）、巡演編年史與各場次完整曲目清單。

## Product Purpose

- 系統性收錄 Official 髭男 dism 公開演出的場次與曲目，建立高可信度、高檢索效率的演出與歌曲雙向檔案庫。
- 解決歌迷在社群或碎片化資訊中難以追溯歷史巡演曲目、歌曲演出次數、限定改編（アレンジ）與稀有演出紀錄的問題。
- 成功指標：極速檢索反應、精準無歧義的演出曲目雙向關聯、跨年度巡演與多種演出型態的清晰展示。

## Positioning

- 專注於 Official 髭男 dism 演出歷史的權威檔案庫，具備共識模板差異化演算法（巡演模板 + 場次 diff）與嚴謹的領域本體（Domain Ontology）。
- 嚴格劃分八大演出類型（巡演專場、特別專場、聯合專場、店家活動、音樂祭、學園祭、電視演出、線上直播），並完整保留一手資料來源查證（LiveFans、官方公告、Twitter 等）。

## Operating Context

- 桌面端與行動端瀏覽器（Web App），主要於觀賞演唱會前後、通勤聽歌、討論歌單或巡演回顧時查閱。
- 資料層由 `data/tours/`、`data/events/` 與 `data/songs/` 結構化 JSON 驅動，經同步腳本（`sync-data.mjs`）構建為靜態/輕量前端資料包。
- 互動核心採用雙模架構（Dual-Mode Architecture）：進站為極致留白之「純淨聚光燈首頁門面（Spotlight Landing Page）」，提供大型聚焦搜尋框、熱門探索標籤與三大特色亮點卡；進入「檔案庫檢索模式（Archive Mode）」後切換為緊湊 AppBar、單欄聚焦流視圖、四層膠囊導航（類型 → 年份 → 活動 → 場次）與自適應兩層分段分頁機制（`CHUNK_SIZE = 50`, `PAGE_SIZE = 10`）。

## Capabilities and Constraints

- **純淨首頁與雙模切換**：首頁零按鈕牆干擾，具備高級官方檔案館質感；支援一鍵直達檔案庫，並保留「🏠 回首頁」隨時切回門面。
- **雙向檢索**：支援「歌曲 → 歷史演出場次/統計」與「場次/活動 → 曲目清單/版本註記」雙向流暢切換。
- **單欄聚焦流約束**：全站維持 `max-w-[960px] mx-auto` 單一垂直滾動軸，杜絕雙滾動條拉扯與雜亂視窗切換。
- **嚴謹命名規範**：場館名稱約定中文為主、品牌劇場保留原文；演出標題保持純淨官方名，不追加城市後綴。
- **Hash 路由穿透**：全域搜尋與分類切換與 URL Hash 雙向同步，支援深層連結直達特定歌曲或場次，外部深層連結自動直達檢索票券而不受首頁阻擋。
- **資料保護約束**：同步腳本嚴格保護使用者自訂 `shortTitle`，不允許無序覆寫。

## Component & Domain Terminology Mapping

| 領域概念 / 介面元素 | 職責與展現內容 | 對應前端模組 |
| :--- | :--- | :--- |
| **場次篩選器**（Show Navigator） | 演出類型 → 年份 → 巡演專場 → 場次日期切換 | `site/src/components/navigators/ShowNavigator.jsx` |
| **歌曲篩選器**（Song Navigator） | 專輯分類 / 登場次數排行 → 歌曲切換 | `site/src/components/navigators/SongNavigator.jsx` |
| **場地篩選器**（Venue Navigator） | 日本地理分區 / 登場次數排行 → 場館切換 | `site/src/components/navigators/VenueNavigator.jsx` |
| **場次票根**（Show Slip） | 單場演出票根、本篇/安可曲目單、前場曲目 Diff | `site/src/components/slips/ShowSlip.jsx` + `ShowMetadataBox.jsx` |
| **巡演總覽票券**（Tour Slip） | 巡演定番歌曲、輪換曲、驚喜曲目與巡演足跡日程 | `site/src/components/slips/TourSlip.jsx` |
| **歌曲詳情票券**（Song Slip） | 歌曲出賽履歷、版本統計、首演/最新演出里程碑 | `site/src/components/slips/SongSlip.jsx` + `SongMilestonesDrawer.jsx` |
| **場館詳情票券**（Venue Slip） | 場館歷史演出編年史、地理標籤與初次/最近登場 | `site/src/components/slips/VenueSlip.jsx` |
| **行動版篩選抽屜**（Filter Drawer） | 手機版底層彈出之階層篩選面板與麵包屑指示 | `site/src/components/layout/FilterDrawer.jsx` |
| **全域搜尋彈窗**（Search Modal） | 四語系無阻力跨語檢索歌曲、場館、巡演與日期 | `site/src/components/SearchBox.jsx` |
| **紀念卡片彈窗**（Memorial Card Modal） | 專場紀念票根點陣/懷舊視覺卡片渲染與 PNG 匯出 | `site/src/components/MemorialCardModal.jsx` |

## Brand Commitments

- 繁體中文為核心介面語系，尊重日語音樂圈專用術語與原始標題（如 弾き語り 對應「自彈自唱」、アレンジ 對應「版本差異」）。
- 品牌識別與現場調性相符：結合 Official 髭男 dism 現場演出的感染力與音樂精準度，融入現場演唱會的視覺張力、巡演主題氛圍與精緻動態細節，但保持底層資料的高清晰度。

## Evidence on Hand

- `CONTEXT.md`：完整領域模型語言定義（巡演、事件、場次、曲目清單、演出類型八大分類、分組維度與導航規則）。
- `data/` 目錄：收錄自獨立時期（2012–2015）至主流時期（Major）各大體育館（Arena）巡演、音樂祭、學園祭與電視演出之完整真實資料庫。
- `docs/adr/`：架構決策紀錄（含 ADR-0070 單欄聚焦流與膠囊導航）。

## Product Principles

1. **真實資料為本（Truth in Data）**：演出曲目與場次資訊必須源於可驗證之官方或公認記錄，不捏造歌單或模糊演出形式。
2. **極速雙向可達（Effortless Bi-directionality）**：從任何一首歌曲一鍵抵達它所有的演出歷史，從任何一場演出一秒透視所有歌曲的背景脈絡。
3. **現場張力與結構清晰並存（Live Energy, Structural Clarity）**：在嚴謹單欄資訊架構下營造巡演現場的氛圍感與細節質感，讓檔案庫兼具實用工具與歌迷情感共鳴。
4. **零認知負擔導航（Zero-Friction Navigation）**：利用膠囊層級與無差別全域搜尋消化龐大的編年史資料，徹底避免按鈕牆與雙滾動軸干擾。
