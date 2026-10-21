# ADR-0123: 拒絕過度工程化與現場情報純前端直連架構（Over-engineering Refusal & Pure Frontend Direct Compose Architecture）

## Status
Accepted（替代 ADR-0122 之 Web3Forms 轉發通道與潛在後端資料庫方案）

## Context
1. **外部服務商與資料庫引發之過度工程危機**：
   在 ADR-0122 實作後，系統嘗試引入第三方無伺服器表單轉發（Web3Forms）與評估 Cloudflare D1 資料庫。然而，這引發了嚴重的架構矛盾：
   - 樂迷與站長需管理外部 API Key、環境變數或資料庫維護。
   - 引入了依賴外部第三方服務商的額度限制與網域阻擋風險，甚至動搖了專案純靜態站（Pure Static SPA）之初心。
2. **純前端、零後端與零負擔的終極解法**：
   經過深入的領域建模與實質反思，本站確認守護「100% 純前端、零後端維護負擔、零外部 Token 依賴」的核心價值。樂迷回報線索（Twitter/X 貼文、LiveFans 等）根本不需要後端資料庫，只需要安全、順暢地在前端完成傳遞。

## Decision
1. **徹底移除外部服務商與後端 API**：
   - 清除所有 Web3Forms 端點、API Key、本地環境變數及資料庫規劃，維持純靜態站之純粹性。
2. **純前端雙軌直連操作（Web Gmail Direct & Clipboard Copy）**：
   - 保持站內票券美學彈窗（`LeadDropModal`，`rounded-[3px]`、`shadow-xs`、原子日期標籤）。
   - **主行動 1（網頁版 Gmail 直連，`buildGmailWebComposeUrl`）**：
     點擊在新分頁直接開啟 `mail.google.com` 撰寫畫面，自動帶入 `hgdnlive@gmail.com`、演出主旨與包含佐證網址之內文，樂迷在瀏覽器內即可一鍵發信，100% 免安裝本機郵件客戶端。
   - **主行動 2（複製內容與信箱，`buildLeadFallbackText`）**：
     一鍵複製標準結構化線索與信箱至剪貼簿，並提供「✓ 已複製到剪貼簿」視覺回饋，滿足使用 Yahoo Mail、Outlook 或社群私訊之樂迷。
   - **次行動（本機郵件軟體直連，`buildLeadMailtoUrl`）**：
     保留底部小連結供習慣使用 Apple Mail / Outlook 之桌面端樂迷點擊呼叫。
3. **消除版面跳動與一致性交互模型**：
   - 所有按鈕與連結常駐顯示，當未填寫有效網址時即時顯示紅字格式提示，杜絕輸入時 DOM 節點突兀彈出跳動。
4. **四語系完全在地化與測試架構對齊**：
   - 繁體中文、日文、英文、韓文對稱支援「在網頁版 Gmail 寄出」與「使用本機郵件軟體」文案。
   - 測試套件全面更新為驗證純前端 Web Gmail URL 產生、RFC 6068 CRLF 換行與剪貼簿排版。

## Consequences
- **Positive**: 拒絕過度工程化，專案回歸 100% 純前端靜態站，零後端、零資料庫、零 API Key、零維護成本。
- **Positive**: 徹底解決 Windows/桌面端原本原生 `mailto:` 點擊「開不起來」的死胡同。
- **Positive**: 不受任何第三方服務商額度限制或關站風險影響，程式庫絕對乾淨。
