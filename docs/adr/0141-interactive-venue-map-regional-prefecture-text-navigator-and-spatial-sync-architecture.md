# ADR-0141: 互動式場地地圖分區都道府縣文字導覽與空間雙向連動架構 (Interactive Venue Map Regional Prefecture Text Navigator & Spatial Sync Architecture)

- **狀態**：Accepted
- **日期**：2026-11-02
- **相關議題**：場地地圖選場認知負擔、非日本歌迷地理定位障礙、雙向空間連動、無障礙與防爆版

---

## 背景與問題意識 (Context & Problem Statement)

在先前 ADR-0124 與 ADR-0140 奠定了「互動式場地地圖（VenueMapCanvas）」與「統一搜尋（Omnibox）」後，全庫涵蓋日本 43/47 都道府縣（340+ 場館）與亞洲海外 4 國 5 城 6 館。

然而，在純地圖檢索情境（`mode === "venues"`）的全國總覽視圖下，使用者面臨一項嚴重的認知痛點：
1. **海外與非日本本土歌迷的地理盲區**：
   - 全國總覽僅呈現日本本土列島 47 都道府縣之空白 SVG 輪廓。
   - 非日本使用者無法單憑地理多邊形辨識各縣方位（例如無法在無文字輔助下找出山陰聖地「島根」、「鳥取」，或中部「石川」、「長野」在哪裡）。
2. **缺乏文字輔助檢索門面**：
   - 過去必須將滑鼠游標逐一懸停在 47 個縣市路徑上方才能查看 HUD 提示，檢索效率低且行動觸控體驗不友善。
3. **未踏破 4 縣與海外的空間認知割裂**：
   - 官方未曾造訪之 4 縣（岩手、三重、和歌山、宮崎）在純地圖上僅為虛線，無文字清單對照時容易讓歌迷誤認資料遺漏。

---

## 決策內容 (Decision Record)

### 1. 雙層分區文字導覽器（RegionalPrefecturePicker）
在 `VenueMapCanvas` 全國總覽（`mode === "venues" && !selectedPrefecture`）正下方嵌入高對比票券風格之文字導覽面板：
- **Tier 1：日本 8 大地方 ＋ 亞洲海外分段頁籤（Region Tabs）**：
  - 定義 `JAPAN_8_REGIONS` 於 `site/src/lib/venue-map.js`（預設聚焦為高頻場館集中的關東地方，不設置冗餘的「全部」頁籤，確保單一分區膠囊聚焦）：
    - `關東 (Kanto)`
    - `近畿 (Kinki)`
    - `🌱 中國 (Chugoku - 山陰聖地)`
    - `中部 (Chubu)`
    - `東北 (Tohoku)`
    - `九州・沖繩 (Kyushu & Okinawa)`
    - `四國 (Shikoku)`
    - `北海道 (Hokkaido)`
    - `✈️ 海外 (Overseas Asia)`
- **Tier 2：分區所屬都道府縣膠囊（Prefecture Capsules）**：
  - 各分區內已踏破都道府縣按**累積場次降序（`showCount DESC`）**排列，優先突顯高頻巡演重鎮。
  - **🌱 山陰聖地標章**：島根縣與鳥取縣標註發跡聖地圖示。
  - **未踏破 4 縣（0 場）**：岩手縣、三重縣、和歌山縣、宮崎縣保留於各自所屬分區末端，採用**票券虛線邊框（`border-dashed`）＋ `text-muted` ＋ `[未踏破]` 標籤**，點擊停用並提供無障礙提示。
  - **亞洲海外**：整合台灣、韓國、泰國、新加坡 4 國膠囊，點擊直達海外副聯插頁。

### 2. 即時雙向空間鏡像連動（Bi-directional Spatial Mirroring & Sync）
- **文字 Hover ➔ 地圖即時高亮**：
  - 滑鼠懸停於文字膠囊時，SVG 地圖上該縣多邊形即刻以官方金（`--color-band`）亮起，左下角 HUD 同步顯示該縣累積數據；眼角餘光即可得知該縣地理方位。
- **地圖 Hover ➔ 文字膠囊即時鏡像高亮**：
  - 滑鼠懸停於 SVG 地圖某縣時，下方文字膠囊亦同步套用高亮底色。
- **點擊下探（Click Spotlight Zoom）**：
  - 點擊膠囊即刻觸發地圖 Spotlight Zoom 平滑變焦，無縫切換至該縣的「城市分類 ＋ 場館清單列表」（`map-drilldown-panel`）。

### 3. 行動端防爆版與 Omnibox 智慧聯動
- **行動端單行滾動規範**：
  - 在小螢幕（`< md`）與行動端抽屜（`FilterDrawer`）中，8 大地方頁籤嚴格採用 `flex-nowrap overflow-x-auto` 單行水平滑動條，高度鎖定 ~36px，嚴防垂直暴增（符合 `ADR-0140`）。
- **Omnibox 搜尋自動連動**：
  - 使用者在頂部搜尋框輸入縣市名（如「福岡」）時，分區頁籤自動同步切換至「九州・沖繩」，並自動聚焦福岡縣膠囊。

### 4. 四語對稱在地化（i18n Localization）
- 於 `site/src/lib/locales/{zh-TW, ja, en, ko}.js` 對稱擴充地方名稱（`regions.*`）與未踏破標籤（`venueMap.unvisitedTag`）。

---

## 後續影響 (Consequences)

### 正向影響
- 徹底消除非日本歌迷在地圖選場時「不知身在何處」的認知障礙。
- 透過「Hover 文字即刻點亮地圖位置」建立直觀的空間學習連結。
- 兼顧 43/47 踏破歷史真實性與高頻場館快速選取。
- 維持 100% 零後端純靜態架構與復古票券設計語彙。
