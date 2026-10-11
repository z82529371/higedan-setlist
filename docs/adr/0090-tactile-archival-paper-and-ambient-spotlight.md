# ADR-0090: 日系典藏手感紙質有機微紋理與控台聚光微光架構 (Tactile Archival Paper Grain and Soundboard Lamp Ambient Spotlight Architecture)

## 狀態
已通過 (Accepted)

## 背景 (Context)
在先前版本中，全站背景採用日系暖紙色（#f0eee8）並疊加了 24px 圓點陣列（Dot Grid，`radial-gradient`）：
1. **幾何點陣過於生硬科技化**：均勻的電腦幾何圓點類似軟體儀表板或開發者工具藍圖，與樂團現場演唱會的實體紙券手作質感、音樂氛圍產生風格衝突。
2. **底部漸層截斷（Fade-Out Gap）**：先前的圓點陣列設定了 `[mask-image:linear-gradient(to_bottom,black_0,transparent_80%)]`，導致長頁面滾動超過 80% 後點陣完全消失，下半頁淪為死板單調的純平灰色塊。

使用者要求進行「背景 質感 優化」，經 `/grill-with-docs` 決策共識，決定全面淘汰幾何點陣，導入「有機手感紙質微粒」與「舞台控台溫潤聚光微光」。

---

## 決策 (Decision)

### 1. 徹底移除幾何圓點與漸層截斷
- 從 `site/index.html` 中移除 `bg-[radial-gradient(var(--color-grid-line)_1px,transparent_1px)]` 與 `mask-image` 截斷遮罩。

### 2. 控台柔和聚光微光 (`Soundboard Lamp Ambient Spotlight`)
- 在視窗頂部中央配置橢圓形柔和漫射光暈：
  - `bg-[radial-gradient(ellipse_85%_700px_at_50%_0%,var(--color-ambient-glow)_0%,transparent_100%)]`。
  - **淺色模式**：`--color-ambient-glow: rgba(209, 159, 0, 0.08)`（髭男官方芥末金色溫潤微光）。
  - **暗色模式**：`--color-ambient-glow: rgba(212, 154, 0, 0.12)`（控台夜間昏黃暗金聚光）。
- 營造出巡演音控台上方柔光燈（Gooseneck Console Lamp）靜靜照耀在手邊 Setlist 票券跑單上的沈浸式現場氛圍。

### 3. 日系典藏手感紙質有機微粒 (`.paper-grain`)
- 運用純 SVG 噪點過濾器（`feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'`）產生無縫平鋪的有機紙漿微粒纖維。
- 以固定圖層（`pointer-events-none fixed inset-0`）覆蓋全視窗，透明度設為細微低調的 3.8%（暗色模式 5%），搭配 `mix-blend-multiply`（暗色模式 `dark:mix-blend-screen`），完美呈現日本無酸典藏紙的溫潤手感與紙漿觸感。
- 全頁無縫延伸至底部，徹底告別下半頁純平截斷問題。

---

## 後果 (Consequences)

### 正面影響 (Positive)
1. **質感飛躍**：擺脫了刻板的工程點陣，轉化為如同觸摸真實手作無酸紙、舞台控台柔光映照的典藏氛圍。
2. **純 CSS / SVG 零負載**：噪點為向量資料 URI，聚光為純 CSS 漸層，零額外圖檔 HTTP 請求，滾動時零排版重繪，維持 60fps 流暢人體工學體驗。
