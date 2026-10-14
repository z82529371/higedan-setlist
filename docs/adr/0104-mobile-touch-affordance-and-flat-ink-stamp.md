# ADR-0104: 全域小尺寸觸控認知與墨水壓印架構 (Global Mobile Touch Affordance and Flat Ink Stamp Architecture)

## Status
Accepted

## Context

1. **背景與行動端互動痛點**：
   - 本檔案庫以實體演唱會門票紙感與舞台音箱歌單為美學核心（`DESIGN.md`：The Stage Monitor Setlist）。
   - 在桌面端，使用者仰賴滑鼠游標懸浮（Hover）來獲知可點擊性（游標變更手指、文字變色、虛線浮現）。
   - 然而在行動端觸控螢幕上，完全缺乏 Hover 機制，引發兩大衝突性挑戰：
     - **事前可點擊認知（Pre-touch Affordance）**：若全數仰賴傳統 Web 超連結視覺（藍色文字、常態下劃線），會破壞舞台實體白紙印刷的專業俐落感，使長篇歌單顯得雜亂冗贅；但若毫無視覺線索，使用者無法預判何處可點擊。
     - **按下瞬間即時反饋（Active Feedback）**：缺乏按壓反饋會讓使用者感覺介面遲鈍未響應；若隨意套用現代 App 常見之微縮放（如 `active:scale-[0.98]`），在 20～30 首高密度曲目清單快速上下滑動時，容易引發頻繁的版面微幅震動與視覺跳動。
     - **滑動誤觸風險（Scroll Safety）**：若將單場歌單整列設為全域可點擊，歌迷以大拇指快速滑動檢索長歌單時，手指停頓極易誤開歌曲彈窗（`SongModal`），阻斷瀏覽流程。

2. **經架構審查確認之邊界**：
   - 必須兼顧實體票券印刷美學、觸控反饋明確性與高密度歌單滑動防誤觸安全。

## Decision

1. **墨水壓印觸控手感（Flat Ink Stamp Touch Feedback）**：
   - **核心手感**：於 [`site/src/style.css`](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/site/src/style.css) 抽象出全域 utility `.touch-stamp`，手指按下瞬間觸發淡墨印痕：
     ```css
     .touch-stamp {
       touch-action: manipulation;
       user-select: none;
       -webkit-user-select: none;
       transition-property: color, background-color, border-color, opacity;
       transition-duration: 100ms;
     }
     .touch-stamp:active {
       background-color: rgba(0, 0, 0, 0.05);
     }
     html[data-theme="dark"] .touch-stamp:active {
       background-color: rgba(255, 255, 255, 0.10);
     }
     ```
   - **Zero Shift 原則**：嚴禁任何縮放（No `scale`）或像素位移（No `translate`），保持票券平面的吸墨壓印感，確保快速滾動或連續點擊時零版面重繪抖動。
   - **延遲消除**：強制帶有 `touch-action: manipulation`，消除行動端 300ms 雙擊縮放判定延遲。

2. **漸進式實體暗示（Progressive Affordance）**：
   - **維持純淨印刷排版**：單場與巡演曲目文字全面拒絕滿版藍字或底線；保持黑墨純粹字重（`font-semibold`）。
   - **實體標籤為視覺靶點**：可跨場次跳轉之列表與過場，均於右側常態配置明確之 `[🎫 →]` 或 `[🎫 城市 日期]` 實體膠囊作為引導按鈕；收合區域固定於右側展示 `▸ / ▾` 三角指示符。

3. **歌名精準熱區與滑動防誤觸（Title-Focused Scroll Safety）**：
   - 在單場票根（`ShowSlip`）中，點擊彈窗事件嚴格收斂於歌名文字（[`SETLIST_SONG`](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/site/src/lib/constants.js) 封裝 `px-1 -mx-1 py-0.5 inline-block touch-stamp`）。
   - 左側演出序號（如 `M01`、`EN1`）與右側留白區域維持靜態非可擊發區，保留作為大拇指縱向滑動檢索的絕對安全緩衝走廊。

4. **三大核心互動層全域覆蓋**：
   - **導航型整列與卡片**：巡演足跡（`TourSlip` Itinerary 整列 `<li>`）、巡演步進器（`ShowSlip` 上一場／下一場按鈕）。
   - **實體膠囊與徽章**：全站篩選膠囊（`filterPillClass`）、巡演標籤（`unitPillClass`）、票根跳轉徽章、頻率統計膠囊。
   - **收合標題列**：安可、雙日輪替、場次限定曲與特別過場之摺疊標題列。

## Consequences

- **正面影響**：
  - **極致細膩之觸控反饋**：觸控按壓宛如在厚磅白卡紙上蓋下印章，反饋迅速且自然。
  - **杜絕滑動誤觸**：徹底解決手機滑動長歌單時頻繁跳出歌曲彈窗的惱人體驗。
  - **設計系統一致性**：代幣化封裝收斂於 `style.css`、`constants.js` 與 `DESIGN.md`，未來新元件遵循 `.touch-stamp` 即可自動保證手感與規範統一。
- **維護約束**：
  - 所有票券新增之可點擊小尺寸元素，一律繼承 `.touch-stamp`，嚴禁私自添加 `active:scale-*` 破壞實體票券平面手感。
