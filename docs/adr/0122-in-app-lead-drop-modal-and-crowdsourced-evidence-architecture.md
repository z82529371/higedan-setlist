# ADR-0122: 站內情報線索投遞彈窗、佐證連結驗證與無伺服器轉發架構（In-App Lead Drop Modal, Evidence Verification & Serverless Forwarding Architecture）

## Status
Accepted（部分替代 ADR-0121 之純 mailto: 協定）

## Context
1. **mailto 協定靜默失效與桌面端回報死胡同**：
   在 ADR-0121 中，針對 113 場未收錄歌單與缺失開演時間之場次導入了「📮 提供本場曲目情報」與「⏰ 提供開演時間」回報入口。然而該機制純粹依賴原生 HTML `<a href="mailto:...">` 協定。在未設定系統預設郵件客戶端（Default Mail Client）的桌面設備（Windows / macOS / Linux）或未授權瀏覽器 Mail Handler 之環境中，點擊超連結時瀏覽器會**靜默忽略、毫無反應**，導致樂迷誤以為功能損壞，實體情報回報因此中斷。
2. **手打歌單認知摩擦力與一手史料查證痛點**：
   原先預期樂迷在郵件中逐一手打 10 餘首曲目與開演時間，不僅在行動端帶來極高的填寫負擔，且站長審核時仍必須親自查驗推特或報導的一手真實出處。真正具備高可信度的單一事實來源（SSOT）是公開的現場紀錄貼文（Twitter/X、LiveFans、Instagram、演出報導）。
3. **極致隱私、零後端營運成本與防垃圾機制**：
   本站為純靜態部署（Cloudflare Pages），不設立私有中心化資料庫與需要伺服器維護的帳號系統。需要一套既能讓樂迷在站內 2 秒完成線索投遞、免登入、免開啟郵件客戶端，同時具備防機器人攻擊與極致降級備援的無伺服器架構。

## Decision
1. **站內現場情報線索投遞對話框（In-App Lead Drop Modal）**：
   - 全面將原本容易靜默失效的原生 `mailto:` 連結，替換為喚起站內票券美學對話框（`LeadDropModal`，`data-testid="lead-drop-modal"`）。
   - 對話框嚴格遵循 `DESIGN.md` 票券紙質與對比規範（`bg-card`、`border-ink`、`bg-paper`），並具備無障礙屬性（`role="dialog"`、`aria-modal="true"`、Escape 鍵關閉、背景點擊關閉）。
   - 頂部以票根風格固定呈現該場演出之【日期、活動名稱、場館】。
2. **極簡化「佐證連結必填」核心結構**：
   - 不強迫樂迷在介面上手打完整歌單或時間，核心收斂為：
     1. **佐證連結（* 必填，`data-testid="lead-evidence-input"`）**：樂迷直接貼上 Twitter (X) 貼文、LiveFans、Instagram 或報導網址。前端透過 `validateEvidenceUrl` 嚴格檢核合規 HTTP/HTTPS 網址，非網址或空白則阻擋送出，杜絕隨意猜測。
     2. **備註說明或稱呼（選填，`data-testid="lead-notes-input"`）**：一句話補充（例如「推文照片有紙本歌單」）或提供者暱稱。
   - 將回報流程壓縮至 2 秒內完成，最大化激發社群情報貢獻意願。
3. **無伺服器背景轉發（Web3Forms Serverless Forwarding）**：
   - 封裝 `buildLeadSubmissionPayload` 純函數（`site/src/lib/feedback.js`），將線索自動格式化為結構化郵件內容。
   - 前端點擊送出時於背景發送至 Web3Forms 轉發通道直達官方管理信箱 `hgdnlive@gmail.com`，內建防連點保護與 Honeypot 防機器人機制。
   - 送出成功原地呈現印章回饋：「📮 情報已送達！感謝您協助拼湊 Official 髭男 dism 歷史現場拼圖」。
4. **極致防禦性複製降級備援（Defensive Fallback）**：
   - 若樂迷處於離線狀態或外部轉發 API 異常，介面自動展開「📋 複製內容與信箱」備援按鈕（`buildLeadFallbackText`），一鍵複製整理妥當的主旨、線索與 `hgdnlive@gmail.com`，確保情報永不流失。
5. **全站協尋觸點統一與四語系完全在地化**：
   - 未收錄歌單（`SetlistQuestCard`）與缺失時間（`ShowMetadataBox`）統一複用同一個對話框架構，依來源動態切換標題與 Placeholder。
   - `slips.quest` 字典完整對稱擴充繁體中文（`zh-TW`）、日文（`ja`）、英文（`en`）、韓文（`ko`）四種語言。
6. **三層模組化測試守護**：
   - 建立 `site/tests/pipeline/feedback-lead.test.js` 驗證 URL 格式驗證、結構化 Payload 與剪貼簿文字產生。
   - 建立 `site/tests/ui/lead-drop-modal.test.js` 驗證四語系無頭 SSR、必填欄位與開啟/關閉狀態。
   - 更新 `site/tests/ui/modular-slips.test.js` 確保 `SetlistQuestCard` 與 `ShowMetadataBox` 正確對接對話框觸發行為。

## Consequences
- **Positive**: 徹底解決桌面端因無預設郵件客戶端導致按鈕點擊「開不起來」的重大互動阻礙。
- **Positive**: 樂迷免打字、免登入、免開郵件軟體，僅需貼上 X 貼文或報導網址即可完成回報，大幅降低社群貢獻摩擦力。
- **Positive**: 以公開一手佐證網址為唯一事實來源（SSOT），由站長親自核驗日文官方曲名與現場特殊改編，確保檔案庫歷史純度。
- **Positive**: 保持純靜態零伺服器維護成本與極致樂迷隱私，並具備離線複製降級備援。
- **Positive**: 全套 4 語系與自動化測試全數通過驗證。
