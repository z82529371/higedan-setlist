# 0024 中央場館字典單一真理來源與自動反向校正管線

## 背景
先前 `data/venues.json` 雖作為 central venue dictionary 記錄翻譯，但在修改字典檔中的中文譯名或地名時（如修訂 `KSPO DOME` 或 `豊洲PIT` $\rightarrow$ `豐洲PIT`），`data/tours/` 與 `data/events/` 的歷史場次 JSON 檔依然保留正名前的舊文字，導致資料在庫呈現不一致。

## 決策
1. **確立 `data/venues.json` 為絕對單一真理來源（Single Source of Truth）**：
   - 全站所有場館名稱（`venue`）、城市（`city`）、區域（`region`）與都道府縣（`prefecture`）的權威定義統一歸屬於 `data/venues.json`。

2. **整合資料自動驗證與反向校正管線 (`validate-data.mjs`)**：
   - 在執行 `node site/scripts/sync-data.mjs` 資料構建與同步前，自動讀取 `venues.json`。
   - 遍歷所有 `tours` 與 `events` 場次，當偵測到場館名稱或地名與字典不符時，自動強制進行反向修正與回寫存檔，保證全站發布資料 100% 同步。
