# ADR-0120: 票夾參戰時間軸就地匯出紀念票根與彈窗狀態解耦架構（In-Place Memorial Ticket Export & Timeline Interaction Architecture）

## Status
Accepted

## Context
1. **跨頁面跳轉造成的空間感割裂與操作成本（Issue #43）**：
   在 `ADR-0114` 與 `ADR-0115` 確立的個人巡演票夾（`#/tickets`）參戰時間軸中，歌迷雖然能清晰回顧歷年參戰歷程，但若欲匯出單場紀念票根（`MemorialCardModal`，440px 復古票券透明 PNG），先前必須先點擊「查看票根」跳轉至檔案庫專場頁面（`#/show/...`），再手動尋找「產生紀念小卡」入口。
2. **時間軸脈絡丟失與瀏覽中斷**：
   歌迷在檢視多年參戰歷史時，往往希望連續性地為每一場演出的珍貴回憶產生票券圖片並分享至社群平台。跨頁跳轉不僅導致票夾頁面的滾動位置、搜尋關鍵字與年份篩選重置，亦大幅增加操作往返成本。
3. **場次中繼資料與樂迷打卡備忘之完整繼承**：
   就地喚起的紀念票根彈窗必須完美繼承該場次之曲目清單（`main` / `enc`）、演出序號與總場次，並自動繼承歌迷在本地儲存的自訂座位、心得隨筆、專屬紀念印章戳記與歌迷身分暱稱（`holderName`）。

## Decision
1. **就地匯出入口（In-Place Action Row Entry）**：
   - 在參戰時間軸卡片（`TicketBookPage`）的座位席次與心得備忘下方操作列中，新增專屬操作按鈕：`[🎨 儲存紀念票根]`（`export-memorial-btn-${showKey}`）。
   - 按鈕樣式遵循實體票券工藝美學 token（`bg-card border-ink/30 text-ink hover:bg-tape-tint`），並提供專屬觸控回饋（`touch-stamp`）。
2. **彈窗狀態無縫綁定與資料組裝（Seamless State Coupling & Data Assembly）**：
   - 票夾內部維護 `memorialShowId` 區域狀態，點擊卡片就地按鈕時以 `useMemo` 動態檢索關聯之靜態演出資料庫（`showById`、`unitData`、`unitIdByShowId`）。
   - 透過 `assignCues` 自動為本篇演奏（`M`）與安可（`EN`）編排曲目標號，組裝完整 `show`、`unit`、`main`、`enc`、`showIndex`、`totalShows`，無縫傳遞至 `MemorialCardModal`。
   - 即使遭遇特殊或未完全收錄之場次，亦提供防禦性 fallback，確保彈窗穩定渲染而不中斷。
3. **零跳轉無痕閉環體驗（Zero-Redirection Seamless Lifecycle）**：
   - 彈窗以宣告式模態層渲染於票夾時間軸頂部，不修改當前 URL Hash（維持在 `#/tickets`）。
   - 彈窗關閉或匯出完成後，樂迷維持在原有滾動位置、年份篩選與關鍵字檢索狀態，無任何非預期之頁面跳轉。
   - 彈窗內部之座位與心得修改直接觸發 `recordAttendance` 與 `TICKET_BOOK_EVENT_UPDATED` 事件，票夾時間軸卡片與里程碑即時響應刷新。
4. **一鍵式 PNG 檔案下載支援（One-Click PNG Download Trigger）**：
   - `MemorialCardModal` 底欄擴充一鍵下載連結（`memorial-download-btn`），帶有自訂檔名 `higedan-memorial-${showKey}-${theme}.png`，在桌面端與行動端均能直覺下載或長按存檔。
5. **四語系完全在地化與自動化測試守護**：
   - 按鈕與彈窗提示在 `zh-TW`（儲存紀念票根）、`ja`（記念チケットを保存）、`en`（Save Memorial Ticket）、`ko`（기념 티켓 저장）四語系全數同步。
   - 在 `site/tests/ui/ticket-book-page.test.js` 新增 `Subtest 9: In-place Memorial Card Modal Export Flow (#43)` 進行 SSR 端到端互動與資料繼承驗證。

## Consequences
- **Positive**: 解決票夾匯出單場小卡需跳轉離開的割裂感，實現原位直覺匯出。
- **Positive**: 保持純粹的零跳轉 URL 狀態，完整保護樂迷當前之篩選與檢索脈絡。
- **Positive**: 雙向同步歌迷自訂備忘、座席與身分暱稱，體驗極為流暢。
- **Positive**: 四語系字典對稱性與無頭 SSR 測試全數通過驗證。
