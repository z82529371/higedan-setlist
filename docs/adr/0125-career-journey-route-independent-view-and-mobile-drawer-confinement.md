# ADR-0125: 全生涯巡演足跡一級獨立頁面、懸浮 Emoji 按鈕與小尺寸場地地圖抽屜收納架構 (Career Tour Footprint Independent View, Floating Emoji Controls & Mobile Venue Map Drawer Confinement Architecture)

## Status
Accepted

## Context
1. **小尺寸螢幕場地地圖侵入與三頁籤體驗不一致**：
   在 `ADR-0124` 引入互動式場地地圖後，`ArchiveLayout.jsx` 於場地頁籤（`tab === "venue"`）設定了特例條件：若處於地圖模式或足跡模式（`filterState.venueSortMode === "map" || venueSubMode === "journey"`），即強制以 `block` 呈現於網頁內文中。相較於演出場次（`show`）與歌曲（`song`）在行動端（`< sm`）皆將導航器收進 `FilterDrawer` 抽屜並於主畫面維持票根明細清爽閱讀，場地頁籤直接將高達數百像素之 SVG 大地圖嵌入內文，阻斷了票根清單的連續滑動體驗，形成認知撕裂。
2. **全生涯巡演足跡與場館檢索之領域職責混雜**：
   「全生涯巡演足跡（Career Tour Footprint）」本質上是跨越 2012 至 2026 年的宏觀巡演時空史詩（涵蓋 523+ 場次、陸空移動動畫、交通工具三態判定與首尾站端點），其核心受眾為檢視樂團足跡與巡演動畫之歌迷；而「場館檢索（Venue Navigator）」之職責則為單一場館的歷年演出歷史、場次排行與縣市定位。將巡演足跡作為次級模式硬塞於 `VenueNavigator` 之頂部切換開關中，導致場館導航器介面擁擠，亦限制了巡演足跡在小尺寸下之展示舞台。

## Decision
1. **小尺寸螢幕場地地圖嚴格抽屜收納（Mobile Drawer Confinement）**：
   - 移除 `ArchiveLayout.jsx` 中對場地導航器的行動端特例顯示，將導航器容器全面收斂為 `hidden sm:block`。
   - 在行動裝置（`< sm`）尺寸下，網頁主體全面對齊 `show` / `song` 體驗：頂部僅呈現輕量脈絡摘要條（`🏛️ 目前選定場館 · 城市 / 場館名`）與 `VenueSlip` 場館票券明細。
   - 點擊摘要條之「變更 ▾」按鈕時喚起 `FilterDrawer`，在抽屜內部提供完整的場地地圖與排行榜瀏覽。
   - 深層路由相容性：當行動裝置使用者直接透過 `#/map` 或 `#/map/:prefecture` 連結造訪時，系統自動偵測並拉起 `FilterDrawer`，確保使用者能第一時間與所請求之地圖互動。
2. **全生涯巡演足跡升格一級獨立頁面（`JourneyPage.jsx`）**：
   - 命名定案為親切自然之「**巡演足跡**」（Career Tour Footprint / ツアールート），廢除生硬之「長征」語義。
   - 將「全生涯巡演足跡」從 `VenueNavigator` 內部抽離，建立專屬之 `site/src/components/journey/JourneyPage.jsx`，地位平起平坐於個人巡演票夾（`TicketBookPage.jsx`）。
   - 路由狀態機擴充 `viewMode === "journey"` 與雙向同步 Hash 路由 `#/map/journey`。
   - `JourneyPage` 採用票券美學（`SLIP_ARTICLE`、`SLIP_TAPE`），提供完整全幅之畫布視野、年份／巡演篩選工具列、電視演出開關、線上配信徽章、首站與終點站紀念端點卡，並具備標準「← 返回檔案庫」與首頁導向按鈕。
3. **行動端懸浮 Emoji 按鈕與純淨抽屜邊界（Floating Emoji FAB & Pure Drawer Boundary）**：
   - **抽屜內部 100% 淨空（`FilterDrawer.jsx`）**：抽屜內部不再堆疊票夾或足跡快捷大按鈕，維持純粹的場次、歌曲與場地挑選面板。
   - **行動端左下角垂直懸浮按鈕叢集（`MobileFloatingControls.jsx`）**：
     - 最上層：`🚐` 圓形懸浮按鈕（Tour Footprint FAB，點擊直達巡演足跡專頁）。
     - 中間層：`🎟️` 圓形懸浮按鈕（Ticket Book FAB，點擊直達我的巡演票夾，附打卡場次徽章）。
     - 底層：`🏠 首頁` 與 `▲ 回頂部` 輔助導航。
   - **全域常駐狀態列（`ArchiveStatusBar.jsx`）**：於頂部全寬懸浮狀態列右側，並列「🎟️ 巡演票夾」與「🚐 巡演足跡」快捷按鈕。
4. **場館導航器職責純化（VenueNavigator Pure Refinement）**：
   - 移除 `VenueNavigator.jsx` 頂部之「場館地圖與排行 vs 全生涯巡演足跡」次級開關，徹底回歸場地檢索本質（「依日本地圖」vs「依累積場次排行」），消除冗餘狀態與視覺雜訊。

## Consequences
- **Positive**: 徹底解決行動端場地地圖強佔螢幕空間與滑動阻滯問題，三頁籤（場次、歌曲、場地）在小尺寸下達到 100% 一致之摘要條＋抽屜互動模式。
- **Positive**: 抽屜內部保持純粹，避免了入口層層嵌套的擁擠感；透過畫面左下角直覺的垂直懸浮 emoji 按鈕（`🚐` 與 `🎟️`），單手操作即可一鍵直達兩大核心獨立功能。
- **Positive**: 巡演足跡獲得專屬之完整全幅大頁面，擺脫空間束縛，名稱回歸親切自然，空間敘事與未來動畫舞台更加完整。
