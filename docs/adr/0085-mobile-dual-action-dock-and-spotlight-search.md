# ADR-0085: 行動端垂直獨立雙 FAB 與 Spotlight 沉浸式搜尋浮層架構 (Mobile Vertical Dual FAB Stack and Spotlight Search Architecture)

## 狀態
已通過 (Accepted)

## 背景 (Context)
在先前版本中，行動端（`< sm`）頂部依序堆疊了：
1. 頂部狀態欄（~25px）
2. Header 標題與 5 顆滑動統計膠囊（~160px）
3. 三大查詢分頁按鈕（~44px）
4. **全域搜尋框 `SearchBox`（~64px 佔位）**
5. 當前脈絡摘要橫條（~60px 佔位）

總計佔據首屏高達約 350px，導致在 667px～844px 的一般手機螢幕上，下方的「舞台歌單小卡（`ShowSlip`）」首屏只能露出一半，使用者一進網站無法完整看見首屏歌單票頭、場館與前三首定番曲目。

經由 `/grill-with-docs` 的多次決策樹推導與美學驗證，先前水平拼裝的「單一雙鍵膠囊 Dock」因兩鍵長短不一、中間隔線粗重而視覺顯得局促沉重。使用者確認應拆為**兩顆獨立分開之懸浮按鈕**，並採「垂直排列、主次配色」的人體工學佈局。

---

## 決策 (Decision)

### 1. 響應式搜尋分流架構 (Responsive Search Dichotomy)
- **桌面端（`>= sm`）**：
  維持頁面頂部常駐 `SearchBox` 輸入框（`hidden sm:block`），電腦滑鼠使用者保持零點擊打字、快速過濾之優勢。
- **行動端（`< sm`）**：
  頂部靜態輸入框隱藏，完全釋放出 64px 首屏高度；搜尋入口改由底部右下角獨立圓形 FAB 喚起。

### 2. 右下角垂直獨立雙 FAB 架構 (Mobile Vertical Separate Dual FAB Stack)
徹底廢除水平黏合的膠囊，改為右下角垂直排列的獨立雙按鈕群組（`fixed bottom-5 right-4 z-40 sm:hidden flex flex-col items-end gap-2.5`）：
- **上方副操作：`🔍` 獨立圓形 FAB**：
  - 造形：`w-11 h-11` 正圓形獨立按鈕。
  - 配色：票券紙白底（`bg-paper text-ink`）、粗墨線外框（`border-[2px] border-ink`）、微立體墨黑投影（`shadow-[2.5px_2.5px_0_#000]`）。
  - 行為：點擊喚起全域專注 Spotlight 搜尋面板。
- **下方主操作：`🏷️ 篩選` 核心膠囊 FAB**：
  - 造形：大拇指友善橫向膠囊（`rounded-full px-4 py-2.5`）。
  - 配色：品牌芥末金底（`bg-band text-band-ink`）、粗墨線外框（`border-[2px] border-ink`）、立體投影（`shadow-[3px_3px_0_#000]`）。
  - 文案：隨分頁動態切換（`[ 🏷️ 篩選場次 ]` / `[ 🎵 挑選歌曲 ]` / `[ 🏛️ 挑選場地 ]`）。
  - 行為：點擊喚起 Staged Draft 底部篩選抽屜。
- **左下角平衡：`↑` 回到頁首圓鈕**：
  - 獨立位於 `bottom-5 left-4 z-30`，兩側重心對稱平衡。

### 3. Spotlight 全螢幕沉浸式專注搜尋面板 (Spotlight Search Modal & Stream Body Architecture)
點擊 `🔍 搜尋` 時，彈出專注搜尋浮層：
1. **視口動態錨定與虛擬鍵盤避讓 (Visual Viewport Dynamic Tracking)**：
   - 容器動態綁定 `window.visualViewport.height` 與 `offsetTop`，外層 `overflow-hidden`。
   - 當手機虛擬鍵盤彈起時，Modal 底部剛好貼齊鍵盤頂端，100% 杜絕搜尋結果被虛擬鍵盤遮擋或裁切的問題。
   - 開啟 Modal 時自動鎖定背景捲動（`body.style.overflow = "hidden"`），關閉時復原。
2. **頂部搜尋輸入列 (Header Bar)**：
   - 內建 `SearchBox` 輸入框，帶 `autoFocus` 自動聚焦彈起手機鍵盤，內建快速清空按鈕「✕」。
   - 右側常設專屬圓形關閉按鈕「✕」，支援點擊或按 `Escape` 鍵退出搜尋並清空關鍵字。
3. **滿版串流主體結果區 (Stream Body Mode)**：
   - 徹底揚棄桌面的 `absolute` 下拉懸浮框，改為 Modal 內部的滿版串流主體（`flex-1 min-h-0 overflow-y-auto overscroll-contain`）。
   - **滑動手勢收合鍵盤 (Dismiss on Drag/Scroll)**：使用者手指滑動搜尋結果串流時，立即觸發 `input.blur()` 收起虛擬鍵盤，讓螢幕空間瞬間 100% 還原給搜尋結果瀏覽。
   - 分類清晰呈現歌曲、巡演/活動、場館；點擊任一目標項目時，自動 Commit 路由切換、更新網址並自動關閉搜尋面板。
4. **空狀態導引 (Empty State)**：
   - 尚未輸入字詞時，主體區展示友善之中心圖標與提示文字（「輸入歌曲名、巡演名稱、年份或演出場館…」）。

---

## 後果 (Consequences)

### 正面影響 (Positive)
1. **首屏視覺大釋放**：手機端釋出 64px 垂直空間，舞台歌單卡（`ShowSlip`）的票頭、場館與前三首定番曲目在手機首屏立即完整映入眼簾。
2. **單手人體工學極致化**：所有全域查找功能（搜尋、篩選）集中於右手拇指熱區（Bottom-Right Dock）。
3. **搜尋專注度提升**：進入全螢幕 Spotlight 模式時，不受背景捲動干擾，虛擬鍵盤彈起佈局最為穩健。

### 負面影響 / 限制 (Trade-offs)
- 手機端進行搜尋需先點擊一次「🔍 搜尋」Dock 鍵；但換來了首屏 100% 乾淨的歌單露出。
