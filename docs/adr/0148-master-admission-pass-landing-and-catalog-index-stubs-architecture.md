# ADR-0148: 總館入場主票券門面與六大典藏目錄存根架構 (Master Admission Pass Landing & Six Catalog Index Stubs Architecture)

## Status
Accepted (演進 ADR-0095 與 ADR-0115)

## Context
1. **首頁美學與全站實體票券系統之斷層**：
   雖然 `DESIGN.md` 確立了「舞台音箱上的實體歌單（Stage Monitor Setlist）」北極星（`rounded-[3px]`、`1.5px` 墨黑實框、零模糊硬邊投影、手撕和紙膠帶、左右半圓撕票缺口與條碼），並明文禁止 `8px` 以上的大圓角，但既有首頁（`LandingHero.jsx`）仍沿用 `rounded-2xl` 標章、`rounded-xl` 細邊四卡片與 `rounded-xl` 主按鈕，視覺調性偏向一般 SaaS 落地頁。
2. **第一屏（Above-the-Fold）操作效率瓶頸**：
   原本 5 顆散落的統計膠囊在手機端易折行成 2–3 排，且核心主按鈕「進入完整檔案庫探索 →」被放置在四張高卡片最下方，手機端訪客不往下滑過多屏便看不到主入場按鈕。
3. **內容時效與第一公民功能曝光落差**：
   熱門探索曾靜態寫死「2024 Rejoice 巡演」，卡片文案亦硬編碼「523 場」；同時，後續新增的「排行殿堂（`#/ranking`，ADR-0139）」與「官方歷年發行展間（`#/releases`，ADR-0142/0144）」在首頁僅作為次要小標籤，未獲得與其他核心頁面平權的目錄索引入口。

## Decision
1. **總館入場主票券（Master Admission Pass）**：
   - 首頁頂部工具列維持極簡（僅保留 `LanguageSwitcher`，嚴守 ADR-0107 / ADR-0115 零按鈕牆與無懸浮球規範）。
   - 將品牌識別、統計規格表、中央聚光燈搜尋框、熱門探索與主 CTA 統一收束為一張大型「總館入場主票券」（`rounded-[3px]`、`border-[1.5px] border-ink`、`shadow-xl dark:shadow-none`、頂部 `.washi-tape` 手撕金色和紙膠帶、底部 `TicketBarcodeFooter`）。
   - **上半聯（Header + Printed Monospace Spec Strip）**：5 顆散落統計膠囊收斂為緊湊等寬規格表（桌機 5 欄 / 手機 2 欄首行跨欄），杜絕無序折行。
   - **撕票分隔線**：複用 `TicketPerforationDivider`（左右半圓缺口＋虛線＋微縮安全字帶）。
   - **下半聯（Spotlight Search + Dynamic Quick Jump + Elevated Primary CTA）**：
     - 「進入完整檔案庫探索 →」主 CTA（`data-testid="landing-primary-cta"`）提早置入主票券下半聯，使桌面與行動端第一屏即可完成「搜尋／熱門直達／進入檔案庫」三種核心動作。
     - 熱門探索去重（移除已升格成獨立目錄卡的排行與作品），改為：**自動讀取最新專場巡演**（`findLatestTourUnit` + `formatLatestTourPromptLabel`）、`台北小巨蛋專場`、`Pretender` 與 **「🎲 隨機抽一張票根」**（`pickRandomPlayableShow`）。
     - **存根場次排除不變量**：隨機抽一張票根嚴格透過 `resolveShowItems` 排除無公開曲目清單之存根場次（Stub Shows），確保點擊必落於具備完整曲目清單之演出票根。

2. **六大典藏目錄存根（Six Catalog Index Stubs，演進 ADR-0115）**：
   - 主票券下方改為桌機 3×2、手機 2×3 的 6 格緊湊實體票根索引（`data-testid="landing-catalog-stubs"`）：
     - `01 BI-DIRECTIONAL` 歌曲雙向檢索（`#/song`）
     - `02 VENUE ATLAS` 場地制霸地圖（`#/map`）
     - `03 TICKET BOOK` 個人巡演票夾（`#/tickets`）
     - `04 TOUR JOURNEY` 全生涯巡演動態足跡（`#/map/journey`）
     - `05 LEADERBOARD` 排行殿堂（`#/ranking`）
     - `06 RELEASES` 官方發行（`#/releases`）
   - 全面改採 `rounded-[3px]`、`border-[1.5px] border-ink`、硬邊陰影與 `.touch-stamp` 墨水壓印回饋，文案壓縮為一句精簡說明並徹底清除硬編碼場次數。
   - **避免重複統計與零計數不變量**：6 格存根不重複堆疊全站總數；僅 `03 個人巡演票夾` 在 `attendedCount > 0` 時渲染高對比紙膠帶金徽章（`bg-tape text-ink`，`✓ {count}`），`attendedCount === 0` 時嚴格隱藏。

## Consequences
- **Positive**: 首頁與檔案庫內的 `ShowSlip` / `TourSlip` 達成 100% 實體票券工藝統一，徹底告別 SaaS 圓角卡片感。
- **Positive**: 主 CTA 提早進入主票券下半聯與手機端 2×3 緊湊索引，大幅提升第一屏操作效率並縮短垂直滑動距離。
- **Positive**: 最新巡演與全站數據 100% 動態派生，未來新增巡演無須手動更新首頁文案；全站六大第一公民入口獲得平權曝光。
- **Trade-off**: 首頁卡片由 4 張擴充為 6 格緊湊索引，透過壓縮單卡文字行數與雙欄佈局抵銷垂直高度增長。
