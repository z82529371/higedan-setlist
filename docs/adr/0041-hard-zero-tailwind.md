# 硬零自訂 CSS（ADR-0040 修正案）

經 grilling 共識，將 ADR-0040 的「utilities＋薄 `@layer`」收緊為硬零：`site/src/style.css` 僅保留 `@import "tailwindcss"`＋`@theme` 代幣（38 行），無任何自訂 selector / `@layer` / 全域基底。

- 紙紋格線搬進 `index.html` fixed div utilities；body／selection 搬進 body class。
- 膠帶 `::before` 改為 JSX 實體 `SLIP_TAPE` span；斜貼四卡改為 `SLIP_CARD` utilities（`rotate-[...]`＋`shadow-[...]`＋`max-sm:` 響應式）。
- 序號色／歌名粗細由 `CUE_COLOR`／`songWeight` 逐項計算，取代後代選擇器。
- 全域 transition／focus／reduced-motion 改為逐元件 `transition-colors`＋`focus-visible:`＋`motion-reduce:`，像素級驗收、`pnpm build` 通過。
