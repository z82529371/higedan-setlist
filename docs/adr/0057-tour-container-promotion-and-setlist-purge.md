# ADR-0057: 巡演容器升格判定與 setlist 冗餘屬性清除機制

## Status
Accepted

## Context

1. **巡演與事件之容器目錄單一來源（Single Source of Truth，[ADR-0014](0014-unit-selector-by-container.md)）**：
   - 系統依據檔案所屬之目錄區分演出架構：
     - `data/tours/`：存放全國巡迴專場。此目錄下所有檔案均由「共識歌單模板（`templateSetlist`）」與場次「差異（`diff`）」所驅動。
     - `data/events/`：存放各類單發事件（含特別專場、音樂祭、學園祭、聯合專場、電視演出、線上直播）。此目錄下所有檔案均逐場完整記錄全文歌單（`setlist: [...]`）。
   - 在匯入 2018 年春季全國巡迴《Official髭男dism one-man tour 2018》（13 場）時，因爬蟲預設將未知目標寫入 `data/events/`，使該檔案初始落地於 `data/events/one-man-tour-2018.json`。
   - 使用者手動將其 `type` 宣告為 `"巡演專場"` 後，發現系統中每場依然殘留大量且重複的全文 `setlist`，且無法發揮巡演容器目錄的架構特性。

2. **爬蟲管線在生成差異時漏刪 setlist 之歷史缺陷**：
   - 審查爬蟲腳本 [`batch-import.mjs`](../../site/scripts/batch-import.mjs) 發現：當單元計算出共識模板並針對各場賦值 `s.diff = diff` 時，僅寫入 `diff` 結構，而未執行 `delete s.setlist`。
   - 原先存在於 `data/tours/` 的既有巡演本身即不帶 `setlist` 屬性，因此未暴露此問題；但一旦某檔案自單發事件轉為具備 `templateSetlist` 的狀態時，龐大的全文 `setlist` 與新產生的 `diff` 就會同時並存於同一個場次物件中，造成資料嚴重冗餘並引起渲染語意歧異。

---

## Decision

1. **爬蟲管線自動清除冗餘 `setlist` 防禦機制**：
   - 在 [`batch-import.mjs`](../../site/scripts/batch-import.mjs) 加入強制淨化邏輯：
     ```javascript
     if (unit.templateSetlist) {
       delete s.setlist; // 杜絕巡演場次保留 redundant setlist 全文
       const { diff, status } = computeDiff(...);
       ...
     }
     ```
   - 確保任何具備共識模板的單元，其底層場次資料嚴格僅保留 `diff`，杜絕雙重資料來源。

2. **《one-man tour 2018》正式升格移入 `data/tours/`**：
   - 將檔案正式升格並遷移至 [`data/tours/one-man-tour-2018.json`](../../data/tours/one-man-tour-2018.json)。
   - 刪除事件目錄之暫存檔 [`data/events/one-man-tour-2018.json`](../../data/events/one-man-tour-2018.json)。
   - 提煉 20 首歌曲之多數共識歌單模板（`templateSetlist`）。
   - **固定版本備註下沉模板**（依據 [ADR-0028](0028-same-song-version-note-diff.md)）：
     該巡演全部 13 場演出的安可段落均演出縮短版《愛なんだが (サビのみ)》與《恋の去り際 (サビのみ)》，此非單場即興，而是整輪巡演之固定安排。將 `note: "(サビのみ)"` 直接固化於共識模板之第 17、18 軌中，使 13 場巡演全數達到 100% 精準吻合（`diff: {}`）。
   - 全面刪除各場次冗餘之 `setlist` 屬性。

3. **容器目錄規範更新於架構文檔**：
   - 更新 [`CONTEXT.md`](../../CONTEXT.md) 的【巡演】與【事件】條目：
     - 明確規定巡演必須存放於 `data/tours/`，且嚴格禁止在巡演場次保留 `setlist` 全文。
     - 明確規定事件存放於 `data/events/`，嚴禁僅以手動宣告 `type: "巡演專場"` 混充，必須實體升格至 `data/tours/`。

---

## Consequences

- 系統容器權責邊界再度強化，前端無論透過容器路徑判定（`isTour`）或模板解析（`resolveShowItems`）皆保持絕對單一真實來源。
- 全站正式專輯巡演由 11 部增至 12 部，《エスカパレード》發行之紀念巡演 13 場次全部以極簡 `diff: {}` 呈現，大幅減省 JSON 傳輸體積與維護複雜度。
