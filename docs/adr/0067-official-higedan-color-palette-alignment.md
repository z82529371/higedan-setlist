# ADR-0067: 精準對齊 Official 髭男 dism 官網 (higedan.com) 設計色系代幣

- **日期**：2026-10-03
- **狀態**：已採納 (Accepted)
- **關聯**：[ADR-0040](0040-tailwind-v4-pure-zero-custom-css.md), [ADR-0066](0066-song-category-buttons-and-venue-ui-ux-optimization.md)

---

## 背景與問題陳述

使用者提供並比對 Official 髭男 dism 官方網站（`https://higedan.com/?lang=zh-tw`）之設計語彙，希望將本專案的演唱會票根檔案庫介面色系，全面精準對齊官方品牌調色盤。

經爬梳 `higedan.com` 之 `service.css`，官方網站核心色系由下列設計代幣組成：
1. `body { background: #e6e6e6; color: #000; }`：淺石墨紙灰底與純黑字體。
2. `::selection { background: #d19f00; color: #e6e6e6; }`：官方專屬標誌赭金反白選取色。
3. `.btn--sub:hover { background: #d19f00; color: #000; }`：懸停赭金。
4. 分隔線與邊框：`#BDBEBE`、`#e6e6e6`。
5. 實體卡片底色：純白 `#ffffff`。

原系統採偏深海軍藍（`#17233b`）與藍調鏈結（`#1c7ab8`），與 Official 髭男 dism 當前官方視覺風格略有出入。

---

## 決策內容

1. **全面套用 higedan.com 官網核心調色盤**：
   - `--color-paper`: `#e6e6e6`（官網 body 背景底色）。
   - `--color-card`: `#ffffff`（純白實體票根與模態框表面）。
   - `--color-ink`: `#000000`（純黑文字與銳利邊框）。
   - `--color-band`: `#d19f00`（官方標誌赭金，作為標籤與選取態主色）。
   - `--color-band-ink`: `#000000`（黑色文字配金底）。
   - `--color-line`: `#bdbebe`（官網線條色）。
   - `--color-line-soft`: `#e6e6e6`（卡片內柔和分割線）。
   - `--color-muted`: `#6b6366`（將色系中之暖灰 `#b2a8ab` 適度加深，確保在白底上符合 WCAG AA 4.5:1 對比度）。
   - `--color-tape`: `#d19f00`、`--color-tape-soft`: `rgba(209, 159, 0, 0.45)`、`--color-tape-edge`: `#000000`（官方金膠帶與黑邊界）。
   - `--color-pool`: `#d19f00`、`--color-pool-wash`: `#faf5e6`（懸停由藍轉為官網金與淺金 wash）。

2. **啟用官網同款 ::selection 反白選取色彩**：
   - 全域反白選取文字時，呈現官網完全一致的 `background: #d19f00; color: #e6e6e6;`。

---

## 影響與驗證

- **驗證方式**：
  - `node site/scripts/smoke-test.mjs`：11/11 測試全部通過。
  - `npm run build`（`pnpm sync && vite build`）：生產環境建置成功（149 modules transformed，0 errors）。
