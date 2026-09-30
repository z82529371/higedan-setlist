# Tailwind v4 取代手寫 CSS（像素級還原＋薄客製層）

全站 `site/src/style.css`（約 1195 行手寫 CSS）以 Tailwind CSS v4 取代，達成清理維護成本之目的，同時凍結「後台曲目紙」視覺（紙紋格線、膠帶、斜貼籤、ENCORE 裁切線）做到像素級還原。

## 決策

- 採用 Tailwind v4（CSS-first `@theme`），相容 Vite 6 / React 19，不用 `tailwind.config.js`。
- 現有 `:root` 色票（`--paper`、`--band`、`--tape` 等 20+ 變數）原樣搬進 `@theme`，JSX 以 utility 引用。
- 偽元素與特殊質感（`body::before` 格線、`field-note/slip ::before` 膠帶、`request-slip` rotate、interlude 斜紋）保留約 100-200 行薄 `@layer components`，不硬用 arbitrary value 堆疊，不算違約。
- `data/` 與 `scripts/sync-data.mjs` 管線不動，僅改前端呈現層。
- 驗收：`pnpm build` 通過＋肉眼對照零迴歸。
