# 27. TV拼盤類型、sl系解析相容與空解析保護

* Status: Accepted
* Date: 2026-09-29

## Context & Problem Statement

`batch-import.mjs 1500153`（CDTVライブ！ライブ！クリスマス4時間スペシャル）回報 `Total checked: 0` 並把 `setlist` 洗成 `[]`，但 LiveFans 頁面明明有 2 首（ミックスナッツ + Subtitle，共用 memo「今年の大ヒットソング2曲をSPメドレー」）。

根因：
1. `extractSongsFromHtml` 的 `tdRegex` 只認 `pcsl`（`site/scripts/batch-import.mjs:77-78`），而該 TV 頁面用 `<td class="sl24">` / `<td class="sl25">`，第一關就被丟掉，根本走不到內層 `idx` 抓 `playIndex`。
2. 事件分支（無 `templateSetlist`）在 `pageSongs` 為空時仍寫入空陣列並印 `UPDATED`。
3. 用語上「拼盤」無定義，`演出類型` 只有專場 / 音樂祭 / 對バン，CDTV 這類電視節目段落歸入音樂祭很牽強。

## Decisions

1. **新增 `TV拼盤` 為第 4 種演出類型**：電視音樂節目的拼盤演出段落（CDTV、Mステ、紅白）；仍必屬事件、不設巡演模板，曲目完整收錄於該場次。專場仍是唯一跨容器類型。
2. **解析器小修不重寫**：`tdRegex` 從 `pcsl` 放寬為 `(?:pc)?sl`，同時支援 `sl` + `pcsl` + `medley`；`songMatch` 從相對路徑 `/songs/ID` 放寬為同時支援絕對路徑 `https://www.livefans.jp/songs/ID`（TV 頁用絕對、巡演頁用相對），內層 `idx` / `subtitle` / `cmt` / `encore` / `sortKey` 邏輯不動（舊 `scratch_1499384.html` 的 `pcsl` 已驗相容；`1500153.html` 驗出 47 歌格、命中 712993/736671）。
3. **SPメドレー記兩筆**：兩首各一筆演出曲目（order 1/2），`note` 各帶相同 memo，不另設 medley 類型；符合歌曲不因短版分開、可雙向查詢。
4. **空解析不覆寫**：事件分支若 `pageSongs.length === 0`，跳過 `setlist` 寫入、計 `NO_SETLIST` 並警告，保留舊資料（場館/日期校正仍寫入）。

## Consequences

* 1500153 可正確入庫 2 首；未來 TV 系 `sl` 頁面不再掛蛋。
* 空頁不再靜默洗掉已入庫曲目，符合資料來源不靜默覆蓋原則。
* `演出類型` 篩選與次級分組需後續把 TV拼盤納入（上排分類型：專場 / 音樂祭事件 / TV拼盤或歸入音樂祭事件群）。
