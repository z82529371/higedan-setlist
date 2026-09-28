# 0021 自動化資料校驗與防錯修復流程規格

## 背景
在巡演樣板 (`templateSetlist`) 調整（例如將 `風船` 提升為預設曲目）時，若個別場次的 `diff.insert` 中殘留舊有重複插入項目，解析器還原歌單時會產生相鄰重複歌曲。此外，在安可時段插入的歌曲若漏設 `encore: true`，會被錯誤算入正歌單中。

## 決策
1. **建立 `validate-data.mjs` 自動校驗管線**：
   - 於 `site/scripts/validate-data.mjs` 實作歌單結構自動防錯邏輯。
   - 於 `sync-data.mjs` 資料同步流程前端自動執行校驗，確保在開發（`pnpm dev`）、編譯（`pnpm build`）與同步（`pnpm sync`）時 100% 自動守護。
2. **自動清理與修正規則**：
   - **自動去重 (Auto-Prune Redundant Inserts)**：若 `diff.insert` 插入的歌曲已存在於樣板對應位置且未被 `skip`，自動移除該 redundant `insert`。
   - **自動修正安可標籤 (Auto-Fix Encore Marker)**：所有位於安可起始位置（Order 18 之後）插入的歌曲，若 `encore: false` 自動修正為 `encore: true`。
   - **相鄰重複通報 (Duplicate Song Warning)**：若最終解析結果出現相同歌曲連唱，終端機即時輸出警告提示。
