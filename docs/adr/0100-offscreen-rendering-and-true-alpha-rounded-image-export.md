# ADR-0100: 離屏隔離渲染與真透明圓角圖片匯出架構

## Status
Accepted

## Context

1. **使用者反饋問題**：
   - 歌迷與使用者回報：在手機端或窄螢幕小尺寸視窗下進行圖片下載（`html-to-image` 產生 PNG）時，圖片經常出現嚴重的「文字換行跑版」以及「下方產生大片無意義空白留白」。
   - 同時，下載後的圖片四個角落並非真正的平滑圓角（True Alpha Rounded Corners），而是帶有生硬的直角矩形底色或邊界截斷。

2. **技術根本原因分析**：
   - **小尺寸跑版與底部空白留白**：
     - 在手機視窗（寬度常小於 390px）下，原節點文字因容器寬度受限而折行（例如 1 行折成 2~3 行），使得 DOM 的 `scrollHeight` 變大（例如 1100px）。
     - 當過去直接對畫面上的 `ref.current` 呼叫 `toPng`，即使強制指定 `style.width = '440px'`，`toPng` 依然抓取手機當前的真實量測高度，或因 CSS 響應式斷點（如 Tailwind `sm:` 類別）依賴外層視窗寬度而無法在窄螢幕觸發，導致在寬度 440px 展開時文字高度縮減回 900px，下方卻殘留原測量的高達 200px 之空白空洞。
   - **虛假圓角（Fake vs. True Alpha Rounded Corners）**：
     - 過去呼叫 `toPng(node, { backgroundColor: cardBgColor })` 時，`html-to-image` 會以該底色建立一塊完整實心的矩形 Canvas。
     - 即使內部 DOM 節點宣告了 `rounded-2xl`，Canvas 外部四個透明角被實心底色填滿，匯出後的 PNG 四角喪失透明通道（Alpha: 0），呈現生硬 90 度直角。
   - **外層陰影截斷（Box-Shadow Bleed & Clipping）**：
     - 網頁卡片原本帶有柔和的浮空外陰影（`box-shadow: 0 20px 25px -5px ...`）。在按精確尺寸輸出時，外擴的陰影超出 Canvas 邊界被粗暴裁切，形成不自然的生硬色階截線。

3. **經 `/grill-with-docs` 決策確認之邊界**：
   - **範圍**：同時涵蓋 `MemorialCardModal.jsx`（巡演歌單紀念票券）與 `slips.jsx`（演出主單據 `ShowSlip`），建立全站統一的離屏隔離圖片匯出核心函式庫 `site/src/lib/image-export.js`。
   - **陰影與圓角樣式**：採乾淨實體票券資產路線，去除外層擴散投影，保留純淨微圓角與原生 PNG Alpha 透明通道，呈現俐落票券感。
   - **演出單據寬度**：`ShowSlip` 固定以最適閱讀之 540px 寬度匯出；小卡 `MemorialCardModal` 則維持經典 440px 票券尺寸。

## Decision

1. **建立統一離屏隔離渲染函式庫 (`site/src/lib/image-export.js`)**：
   - 建立 `exportElementToPng(sourceNode, filename, options)` 抽象介面：
     - **離屏容器**：建立隱藏於可視區域外（`position: fixed; left: -99999px; top: 0; pointer-events: none`）的獨立渲染沙盒，強制設定目標物理像素寬度（`targetWidth`）與 `box-sizing: border-box`。
     - **深層複製 DOM**：將目標節點 `cloneNode(true)` 置入離屏沙盒中，並精準量測該指定寬度下的真實渲染高度 `computedHeight`，徹底消除手機視窗與桌面視窗的排版差異。
     - **樣式淨化與真圓角**：在離屏副本上暫時抹除外層 `box-shadow`（`boxShadow = 'none'`），注入指定之 `border-radius` 與 `overflow: hidden`。
     - **保留原生 Alpha 通道**：`toPng` 選項中絕對不傳入不透明的 `backgroundColor`，使 Canvas 保留周圍四角之 100% 透明像素（Alpha: 0）。
     - **安全留白邊距支援**：針對頂部帶有微突出手撕和紙膠帶之 `ShowSlip`，支援 `topPadding`（18px）動態補償，確保鋸齒和紙膠帶頂端絕不切邊。

2. **重構 `MemorialCardModal.jsx`**：
   - 移除原先於組件內部直接呼叫 `toPng` 且傳遞 `backgroundColor: cardBgColor` 之實作。
   - 改為呼叫 `exportElementToPng(cardRef.current, filename, { width: 440, borderRadius: '16px' })`。
   - 將卡片內部內距與字級收斂為固定數值（`p-5`、`text-xl`、`text-[13px]`），避免斷點跳動。

3. **重構 `slips.jsx` 之 `ShowSlip` 下載機制**：
   - 在 `handleDownloadImage` 中導入 `exportElementToPng`。
   - 宣告固定寬度 `540px`、頂部和紙膠帶緩衝 `topPadding: 18`、圓角 `borderRadius: '8px'`，達成手機與桌面一致的特等席票據無損輸出。

## Consequences

- **正面影響**：
  - **跨裝置輸出 100% 一致**：無論使用者在 360px 的 iPhone mini 或 4K 寬螢幕桌面上下載，產出的圖片皆具備完全相同的字級、排版行距與緊湊高度，徹底根絕底部多餘大片空白。
  - **真正的 Alpha 透明圓角**：下載之 PNG 放置於任何深色或淺色背景、社群預覽貼文或通訊軟體時，四角呈現平滑微圓角透明切邊，無任何髒色直角殘留。
  - **無邊緣毛邊與硬切陰影**：消除原本超出 Canvas 邊界被硬切的外陰影，視覺極致俐落專業。
  - **架構模組化**：`image-export.js` 成為系統級工具，未來若有其他單據（如 `VenueSlip` 或 `SongSlip`）需支援長圖下載，可直接無痛復用。

- **潛在限制與權衡**：
  - 離屏深層複製並等待渲染約需增加 50~100ms 之微小計算時間，但在使用者點擊「下載圖片」的情境下，整體體感仍處於 0.5 秒內之流暢無感範圍。
