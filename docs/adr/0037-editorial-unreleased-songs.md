# 37. Editorial 未發表曲建檔與映射刷新

> **See also**：兩曲已於 2026-10-01 官方曲目校正清 `unreleased` 轉入 `Editorial` 桶（未發行剩風船 1 首）；歸屬原則見 `CONTEXT.md` 專輯歸屬條。

* Status: Accepted
* Date: 2026-09-30

## Context & Problem Statement

Editorial 巡演批量匯入後，`みどりの雨避け`（687564）與 `Lost In My Room`（687569）
兩首髭男原創未發表曲因無 `songs.json` 主檔，只能記為 `title` 軌，
無法進入共識模板、歌曲統計與歌曲雙向查詢（翻唱《思ひで》則依 ADR-0032 本就不該進）。

## Decisions

1. 兩首建主檔（`midori-no-amayoke`、`lost-in-my-room`，`unreleased: true`）；
   LiveFans ID 以同期 6875xx 編號互證。
2. 建檔後重跑 49 場刷新映射與共識模板。

## Consequences

* 模板 19→21 首，兩曲納入；全場 `title` 軌僅剩翻唱一筆；`sync`＋`validate` 通過並鏡像。
* `CONTEXT.md` 不動（歌曲條目本就涵蓋未發表曲建檔）。
