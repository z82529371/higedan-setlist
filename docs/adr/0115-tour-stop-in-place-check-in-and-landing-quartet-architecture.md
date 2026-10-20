# ADR-0115: 巡演日程就地收錄、首頁四大核心特色與全域票夾動態接觸點架構（Tour Stop In-Place Check-in, Landing Feature Quartet & Ticket Book Dynamic Touchpoints Architecture）

## Status
Accepted

## Context
1. **首頁極簡聚光燈與票夾發現性權衡（Spotlight Minimalism vs. Feature Discovery）**：
   在 `ADR-0095` 與 `ADR-0114` 確立了純淨聚光燈門面（Spotlight Landing Page）與個人巡演票夾（`#/tickets`）。然而，若在首頁頂部工具列直接插入票夾按鈕，將會破壞首頁「零按鈕牆干擾、極致聚焦搜尋與探索」的官方檔案館氛圍。同時，若完全不在首頁提及票夾，新訪客又難以發現此項核心個人化能力。
2. **檔案庫導航純淨度（Archive Top Bar Hygiene）**：
   在檔案庫模式下，桌面端頂部標題列若在語言切換器旁強行塞入票夾按鈕，會與「回首頁」和「語言切換」產生視覺擁擠，且割裂了票夾作為「個人資產收納」與「即時檢索篩選」的職責邊界。
3. **收進票夾之操作摩擦力（Friction in Show Check-in）**：
   先前歌迷若要收錄巡演場次，必須逐一進入單場票根（`ShowSlip`）開啟詳細頁，點擊「收進票夾」後再返回。對於參與多次巡演或同一巡演連參數場的資深樂迷而言，操作路徑冗長且具高度重複性。

## Decision
1. **首頁特色矩陣升級為「四大核心特色卡片（Spotlight Feature Quartet）」**：
   - 首頁頂部工具列保持純淨（零票夾按鈕），僅保留簡約的語言切換器。
   - 將首頁下方的核心特色區塊從三卡片（`BI-DIRECTIONAL`、`TICKET STUB`、`PROVENANCE`）擴展為四卡片（`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`），加入 `🗂️ TICKET BOOK // 個人巡演票夾` 獨立特色卡。
   - 點擊該卡片直接調用 `onSelectTickets` 直達 `#/tickets`，兼顧首頁高雅留白與核心功能的高能見度。

2. **檔案庫全域票夾接觸點分流與動態徽章（Dynamic Touchpoints & Zero Count Invariant）**：
   - 桌面端：頂部標題列語言切換旁不設票夾按鈕；將入口收斂至底部狀態列（`ArchiveStatusBar`）首頁按鈕旁（`[🎟️ 票夾]`）。
   - 行動端：於 `MobileFloatingControls` 左下角控制項中，將 `[🎟️]` 圓形懸浮鈕垂直堆疊於 `[🏠 首頁] [↑ 置頂]` 正上方（維持 `gap-2`），形成一體化的導航控制台。
   - 零計數不變量（Zero Count Invariant）：當 `attendedCount === 0` 時，狀態列與行動懸浮鈕的數字徽章一律不渲染；僅當 `attendedCount > 0` 時動態呈現參戰次數徽章。

3. **巡演日程就地收錄與跨組件參戰標記同步（In-Place Check-in & Attended Badges）**：
   - 在巡演總覽票券（`TourSlip`）的全國日程清單中，於各場次按鈕旁直接提供就地打卡按鈕（`tour-stop-attend-btn-*`）：未收進時顯示 `🎟️ 收進票夾`，已收進時顯示高對比度 `bg-tape text-ink ✓ 已收進票夾`，點擊即時完成切換，無須開啟單場票根。
   - 在場次導航膠囊（`ShowNavigator`）第 4 步場次按鈕中，已收進場次同步顯示極小參戰打勾徽章（`show-nav-attended-badge-*`）。
   - 跨組件透過 `useTicketBook` 與 SafeStorage 即時廣播同步，資料保持純前端本地離線存儲（`hg_ticket_book_v1`）。

4. **票夾頁面行動端導航重構**：
   - 在 `TicketBookPage` 手機版中，頂部次級工具列隱藏（`hidden sm:flex`），底部啟用與檔案庫對齊之雙側懸浮按鈕：左側提供「返回檔案庫」、「回到首頁」、「回到頂部」，右側提供獨立的「語言切換 FAB」。

## Consequences
- **Positive**: 消除逐場進入票根才能打卡的繁瑣流程，大幅降低歌迷整理參戰紀錄的摩擦力。
- **Positive**: 完美維護首頁頂部與檔案庫標題列的純淨美學，同時透過首頁四大特色卡片大幅提升票夾功能的發現性。
- **Positive**: 零計數隱藏規則杜絕了首頁與狀態列無意義的「0」徽章雜訊。
