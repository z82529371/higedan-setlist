# 30. 安可分隔線語義：標記後全為安可（結構性分隔才傳染）

> **安可定稿**：另見 0021（安可區自動補旗）、0022/0023（舊偵測邏輯，已修正）。

* Status: Accepted
* Date: 2026-09-29

## Context & Problem Statement

`unofficial-2025` 的 `1775094`（KT Zepp Yokohama）：LiveFans 以
`<td class="pcsl16 …"><strong>アンコール：</strong>…50%` 標示安可開始，
其後 Universe / Stand By You / Sweet Tweet 三格無任何標記。
解析器逐格獨立判定 `isEncore`，僅 50% 被標安可，後三首掉回本編；
前端（`App.jsx:897`）按旗分組顯示為 `M1–M15, EN1 50%, M16–M18`，
安可徽章與顯示分組/編號同時錯亂。存檔歌曲順序本身（`idx` 播放序）無誤。

## Decisions

1. **分隔線語義**：安可分隔標記出現後，其後所有演出曲目（含過場）皆視為安可。
2. **結構性分隔才傳染**：`<strong>アンコール` 前綴 / `sec-encore` / `td` 的 `en` 數字類；
   格內備註順口提及安可者維持現狀僅標當首，避免後半場被誤翻。
3. 實作於 `extractSongsFromHtml`：各項目攜 `encoreDivider`，按播放序掃描傳染後清除旗標；
   事件與巡演分支免改直接受益（`computeDiff` 共識安可多數決亦更準）。

## Consequences

* 該場 16–19（50% / Universe / SBY / Sweet Tweet）全標安可；點歌 `note`/`kind` 不變；
  5 個 `MC` 過場照舊過濾。
* 全量重跑時，凡帶分隔線的巡演場安可旗會變準，其 `diff`（安可區插入的 `encore` 值）可能隨之變動，屬預期修正。
