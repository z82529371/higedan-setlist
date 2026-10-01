# 0022 跨巡演純 ID 批次匯入與現場 Interlude/副標題解析規格

## 背景
原先 `batch-import.mjs` 腳本硬編碼限定單一巡演 JSON 檔案（`shocking-nuts-tour-2022-2023.json`），無法對其他巡演進行批次更新。同時舊有爬蟲忽略 LiveFans DOM 中的 `<p class="subtitle">` 備註與無 Song ID 的現場表演，導致現場 Solo、彈唱與過場曲目遺漏。

## 決策
1. **解除巡演檔名限制，實作純 ID 比對**：
   - 移除檔名硬編碼。傳入數字場次 ID（如 `node batch-import.mjs 1419721 1499384`）時，自動跨所有巡演 JSON 檔案進行 ID 比對與更新。
2. **升級 LiveFans HTML 解析能力**：
   - **解析副標題與標籤**：提取 `<p class="subtitle">` 文字，自動識別 `弾き語り` / `ソロ` 為 `satoshi-solo` 標籤、`新曲` 為 `premiere` 標籤，並將完整註解保存至 `note` 屬性。
   - **支援現場 Solo / Cover 間奏**：對無官方 Song ID 的文字列（如《思ひ出 [鈴木常吉]》、《Canon Rock》），自動註冊為 `type: "interlude"` 項目。
   - **自動判斷安可區域**：偵測 DOM 中的 `sec-connect` 與 `アンコール` 標記，自動為安可曲目賦予 `"encore": true`。

> See also 0030：安可偵測定稿為分隔線傳染語義，本篇 `sec-connect` 觸發條件已廢止。
