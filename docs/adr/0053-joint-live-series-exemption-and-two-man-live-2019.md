# ADR-0053: 聯合專場（Two-Man Live）系列活動聚合與腳本變數作用域修復

## Status
Accepted

## Context

1. **腳本變數未定義拋錯（`isSameShow is not defined`）**：
   - 執行 `batch-import.mjs 1084697` 抓取未知演出時，腳本於防碰撞檢查行拋出 `ReferenceError: isSameShow is not defined`，導致該場次抓取中斷。
   - 經檢查，先前在引入同場次判定（`isSameShow`）時，缺少了在該區塊對 `existing.shows` 檢查目前 `eventId` 是否已存在的宣告。

2. **跨城市聯合專場（Two-Man Live）之企劃聚合**：
   - `1084697`（2019-03-02 東京 新木場STUDIO COAST，對手 THE BAWDIES）與 `1084703`（2019-03-17 大阪 なんばHatch，對手 フレデリック）同屬官方企劃 **《Official髭男dism two-man live 2019》**。
   - 兩場間隔 15 天（大於 7 天）。先前 [ADR-0048](0048-event-granularity-and-slug-collision-disambiguation.md) 僅將 `Tour` / `ツアー` 豁免於 7 天消歧義分拆，導致 Two-Man Live 此類跨城市系列專場若間隔超過一週，面臨被誤拆為 `two-man-live-2019.json` 與 `two-man-live-2019-0302.json` 的風險。

## Decision

1. **修正腳本變數作用域**：
   - 於 `site/scripts/batch-import.mjs` 中明確定義 `isSameShow`：
     ```javascript
     const isSameShow = existing.shows.some(
       (s) =>
         s.id === eventId ||
         (s.sourceUrls ?? []).some((u) => u.includes(eventId))
     );
     ```
   - 確保已存在同場次時安全略過，未存在時接續評估。

2. **聯合專場（Two-Man Live / 對バン）系列活動豁免 7 天分拆**：
   - 標題符合 `isSeriesTitle`（包含 `tour`、`ツアー`、`巡演`、`two-man`、`ツーマン`、`対バン`、`對バン`）者，視為多城市系列企劃，統一聚合收錄於單一檔案（如 `data/events/two-man-live-2019.json`，涵蓋東京與大阪全 2 場）。
   - 僅對無系列屬性之一般電視節目特輯（如 CDTV 初回 vs 髭男フェス）維持大於 7 天自動加 `-MMDD` 拆解防禦。

3. **收錄 `two-man-live-2019.json`**：
   - 完整收錄 2019-03-02 東京場（1084697）與 2019-03-17 大阪場（1084703）。
   - 大阪場之安可翻唱曲《オドループ [フレデリック]》依 [ADR-0032](0032-cover-title-track.md) 維持非原唱 `title` 軌記錄；新木場場次之《明け方のゲッタウェイ》自動對應歌曲主檔。

## Consequences

- 徹底修復自動抓取管線之 ReferenceError，未知活動匯入順暢無阻。
- Two-Man Live 系列跨城市場次完整凝聚於同一檔案，選單按鈕語意清晰。
