# 28. 同曲異註記的版本差異差異化與 kind 殘餘觸發規則

* Status: Accepted
* Date: 2026-09-29

## Context & Problem Statement

`four-re-ism-osaka-1215`（LiveFans 1866411）的 `What's Going On?` 頁面備註為「The Blooming Universe アレンジ」，
但因與巡演模板 order 8 同曲，`computeDiff` 視為完全一致直接 `tIdx++`，`note` 被靜默丟掉。
同頁另有 `Anarchy` 備註「通常ver.」、`Subtitle` / `ニットの帽子` 備註「弾き語り」（模板已有 `satoshi-solo`）。

## Decisions

1. **保留巡演模板，不存全文**：模板 19 首多場共用（ADR-0004 去重初衷）；同曲差異以差異記之。
2. **アレンジ屬單場版本差異**：只記該場次 `diff`，不寫入 `templateSetlist`（共識模板本就不收 `note`）。
3. **復用 `skip`＋`insert`**：同曲但差異成立時，`skip` 該 `order` 並於前一錨點後插入同 `songId` 帶 `note`；
   前端 `resolve` 獨立評估兩者，無需改動。
4. **去 kind 殘餘才觸發**：比對 `kind` 陣列與殘餘備註（扣掉弾き語り / ソロ / 新曲 / リクエスト / request /
   リハ / Soundcheck / 彩排及標點空白後還有字才算差異）。故アレンジ與通常 ver. 觸發，
   單純弾き語り（`kind` 已覆蓋）不觸發，避免差異爆炸。

## Consequences

* 1866411 的 `diff` 從 `skip: [17,18]` 變為 `skip: [5,8,17,18]`，新增 `Anarchy`（通常ver.）與
  `whats-going-on`（The Blooming Universe アレンジ）兩組替換式插入；既有點歌 / 新曲插入不變。
* 全量重跑時其他場次若有同類アレンジ備註，亦會新增對應差異，屬預期行為。
* 觸發關鍵字清單若未來出現新型版本註記（如 `strings ver.`），殘餘規則天然覆蓋，無需改碼。
