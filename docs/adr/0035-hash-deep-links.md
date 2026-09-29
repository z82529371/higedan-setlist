# 35. 前端 Hash 深連結：子連結、前後頁與翻唱詳情

* Status: Accepted
* Date: 2026-09-30

## Context & Problem Statement

全站選擇態（歌曲/場次/場地/巡演）只存 `useState`，所有連結皆 `href="#"`：
瀏覽器前後頁無法回到上一個選擇；曲目內的翻唱 `title` 軌顯示為無連結純文字，
無法分享、無法右鍵開分頁。站為純靜態 Vite build，無 router 依賴。

## Decisions

1. **Hash 路由**（`#/song/:id`、`#/show/:id`、`#/venue/:name`、`#/title/:title`）：
   零依賴、免 server 重寫、前後頁原生可用；`location.hash` 為單一漏斗
   （選擇寫 hash → `hashchange` 回寫 state；初載由 hash 還原選擇並校驗存在性）。
2. **全實體真實 `href`**：歌曲/場次/場地抽屜、曲目行、出現清單共 7 處 `href="#"` 清零；
   搜尋 Enter 與單位切換同走漏斗；頁籤切換不推歷史（避免噪音）。
3. **翻唱 `TitleSlip` 詳情**：以 `title` 為鍵建 `globalTitleShows`，
   `#/title/…` 顯示標題＋全檔案庫出現場次（沿用出現清單样式）；過場維持純文字。

## Consequences

* 前後頁、分享、右鍵開分頁、重新整理保持位置皆可用；`vite build` 通過；
  路由往返（日文/括號/空白編碼）單元驗證通過。
* `CONTEXT.md` 不動（純實作，未改領域語言）。
