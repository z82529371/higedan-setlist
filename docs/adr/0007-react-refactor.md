# 前端架構重構為 React 靜態單頁應用 (SPA)

為提昇組件維護性與狀態管理效率，前端網站由原生 DOM 操作重構為 React 18 / 19 結合 `@vitejs/plugin-react`。全域歌曲與場館索引計算統一由 `useMemo` 快取，各頁視圖（場次曲目 Slip、全域歌曲 Slip、全域場館 Slip）拆分為宣告式 React Functional Components，構建輸出維持完全靜態部署（Vite Static Build）。
