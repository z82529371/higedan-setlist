# ADR-0144: 錄音室歷年發行雙軌整合與雙向深層連結架構 (Studio Discography Releases Tab & Bidirectional Deep-Link Architecture)

## 狀態 (Status)
已採納 (Accepted)

## 脈絡 (Context)
在先前 [ADR-0142](0142-live-releases-and-video-archive-mapping-architecture.md) 中，我們建立了現場影音獨立載體模型與 `#/releases` 路由，解決歌迷尋找演唱會藍光（BD/DVD）與限定盤特典映像的痛點。在 [ADR-0143](0143-official-album-jacket-ssot-and-song-slip-cover-lightbox-architecture.md) 中，我們為每首歌曲引入官方唱片封面與封套燈箱（`CoverLightboxModal`），並在 [`site/src/lib/song-release.js`](file:///site/src/lib/song-release.js) 建立了歌曲一手首發脈絡對照表（`SINGLE_EP_PROVENANCE`）。

然而，目前架構存在以下資訊斷層與資料休眠問題：
1. **錄音室作品（Discography）無專屬展間**：
   資料庫中的 [`data/discography.json`](file:///data/discography.json) 完整記錄了 Official 髭男 dism 歷年發行的實體單曲、數位單曲、EP 與原創大碟的規格品番（如 PCCA 編號）與榜單紀錄，但在前端卻無任何獨立展示頁面，形同「休眠資料」。
2. **單向展示與斷頭路**：
   樂迷在歌曲票券（`SongSlip`）的封面燈箱中看到「2nd Single《Pretender》(2019)」考證文字，但無法點擊跳轉查閱該單曲的實體發行規格、各版本品番差異與完整收錄曲目清單。
3. **概念邊界與全站定位平衡**：
   本站核心定位為「演唱會現場歷年演出檔案庫與巡演票夾」，而非一般維基型資料庫。若將錄音室作品粗暴地與現場影音混排，會破壞既有現場影音的精準檢索體驗。

## 決策 (Decision)

### 1. `#/releases` 雙軌並立標籤頁架構（Segmented Tabs Architecture）
在 `#/releases` 頂部引入高辨識度雙軌分頁切換器：
- `[🎬 現場影音 (Live Releases)]`：維持 ADR-0142 原有之現場影像與串流現場專輯展間。僅在具備 Spotify 官方串流發行與封面時呈現縮圖按鈕與燈箱；其餘純特典影像零空白方塊佔位（Zero-Placeholder）。
- `[💿 錄音室歷年發行 (Discography)]`：專屬呈現樂團歷年錄音室出版物（實體單曲、數位單曲、合作單曲、EP、正規專輯）。
- URL 路由支援 Query 參數：`#/releases?tab=discography` 與 `#/releases?tab=live`，確保可直接分享與返回。

### 2. 錄音室作品 5 種子分類過濾與型態前綴 ID 命名空間（Namespaced Slugs）
全面移除冗餘的「全部型態」過濾膠囊，於錄音室分頁中提供 5 顆精確次級分類膠囊（預設聚焦於實體單曲）：
- `[💿 實體單曲 (Physical Singles)]`
- `[🎧 數位單曲 (Digital Singles)]`
- `[🤝 合作單曲 (Collaboration Singles)]`
- `[📦 EP / 迷你專輯 (EPs & Mini Albums)]`
- `[📀 正規專輯 (Full Albums)]`

所有錄音室發行在 [`data/discography.json`](file:///data/discography.json) 中賦予全域唯一之型態前綴 ID（如 `single-pretender`、`digital-subtitle`、`single-koi-no-saichu`、`ep-mixed-nuts`、`album-traveler`），徹底消除若單曲名與專輯名相同時的命名衝突。

### 3. 結構化曲目清單（Tracklist）與無票券曲目降級展示
在 `data/discography.json` 為每筆發行擴充標準 `tracks` 陣列（`trackNumber`, `title`, `songId?`）：
- **本站收錄演出曲目（具備 `songId`）**：右側展示高亮之 `[♪ 演出票根]` 徽章，點擊直接一鍵直達 `#/song/:id`。
- **純伴奏或無演出紀錄曲目（無 `songId`，如 Instrumental / Overture）**：以優雅印刷體呈現純文字，杜絕死連結。

### 4. 唱片卡片精簡收折與深層定位動畫
- **預設狀態**：卡片陳列官方主視覺封面（640×640 Retina）、發行日、廠牌、Oricon 榜單名次、多版本規格品番徽章（`初回限定盤 [CD+DVD] PCCA-04784`、`通常盤 [CD] PCCA-04785`）與曲目摘要（`♪ 共 3 曲`），曲目清單預設收折保持頁面簡潔。
- **雙向深層定位（Bidirectional Deep-Link）**：
  - 歌曲票券燈箱（`CoverLightboxModal`）提供 `[💿 查看實體發行規格 ➔]` 行動按鈕，直達 `#/releases?tab=discography&id=:releaseId`。
  - 頁面載入或 Hash 變更時，自動切換至 `discography` 分頁、平滑捲動至該卡片、**自動展開曲目清單**，並施加 1.5 秒的金屬光澤外框高亮（Highlight Flash）。

## 後果 (Consequences)

### 正向效益 (Positive)
- **活化唱片底冊**：將 `data/discography.json` 升格為第一公民展示，讓樂迷可完整查閱實體唱片規格與品番。
- **打通雙向閉環**：實現 `SongSlip` 燈箱 ➔ 唱片發行卡片 ➔ 收錄曲票根 ➔ `SongSlip` 的完整無縫瀏覽體驗。
- **守護現場定位**：透過雙軌分頁嚴格隔離現場映像與錄音室出版，既豐富了唱片考證功能，又絕不稀釋演唱會檔案庫的核心定位。
