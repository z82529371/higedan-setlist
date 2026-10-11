# ADR-0086: 日式印刷暖米紙底色調色盤與精緻微點陣背景架構 (Japanese Warm Paper Palette and Dot Grid Background Architecture)

## 狀態
部分已被替代 (Partially Superseded by [ADR-0091](0091-japanese-graph-notebook-background.md)：點陣背景已被日系 5mm 方眼手帳筆記本格線替代；暖米紙色盤 `#f0eee8` 依然有效)

## 背景 (Context)
在先前版本中，全站採用 `#e6e6e6` 作為 body 預設背景色（`--color-paper`），並在 `index.html` 疊加 28px 的方格坐標線（`linear-gradient` 方格網格）。

經由 `/grill-with-docs` 決策評估與使用者回饋：
1. **冷灰生硬感**：`#e6e6e6` 是純冷調水泥灰，與 Official髭男dism 官方標誌金（`#d19f00`）、實體紙本票根卡片（純白 `#ffffff`）以及黑墨水（`#000000`）的搭配顯得生硬且偏向數位軟體灰底，缺乏實體音樂演出檔案庫的紙本收藏溫度。
2. **工程製圖感**：28px 的方格坐標實線偏向 CAD/工程儀表板感，與演唱會現場票券、歷史檔案庫的文藝情境脫節。

因此，使用者確認將整體背景系統進行全面美學昇華。

---

## 決策 (Decision)

### 1. 日式印刷暖米紙色調色盤 (Japanese Warm Paper Palette)
在 `site/src/style.css` 中升級基礎色系：
- **`--color-paper: #f0eee8`**：
  採用帶有文庫本/無酸紙溫潤質感的日式暖米紙色（溫暖微奶油灰，明度約 94%）。與純白票券卡片（`#ffffff`）形成舒適高雅的對比，襯托黑色墨水印刷與官方金，長久閱讀極為耐看且不刺眼。
- **`--color-line-soft: #e4e1d8`**：
  柔和分隔線同步微調為同色系微暖灰，維持邊框與紙質的自然融合。
- **`--color-line: #b8b5ab`**：
  主分隔線同步調整為溫潤灰調。
- **`--color-grid-line: rgba(0, 0, 0, 0.06)`**：
  微透暖墨點陣顏色。

### 2. 精緻微點陣背景紋理 (Fine Dot Grid Overlay)
在 `site/index.html` 中，將原本生硬的 28px 實線方格全面替換為 24px 精緻微點陣：
```html
<div aria-hidden="true" class="pointer-events-none fixed inset-0 bg-[radial-gradient(var(--color-grid-line)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,black_0,transparent_80%)]"></div>
```
- **視覺效果**：極細微的 1px 點陣若隱若現，頂部向下至 80% 自然淡出。兼具印刷度量感與極致文藝氣息，徹底擺脫工程軟體感。

---

## 後果 (Consequences)

### 正面影響 (Positive)
1. **收藏溫度大幅提升**：純白舞台歌單票根、場館小卡在 `#f0eee8` 暖米紙色上立體浮現，呈現高級紙本典藏品的美學張力。
2. **眼睛耐看度提升**：微暖調底色消除冷水泥灰的刺眼感與數位冷冽感，大幅改善長時間翻閱場次與歌單的心智舒適度。
3. **符合品牌精神**：與 Official髭男dism 現場音樂的溫度與黃底黑鬍子視覺形象達到完美諧和。
