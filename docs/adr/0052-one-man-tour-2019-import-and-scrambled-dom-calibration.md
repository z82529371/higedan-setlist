# ADR-0052: one-man tour 2019 巡演建檔與 1049544 仙台場 Scrambled DOM 曲序校準鎖定

## Status
Accepted

## Context

1. **`official髭男dism one-man tour 2019` 巡演容器歸屬**：
   - 2019 年 6 月至 7 月舉行的全國單獨巡演（共 8 場，涵蓋仙台、福岡、札幌、日本武道館、大阪、名古屋、東京 Zepp 兩場）先前因尚未建立巡演容器，於爬蟲抓取時暫存於 `data/events/one-man-tour-2019.json`。
   - 依據專案架構原則，專場巡演必須建立於 `data/tours/`，透過動態規劃 LCS 共識模板（`templateSetlist`）與各場次差異（`diff`）進行系統化管理。

2. **1049544（仙台場）LiveFans DOM 亂序與未發行曲錯位**：
   - 在 1049544（2019-06-22 仙台 SENDAI GIGS）場次中，LiveFans 投稿頁面發生嚴重的 DOM 逆序（`[SCRAMBLED DOM]`）：
     - 未發行曲《明け方のゲッタウェイ》無播放器索引（`playIndex: null`），且被投稿者擺在 DOM 最前方的第 0 格（`class="pcsl1"`）。
     - 爬蟲解析器依據相鄰 DOM 計算 `sortKey` 時，誤將其推算為 M2（排在《異端なスター》之後、《Amazing》之前）。
   - 經查證與現場歌單比對，真實演出曲序中《明け方のゲッタウェイ》位於 **M6**（緊接在 M5《FIRE GROUND》之後、M7《犬かキャットかで死ぬまで喧嘩しよう!》之前）。
   - 若僅手動修改資料而不加保護，未來執行 `batch-import.mjs` 時，爬蟲重新自 LiveFans 抓取又會覆寫回錯誤的 M2。

3. **歌曲主檔健檢警報（始まりの朝）**：
   - 巡演匯入驗證管線觸發健康審計警報：`[Song Audit Notice] Performed song 'hajimari-no-asa' (始まりの朝) is missing livefansId in data/songs.json.`。

## Decision

1. **建立單一巡演主檔 `data/tours/one-man-tour-2019.json`**：
   - 將全 8 場專場統整收錄於 `data/tours/one-man-tour-2019.json`，移除 `data/events/one-man-tour-2019.json`。
   - 提煉 19 首高共識歌單作為 `templateSetlist`，各場次透過 LCS 差異比對紀錄變更。

2. **1049544 仙台場曲序人工校準與 `locked: true` 鎖定**：
   - 將 1049544 場次之《明け方のゲッタウェイ》正確配置於 **M6**，後續歌曲順號順延。
   - 依據 [ADR-0042](0042-missing-idx-template-anchoring.md) 與 [CONTEXT.md](../../CONTEXT.md) 規範，將 1049544 標記為 `"locked": true`。管線同步時保留其手排差異與曲序，絕對禁止自動化重新計算覆寫。

3. **補齊《始まりの朝》LiveFans 歌曲 ID**：
   - 於 [`data/songs.json`](../../data/songs.json) 補充 `"livefansId": "474419"`，消除歌曲主檔稽核警報。

## Consequences

- `one-man tour 2019` 完整納入全站巡演架構，前端依起始年份（2019）正確分類展示。
- 1049544 仙台場還原真實演出曲序（M6: 明け方のゲッタウェイ），且受 `locked: true` 機制保護不再被 LiveFans 原始錯誤污染。
- 驗證管線（`validate-data.mjs`）、測試套件（`pnpm test`）及網站建置（`pnpm build`）全數 0 錯誤通過。
