# 26. cmt 獨立過場之 DOM 相對依附排序規範

* Status: Accepted
* Date: 2026-09-29

## Context & Problem Statement

在解析 LiveFans 歌單 HTML 時，歌曲條目帶有播放按鈕索引（如 `id="idx-6"`），而獨立過場 / 備註段落（`<div class="cmt">`）則不具備 `playIndex`。

先前計算無 `playIndex` 項目之 `sortKey` 時，採用前後已知歌曲的平均值 `(prev.playIndex + next.playIndex) / 2`。然而在 LiveFans 頁面中，`playIndex` 存在倒序或非連續編號的情形（例如 Pretender 為 6，而後續曲目 Laughter 為 5）。使用平均數計算導致 `cmt` 段落（如《ひ組のテーマ ～八岐大蛇編～》）排序計算後被誤插入至非關聯歌曲之間（如 Laughter 與 Pretender 之間），而非緊跟在 Pretender 之後。

## Decision Drivers

* 確保 `cmt` 過場/備註段落永遠精確還原現場演出順序。
* 避免 LiveFans 原生 `playIndex` 遞減或跳號破壞 DOM 上下文關聯。

## Decisions

1. **依據 DOM 上下文依附相鄰曲目**：
   - 不再計算前後 `playIndex` 之算術平均數。
   - 當 `cmt` 位於同一個 `<td>` 或 DOM 結構中的歌曲**之後**時，其 `sortKey` 直接設為 `prevSong.sortKey + 1`（緊跟於前一首歌正後方）。
   - 當 `cmt` 位於歌曲**之前**時，其 `sortKey` 設為 `nextSong.sortKey - 1`（緊跟於後一首歌正前方）。

2. **DOM 順序優先於索引插值**：
   - 解決 LiveFans 頁面中播放索引逆序、缺號時導致的排序倒置問題。

## Consequences

* 匯入之 `cmt` 過場（如《ひ組のテーマ》）能 100% 精確緊跟於其所屬之 `<td>` 主歌曲後面。
* 消除跨歌曲錯位與歌單順序倒置之 Bug。
