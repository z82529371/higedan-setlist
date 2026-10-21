# ADR-0117: 原子演出日期防折行不變量與生涯里程碑小卡巡演標題精簡架構（Atomic Show Date Invariant & Milestone Card Short Title Presentation Architecture）

## Status
Accepted

## Context
1. **圖片匯出與窄版排版下之日期斷詞擠落問題（Show Date Line-Breaking & UAX #14 Splitting）**：
   在使用者回報與小卡匯出實測中，西元日期附帶星期之字串（例如 `2026-08-29（六）`、`2024-11-12（火）` 或 `2026-08-29 (Sat)`）在單場紀念票券（`MemorialCardModal`，440px）與生涯里程碑小卡（`MilestoneCardModal`，540px）中，於容器寬度緊湊、字型加載或多欄 flex 排版時，瀏覽器 Unicode 斷行演算法（UAX #14）將括號 `（` 或 `(` 視為 Open Punctuation（開啟標點），允許在西元日期與開啟括號之間斷行，導致 `(六)` 被擠至次行，破壞實體票券印刷的物理原子性美感。
2. **生涯小卡巡演標題冗餘與空間擠壓（Milestone Card Tour Title Redundancy）**：
   在 540px 生涯里程碑導出卡中，「最初參戰」與「最近參戰」採雙欄並排（每欄僅約 220px 寬度），而總結小卡頂部 Header 已經固定印有巨大顯眼的 `Official髭男dism` 品牌字標。此時下方若繼續渲染 `Official髭男dism Tour 2024 - Rejoice` 或 `Official髭男dism SHOCKING NUTS TOUR` 等完整主標題，重複的前綴會直接吃光欄位寬度，使得真正具有辨識度的巡演關鍵字過早遭到 `truncate` 省略。

## Decision
1. **原子演出日期不折行原則（Atomic Show Date Invariant）**：
   - 全面在 `MemorialCardModal`、`MilestoneCardModal`、`TicketBookMilestoneDashboard` 的日期渲染節點宣告 `whitespace-nowrap shrink-0`。
   - 將演出日期與星期字串視為不可分割之原子單元，禁止任何斷詞折行。
   - 與其並排之次要資訊（如 `attendedList` 右側之場館地點 `📍 {venueStr}`）設定 `min-w-0 truncate` 並限制最大寬度（`max-w-[55%]`），確保水平空間受迫時優先截斷地點，絕對保全日期與星期之完整性。
2. **生涯小卡與面板巡演標題改採 `shortTitle`（Milestone Card Short Title Presentation）**：
   - 在 `ticket-book-milestones.js` 的 `validShows` 產出物件中新增 `shortTitle: unit ? shortUnitTitle(unit) : show?.title || key`。
   - 在 `MilestoneCardModal`（最初參戰、最近參戰、參戰足跡全紀錄）與 `TicketBookMilestoneDashboard` 中，全面優先渲染 `shortTitle`（fallback 至 `shortUnitTitle(unit)` 或 `title`），去除重複的樂團品牌前綴，大幅釋放水平空間。
3. **保持領域字串格式穩定性**：
   - 底層 `showDate()` 函式維持既有多語系括號字串輸出（中日文全形、英韓文半形），符合 `ADR-0112` 規範，防擠下完全於 UI 表現層透過 CSS/Tailwind 規則達成。
4. **設計規範與自動化測試防回歸**：
   - 將「原子演出日期不折行原則」與「生涯小卡精簡巡演標題準則」正式收錄至 `DESIGN.md` 與 `CONTEXT.md`。
   - 在 `site/tests/ui/ticket-book-milestones.test.js` 與 `site/tests/ui/ticket-export.test.js` 中新增斷言，驗證 `whitespace-nowrap shrink-0` 與 `shortTitle` 的正確渲染。

## Consequences
- **Positive**: 無論在任何螢幕寬度或匯出圖片中，日期與星期永不拆散擠落，符合實體票券嚴謹排版標準。
- **Positive**: 生涯小卡資訊密度大幅提升，巡演名稱一目了然（如 `Rejoice`、`SHOCKING NUTS TOUR`），不再被長前綴截斷。
- **Positive**: 設計規範沉澱至 `DESIGN.md` 與 `CONTEXT.md`，並受 UI 測試套件自動化守護。
