# ADR-0047: 未收錄本家歌曲匯入警報（Tripwire）與曲庫雙向健康審計

## Status
Accepted

## Context
在 `batch-import.mjs` 抓取 LiveFans 演出歌單時：
- 官方歌曲庫以 `data/songs.json` 為單一真理來源（Single Source of Truth）。
- 當場次中出現尚未於 `songs.json` 建檔的髭男原創曲（例如《夏模様の猫》或早期獨立時期歌曲）時，先前管線會將其靜默退回純文字 `title` 軌（如 `"title": "夏模様の猫"`），當作翻唱曲處理。
- **痛點**：
  1. 靜默降格無任何終端提醒，造成本家曲目遺漏 `songId`，前端失去雙向查詢與統計關聯。
  2. 日後人工除錯時，難以查知 LiveFans 現場抓到的真實數字 ID，需耗費額外時間搜尋。
  3. `validate-data.mjs` 過去僅單向校驗已存在的 `songId` 是否有效，未審計是否有「疑似本家歌曲卻被記為純文字」或「已登場演出但缺 `livefansId`」的曲目。

## Decision
1. **匯入期即時報警（Import-Time Tripwire）**：
   - 在 `consensus.js`（`computeDiff` 與 `mapPageSongsToEventSetlist`）中，若遇到未在 `songs.json` 建立映射的曲目，且標題未包含原唱歌手標註（`[...]`）或器樂過場標記（`～`）：
   - 立即在終端機輸出黃色高亮警報 `[UNREGISTERED SONG DETECTED]`，印出歌名與 LiveFans 抓到的即時 `livefansId`，並生成建議加入 `data/songs.json` 的 JSON 片段。
2. **驗證期曲庫雙向健康審計（Validator Audit）**：
   - 在 `site/scripts/validate-data.mjs` 加入全庫掃描：
     - **非翻唱純文字軌警告**：掃描所有 `shows` 的 `title` 軌，發現未帶 `[歌手名]` 且非 Interlude 者，提出警告以杜絕未建檔歌曲漏網。
     - **已登場歌曲 `livefansId` 覆蓋率提示**：比對所有在巡演或事件中實際演出過的歌曲，若 `songs.json` 該項目缺少 `livefansId`，主動列出提醒。
3. **安全邊界**：
   - 爬蟲**絕不自動盲目將未知曲目塞入 `songs.json`**，以維護官方曲庫的純潔性（防止他團翻唱曲或無效項目污染主檔）；透過即時警報由工程人員確認後收錄。

## Consequences
- 匯入新演出時，若遇到尚未收錄的本家歌曲，終端機立刻提供完整資訊與 ID，1 秒即可複製建檔。
- CI 驗證器自動防守資料庫，徹底杜絕本家歌曲被誤記為純文字 `title` 軌或過場格式混亂的現象。
