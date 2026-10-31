# ADR-0135: 歌曲主檔官方影音收錄、現場雙軌聯動與沉浸式播放架構 (Song Master Media Embed, Live Twin-Track Linkage & Immersive Player Architecture)

## Status
已採納 (Accepted)

## Context
1. **現場演出檔案庫之視聽記憶缺口**：
   在 [`SongSlip`](file:///site/src/components/slips/SongSlip.jsx) 歌曲票根中，樂迷能夠完整檢視歌曲歷史出演場次、近年是否封箱、自彈自唱與特殊版本統計。然而過往僅提供外跳 YouTube 搜尋關鍵字的動態連結（`https://www.youtube.com/results?search_query=...`），此舉存在兩大體驗痛點：
   - 點擊後跳出網站，打斷連續探索與個人巡演票夾的瀏覽節奏；
   - 搜尋結果多為民間個人自製音源或混雜影片，無法精準傳達樂團一手官方發布的高音質現場震撼。
2. **現場檔案庫之領域靈魂 vs 官方影片現實（Domain Model vs Reality）**：
   - 本站核心定位為「現場演出檔案庫」（Live Concert Archive），歌迷最渴望看見的是該曲在具體巡演或場館的**官方現場演出版（Official Live Video）**（如武道館之《Pretender》、日產體育場之《White Noise》等）；
   - 然而 Official 髭男 dism 官方 YouTube 頻道公開釋出之獨立 Live 影片僅約 20~30 首，全站收錄百餘首歌曲中多數僅有**官方音樂錄影帶（Official MV）**，早期地下未發表作品甚至兩者皆無。若強制要求「非 Live 不錄」，將導致七成以上歌曲開天窗。
3. **長片集錦與直播錄影之時間戳偏移需求（Timestamp Offset）**：
   樂團許多珍貴現場（例如 YouTube Space Tokyo 2019、線上直播精華、Festival 串燒或官方 Digest）為長達數十分鐘之單一整片影片，特定歌曲落在影片中間，必須支援時間戳（`start`）以利開播時精確跳轉至唱段。

## Decision

### 1. 歌曲主檔單一真理來源擴充（SSOT: `data/songs.json`）
在全域歌曲主檔 [`data/songs.json`](file:///data/songs.json) 中擴充結構化媒體欄位，由 `pnpm sync` 自動同步至前端：
- **`mv`**（字串或物件，可選）：官方錄音室影音。採四級階梯收錄準則：
  1. 官方完整版 MV（Full MV）
  2. 官方完整歌詞版（Lyric Video）
  3. 官方短版 MV（Short Ver.）
  4. 官方專輯全曲試聽節錄（Album Trailer / Crossfade 透過 `start`/`end` 節錄 20～30 秒副歌）
  支援純字串 ID（例如 `"TQ8WlA2GXbk"`）或帶時間戳之物件 `{ "youtubeId": "...", "start": "01:23", "end": "01:53" }`。
- **`live`**（物件或物件陣列，可選）：官方現場演出錄影詮釋資料。若同一首歌曲官方釋出多場跨年份現場（例如 2019 武道館、2021 ぴあアリーナ、2025 日產體育場），允許傳入物件陣列：
  ```json
  "live": [
    {
      "youtubeId": "bJXIYp2f0pc",
      "title": "one-man tour 2019 @ 日本武道館",
      "shortTitle": "2019 武道館",
      "showId": "1078251",
      "start": "02:15",
      "end": "02:45"
    },
    {
      "youtubeId": "h8rZAMiRTTo",
      "title": "LIVE at STADIUM 2025 @ 日産スタジアム",
      "shortTitle": "2025 日產",
      "showId": "1735839"
    }
  ]
  ```
- **多場次版本切換（Multi-Show Live Selector）**：若歌曲包含多場 Live，舞台上方自動渲染年份場館切換標籤（如 `[📍 2019 武道館]`、`[📍 2025 日產]`），切換時影片即時換台，底部的「前往該場次票根」亦同步切換綁定。
- **`showId` 深度聯動**：選填欄位，關聯至系統內的具體場次主檔，使影片直接串聯本站歷史演出票根。

### 2. 雙軌回退與智慧感知按鈕（Twin-Track Fallback & Smart Affordance）
在 [`SongSlip`](file:///site/src/components/slips/SongSlip.jsx) 工具列中依歌曲具備之媒體屬性呈現對應按鈕：
- **具備 Live 片段**：顯示 `🎬 現場影片`（高亮提示）。
- **僅具備 MV**：顯示 `▶ 官方 MV`。
- **兩者皆無（如未發行曲）**：優雅回退現行 `▶ YouTube`（保持原外跳搜尋行為，不破壞排版）。

### 3. 票根原生內嵌影音舞台（`SongMediaStage`）
取代舊式覆蓋全螢幕的跳出彈窗（Modal），改為直接在歌曲票根（`SongSlip`）虛線撕角（`TicketPerforationDivider`）下方常駐內嵌「官方影音舞台」，嚴格遵從下列體驗、排版與繪圖管線準則：
- **徹底杜絕 GPU 視訊破圖**：舊式全螢幕彈窗遮罩在 Windows / Chromium 硬體加速下會觸發 Direct Composition 合成器縫隙破圖（卡片外產生黑框與黑線）；改為票根內自然流內嵌後，播放器作為普通 DOM 節點渲染，零遮罩、零圖層穿透運算，100% 穩定呈現。
- **邊聽邊查雙重體驗（Simultaneous Listening & Browsing）**：歌迷點擊播放現場錄音後，可自由向下滑動票根，對照瀏覽該曲橫跨數年的歷次巡演演出歷史，無需中斷視聽。
- **小尺寸螢幕自適應排版（Mobile-Optimized Layout）**：
  - 舞台頂部工具列在手機窄螢幕（`<420px`）採用垂直彈性折行，外跳連結縮短為 `YouTube ↗` 避免水平溢出；
  - 雙軌切換按鈕（`[🎪 現場 Live]` / `[🎬 官方 MV]`）與場次直達按鈕設定 `>=32px` 舒適觸控熱區；
  - 16:9 自適應畫幅（`aspect-video w-full`）緊密貼合票券寬度。
- **場次雙向直達（Show Deep-link）**：若當前播放之 Live 標有 `showId`，舞台底部渲染 `📍 {title} ➔ 前往該場次票根`，點擊即無縫切換路由至該場次的 [`ShowSlip`](file:///site/src/components/slips/ShowSlip.jsx)。
- **開播 50% 音量調校與非侵入式開播**：初次進入頁面使用 `autoplay=0`，避免突發聲音干擾；切換分頁時使用 `autoplay=1`，並透過 YouTube PostMessage API 發送 `setVolume: 50` 鎖定半音量。

### 4. 播放區間（`start` / `end`）與官方現場精華（Live Excerpt / Digest）
官方 YouTube 頻道常釋出 20～30 秒巡演 DVD/BD 預告片（Teaser / Digest）或合輯精華。為兼顧「珍貴畫面收錄」與「透明避免錯愕」：
- **`end` 欄位支援**：主檔物件擴充選填 `end`（如 `"03:45"` 或秒數），由 `parseTimestamp` 解析並帶入 YouTube 播放器 `&start={start}&end={end}`，抵達指定秒數時原生自動暫停。
- **自動標註現場精華**：當 `end > start` 時自動標記為 `isExcerpt: true`，分頁與工具列標籤智慧切換為「🎪 現場精華」（`ja`: 🎪 ライブ（ダイジェスト）, `en`: 🎪 Live Excerpt, `ko`: 🎪 라이브 하이라이트），並在舞台資訊標註區間時長 `⏱️ {timeRangeText}`。
- **維持現場優先**：即使現場錄音為 30 秒短節錄，影音舞台依然維持「現場優先」預設停在現場精華，旁邊並列完整 MV 供隨時切換。

### 5. 時間戳解析防呆機制（`parseTimestamp` & `formatTimestamp`）
在核心工具函式中提供強健之時間轉換，相容以下寫法：
- `"MM:SS"` 格式（如 `"02:15"` -> `135` 秒）與 `"HH:MM:SS"` 格式；
- 整數秒格式（如 `135` 或字串 `"135"`）。
- 在內嵌播放器網址中帶入 `?start={seconds}`，並在「前往 YouTube 原片」外跳網址中對應帶入 `&t={seconds}s`。

### 5. 零後端靜態純粹性與四語系對稱（ADR-0123 & ADR-0107 Invariants）
- 堅持零後端原則，不使用 YouTube Data API 額度或外掛後端，所有影片 ID 均在建置期靜態固化於 `data/songs.json`。
- 介面文案在繁中（`zh-TW`）、日（`ja`）、英（`en`）、韓（`ko`）四語字典中具備完整對稱翻譯。

## Consequences
- **Positive**: 歌迷在回顧歌曲演繹歷史時，無需跳出站點即可沉浸欣賞官方高畫質現場與 MV，顯著提升檔案庫的視聽沉浸感。
- **Positive**: 透過 `showId` 達成「影音 ➔ 歷史場次票根」的反向探索閉環，賦予 YouTube 影片在現場資料庫中的真正歸屬。
- **Positive**: 雙軌模式兼顧了現場檔案庫的核心精神（Live 優先）與曲目覆蓋率（MV 回退）。
- **Positive**: 延遲載入與即時卸載設計保證了網站秒開效能與零背景雜音。
