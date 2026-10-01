# 32. 翻唱曲改記無連結正式軌（title 軌，不進主檔）

> **Partially superseded by 0043**：團員 solo 翻唱串場改記過場（看內容不看連結）；其餘翻唱（對方正式演出曲、完整翻唱）維持本決議之 title 軌。

> **翻唱定稿**：另見 0031（舊形史料，已取代）、0033（拼盤過濾）。

* Status: Accepted
* Date: 2026-09-30
* Supersedes: ADR-0031（合併 note 過場形，改為本決議之 title 正式軌形）

## Context & Problem Statement

`shocking-nuts` 的 `1499384`：翻唱《思ひで [鈴木常吉]》有 LiveFans 曲目連結但無主檔。
ADR-0031 將其記為合併 `note` 之過場（`—` 序號、不計曲數），但它實為正式演出曲目，
過場形遺失編號、標題欄位與曲數統計。前端其實早已支援無連結正式軌
（`App.jsx`: 有 `title` 無 `songId` 即編號＋無連結標題＋備註，並計入曲數）。

## Decisions

1. **翻唱記 `title` 正式軌**：`{title: "曲名 [原唱歌手]", note: 現場備註}`，與正式曲目同樣編號、
   顯示標題與備註並計入曲目數；僅不連結歌曲主檔、不進 `songs.json`、不進巡演模板與歌曲統計。
2. 兩處同修：`computeDiff` 巡演插入分支（未知歌曲來源改 `title` 軌，`cmt`/過場來源不動）；
   事件映射 `mapPageSongsToEventSetlist`（未知歌曲來源改 `title` 軌；附帶修復過濾器整筆丟棄未知曲問題）。
3. `kind` 照常透傳（如點歌翻唱之 `request`）；`楢崎` 備註照舊不誤標 `satoshi-solo`。
4. 1499384 該筆自 ADR-0031 合併過場形遷移為 `title` 形。

## Consequences

* 該場 `after: 11` 改為 `{title: "思ひで [鈴木常吉]", note: "楢崎さんGuitarにて弾き語り＋Andy"}`；
  前端顯示為有編號之無連結曲目；`validate-data` 通過（`resolve` 直通、`resolveShow` 僅 `songId` 參與去重檢查）。
* 全量重跑時同類翻唱一併轉為 `title` 軌；`cmt` 過場規範（不設 `title`）不受影響，兩者以來源區分。
