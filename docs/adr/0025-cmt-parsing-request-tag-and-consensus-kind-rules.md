# 25. cmt 註解過濾、點歌標籤自動辨識與共識標籤採樣規範

> **cmt 主文**：另見 0005（原則）、0026（排序補丁）、0029（多 cmt 與正規化）。

* Status: Accepted
* Date: 2026-09-29

## Context & Problem Statement

在 livefans 爬蟲匯入資料時，遇到了以下幾個資料結構與解析問題：
1. **點歌（Request）標籤**: LiveFans 備註中常見「観客リクエスト」、「リクエスト」等字眼，先前未自動歸類為 `kind: ["request"]`。
2. **獨立過場/註解 `<div class="cmt">`**: LiveFans 頁面上除了歌曲內部的 `<p class="memo">` 外，還有獨立的 `<div class="cmt">` 標籤（如 `MC`、`OPENING`、`ひ組のテーマ ～八岐大蛇編～`）。需要明確定義過濾與記錄規範。
3. **共識模版標籤污染**: 先前的 `buildConsensusTemplate` 會盲目將單一場次的曲目標籤（如某場的 `satoshi-solo` 或 `note`）寫入全巡演共識模版 `templateSetlist`，導致其他場次誤帶特定場次專屬的標籤。
4. **非主唱獨奏誤標**: 包含「弾き語り」的備註（如 `楢崎さんGuitarにて弾き語り`）被誤判為 `satoshi-solo`。

## Decision Drivers

* 保持巡演模板 `templateSetlist` 的純淨性，僅收錄全巡演共識的正式歌曲（`songId`），不混入過場（`cmt` / `interlude`）。
* 精確區分歌曲內部的 `subtitle`/`memo` 與獨立的 `cmt` 段落。
* 自動過濾無關紀錄的 `MC` 與 `OPENING` 標籤。

## Decisions

1. **`request` 標籤自動辨識**:
   - 當 `subtitle`/`memo` 包含「リクエスト」或「request」（不區分大小寫）時，自動於該曲目的 `kind` 陣列加入 `"request"`。

2. **`<div class="cmt">` 獨立過場處理與欄位收斂規範**:
   - `MC` 與 `OPENING` / `SE:` 標籤：**完全過濾忽略**，包含帶編號與分隔符之變體（如 `MC1`, `MC 2`, `MC-3`），不寫入任何歌單。
   - 非 MC/OPENING 之 `cmt` / 過場標籤（如 `ひ組のテーマ`、`One more time, One more chance`）：一律作為**獨立過場項目**（`type: "interlude"`, `note: cmtText`）記錄於該場次的 `diff.insert` 中，**僅保留 `type` 與 `note`，不需要也不設定 `title` 或 `songId`**。
   - **`cmt` / `interlude` 項目一律不進入巡演模板 `templateSetlist`**。

3. **團員彈唱區分與 `satoshi-solo` 標籤**:
   - `satoshi-solo` 僅適用於主唱藤原聰（Satoshi）。當備註中明確提及 `楢崎`、`小笹` 或 `松浦` 等其他團員時，排除自動加入 `satoshi-solo`。

4. **共識標籤多數決（$\ge 50\%$ Threshold）**:
   - 巡演模板 `templateSetlist` 中的 `kind` 標籤，必須在該巡演中出現於 $\ge 50\%$ 的場次，才寫入模版；單一場次的特例標籤保留在該場次的 `diff` 中。

## Consequences

* 巡演模板 `templateSetlist` 更加精準乾淨，不再包含非歌曲項目與特例標籤。
* 所有現場特定過場（`cmt`）皆以統一的 `type: "interlude"` + `note` 規範呈現。
