# 29. 單格多 cmt 全收錄、排序次鍵與事件過場過濾修正

* Status: Accepted
* Date: 2026-09-29

## Context & Problem Statement

`1chance-festival-2025-0907`（LiveFans 1795140）的 `pcsl3` 格含 3 個 `<div class="cmt before">`
（三段リハ：アポトーシス / Universe / 異端なスター，皆掛於 Pretender 前），
但 `extractSongsFromHtml` 以單次 `.match` 只取第一個，現存曲目清單僅有第一段。
另發現事件分支 `interlude` 的 `note` 未做 `リハ：` 全形正規化（存成半形 `リハ:`），
與 `CONTEXT.md` 彩排試音定義及未知事件分支行為不一致。

## Decisions

1. **多 cmt 全數收錄**：改 `matchAll` 逐個收集，逐個做 MC/OPENING/SE 過濾，
   以各自在 DOM 中相對 `<div class="ttl">` 的位置判定 before/after，各記一筆 `interlude` 並保序。
2. **排序加 `domIndex` 次鍵**：同錨點多過場 `sortKey` 相同時，以 `domIndex` 顯式保序，不依賴引擎穩定排序。
3. **事件曲目映射抽出為 `mapPageSongsToEventSetlist`**，`リハ`/`Soundcheck` 備註统一經
   `formatEventNote` 正規為全形 `リハ：`（含 `interlude` 路徑；既有第一段一併轉為全形）。
4. **過場相鄰過濾改連續段擴散**：原「緊貼已映射歌曲前後一格」會丟掉多段連續過場的前段；
   改為保留所有已映射歌曲加上與之相連的整段連續過場（flood fill），孤立過場仍丟棄，舊語義不變。

## Consequences

* 該場曲目清單從 7 筆變為 9 筆：order 1–3 為三段リハ（全形 `リハ：`），後接 6 首正式曲。
* 單格多 cmt 頁面未來不再靜默丟失；排序保序顯式化。
* 未知事件分支的內聯映射未動（已知同式不一致，留待後續統一）。
