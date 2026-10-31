# ADR-0136: 巡演與單場官方影音精華收錄、全景票券舞台與漸進式展示架構 (Tour & Show Media Digest Embed, Concert Media Stage & Progressive Enhancement Architecture)

## Status
已採納 (Accepted)

## Context
1. **巡演整體視聽記憶的聚合需求**：
   在 [`ADR-0135`](file:///docs/adr/0135-song-master-media-embed-and-live-twin-track-linkage-architecture.md) 中，系統成功實作了以「單曲」為核心的雙軌影音（MV / Live / 精華）。然而樂迷在瀏覽 [`TourSlip`](file:///site/src/components/slips/TourSlip.jsx)（巡演總覽票券）或特定旗艦級 [`ShowSlip`](file:///site/src/components/slips/ShowSlip.jsx)（如 2020 線上演唱會）時，除了關注曲目出現頻率、輪換歌單與巡演足跡地圖外，更渴望直觀感受該巡演的整體舞台規模、燈光編排、視覺概念與現場震撼力。
2. **官方商業發行（BD/DVD Digest）的真實邊界**：
   - Official 髭男 dism 官方 YouTube 頻道僅為具備商業實體發行或線上付費直播之重大巡演／演出釋出過 3～5 分鐘的高音質官方精華（`[BD/DVD Digest]` 或巡演預告片），如 2018 中野サンプラザ、2018-2019 NHK Hall、2019 武道館、2020 Hall Travelers、2020 Arena Travelers 線上、2021 Blooming Universe 線上、2021-2022 Editorial、2022-2023 Shocking Nuts 與 2024 Rejoice。
   - 早期小型 Livehouse 巡演與發行紀念 Mini Live 官方從未發行過 Digest。若強制所有巡演皆需有影片，勢必面臨大面積開天窗或混入民間盜攝。
3. **體驗一致性與零 DOM 污染原則**：
   承襲專案對靜態純粹（`ADR-0123`）與票券美學（`ADR-0104`）的要求，巡演影音不可侵入性破壞原有票根資訊架構，無影片的巡演必須維持 100% 乾淨版面。

## Decision

### 1. 巡演與單場主檔單一真理來源擴充（SSOT: `data/tours/*.json` & `data/events/*.json`）
遵循自足資料單元（`ADR-0009`），在具備官方精華之巡演 `tour` 物件或事件 `event` 物件中新增結構化 `media` 欄位：
```json
"media": {
  "digest": {
    "youtubeId": "y3L0pjZZqKo",
    "title": "Official髭男dism Tour 19/20 -Hall Travelers- (2020.2.10 パシフィコ横浜)［Digest］"
  }
}
```
由 `pnpm sync` 自動同步至前端 `site/src/data/tours/*.json` 與 `site/src/data/events/*.json`。

### 2. 漸進式增強與專屬票券按鈕（Progressive Enhancement & Ticket Affordance）
- **有 Digest**：於 `TourSlip` 或 `ShowSlip` 頂部工具列（Toolbar）渲染高對比之「🎬 巡演精華」（或「🎬 演出精華」）按鈕。點擊後流暢展開 16:9 播放舞台（`ConcertMediaStage`），並支援一鍵放大至全螢幕沉浸式 Modal。
- **無 Digest**：完全不渲染任何影音按鈕或預留空白容器，維持零 DOM 污染與純粹的票根視覺。

### 3. 全面共用原生影音舞台元件（直接復用 `SongMediaStage.jsx`）
徹底拒絕為巡演重複發明另一套播放舞台，直接擴充並共用現有的 [`SongMediaStage.jsx`](file:///site/src/components/slips/SongMediaStage.jsx)：
- 透過 `mediaOverride` 傳入標準化媒體物件，支援 `titleOverride` 自訂舞台標題；
- 頂部工具列支援可選之 `onClose` 收合按鈕；
- 完整繼承 YouTube 隱私網域（`www.youtube-nocookie.com`）安全嵌入、自動 50% 音量調節、16:9 響應式比例、票券邊框與 YouTube 原生外跳連結；
- 歌曲（`SongSlip`）、巡演（`TourSlip`）與單場（`ShowSlip`）全站三大票券百分之百共用同一套優雅的播放器架構。

### 4. 獨立沉浸觀賞規範
巡演／單場 Digest 本身為 3～5 分鐘的精心剪輯全景作品，不與下方歌單強制進行複雜的時間戳切換，保持純粹輕量的觀賞體驗。

## Consequences

### 肯定效益
1. **視聽體驗閉環**：使樂迷在考察巡演編年史與定番曲時，能一鍵點燃現場回憶。
2. **架構高度內聚**：`TourSlip` 與旗艦單場 `ShowSlip` 共用同一套資料結構與元件，無重複發明輪子。
3. **零負擔擴展**：未收錄 Digest 的巡演零影響，未來若樂團官方釋出新巡演 Digest，只需在該巡演 JSON 補上 `media.digest` 即可自動點亮。
