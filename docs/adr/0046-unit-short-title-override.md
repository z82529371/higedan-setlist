# ADR-0046: 單元完整標題保留與按鈕自訂簡稱（shortTitle）覆寫機制

## Status
Accepted

## Context
在演出資料庫中，每個單元（巡演或單發事件）皆有標題：
1. **頂部欄（Topbar）要求完整性**：頂部資訊欄（`資料來源 livefans`）需顯示來自 LiveFans 的完整官方名稱（如 `Official髭男dism Arena Tour 2024 - Rejoice -`、`UVERworld VS シリーズ "UVERworld vs Official髭男dism"`、`SPACE SHOWER SWEET LOVE SHOWER 2025 -30th ANNIVERSARY-`）。
2. **切換按鈕（Selector Pill）要求精簡性**：下方單元選單空間有限，需要精簡易讀的簡稱。原先透過正規表示式自動刪除開頭的 `Official髭男dism` 或 `OFFICIAL HIGE DANDISM`，但面對非以樂團開頭的特企（例如對バン `UVERworld VS シリーズ "..."`）或尾綴冗長特輯名的音樂祭（如 `-30th ANNIVERSARY-`），單純的正規式無法達到使用者預期的自訂顯示效果。

## Decision
1. **單元架構解耦**：
   - `unit.title`：作為資料來源（LiveFans）之原生完整標題，同步時自動更新，展示於全站頂部狀態欄與主要標題。
   - `unit.shortTitle`（選填）：單元選單按鈕與全域搜尋索引之自訂簡稱。
2. **按鈕文字求值規則（`shortUnitTitle(unit)`）**：
   - 若 `unit.shortTitle` 存在且非空，優先直接採用。
   - 若未設定 `unit.shortTitle`，退回既有之自動剝除正規表示式：移除開頭之 `Official髭男dism` / `OFFICIAL HIGE DANDISM`（含連字號與冒號）。
   - 若剝除後為空字串，則回退至 `unit.title`。
3. **資料同步腳本不變性（`batch-import.mjs`）**：
   - 抓取 LiveFans 最新資訊時，僅更新 `unit.title` 與 `s.title`。
   - 腳本嚴格保護既有 JSON 中的 `unit.shortTitle` 欄位，永不覆蓋或清除。

## Consequences
- 使用者可隨意在個別巡演或事件 JSON（如 `data/events/uverworld-vs-official-hige-dandism-2024.json`、`data/events/sweet-love-shower-2025.json`）設定 `shortTitle`，精準掌控按鈕顯示名稱。
- 絕大多數常規專場與巡演無須贅加欄位，自動透過前綴過濾運作，保持資料簡潔。
- 自動化同步流程不會破壞人工精選的按鈕視覺排版。
