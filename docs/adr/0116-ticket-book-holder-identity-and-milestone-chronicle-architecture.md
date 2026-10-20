# ADR-0116: 票夾歌迷身分識別、歌曲解鎖率未發表曲邊界與生涯小卡編年史重構（Ticket Book Holder Identity, Unreleased Song Coverage Boundary & Career Milestone Chronicle Architecture）

## Status
Accepted

## Context
1. **社群分享與實體小卡之個人歸屬感需求（Fan Identity & Commemorative Affinity）**：
   歌迷在社群平台（X / Threads / Instagram）分享單場紀念票券（`MemorialCardModal`）與生涯里程碑總結小卡（`MilestoneCardModal`）時，強烈期望能標註自己的歌迷 ID 或暱稱（例如 `@higedan_fan`），賦予小卡如真實日本實體演唱會門票般的個人專屬印記。先前卡片缺乏持有人識別，且各卡片設定孤立未互通。
2. **歌曲解鎖率母數之未發表曲邊界失真（Unreleased Song Coverage Boundary Invariant）**：
   在 `ADR-0098` 確立了未發表曲（`unreleased: true`）的領域標記。在生涯里程碑（`computeTicketBookMilestones`）原先計算「歌曲解鎖率（`coveragePercentage`）」時，若將未正式發行曲計入官方曲庫總數（`totalCatalogSongs`），會導致歌迷即使集齊所有官方已發行專輯與單曲，解鎖率依然無法達到 100%；反之，若參戰聽過未發表曲，卻未發行於串流/唱片，不應強行綁架未參戰歌迷的完整度分母。但同時，在個人「現場神曲 Top 3」榜單中，未發表曲若多次在現場演出，對歌迷個人而言具備極高紀念價值，應受保留。
3. **生涯總結卡資訊聚焦度（Footprint Chronicle vs. Top 3 Clutter）**：
   在 540px 生涯總結導出小卡上，既有版面同時擠入統計四宮格、初次/最近參戰、現場神曲 Top 3 與參戰清單，導致卡片版面擁擠、文字層級雜亂。對於參戰多場的歌迷而言，完整的「參戰足跡全紀錄」比重複的 Top 3 更具典藏與回憶價值。
4. **參戰時間軸清單垂直空間浪費（Timeline Card Vertical Density）**：
   在巡演票夾頁面（`TicketBookPage`）的「參戰時間軸」中，每張場次卡片底部均配置一條獨立的 `border-t` 分隔線與一整行空間僅用於放置「🗑️ 移出票夾」按鈕，導致多場次清單被拉得過長，瀏覽效率低下。

## Decision
1. **擴充票夾全域儲存綱式與持有人雙向同步（`hg_ticket_book_v1.holderName`）**：
   - 擴充 `hg_ticket_book_v1` 頂層綱式，新增 `holderName: string`（預設為空字串，上限 40 字元）。
   - 匯出 `getTicketBookHolderName` 與 `setTicketBookHolderName` API，並在儲存時透過廣播事件保持跨元件即時同步。
   - 在 `MemorialCardModal` 與 `MilestoneCardModal` 自訂抽屜中皆提供「👤 歌迷暱稱・ID（`holderLabel`）」輸入框，任一處修改即全域持久化。
   - 嚴格遵守隱私原則：當 `holderName` 為空時，兩張小卡皆完全不渲染 `HOLDER` 標籤；填寫時渲染高對比度實體票券風格徽章（`👤 HOLDER: [Name]`）。
   - 輸入框實施 600ms 防抖（debounce）與 `onBlur` 即時套用，阻斷頻繁擊鍵導致的 2x Canvas 圖片重繪卡頓。

2. **歌曲解鎖率嚴格排除未發表曲邊界（Unreleased Track Coverage Exclusion）**：
   - 在 `computeTicketBookMilestones` 中，官方曲庫母數（`totalCatalogSongs`）與已解鎖曲目數（`unlockedSongCount`）均嚴格排除 `unreleased: true` 或 `songUnreleased.has(id)` 之曲目，確保解鎖率僅針對已正式發表曲庫進行百分比計算。
   - 個人「現場神曲 Top 3」保持對所有演出曲目開放，即使為未發表曲（如幻之名曲），只要在現場聆聽過即計入次數參與排行。

3. **生涯小卡版面重構：專注參戰編年史，Top 3 留存網頁端**：
   - 540px 生涯總結小卡（`MilestoneCardModal`）移除「現場神曲 Top 3」區塊，騰出空間給完整「參戰足跡全紀錄（`attendedShowsList`）」。
   - 足跡清單採清晰的雙行結構：
     - 第一行：場次編號（`#01`）、演出日期與地點（📍 城市 / 場館）。
     - 第二行：巡演專場名稱。
   - 網頁版票夾儀表板（`TicketBookMilestoneDashboard`）完整保留 Top 3 神曲展示，達成「網頁版互動分析」與「實體卡導出分享」的清晰分工。

4. **時間軸卡片操作整合與垂直空間緊緻化**：
   - 完全移除每張參戰卡片底部的 `mt-3 pt-2.5 border-t` 獨立列。
   - 將「🎫 查看票根 →」與「🗑️ 移出票夾」整合並列至卡片頂部右側（與左側日期/巡演類型徽章對齊）。
   - 「查看票根」維持主要導覽連結；「移出票夾」微調為次級輕量風格按鈕，大幅壓縮單張卡片高度，使多場次清單呈現緊緻優雅的票夾美學。

## Consequences
- **Positive**: 歌迷導出的小卡具備高度個人歸屬感，並能隨意自訂與清除，保護隱私。
- **Positive**: 歌曲解鎖率計算回歸精準的官方發行曲庫範疇，避免未發行特殊曲目扭曲統計指標。
- **Positive**: 生涯小卡版面重點聚焦於真實的「參戰巡迴足跡」，雙行排版清晰易讀，實體感倍增。
- **Positive**: 參戰時間軸卡片高度顯著降低，大幅提升滾動瀏覽體驗。
