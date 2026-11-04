# ADR-0143: 官方唱片封面底冊與歌曲票券封套燈箱架構 (Official Album Jacket SSOT and Song Slip Cover Lightbox Architecture)

## 狀態 (Status)
已採納 (Accepted)

## 脈絡 (Context)
在先前 [ADR-0138](0138-spotify-master-audio-stage-and-live-twin-track-architecture.md) 中，我們為 Official 髭男 dism 歌曲主檔建立了 100% 覆蓋的官方 Spotify 錄音室與巡演現場音源舞台，並在 [ADR-0142](0142-live-releases-and-video-archive-mapping-architecture.md) 建立了樂團全量唱片底冊（Band Discography SSOT）與現場影音載體索引。

然而，在歌曲詳情票券（`SongSlip`）的頂部 Header 資訊區中，目前僅有文字曲名、官方別名與文字專輯標籤，缺少實體唱片封套（Album Jacket / Cover Art）的視覺錨點。為讓樂迷進入歌曲頁時能一眼辨識該作品的經典封面視覺、強化本專案核心的黑膠票券（Vinyl Ticket）實體收藏美學，我們需要為每首歌曲引入官方唱片封面。

經調研與實測，Spotify 提供了具備開放跨域標頭（`Access-Control-Allow-Origin: *`）且無須 API Key / Token 的官方 oEmbed API：
`https://open.spotify.com/oembed?url=https://open.spotify.com/track/{id}`
可直接解析出 300×300 的官方封面圖檔網址（`thumbnail_url`），且 Spotify CDN 支援透過替換規格代碼（`ab67616d00001e02` 換為 `ab67616d0000b273`）取得 640×640 的超高畫質原檔。

在架構設計上，面臨以下三個權衡與決策：
1. **獲取與儲存時機**：是純前端於執行期動態 `fetch`，還是於建置期（Build-time / Sync-time）固化？若前端動態請求，會導致使用者每次瀏覽歌曲時產生 200~400ms 骨架空白等待與網路依賴，且違反 [ADR-0123](0123-overengineering-refusal-and-pure-frontend-direct-compose-architecture.md) 的零後端純靜態原則及 [ADR-0119](0119-pwa-offline-support-and-web-app-manifest.md) 的 PWA 離線秒開特性。
2. **封面版本語義與首發優先權**：一首經典代表作（如《Pretender》、《宿命》、《Subtitle》、《Cry Baby》）往往先以單曲首發，後續再收錄至正規專輯。若直接抓取專輯版 Track，會導致全站封面全部變成《Traveler》、《Editorial》、《Rejoice》少數幾張大碟的主視覺，使具有強烈時代記憶的一手單曲封面（如《Pretender》台北街景霓虹封套、《Subtitle》冰晶滑冰場封套）被淹沒。因此必須確立「一手首發優先權（Jacket Precedence Hierarchy: 實體單曲/數位單曲 > EP > 正規大碟初出）」原則。
3. **未發行曲目回退與點擊互動**：全站有 16 首未收錄串流之早期或現場限定作品（`unreleased: true`），必須有系統性的非破圖美學回退；同時，使用者看到精美封套會有放大檢視細節的需求。

## 決策 (Decision)

### 1. 歌曲主檔封面欄位與單一真理來源（SSOT）
於 `data/songs.json` 的每筆歌曲之 `spotify` 容器中擴充 `coverUrl` 欄位：
```json
{
  "id": "same-blue",
  "title": "Same Blue",
  "spotify": {
    "trackId": "2cupzYHOSLmMqDHRVQfI9j",
    "coverUrl": "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02409f76d5a323cf3c511701cb"
  }
}
```
- **一手首發優先權（Jacket Precedence Hierarchy）**：
  1. **獨立單曲（實體單曲 / 數位單曲）**：如《Pretender》、《宿命》、《Subtitle》、《Cry Baby》、《I LOVE...》、《Same Blue》等，100% 優先鎖定首發單曲的專屬封面與 Spotify Track ID，避免被後續收錄之大碟（Traveler, Editorial, Rejoice）封面同質化刷屏。
  2. **迷你專輯 / EP 首發**：如《Stand By You EP》、《What's Going On?》、《ミックスナッツ EP》之收錄作品。
  3. **正規原創大碟初出曲（Album Debut）**：如《115万キロのフィルム》、《フィラメント》、《Sharon》、《B-Side Blues》等未曾獨立發行單曲之曲目，採用所屬正規大碟封面。
- 未正式商業發行或未上架之曲目（如《明け方的ゲッタウェイ》等 16 首），`spotify.coverUrl` 維持 `undefined` / `null`，保持底冊無污染。

### 2. 建置期預算同步管線（Build-time Sync Pipeline）
建立 `site/scripts/sync-spotify-covers.mjs`，整合於 `pnpm sync` 資料驗證同步流程中：
- 遍歷 `data/songs.json` 中具備 `spotify.trackId` 且尚未抓取或需更新之歌曲。
- 透過官方無金鑰 Spotify oEmbed API 批次解析，將取得之 300×300 永久 CDN 網址寫回 `data/songs.json`。
- 前端執行期完全不依賴外部 API，達成 0ms 即時渲染、零版面跳動與 100% 離線 PWA 相容。

### 3. 歌曲票券 Header 自適應兩段式排版（Adaptive Two-Row Grid）
在 `SongSlip.jsx` 頂部 Header 採用響應式 CSS Grid（`grid grid-cols-[auto_1fr]`）：
- **小尺寸行動端（< 640px）**：
  - Row 1：唱片封套（56×56）與歌曲標題、官方別名垂直置中並排。
  - Row 2（`col-span-2`）：全量演出指標膠囊（共出演場次、定番標籤、特殊版本數、平均曲序、安可率）橫跨全螢幕寬度展開，消除窄欄擠壓與多行折疊。
- **桌面/平板端（sm+）**：
  - Col 1：唱片封套跨兩行側伴（`sm:row-span-2`）。
  - Col 2：Row 1 歌名與別名，Row 2 指標膠囊列。
- **微陰影與邊框**：比照實體唱片紙套質感（`rounded-[4px] border border-ink/25 bg-paper shadow-2xs`），符合觸覺零位移（Zero Shift, ADR-0104）規範。
- **缺漏黑膠刻紋佔位回退（Vinyl Jacket Placeholder）**：針對未發行或無封面之曲目，呈現符合票券設計系統的復古黑膠唱片圖標（帶有溝槽刻紋與軸心孔），具備高對比與完整 aria 語意，絕不留下空白或破圖。

### 4. 高清唱片封套燈箱（Cover Lightbox Modal）與雙重脈絡標記
使用者點擊唱片封套時，開啟全螢幕居中燈箱：
- **Retina 高畫質自動換算**：利用 Spotify CDN 命名規則，將 `ab67616d00001e02` 自動升級為 `ab67616d0000b273`（640×640 規格），展現實體封套高清細節。
- **雙重發行脈絡（Release Provenance）**：清楚標明一手首發載體（例如 `2nd Single《Pretender》(2019)`）與收錄大碟（`収録アルバム《Traveler》`）。
- **無障礙與鍵盤互動**：支援 Escape 鍵關閉、點擊半透明遮罩背景關閉與關閉按鈕。

## 後果 (Consequences)

### 正向效益
- **實體美學與歷史重現**：歌曲票券正式擁有實體黑膠/單曲封套視覺，大幅提升歌迷瀏覽時的情感共鳴與收藏感。
- **純靜態零負擔**：遵循 ADR-0123，前端零外部請求、零依賴，離線 Service Worker 快取完美運作。
- **超高畫質燈箱與雙重脈絡**：滿足歌迷欣賞官方實體專輯封套高解析度美術設計與考證發行歷史的需求。

### 負面代價與維護義務
- 每次新增發行曲目時，需執行一次 `pnpm sync` 更新歌曲封面網址。
