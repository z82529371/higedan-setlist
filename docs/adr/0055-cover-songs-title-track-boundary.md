# ADR-0055: 非本家翻唱曲目與未發行作品庫邊界規範

## Status
Accepted

## Context

1. **翻唱曲目與未發行原創曲之概念混淆風險**：
   - 討論特定現場／Fan Club 限定演出之曲目，如《チキンライス》（浜田雅功と槇原敬之）、《Don't Stop Me Now》（Queen）、《きよしこの夜》（讃美歌）等，是否應於 [`data/songs.json`](../../data/songs.json) 中登記為未發行曲（`"unreleased": true`）。
   - 檢討本專案之領域模型：[`data/songs.json`](../../data/songs.json) 的本質為 **Official髭男dism 官方本家作品庫（Official Repertoire）**；其中之 `"unreleased": true` 專門指代「髭男本家詞曲創作、但未曾發行 CD/數位單曲」之原創作品（如《風船》、《明け方のゲッタウェイ》），並於前端「專輯分類」中獨立設有「未發行曲目」抽屜與參與歌曲統計。

2. **翻唱曲納入歌曲主檔之副作用**：
   - 若將西洋經典（Queen）或聖誕頌歌（讃美歌）登記於 `songs.json` 並設為未發行，會導致前端「未發行曲目」專輯抽屜中出現非髭男原創的他人作品，破壞作品庫邊界並污染歌曲原創統計數據。
   - 延續 [ADR-0032](0032-cover-title-track.md) 與 [ADR-0043](0043-cover-content-rule-and-locked.md)，翻唱曲目在專案中已有成熟之 `title` 軌機制。

## Decisions

1. **翻唱曲絕對不登錄於 `data/songs.json` 主檔庫**：
   - 凡非 Official髭男dism 原創之翻唱歌曲（含西洋經典、J-POP 經典、傳統頌歌、對樂團正式演出曲目），**一律不進入 `data/songs.json`**，絕不標記為 `"unreleased": true`。
   - 嚴格守護 `songs.json` 作為樂團「本家作品庫」之純淨性與代表性。

2. **統一採用標準 `title` 軌標註格式（`"title": "曲名 [原唱歌手]"`）**：
   - 現場正式演出之完整翻唱曲目，於各場次歌單之 `diff.insert` 或 `setlist` 中以 `title` 軌記錄，標明原唱歌手中括號：
     - 《Don't Stop Me Now》：`"title": "Don't Stop Me Now [Queen]"`（已收錄於 [`data/tours/tour-19-20-hall-travelers.json`](../../data/tours/tour-19-20-hall-travelers.json) 神戶場）
     - 《チキンライス》：`"title": "チキンライス [浜田雅功と槇原敬之]"`
     - 《きよしこの夜》：`"title": "きよしこの夜 [讃美歌]"`
   - 此類 `title` 軌於前端正常編列演出曲目序號、展示標題與原唱並計入該場曲數，但不連結歌曲主檔、不計入全站原創歌曲統計。

3. **未來 FC Tour Vol.1 匯入套用準則**：
   - 未來當建立或匯入 2018 年 12 月聖誕歌迷會巡演（`Official髭男dism Fan Club Tour Vol.1 ～Hey BROTHERS! 聖なる夜にWhat's Up Live～`，全 3 場）時，上述《チキンライス》與《きよしこの夜》一律直接依照本規範之 `title` 軌建檔。

## Consequences

- 徹底釐清「本家未發行原創作品」與「現場現場翻唱曲目」之架構邊界。
- 前端「未發行曲目」專輯抽屜維持僅展示《風船》與《明け方のゲッタウェイ》等真正之髭男原創曲目。
- 翻唱曲在現場歌單中享有完整之曲序、序號與原唱歌名展現，符合現場紀錄之真實性。
