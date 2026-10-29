# ADR-0132: 向量畫布引擎、次秒級 1080p 視網膜巡演足跡動態短片合成架構 (Vector Canvas Engine & Sub-Second 1080p Retina Video Export Architecture)

## Status
已採納 (Accepted)

## Context
在 ADR-0131 中，我們確立了個人巡演票夾參戰足跡「動態明信片（The Living Postcard）」短片錄製與累計里程廢除架構。然而在實測與深度架構審視（/grill-with-docs）後，發現初期基於 DOM 截圖（`html-to-image` / `toCanvas`）的合成機制在瀏覽器端面臨兩大工程瓶頸：

1. **DOM 爬蟲序列化之效能開銷與不穩定性**：
   - `html-to-image` 每一格皆需深層複製 DOM 節點、計算所有 computed CSS 樣式、嵌入外部字型與序列化 SVG foreignObject。
   - 在每秒 24~30 幀的持續抓取下，極度消耗 CPU/GPU 資源，容易在低階裝置或手機 Safari 造成掉格、主執行緒凍結、甚至導致 `MediaRecorder` 在錄製完成前崩潰退回 PNG。
2. **實時錄製之等待痛點（Wall-Clock Latency）**：
   - 實時錄製必須跟隨真實物理時間（1× 巡演動畫往往需 6~15 秒），使用者點擊錄製後必須全程盯著螢幕乾等動畫跑完。

為了實現極致絲滑的歌迷體驗與工業級穩定度，必須重構底層渲染管線，導入純向量分層畫布引擎。

## Decision

### 1. 分層純向量畫布架構（Layered Vector Canvas Architecture）
將 540px 明信片徹底解構為「靜態外框底層」與「動態向量軌跡層」：
- **靜態外框層（Static Card Frame）**：
  - 明信片和紙紋理底色、頂部裝飾膠帶、票夾持有人身分（Holder Identity）、巡演歷程總覽標題、底部防偽條碼與裝飾打孔。
  - 在錄製啟動時僅執行一次性渲染並快取於離線 Canvas（Offscreen Canvas），不再逐格重複計算。
- **動態向量層（Dynamic Vector Journey Layer）**：
  - 中間地圖區域完全改由原生 Canvas 2D API 與 `Path2D` 向量路徑（`japan-map-paths.js`）直接繪製。
  - 47 都道府縣幾何輪廓、參戰點亮著色、金色巡演貝茲弧線、場館發光定位點均在記憶體內以微秒級速度運算，徹底告別 DOM 樹爬蟲。

### 2. 次秒級離線高速轉檔（Sub-Second Offline Fast Render）
- 擺脫真實物理時間（Wall-Clock）的束縛，採用確定性離線步進渲染（Offline Deterministic Step Loop）。
- 在背景記憶體畫布中以每秒數百格的極速完成 100~150 幀的精確路徑演算與圖像合成，**整個轉檔與編碼在 0.5 ~ 1 秒內瞬間完成**。
- **時長自然連動契約**：短片之播放時間長度依然嚴格依照歌迷選取之 `[1×]` `[2×]` `[4×]` 倍速設定進行計算封裝，兼顧極速產出與精確節奏。

### 3. 2× Retina 1080p 超高清規格（1080 × 1520）
- 渲染畫布全面升級為 2 倍視網膜解析度（寬度 1080px，高度 1520px）。
- 產出之短影片在 iPhone Super Retina、Android 高刷螢幕與 4K 螢幕上播放時，海岸線向量邊界、金色弧線與印章文字均展現針尖級銳利細節，零鋸齒與零模糊。

### 4. 巡演吉祥物與抵達重擊定格（Mascot Journey & 1.5s Postmark Finale）
- **移動中**：依照歌迷設定的樂團動物吉祥物（🐱 貓貓 / 🦁 獅子 / 🐻 熊熊 / 🐯 老虎）或 🚌 巡演休旅車，沿著平滑弧線奔馳於各場館之間，帶有金色微光軌。
- **終點蓋印重擊定格**：到達最後一站時，右下角「CONQUERED 巡演踏破紀念落地章」伴隨縮放與回彈重擊蓋下，並**定格維持 1.5 秒**，確保短片在社群（Instagram Reels / Stories / X）循環播放時，觀眾有充分時間欣賞完整的明信片資訊。
- **單場參戰特別款（Single Show Celebration）**：若歌迷只參戰過 1 場演唱會（無跨縣市路線），吉祥物在該場館進行原地歡呼彈跳後直接蓋下印章。

### 5. 自適應編碼與內置循環播放器（Adaptive Encoding & Loop Player）
- 遵循 `ADR-0123` 零後端原則，完全於瀏覽器端自適應支援 `video/mp4` 或 `video/webm`。
- 錄製完成後，自動觸發檔案下載，並於彈窗中無縫切換為 `<video controls autoPlay loop>` 播放器，提供即時重播、預覽與另存功能。
- 保留「📸 另存靜態卡（PNG）」作為雙軌次要按鈕。

## Consequences
- **Positive**: 徹底根除 DOM 爬蟲 CPU 尖峰與記憶體外洩，消除掉格與錄製失敗。
- **Positive**: 將轉檔等待時間從 10 多秒大幅縮短至 0.5~1 秒，提供令人驚艷的順暢操作回饋。
- **Positive**: 升級至 1080p 2× Retina 畫質，短片質感達到專業社群影音宣傳水準。
- **Positive**: 1.5 秒落地章定格與單場歡呼動態，賦予深厚的情感共鳴與儀式感。
- **Compliance**: 完全符合 `ADR-0123` 靜態純粹性、`ADR-0131` 累計距離廢除、`DESIGN.md` 票券設計美學與無後端離線運行契約。
