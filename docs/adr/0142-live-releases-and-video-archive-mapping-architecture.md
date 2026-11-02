# ADR-0142: 現場影音發行與載體索引架構 (Live Releases, Video Archive Mapping & Dedicated Release Route Architecture)

## Status
已採納 (Accepted)

## Context
1. **歌迷現場映像載體尋訪斷層**：
   在 Official 髭男 dism 十餘年的現場演出歷史中，眾多經典專場（如 Editorial 埼玉超級競技場、SHOCKING NUTS 日本武道館場、2020 線上演唱會 Arena Travelers、2019 武道館場）皆已正式發行商業影音（Blu-ray / DVD）或串流現場專輯。然而歌迷在查閱場次票根時，往往面臨「這場演出是否有出碟？」、「該買哪一張藍光？」、「串流上的哪張現場專輯對應這場？」之資訊斷層。
2. **日本唱片特有之初回限定盤特典映像文化**：
   髭男的現場映像發行模式極為特殊且多樣：
   - 部分為**獨立發行專盤**（如《one-man tour 2021-2022 -Editorial- @ SAITAMA SUPER ARENA》BD/DVD）；
   - 大量關鍵場次則是以**正規專輯／單曲初回限定盤之特典映像（Bonus BD/DVD）**形式發行（如專輯《Rejoice》初回限定盤收錄 2023.02.16 SHOCKING NUTS 武道館場全篇；EP《Mixed Nuts EP》初回限定盤收錄 2021.06.23 Road to Editorial 東京花園劇場場全篇；單曲《Universe》初回盤收錄 2020 線上演唱會）。若無結構化母體作品關聯，歌迷極易在唱片行撲空。
3. **資料庫冗餘與單一真理來源（SSOT）衝突**：
   若在各場次內嵌零散的發行文字，或在發行物中逐軌重複記錄 20 多首曲目（Tracklist），將導致資料庫出現嚴重重複維護地獄，且一旦現場改編或曲目清單經歷史考證修正，雙邊資料極易不同步。

## Decision

### 1. 現場發行物獨立主檔（SSOT: `data/live-releases.json`）
建立獨立第一公民實體主檔 [`data/live-releases.json`](file:///data/live-releases.json)，作為樂團全量唱片底冊（[`data/discography.json`](file:///data/discography.json)）在現場演出維度的投影子集，賦予每筆現場發行物自身完整的商業發行生命週期：
```json
{
  "releases": [
    {
      "id": "editorial-saitama-2022",
      "title": "one-man tour 2021-2022 -Editorial- @ SAITAMA SUPER ARENA",
      "releaseDate": "2022-10-05",
      "releaseType": "standalone",
      "formats": ["bluray", "dvd", "streaming_audio", "streaming_video"],
      "catalogNumbers": ["PCXP-50896", "PCBP-54456"],
      "recordings": [
        {
          "showId": "1468160",
          "coverage": "full"
        }
      ],
      "streaming": {
        "spotifyAlbumId": "58u7vA87kUe05Ue6C7bX3Y",
        "appleMusicUrl": "https://music.apple.com/..."
      }
    }
  ]
}
```

### 2. 場次聚合覆蓋模型（Show-centric Coverage Model）
發行物嚴格透過 `recordings` 陣列錨定系統內的實體場次（`showId`）：
- **全場完整收錄（`coverage: "full"`）**：直接繼承關聯場次的完整曲目清單（`setlist`），零資料重複，保持全站單一真理來源；在票根與總覽頁面呈現「全場收錄」識別徽章。
- **精選節錄收錄（`coverage: "selected"`）**：僅需選填收錄曲目（`songIds: [...]`）或特殊節錄說明，完美支援單一光碟收錄多場不同演出精華之場景；在票根與總覽頁面呈現「精選節錄」識別徽章。

### 3. 客觀雙軌發行型態分類（Taxonomy）與載體維度解耦
為避免串流與實體載體造成發行分類混淆，領域模型將發行型態收斂為客觀雙軌：
- `standalone`（獨立影音發行）：專門為現場演出獨立製作出版之實體影像作品（Blu-ray / DVD）。
- `bonus_video`（影音限定盤 / 特典映像）：隨單曲、EP 或正規專輯之 CD+DVD / CD+Blu-ray 盤或初回限定盤附屬之影像光碟，必須具備 `parentRelease: { title, albumId, type }` 關聯，直通既有 `ALBUM_MAP` 體系。
- **載體格式與串流平台解耦**：數位串流（Spotify / Apple Music）與實體光碟（Blu-ray / DVD / CD）統一作為作品具備的載體格式屬性（`formats` 與 `streaming`），無論作品屬獨立發行或特典影像，只要該演出音源有上架串流，皆在卡片中提供一鍵直達收聽。

### 4. 漸進式票根展示與第一公民全覽路由（`#/releases`）
- **單場票根（[`ShowSlip`](file:///site/src/components/slips/ShowSlip.jsx)）**：若該場次具備發行紀錄，以高辨識度之金屬票券風格呈現「🎬 官方映像化與發行載體」卡片，列出發行名義、初回盤母體、規格膠囊（`Blu-ray`、`DVD`、`Spotify` 等）、實體品番、收錄範圍徽章（`全場收錄` / `精選節錄`）與串流一鍵直達。
- **巡演票券（[`TourSlip`](file:///site/src/components/slips/TourSlip.jsx)）**：於巡演總覽中標示映像化收錄場次徽章，點擊直接定位該場次。
- **全域現場影音發行總覽（專屬路由 `#/releases`）**：建立一級發行視圖，列表嚴格依據發行日由新至舊（降序，Reverse Chronological Order）展示，確保歌迷進站優先瀏覽最新發布作品；每張作品均標註類型與收錄範圍徽章，並支援「獨立影音發行 / 影音限定盤」雙軌分類即時過濾，一覽髭男生涯所有現場影音出版物。

## Consequences
- **Positive**: 徹底解決歌迷「這場經典專場該買哪張實體 BD/DVD」與「哪張專輯初回盤有收錄現場」的痛點。
- **Positive**: 透過場次覆蓋模型（Coverage Model）達到 100% 複用既有演出歌單，杜絕資料手抄重複。
- **Positive**: 將實體光碟品番（PONY CANYON 編號）與數位串流（Spotify Live Album）統合收納，實現多載體無縫跳轉。
- **Positive**: 保持零後端純靜態架構（ADR-0123），符合全站離線可用與極速檢索標準。
