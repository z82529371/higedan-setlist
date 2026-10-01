# ADR-0050: 跨年份巡演單一容器歸屬與連續組曲解析傳導規範

## Status
Accepted

## Context

1. **跨年份巡演之容器歸屬與年份錨點爭議**：
   - 樂團部分大型巡迴專場跨越多個日曆年度：
     - `Tour 19/20 - Hall Travelers -`（2019-10-26 至 2020-02-22，全 29 場）
     - `one-man tour 2021-2022 - Editorial`（2021-09-04 至 2022-04-17，全 49 場）
     - `SHOCKING NUTS TOUR 2022-2023`（2022-09-28 至 2023-02-16）
     - `4 Re:ism 2025-2026`（2025-11-20 至 2026-01-25）
   - 若將跨年巡演依日曆年拆為 2019 與 2020 兩個檔案，會破壞巡演共識模板（`templateSetlist`）的統計母體，且造成前端單元按鈕碎片化。
   - 此外，過去 `batch-import.mjs` 對未知演出採用大於 7 天自動加 `-MMDD` 後綴拆解規則（原為防止 CDTV 等不同期電視特輯誤併），但巡演本質即跨越數週數月，若未預先豁免，會導致巡演場次被誤拆成十數個單日事件檔案。

2. **現場組曲（Medley / インストメドレー）的 LiveFans HTML 表現與解析遺漏**：
   - LiveFans 在呈現組曲（如 Tour 19/20 的純演奏組曲《ゼロのままでいられたら》+《夕暮れ沿い》、Editorial 的《コーヒーとシロップ》～《115万キロのフィルム》メドレー）時，其 HTML 結構為：
     - 首格：`<td class="sl10"><p class="medley"><b>インストメドレー</b></p><div class="ttl">...</div></td>`
     - 接續格：`<td class="pcslmedley"><div class="ttl">...</div></td>`
   - 過去解析器僅在含有 `<p class="medley">` 的首格提取備註，接續格因缺少 `<p>` 標籤，導致後續組曲曲目丟失 `[インストメドレー]` 或 `[メドレー]` 備註。

3. **使用者自訂 shortTitle 不可變性**：
   - 使用者在 JSON 內自訂的 `shortTitle` 具備最高優先權，自動化腳本絕不可在同步時覆寫。

## Decision

1. **跨年份巡演單一容器不變量（Cross-Year Tour Unification）**：
   - 專場巡演（Tour）**絕對不依日曆年分割**；不論橫跨多少年份，全巡演所有場次統一收錄於單一檔案（如 `data/tours/tour-19-20-hall-travelers.json`，全 29 場）。
   - **年份歸屬錨點為「開始年份（Earliest Year）」**：前端二級篩選（開始年份）統一取自首場演出日期之年份（`unitEarliest(u).split("-")[0]`）。因此 `Tour 19/20` 歸屬於 `2019`（同理 Editorial 歸屬於 `2021`，SHOCKING NUTS 歸屬於 `2022`）。
   - **巡演豁免 7 天拆解規則**：在 `batch-import.mjs` 中，凡演出標題含有 `Tour` / `ツアー` / `巡演` 者，**絕對豁免於 7 天日期消歧義分拆**，確保同一巡演場次完整凝聚。

2. **組曲跨格連續傳導機制（Medley Note Propagation）**：
   - 延續 [ADR-0027](0027-tv-medley-sl-parsing-and-empty-guard.md)「SPメドレー記兩筆、各帶相同 memo」原則。
   - 在 [`parse.js`](../site/scripts/lib/parse.js) 的 `extractSongsFromHtml` 迴圈中維護狀態 `currentMedleyText`：
     - 當格內匹配到 `<p class="medley">`，更新 `currentMedleyText`（如 `インストメドレー`、`メドレー`）。
     - 後續相鄰儲存格若其 class 仍包含 `medley`（如 `pcslmedley`、`slmedley`），自動繼承該組曲備註。
     - 直至遇到非 medley 的常規儲存格（如 `sl11`），方重置清空 `currentMedleyText`。
   - **巡演模板連續性**：組曲內相連演出之歌曲，在巡演共識模板（`templateSetlist`）中必須相鄰排列，不得被中途其他常規曲目切斷。

3. **自訂 shortTitle 絕對保護**：
   - 嚴格守護使用者自訂之 `shortTitle`，管線與自動化匯入禁止覆蓋已存在的自訂簡稱。

## Consequences

- `Tour 19/20 - Hall Travelers -` 全 29 場完整歸併於單一巡演主檔，前端清晰座落於 2019 年專場分類。
- 1150102 之《ゼロのままでいられたら》與《夕暮れ沿い》皆完整標註 `[インストメドレー]`，Editorial 巡演等多首連續組曲亦同步受惠正確標註。
- 巡演模板曲序貼合現場真實演出結構，消除組曲被生硬拆散引發之假差異。
