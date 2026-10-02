# ADR-0060: 翻唱曲純文字呈現與 #/title/ 路由退役規範

## Status
Accepted

## Context

1. **翻唱曲之本質與歌曲分頁（Song Tab）之定位（[ADR-0055](0055-cover-songs-title-track-boundary.md)）**：
   - 系統依據 ADR-0055 規範，非 Official髭男dism 原創作品（如西洋翻唱、J-POP 翻唱、讚美歌等）嚴格不登錄於 `data/songs.json`，以保護官方本家作品庫邊界。
   - 先前前端為了呈現未登錄於 `songs.json` 的翻唱曲，實作了 `#/title/<title>` 動態路由、`allTitleTracks` 搜尋項目以及 `TitleSlip` 視圖元件，並在歌單卡片（`ShowSlip`）中將翻唱曲同樣渲染為可點擊之超連結（`<a>` 標籤）。
2. **語意混淆與搜尋污染問題**：
   - 經檢討「翻唱曲都不用帶有連結」之需求：歌單卡片上的超連結樣式給予使用者「這是一首官方作品、點擊可檢視作品統計與發行資訊」的預期，點擊後跳轉至非官方曲目的 `TitleSlip` 視圖，導致使用者困惑。
   - 同時，全域搜尋框（SearchBox）納入 `allTitleTracks` 亦讓非原創作品混雜在歌曲搜尋結果中，降低了官方歌曲庫查詢的純粹度。

---

## Decision

1. **歌單卡片中翻唱曲一律以純文字（無連結）呈現**：
   - 在 [`site/src/components/slips.jsx`](../../site/src/components/slips.jsx) 的 `ShowSlip` 中，無 `songId` 的翻唱／標題曲目一律改以 `<span className="font-medium text-ink">{title}</span>` 純文字標籤渲染，取消超連結、懸停效果（hover）與指標游標（pointer cursor）。
2. **全域搜尋框（SearchBox）完全排除翻唱曲**：
   - 在 [`site/src/components/SearchBox.jsx`](../../site/src/components/SearchBox.jsx) 移除 `allTitleTracks` 與 `type: "title"` 搜尋分支，全域搜尋之「歌曲」分類嚴格聚焦於 `data/songs.json` 官方本家曲庫。
3. **退役 `#/title/` 路由與 `TitleSlip` 視圖**：
   - 徹底移除 `TitleSlip` 元件、`onSelectTitle` 處理常式、`selTitle` 狀態及 `#/title/` 路由解析，簡化前端整體狀態機。歌曲分頁（song tab）百分之百專注於呈現官方原創歌曲視圖（`SongSlip`）。

---

## Consequences

- 前端視圖與本家作品庫界線更加清晰一致：官方歌曲可點擊檢視歷來演出履歷，翻唱曲純粹作為現場演出客觀事實紀錄呈現，無誤導性點擊行為。
- 前端代碼大幅精簡，消除了專為翻唱曲維持的旁支路由、狀態管理與視圖渲染邏輯。
