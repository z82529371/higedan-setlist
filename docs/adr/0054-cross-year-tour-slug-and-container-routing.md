# ADR-0054: 跨年份巡演 Slug 生成防拆機制、巡演目錄導向與 one-man tour 18/19 建模

## Status
Accepted

## Context

1. **跨年份巡演 Slug 生成之日曆年割裂盲點**：
   - 過去 [`batch-import.mjs`](../../site/scripts/batch-import.mjs) 在處理未知演出時，於 slug 生成末端使用 `else if (!slug.includes(year))`（`year` 為演出日期之 4 位數日曆年，如 `2018` 或 `2019`）進行防碰撞追加。
   - 對於如 `Official髭男dism one-man tour 18/19` 此類標題本身已具備兩碼跨年份縮寫（`18-19`）之大型巡演：
     - 2018 年之場次因 slug `one-man-tour-18-19` 未包含 `2018`，被強制追加為 `one-man-tour-18-19-2018`；
     - 2019 年之場次因未包含 `2019`，被強制追加為 `one-man-tour-18-19-2019`；
     - 導致同一巡演在自動匯入時被硬生生拆為兩個獨立的日曆年活動檔案，違反 [ADR-0050](0050-cross-year-tour-unification-and-medley-propagation.md) 之「跨年份巡演單一容器不變量」。

2. **未知演出目錄預設分流問題**：
   - 自動匯入管線遇到未註冊之演出時，預設一律寫入 `data/events/`，未根據巡演特性導向 `data/tours/`，造成專場巡演掉入 events 目錄。

3. **`one-man tour 18/19` 之雙巡演形態（Live House 編 vs Hall 編）**：
   - 髭男主流出道後的首次大型全國巡演（全 24 場）具有明確的雙形態編排：
     - **Live House 編（共 17 場）**：橫濱、札幌、四國、廣島、東北、長野、北陸，以及 2019 年 1 月的濱松、福岡、鹿兒島等。曲目固定為 20 首，以《発明家》開場，中段 M12 演出未發表曲《明け方のゲッタウェイ》（LiveFans 缺播放器索引）。
     - **Hall 編（共 7 場）**：大阪 NHK、米子市文化會館、名古屋特殊陶業、東京 NHK Hall、松江島根縣民會館。曲目精簡為 18 首（東京場含 SE 為 19 筆），改以《ESCAPADE》開場，加入多首 Hall 編專屬曲目。

## Decisions

1. **跨年份巡演 Slug 防拆保護（Cross-Year Slug Span Protection）**：
   - 在 [`batch-import.mjs`](../../site/scripts/batch-import.mjs) 中增設 `hasYearSpan` 判斷（匹配 `\b\d{2}-\d{2}\b` 或 `\b\d{4}-\d{4}\b`）。
   - 若 slug 本身已包含跨年份區間標記，禁止盲目追加日曆年後綴，維持規範唯一 slug（如 `one-man-tour-18-19`）。

2. **巡演目錄優先導向（Tour Directory Routing）**：
   - 匯入管線檢查目標檔案時，優先確認 `data/tours/` 是否已存在同 slug 檔案，確保巡演容器持續歸集於 `data/tours/`。

3. **`one-man tour 18/19` 容器歸併與模板建模**：
   - 全 24 場（橫跨 2018-11-07 至 2019-02-02）全數合併於單一巡演容器 **[`data/tours/one-man-tour-18-19.json`](../../data/tours/one-man-tour-18-19.json)**。
   - 年份錨點依據 [ADR-0050](0050-cross-year-tour-unification-and-medley-propagation.md) 採用首場年份（`2018`）。
   - 以佔多數之 Live House 編（17/24 場，佔 71%）建構 20 首曲目之 `templateSetlist`（含 M12《明け方のゲッタウェイ》）；其餘 7 場 Hall 編及微調場次透過 LCS `diff` 精確表達差異。
   - 徹底移除過渡期產生的 `data/events/one-man-tour-18-19-2018.json` 與 `data/events/one-man-tour-18-19-2019.json`。

4. **場館中文名稱與行政區標準化**：
   - 校正自動翻譯產生的場館與地名：
     - `日本特殊陶業市民会館 ビレッジホール` -> `日本特殊陶業市民會館 Village Hall`（愛知縣名古屋市，中部地區）
     - `米子市文化ホール メインホール` -> `米子市文化會館 主廳`（鳥取縣米子市，中國地區）
     - `浜松窓枠` -> `Live House 濱松窓枠`（靜岡縣濱松市，中部地區）
     - `鹿児島SR HALL` -> `鹿兒島SR HALL`（鹿兒島縣鹿兒島市，九州地區）
   - 於 [`data/songs.json`](../../data/songs.json) 補全《恋の前ならえ》之 LiveFans 識別碼（`329573`）。

## Consequences

- 跨年份專場巡演不再因跨日曆年而被管線自動割裂，保持專場容器凝聚力與模板統計完整性。
- `Official髭男dism one-man tour 18/19` 全 24 場正確歸屬於 2018 專場分類，且完美還原 Live House 與 Hall 雙形態之現場曲目。
- 前端資料驗證（`validate-data.mjs`）與煙霧測試全數 0 警告 0 錯誤通過。
