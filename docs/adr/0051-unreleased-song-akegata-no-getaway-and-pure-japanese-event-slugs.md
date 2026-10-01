# ADR-0051: 未發行曲目《明け方のゲッタウェイ》建檔與純日文活動 Slug 防禦規範

## Status
Accepted

## Context

1. **未發行曲目《明け方のゲッタウェイ》主檔與 LiveFans ID 綁定**：
   - 官方未發行原創曲《明け方のゲッタウェイ》（曾於 2019 年日本武道館單獨公演及 SPACE SHOWER TV "LIVE with YOU" 現場演出）過去因未在 `data/songs.json` 建立主檔，在批次匯入時被降格為純文字 `title` 軌，無法參與全站歌曲搜尋、雙向演出索引及「未發行曲目」專輯分組桶。
   - 經 LiveFans 查詢證實，該曲在 LiveFans 系統具備專屬歌曲頁面與 ID：[LiveFans - 明け方のゲッタウェイ](https://www.livefans.jp/songs/606720)（ID：`606720`）。
   - [ADR-0037](0037-editorial-unreleased-songs.md) 先前註記「未發行剩風船 1 首」，此說明需同步更新以反映曲庫最新狀態。

2. **純日文活動名稱導致 Slug 僅剩年份之防禦與正名**：
   - 爬蟲腳本 [`batch-import.mjs`](../../site/scripts/batch-import.mjs) 動態產生單發活動檔名與 ID 時，透過正規表達式過濾非英文字元（`replace(/[^a-z0-9]+/g, "-")`）。
   - 當活動標題全為日文且尾端帶年份（例如《音楽と髭達2019 -最後の花火-》）時，所有漢字假名被濾除，僅剩年份數字，導致產出 `data/events/2019.json` 且其單元 ID 成為 `"2019"`。
   - 純年份檔案名與 ID 缺乏語意辨識度，且若同年存在第二場純日文活動將引發 ID 碰撞覆寫。

## Decision

1. **未發行曲目《明け方のゲッタウェイ》正式建檔**：
   - 在 [`data/songs.json`](../../data/songs.json) 中登錄：
     ```json
     {
       "id": "akegata-no-getaway",
       "title": "明け方のゲッタウェイ",
       "livefansId": "606720",
       "unreleased": true
     }
     ```
   - 既有演出紀錄（如 `space-shower-tv-live-with-you-2019.json`）中第 12 軌由暫時 `title` 改為 `songId: "akegata-no-getaway"`。
   - 系統依據 `"unreleased": true` 自動將其納入「未發行曲目」分組桶，前端全域搜尋與曲目卡片自動顯示 `（未發行）` 與 `UNRELEASED` 標籤。
   - 更新 [ADR-0037](0037-editorial-unreleased-songs.md) 關聯參照為「未發行曲目包含風船與明け方のゲッタウェイ」。

2. **純日文活動名稱 Slug 防禦與正名機制**：
   - 將已匯入之 `data/events/2019.json` 正名為 [`data/events/ongaku-to-higetachi-2019.json`](../../data/events/ongaku-to-higetachi-2019.json)，其單元 ID 正名為 `"ongaku-to-higetachi-2019"`。
   - 在 [`batch-import.mjs`](../../site/scripts/batch-import.mjs) 建立已知活動名稱對照表（`KNOWN_EVENT_SLUGS`），例如：
     - `音楽と髭達` $\rightarrow$ `ongaku-to-higetachi-${year}`
     - `音楽の日` $\rightarrow$ `ongaku-no-hi-${year}`
     - `紅白歌合戦` $\rightarrow$ `nhk-kohaku-${year}`
     - `FNS歌謡祭` $\rightarrow$ `fns-kayosai-${year}`
   - **純數字防禦條款**：若標題過濾後英文字母數量少於 2 個（例如純年份 `2019`），腳本強制回退為 `unofficial-${year}` 或對應前綴，嚴禁生成純數字 Slug 與檔案。

## Consequences

- 全站未發行曲目主檔完整收錄《風船》與《明け方のゲッタウェイ》，歌曲主檔雙向關聯完整無漏。
- 活動檔案命名與 ID 維持高可讀性與獨立性，杜絕純年份命名與 slug 碰撞風險。
