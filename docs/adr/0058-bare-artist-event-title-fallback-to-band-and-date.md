# ADR-0058: 純樂團名稱事件標題回退為樂團名加日期規範

## Status
Accepted

## Context

1. **LiveFans 原始標題資訊不全之場景**：
   - 爬蟲在抓取部分早期、免費或非正式企劃的單發專場時（例如 LiveFans Show ID 1477750，2018-04-08 於小田原ダイナシティ 1Fキャニオンステージ），頁面之演出名稱僅登記為裸樂團名稱 `Official髭男dism`。
2. **過度推敲與前端語意退化問題**：
   - 若由爬蟲或維護者私自根據外部發行資訊（如推敲當天為專輯發行紀念活動）自行腦補命名為未被頁面或官方確認之長標題，會破壞資料庫「忠於客觀資料源、不任意推敲」之原則，增加維護負擔與不確定性。
   - 若直接保留純 `Official髭男dism` 作為 `unit.title`，由於前端按鈕簡稱演算法 `shortUnitTitle(unit)` 會自動剝離 `Official髭男dism` 前綴，導致計算結果為空字串，最終又回退為 `Official髭男dism`，在 UI 側邊欄或分類選單中顯示為意義不明、重複無鑑別度的按鈕膠囊。
   - 在決定標題策略時，經確認不應自行推敲發行企劃名稱，亦不宜僅留下純日期或硬湊場館，而是明確採用「Official髭男dism 加日期」（`Official髭男dism YYYY.MM.DD`）。

---

## Decision

1. **純樂團名標題自動回退至 `Official髭男dism YYYY.MM.DD`**：
   - 在 [`site/scripts/batch-import.mjs`](../../site/scripts/batch-import.mjs) 中建立純樂團名辨識與回退規則：
     ```javascript
     const isBareBandTitle =
       /^(?:Official\s*髭男\s*dism|Official\s*Hige\s*Dandism)$/i.test(
         actualTitle.trim()
       );
     if (isBareBandTitle) {
       const dateStr = meta.livefansDate.replace(/-/g, ".");
       actualTitle = `Official髭男dism ${dateStr}`;
     }
     ```
   - 場次標題 `show.title` 同步對齊回退後之 `actualTitle`。
   - 嚴格禁止外部無憑據之非官方標題推敲。
2. **Slug 產生與純數字防禦條款連動（[ADR-0051](0051-unreleased-song-akegata-no-getaway-and-pure-japanese-event-slugs.md)）**：
   - 當標題為 `Official髭男dism YYYY.MM.DD` 時，剝離樂團名前綴後僅餘純日期數字，英文字母數為 0，依據 ADR-0051 防禦條款自動回退至 `unofficial-${year}.json`（若同年超過 7 天發生碰撞則追加 `-MMDD`）。
3. **場館標準化（小田原 Dynacity）**：
   - 同步校準 [`data/venues.json`](../../data/venues.json) 中的 `小田原ダイナシティ`，修正原先機器翻譯「小田原迪納市(Odawara Dina City)」與城市誤判為橫濱的缺陷，正名為 `小田原 Dynacity`（城市：`小田原`，縣市：`神奈川縣`）。
4. **收錄 `data/events/unofficial-2018.json`**：
   - 將 2018-04-08 小田原公演正式收錄於 [`data/events/unofficial-2018.json`](../../data/events/unofficial-2018.json)，單元與場次標題統一為 `Official髭男dism 2018.04.08`。

---

## Consequences

- 避免未經官方統一公告之私自臆測命名，維持資料庫客觀嚴謹性。
- 前端 `shortUnitTitle` 能自動將 `Official髭男dism 2018.04.08` 簡化為乾淨的日期膠囊按鈕 `2018.04.08`，無空標籤或重複樂團名問題。
- 完善純樂團名稱事件之標準化回退管線。
