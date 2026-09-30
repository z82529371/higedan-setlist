# 31. 未知翻唱過場保留曲名：note 合併曲名與現場備註

> **Superseded by 0032**：翻唱改記無連結正式軌（`title` 軌）。本文保留作取捨史料。

* Status: Accepted
* Date: 2026-09-29

## Context & Problem Statement

`shocking-nuts` 的 `1499384`（日本武道館）：LiveFans 刊載
`<a href="/songs/729162">思ひで [鈴木常吉]</a>` 併備註「楢崎さんGuitarにて弾き語り＋Andy」。
該曲有 LiveFans 曲目 ID 但無 `songs.json` 主檔，`computeDiff` 判非已知曲走 `interlude`；
有備註時 `note` 只留備註，曲名靜默丟失——前端只見一段無主之備註。
（同站 `rejoice` 巡演有手寫先例 `思ひ出 (鈴木常吉) 楢ちゃんソロ`，曲名備註並陳。）

## Decisions

1. **維持過場，不建主檔**：翻唱/特別段落不進 `songs.json`，沿用 `type: "interlude"`。
2. **曲名備註合併**：歌曲來源之未知曲（非 `cmt`、標題異於備註），`note` 取原文空白拼接
   `曲名＋備註`（如 `思ひで [鈴木常吉] 楢崎さんGuitarにて弾き語り＋Andy`）；無備註時沿用曲名；
   `cmt` 類（標題即備註）不合併，避免重複。
3. 兩處同修：`computeDiff` 巡演插入分支與 `mapPageSongsToEventSetlist` 事件映射；
   未知事件匯入分支本就保留 `title` 欄位，不動。

## Consequences

* 該場 `diff` 僅 `after: 11` 一筆 `note` 改變，其餘 `skip`/插入原樣；`validate-data` 通過。
* 全量重跑時同類翻唱過場會補上曲名；`楢崎` 備註照舊不誤標 `satoshi-solo`（ADR-0025）。
