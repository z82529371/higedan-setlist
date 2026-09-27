# 0017 單場次 kind 標籤覆寫與前端防護規格

## 背景
先前在設定單場特殊標籤（如 2024-09-20 限定之《Pretender》自彈自唱 `satoshi-solo`）時，巡演模板 `templateSetlist` 的 `kind` 屬性會作用至全巡演所有場次。此外，自動化腳本或手動資料寫入時，偶爾會傳入單一字串 `"kind": "request"` 而非陣列 `"kind": ["request"]`，引發前端 `.join()` 崩潰。

## 決策
1. **單場 `diff.kind` 覆寫機制**：
   - 前端 `resolve(diff, tpl)` 解析函式新增 `diff.kind` 解析。
   - 單一場次（如 2024-09-20 福岡）可在其 `diff` 物件中宣告 `"kind": [{ "order": 17, "kind": ["satoshi-solo"] }]`，針對該場次特定曲目進行 `kind` 覆寫，而不必污染全巡演模板。

2. **`kind` 陣列正規化與前端防護**：
   - 前端 `App.jsx` 提供 `getKindArray(item)` 防禦函式。
   - 不論資料庫傳入字串 `"request"`、陣列 `["request"]` 或 `undefined`，皆統一歸一化為陣列處理，徹底消除 `TypeError: (i.kind ?? []).join is not a function` 崩潰隱患。
