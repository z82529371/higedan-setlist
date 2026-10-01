# 43. Cover 軌看內容判定與手排位置鎖定

* Status: Accepted
* Date: 2026-10-01

## Context & Problem Statement

Cover／非髭男原唱曲的管線判定只看該格有無 LiveFans 曲目連結（有連結 → `title` 軌、編號計數；memo 文字 → `interlude`）。同一種內容（團員 solo 翻唱串場）因此分裂兩種身份：`1353359`「思ひで [鈴木常吉]」（有連結，`title` 軌）vs `1672278`「思ひ出／Supernova」（無連結，過場）。

同時，缺 `idx` 的 cover／過場位置全靠 DOM 鄰居內插，而 `1456558`、`1353359` 等頁 DOM 本身亂序，內插位置無意義；存檔手排位置與現行管線輸出已分岔（`tooy-1` 兩首 cover、`1353359` 思ひで、`1672278` 對調），下次跑 `batch-import` 即被覆蓋搬走。

## Decision Drivers

* 身份看演出內容，不看投稿者有無綁連結。
* 手排驗證過的位置不可被管線重算覆蓋；模板共識不受影響。
* `title` 軌保留給對方正式演出曲與完整翻唱。

## Decisions

1. **團員 solo 翻唱串場一律 `interlude`**：`parse.js` 新增 `isMemberSoloText`（楢[崎﨑]／小笹／松浦／大輔，含 `﨑` 異體），`computeDiff` 與 `mapPageSongsToEventSetlist` 的 cover 分支遇此訊號即轉過場（備註合併曲名與演出者），不進 `title` 軌、不計數；`1353359` 思ひで降格為 `after:4` 過場（115万之後、最前）。
2. **場次層級 `locked` 旗標**：`batch-import` 對 `locked` 場次仍抓取並貢獻共識模板（模板穩定），但跳過 `diff`／`setlist` 重寫；`validate-data` 跳過其自動修正（警告保留）。已標 `1456558`、`1353359`、`1672278`。
3. **位置以手排驗證為準**：`tooy-1` 兩首 cover 定為願い M4／ふっかと M7；思ひで轉過場後置於 `after:4` 最前；`1672278` 定為 Supernova→思ひ出（採頁面 DOM 順）。存檔手排為準，管線以 `locked` 保護。

## Consequences

* 歌曲統計不再含團員 solo 翻唱；`1672272` プラネタリウム等完整翻唱維持 `title` 軌。
* 全索引頁面行為零變更；`locked` 場次日後手排完即標，成為工作流。
* ADR-0028 的同曲 `skip`＋重插（アレンジ版本差異）不受影響。
* 思ひで系譜：0031（過場合併 note 形）→0032（title 軌）→本決議（團員 solo 回過場形）；`1499384` 實為過場形，與本決議一致。
