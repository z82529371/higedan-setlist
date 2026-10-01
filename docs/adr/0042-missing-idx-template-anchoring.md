# 42. 缺播放器索引曲目之模板對位排序規範

* Status: Accepted
* Date: 2026-10-01

## Context & Problem Statement

LiveFans 歌單 `<td>` 的真實播放順以播放器索引（`id="idx-N"`）為準，但部分歌曲格僅有連結按鈕而無 `idx`（如 `1981872` 曼谷場之 `Pretender`，其 Apple Music 佇列亦缺該曲）。

`parse.js` 對缺索引項採用 DOM 前後鄰居內插 `sortKey`。當頁面 DOM 順序本身即亂序（曼谷場前 7 格 DOM 順與 `idx` 順完全不一致）時，缺索引曲目被錯置（如 `Pretender` 落到第 2 首），`computeDiff` 進而產出假差異（`skip [3,4,5,6]`＋同曲重插 `after:7`），且既有驗證管線（相鄰重複警告、冗餘 `insert` 剔除）無法捕捉此類順序偏移。

## Decision Drivers

* 曲序還原不可信任亂序 DOM，只能信任 `idx`＋巡演模板。
* 缺索引曲目的投稿原文（標題不可見字元、過場空格）不應順手正規化。
* 修正僅影響含缺索引項之頁面；全索引頁面行為零變更。

## Decisions

1. **缺索引歌曲以巡演模板對位**：`computeDiff` 前先經 `reorderPageSongsByTemplate` 重排——有 `idx` 者維持播放順；無 `idx` 之歌曲按 `songId` 插入模板對應位置；模板外曲目（點歌／翻唱）才回退 DOM 鄰居。
2. **過場跟隨歌曲身份而非索引數字**：無 `idx` 之 `cmt`／過場依附其 DOM 相鄰歌曲（`cmtBefore` 決定前後），隨該曲一同歸位（ADR-0026 意圖之身份制版本）。
3. **共識模板排除缺索引位置**：`buildConsensusTemplate` 仍計數缺索引曲（達 50% 門檻），但不納入其位置平均（全缺才回退 DOM 位置），防止單場錯位污染全巡演曲序。
4. **不碰原文**：`U+202C`（`cleanTitleKey` 已剝除）、`MC` 過濾、`ひ組` 空格差異皆保留現狀。

## Consequences

* 曼谷場 `diff` 收斂為 `after:7` 過場一筆，`resolve` 還原與現場曲序一致。
* 同類缺 `idx` 頁面不再產生同曲刪除再插入之假差異。
* 真實的同曲 `skip`＋重插（アレンジ版本差異，ADR-0028）不受影響，不可對此類形態做自動合併。
