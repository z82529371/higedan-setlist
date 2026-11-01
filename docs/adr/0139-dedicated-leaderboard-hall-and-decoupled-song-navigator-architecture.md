# ADR-0139: 全站獨立排行殿堂分頁與歌曲導航器解耦架構 (Dedicated Leaderboard Hall & Decoupled Song Navigator Architecture)

- **狀態**: Accepted
- **日期**: 2026-11-01
- **問題領域**: 演唱會演出出勤統計、榮譽榜單視覺化、歌曲導航器選曲體驗 (`#/ranking`, `SongNavigator`, `routes.js`)
- **相關文件**: `ADR-0101`, `ADR-0102`, `ADR-0114`, `ADR-0124`, `PRODUCT.md`, `DESIGN.md`, `GLOSSARY.md`

---

## 1. 背景與核心痛點 (Context & Problem Statement)

在先前的架構中，官方髭男 dism 歷年演出出勤統計與排名存在兩大核心痛點：

1. **榜單展示與導航選歌工具職責耦合 (Coupled Concerns)**：
   原本的「依演唱次數排行」僅作為 `SongNavigator` 內部的一個切換選項。使用者希望一覽樂團歷史最常演唱的殿堂神曲時，被侷限在導航器內以 10 首為單位的分頁按鈕（`PaginationPills`）中，缺乏整體排行榜的視覺層次（如金銀銅牌頒獎台、直式百分比數據長條），無法滿足歌迷對於歷史里程碑的觀賞與榮譽感。
2. **歌曲導航器互斥割裂與找歌繁瑣 (Rigid Song Selector UX)**：
   在 `SongNavigator` 內，「依發行專輯分類」與「依演唱次數排行」被設計為互斥的單選模式。當歌迷想查看特定專輯（例如《Traveler》）內各曲目的演出熱度時無法排序；且必須在盲點分頁膠囊中反覆翻頁，缺乏即時搜尋過濾能力。

---

## 2. 決策內容 (Decision Record)

經決策樹梳理與雙軌架構討論，決定實施**「雙軌分離與互補」**架構：

### 軌道一：全站獨立「排行殿堂」分頁 (`#/ranking`)
1. **頂層路由與狀態機拓展**：
   在 `site/src/lib/routes.js` 與 `useArchiveRoute` 中新增第一公民路由 `#/ranking`（支援 `?lang=...` 多語系參數），並在 `viewMode === "ranking"` 時渲染專屬的 `<RankingPage />` 獨立視圖。
2. **純函式數據管線 (`site/src/lib/ranking.js`)**：
   封裝 `computeRankings({ allUsedSongs, allVenues, trackShows, showById })` 純領域函式，精確統計與排序：
   - **歌曲歷史演唱總榜 Top 20 (All-Time Songs)**：包含活躍年代區間（`firstYear–latestYear`）、各曲對比第 1 名的進度百分比。
   - **專場巡演榜 (One-Man Tours Only)**：剔除音樂節拼盤與商場演出，精準聚焦專場定番曲。
   - **音樂節出勤榜 (Festivals Only)**：呈現樂團在各大音樂節最常出勤的嗨歌。
   - **登場場館榜 Top 10 (Top Venues)**：統計樂團最常造訪的歷史地標場館。
3. **前三名頒獎台與直式數據條視覺體系**：
   - 前三名（#1, #2, #3）以特製金牌（🥇 #01）、銀牌（🥈 #02）、銅牌（🥉 #03）榮譽卡片置頂展示。
   - 4～20 名採用橫向百分比進度長條與序號條列。
   - 點擊任一曲目或場館直接觸發深層連結，無縫跳轉至該歌曲票券（`#/song/:id`）或場館票券（`#/venue/:id`）。
4. **全站引流與無縫入口**：
   - 頂部狀態列新增 `[🏆 排行]` 按鈕。
   - 行動版懸浮按鈕叢集新增 `[🏆]` FAB。
   - 首頁熱門提示「🏆 歌曲演唱排行」點擊後直接切換至 `#/ranking`。

### 軌道二：歌曲導航器體驗全面解耦與平滑化 (`SongNavigator.jsx`)
1. **解除「專輯分類」與「演唱次數」互斥**：
   將專輯過濾（All Albums + 各發行專輯）與排序方式（依發行曲序 vs 依演唱次數排行）解耦，支援在特定專輯內直接按次數高低由多至少排序。
2. **即時歌名快速搜尋**：
   在導航器內提供輕量即時關鍵字輸入框，打字即時篩選歌名或別名。
3. **告別 10 首分頁膠囊**：
   淘汰原先痛苦的 `1-10`、`11-20` 分頁按鈕，改為直觀、響應式的平滑滾動曲目格。
4. **專屬引流導航**：
   在導航器頂部提供「🏆 想看前三名頒獎台與各時期總榜？前往【排行殿堂】→」導流按鈕。

---

## 3. 多語系對稱性 (Multi-Lingual Parity)

新增的所有字典鍵值嚴格對稱覆蓋 4 語系：
- `nav.ranking`: zh-TW: `排行` / ja: `ランキング` / en: `Leaderboard` / ko: `랭킹`
- `ranking.title`: zh-TW: `排行殿堂` / ja: `ランキング殿堂` / en: `Leaderboard Hall` / ko: `명예의 전당`
- 所有子榜標籤、表彰台徽章與引流提示均具備完整 4 語系本地化翻譯，零裸寫 CJK。

---

## 4. 驗證與影響 (Consequences & Verification)

- **自動化測試覆蓋**：
  - `site/tests/pipeline/ranking.test.js`：純函式統計計算與邊界條件驗證。
  - `site/tests/ui/ranking-route.test.js`：`#/ranking` 雙向解析、多語系查詢參數與路由狀態機驗證。
  - `site/tests/ui/ranking-page.test.js`：頒獎台、子榜切換與 SSR 渲染驗證。
  - `site/tests/ui/song-navigator.test.js`：解耦排序、即時過濾與導航聯動驗證。
- **純靜態零後端保證**：
  所有數據計算皆由已同步之 `data/*.json` 在用戶端即時純函式完成，無任何後端開銷與 API 依賴。
