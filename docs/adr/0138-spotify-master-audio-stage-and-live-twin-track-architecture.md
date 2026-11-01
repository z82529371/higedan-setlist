# ADR-0138: 歌曲主檔 Spotify 官方音源收錄、現場雙軌聯動與緊湊型播放舞台架構 (Song Master Spotify Audio Embed, Live Twin-Track Linkage & Compact Audio Stage Architecture)

## Status
已採納 (Accepted)

## Context
1. **動態搜尋外跳之體驗斷層與品質不確定性**：
   過往在歌曲票根（[`SongSlip.jsx`](file:///site/src/components/slips/SongSlip.jsx)）中，Spotify 按鈕僅作為拼接關鍵字的動態搜尋連結（`https://open.spotify.com/search/...`）。此做法存在三大體驗痛點：
   - 點擊後跳出搜尋結果頁，需使用者手動二次辨識哪一首才是官方正版；
   - 搜尋結果常夾雜非官方翻唱、Live 現場音源或海外授權受限版本，無法保證點入即為最高品質之錄音室母帶；
   - 失去專案身為「現場演出檔案庫」的雙向探索靈魂，無法讓歌迷在回顧巡演時直接聆聽該場巡演官方發行之現場音源（如 2019 武道館、2020 線上 Live、2021-2022 Editorial 埼玉、2024 Rejoice Arena、2025 日產體育場）。
2. **雙軌視聽心智之對齊（Twin-Track Experience Parity with ADR-0135）**：
   在 [`ADR-0135`](file:///docs/adr/0135-song-master-media-embed-and-live-twin-track-linkage-architecture.md) 中，本站成功建立了以 YouTube 為核心的「錄音室原曲 vs 現場 Live 雙軌切換」影音舞台。然而許多歌迷在瀏覽歷年演唱會歷史、探索冷門曲目或查閱自彈自唱歷程時，更偏好純音訊串流聆聽，渴望擁有與 YouTube 完全對齊的版本切換、多場次選台與場次直達能力。
3. **第三方 Cookie 與 30 秒試聽限制之優雅平衡**：
   Spotify Embed（網頁內嵌播放小工具）因 Chromium 與 Safari 第三方 Cookie 限制，未在當前瀏覽器登入 Spotify 網頁版的使用者會被限制僅能試聽 30 秒片段。因此必須同時兼顧「票根原生即時試聽」與「一鍵直達本機 Spotify App / 網頁版完整高音質播放」的雙層體驗。

## Decision

### 1. 歌曲主檔單一真理來源擴充（SSOT: `data/songs.json`）
在全域歌曲主檔 [`data/songs.json`](file:///data/songs.json) 中擴充結構化 `spotify` 物件，堅持 ID 純粹性與 22 碼 Base62 檢驗：
```json
"spotify": {
  "trackId": "49h5Aav6yn1o1ACGyovDdZ", // 22 碼 Base62 官方錄音室 Track ID
  "live": [                             // 現場專輯音源陣列（選填）
    {
      "trackId": "2K74OeuU2y0RN746g9EizC",
      "title": "one-man tour 2019@日本武道館",
      "shortTitle": "2019 武道館",
      "showId": "1078251"               // 嚴格關聯至系統內的具體場次主檔
    }
  ]
}
```
- **100% 覆蓋已正式發行曲目**：全站 110 首歌曲中，94 首正式發行曲目全數完成官方錄音室音源對齊（含單曲、EP 與大碟）；56 首熱門曲目額外收錄 99+ 筆跨年份巡演現場音源。
- **早期地下 Demo 未上架作品防護**：16 首標記為 `unreleased: true` 之地下時期作品，主檔中不設 `spotify` 屬性，前端工具列維持優雅回退搜尋，杜絕無效空連結。

### 2. 領域純函式模組化與檢驗管線（`song-spotify.js`）
建立獨立領域解析模組 [`site/src/lib/song-spotify.js`](file:///site/src/lib/song-spotify.js)，提供：
- `isValidSpotifyTrackId(id)`：嚴格檢驗 22 碼大小寫英數字元 Base62 格式；
- `buildSpotifyEmbedUrl(trackId)`：標準化產出緊湊型 Embed 網址；
- `buildSpotifyTrackUrl(trackId)`：標準化產出外跳直達網址；
- `resolveSongSpotify(song)` 與 `getSongSpotify(songId)`：快取預索引，提供次毫秒級讀取與安全預設回退。

### 3. 票根原生緊湊型音源舞台（`SpotifyAudioStage.jsx`）
比照 YouTube 影音舞台美學，在歌曲票根（`SongSlip`）內建專屬緊湊型 Spotify 音源舞台：
- **標準 152px 緊湊高度**：採用 Spotify 官方推薦之標準嵌入高度，完整呈現封面藝術、曲目標題、進度條與播放控制，零冗餘留白。
- **雙軌切換按鈕**：若歌曲同時具備錄音室原曲與現場音源，頂部提供 `[🎧 錄音室原曲]` 與 `[🎪 現場 Live]` 快速切換標籤。
- **多場次版本選台器（Pills）**：若收錄多場巡演現場，即時渲染 `[📍 2019 武道館]`、`[📍 2021 埼玉]`、`[📍 2025 日產]` 等藥丸按鈕，支援一鍵換台。
- **場次票根雙向直達（Show Deep-link）**：現場模式下，舞台底部渲染 `📍 {title} ➔ 前往該場次票根 →`，點擊即時無縫跳轉該場次之 [`ShowSlip`](file:///site/src/components/slips/ShowSlip.jsx)。
- **本機 App 一鍵直達（Outbound Button）**：右上角提供 `Spotify ↗` 外跳按鈕，方便歌迷隨時切換至本機 Spotify App 享受完整無損音質與無縫播放列表。

### 4. 零後端靜態純粹性與四語系對稱（ADR-0123 & ADR-0107 Invariants）
- 零後端依賴：所有 Spotify Track ID 均在建置期固化於靜態 JSON，不消耗 Spotify Web API 配額，100% 離線可用。
- 四語系在地化：在繁中（`zh-TW`）、日（`ja`）、英（`en`）、韓（`ko`）四語字典中具備完整對稱翻譯，杜絕裸露 CJK 字串。

## Consequences
- **Positive**: 歌迷點擊 Spotify 不再面臨模糊的搜尋結果，100% 直達官方一手高品質錄音室音源與歷次代表性巡演現場。
- **Positive**: 透過 `showId` 達成「Spotify 現場 ➔ 歷史場次票根」的反向閉環探索，加深現場檔案庫的沉浸感。
- **Positive**: 兼顧票根內直接試聽與外跳本機 App 播放完整音樂之雙重場景需求。
- **Positive**: 16 首未發表曲目優雅降級，未發行狀態一目了然，維護了領域模型的高嚴謹度。
