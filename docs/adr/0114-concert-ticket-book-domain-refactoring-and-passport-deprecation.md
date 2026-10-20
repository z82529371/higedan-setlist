# ADR-0114: 巡演票夾領域重構、意象升級與 Passport 概念廢棄架構（Concert Ticket Book Domain Refactoring, Metaphor Upgrade & Passport Deprecation Architecture）

## Status
Accepted（取代 ADR-0113 之 Passport 隱喻與命名空間，繼承其離屏渲染與持久化基建）

## Context
1. **意象撕裂與實體美學違和（Metaphor Disconnect）**：
   在 `ADR-0113` 中引進了「個人巡演護照（Personal Concert Passport）」概念。然而，護照（Passport）強烈暗示「出國、海關、國境移動」，與本站核心實體視覺理念——**「舞台監聽音箱上的實體歌單（The Stage Monitor Setlist）」** 及票券齒孔、紙膠帶、條碼美學（`DESIGN.md`）產生了明顯的情感與視覺撕裂感。
2. **真實樂迷文化共鳴（Authentic Fan Culture）**：
   在台、日、韓現場音樂文化中，歌迷看完演出後將實體門票／票根妥善收納的載體是「票夾／票本／半券收納冊」（日文：チケットブック / チケットホルダー、韓文：티켓북、英文：Ticket Book / Ticket Stub Album）。
   將打卡行為從「登錄至護照」調整為「收進票夾（Add to Ticket Book）」，更能與單場票根（`ShowSlip`）與巡演大票（`TourSlip`）形成渾然一體的領域語言閉環。
3. **徹底廢棄 Clean Slate 要求**：
   經領域建模（`/domain-modeling`）與設計決策審查，決定徹底刪除 `#/passport` 與所有 `passport` 概念，不留別名，以 `#/tickets` 作為乾淨的一級主路由，並全面遷移語系、組件結構與資料持久化鍵值。

## Decision
1. **核心領域語言全面確立為「巡演票夾（Ticket Book）」**：
   - 繁體中文：**巡演票夾**（「我的票夾」/「收進票夾」/「已收進票夾」/「珍藏你的每場參戰票根，記錄專屬於你的現場回憶」）。
   - 日文（`ja`）：**チケットブック**（「チケットブックに追加」/「チケットブック追加済み」/「チケットブックから削除」）。
   - 英文（`en`）：**Ticket Book**（「Add to Ticket Book」/「In Ticket Book」/「Remove from Ticket Book」）。
   - 韓文（`ko`）：**티켓북**（「티켓북에 담기」/「티켓북 보관중」/「티켓북에서 삭제」）。
   - 圖標全面替換為雙層重疊票根／票夾剪影（🎟️），消除原 🛂 護照圖示。

2. **路由全面切換至 `#/tickets` 並刪除 `#/passport`**：
   - 在 `site/src/lib/routes.js` 註冊一級路由 `#/tickets`，提供雙向 hash 解析與語言參數綁定（`routeHash.tickets`）。
   - 徹底移除 `#/passport` 模式；非預期或舊路由安全回退至標準未匹配流程，實現無殘留概念純化。

3. **底層資料層遷移與向下相容（`site/src/lib/ticket-book.js`）**：
   - 採用 `hg_ticket_book_v1` 作為版本化儲存鍵。
   - 廣播事件更新為 `hg:ticket-book-updated`。
   - 實作讀取時自動遷移：若本機發現舊 `hg_passport_v1` 資料，無損升級轉存至 `hg_ticket_book_v1` 並清除舊鍵，保障先前使用者的參戰紀錄完全不遺失。

4. **組件樹重構與純淨度維護**：
   - `PassportPage.jsx` → `TicketBookPage.jsx`。
   - `PassportMilestoneDashboard.jsx` → `TicketBookMilestoneDashboard.jsx`。
   - 遷移目錄至 `site/src/components/ticket-book/`。
   - 多語命名空間由 `passport.*` 完全遷移為 `ticketBook.*`。

5. **測試套件同步演進**：
   - 重命名測試檔案為 `ticket-book.test.js`、`ticket-book-page.test.js`、`ticket-book-milestones.test.js`。
   - 全套件 102 條 UI 斷言 100% 通過。

## Consequences
- **Positive**: 消除出國護照的違和感，建立起「單場票根（ShowSlip）→ 個人票夾（Ticket Book）」高擬真現場文化共鳴。
- **Positive**: 徹底根除 `passport` 殘留，全站領域語彙高度統一且純淨。
- **Positive**: 自動資料轉移管線保護既有參戰記錄，零資料損失。
