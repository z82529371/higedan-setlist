# ADR-0118: 個人巡演票夾雙軌備份、跨裝置轉移與防禦性檢核架構（Ticket Book Dual-Track Backup, Cross-Device Transfer & Defensive Ingestion Architecture）

## Status
Accepted

## Context
1. **本機儲存易失性與換機轉移斷層（Issue #38 / #42）**：
   在 `ADR-0114`、`ADR-0115`、`ADR-0116` 所確立之「個人巡演票夾」領域模型中，所有參戰打卡、自訂座位、備忘心得與實體紀念印章皆儲存於瀏覽器本地 `localStorage`（`hg_ticket_book_v1`）。樂迷若更換手機、多裝置查閱、或瀏覽器清理快取，多年珍貴累積的參戰記憶面臨永久蒸發之風險。
2. **零後端伺服器與極致隱私承諾**：
   本檔案庫堅持純靜態無伺服器架構，零個人隱私上傳，因此無法使用傳統帳號中心或資料庫同步。備份與轉移機制必須 100% 在前端離線環境中安全完成。
3. **工程黑話禁絕準則（AGENTS.md Rule 12）**：
   傳統開發者習慣暴露「JSON 備份還原」、「Payload 匯入」、「Schema 檢核」等生硬技術名詞，破壞溫暖友善的音樂圈現場體驗。必須以樂迷友善語彙（如「下載備份檔案」、「快速轉移代碼」）重構介面。

## Decision
1. **模式 C：雙軌並行轉移機制（Dual-Track Transfer Architecture）**：
   - **檔案軌（File Track）**：產生標準化時間戳記檔案 `higedan-ticket-book-backup-YYYYMMDD-HHmmss.json`，信封結構包含 `schema: "hg_ticket_book_backup_v1"`、`version: 1`、`exportedAt`、`holderName` 與 `attendedShows`，適合電腦與雲端硬碟長久典藏。
   - **文字碼軌（Quick Transfer Code Track）**：將票夾安全編碼為 URL-Safe Base64 字串，一鍵複製後可直接透過通訊軟體（如 LINE 或備忘錄）貼至新手機秒速還原，免除手機作業系統檔案管理器的選檔痛點。
2. **6 道防禦性欄位檢核引擎（6-Tier Defensive Ingestion Engine）**：
   - **Tier 1**：嚴格排除非 JSON、非物件、陣列或空值根節點。
   - **Tier 2**：防禦原型污染（Prototype Pollution），嚴格拒絕包含 `__proto__`、`constructor`、`prototype` 的惡意物件。
   - **Tier 3**：字串控制字元清洗與 Unicode NFC 正規化，保留 `\n`、`\t` 但剔除不可見 ASCII 控制字元。
   - **Tier 4**：座席字串截斷（`seat.slice(0, 50)`）。
   - **Tier 5**：心得備忘字串截斷（`notes.slice(0, 300)`）。
   - **Tier 6**：孤兒場次寬容保留，若備份含有當前靜態檔案庫未收錄之場次（如未公開地下場次），自動標記 `isOrphaned: true` 予以完整保留，絕不破壞樂迷真實回憶。
3. **安全變更預覽與合併確認狀態機（Diff Preview & Merge State Machine）**：
   - 匯入資料在寫入本地儲存前，先行比對既有票夾，計算並展示「新增 X 場、更新 Y 場、總計 Z 場」預覽卡片。
   - 提供「保留現有並合併（Merge）」與「完全覆蓋為此備份（Overwrite）」兩種透明明確的操作；合併時遵循「本地優先不可篡改原則（`existing.field || incoming.field`）」，僅填補本地未記錄之欄位，絕不覆蓋既有座席與心得，避免使用者誤操作覆蓋現有筆記。
4. **介面純粹樂迷化與四語系在地化**：
   - UI 全面禁止出現 `JSON`、`Payload`、`Database`、`LocalStorage` 等詞彙。
   - 全面支援 `zh-TW`、`ja`、`en`、`ko` 四語系，桌面與手機懸浮列皆提供操作入口。

## Consequences
- **Positive**: 徹底根除樂迷換機或快取清理導致參戰記憶蒸發的痛點。
- **Positive**: 雙軌模式兼顧「長期雲端硬碟備份」與「手機通訊軟體跨機秒傳」雙重優勢。
- **Positive**: 6 道防禦機制確保用戶端存儲安全，並寬容保留未收錄之孤兒場次。
- **Positive**: 規格測試在 `ticket-book.test.js` 與 `ticket-book-page.test.js` 建立自動化守護。
