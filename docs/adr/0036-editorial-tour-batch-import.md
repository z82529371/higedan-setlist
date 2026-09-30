# 36. Editorial 巡演批量匯入與管線缺口修補

* Status: Accepted
* Date: 2026-09-30

## Context & Problem Statement

49 個 LiveFans ID（1310540–1310585、1353359–1353487、1420960）抽查全屬
`one-man tour 2021-2022 - Editorial` 同一巡演。若直接跑 `batch-import`，
全數掉進未知事件匯入、散成事件檔，違反巡演/事件邊界。

## Decisions

1. **新建巡演單元** `one-man-tour-2021-2022-editorial`（專場），場次用 LiveFans 數字 ID，
   先建 49 場骨架，試點 3 場（頭中尾）後全量。
2. 試點修補四缺口再全量：
   - `～MC1～` 波浪號 MC 穿透過濾 → `isIgnoredCmtText` 去裝飾字元，`cmt` 與 memo-only 雙路徑；
   - 47 都道府縣表＋場館名取市（`cityFromVenueName`），註冊分支自動建檔即帶區市縣；
   - `総合 → 綜合` 入規則表；兩筆試點字典回填。
3. 全量後追加修補：日文新字體碼位（徳/德、広/廣、縄/繩）致三列掉回舊邏輯，
   加 `SHINJITAI_FIX`；機器譯名批量正名（朱鷺展覽館、去引號埼玉、日本礙子、
   福岡海洋、宮城積水海姆、福井太陽巨蛋、ASTY德島）。

## Consequences

* 49/49 入庫，19 首共識模板，逐場 `diff`；`メンバー紹介`/`Movie` 等描述性段落保留為過場（非 MC 標籤）。
* 1420960 經查為官方登記之線上直播場，忠於來源記 `線上直播`，不竄改。
* `sync-data`＋`validate` 通過並鏡像；`CONTEXT.md` 不動（無領域語言變更）。
