# ADR-0121: 未收錄歌單與缺失時間之樂迷情報協尋與預填回報架構（Crowdsourced Setlist Quest & Prefilled Mailto Architecture）

## Status
Accepted

## Context
1. **歷史死胡同與社群共建斷點（Issue #40, #45）**：
   在 Official 髭男 dism 自 2012 年起的現場編年史中，早期地下獨立時期（2012–2016 年）存在大量的歷史資料缺漏：
   - 全檔案庫有 113 場單場活動演出缺乏曲目清單（曲目全空或僅具佔位符）。
   - 另有 81 場演出缺乏確切的開場或開演時間（雙時制資料缺漏）。
   先前的場次票根（`ShowSlip`）在曲目為空時僅渲染冷硬的靜態文字「🔍 歌單情報未明 / 本場演出目前尚無公開曲目紀錄」，介面呈現為完全的死胡同。持有當年紙本歌單、入場票根、Livehouse 宣傳單（Flyer）或推特現場貼文的資深樂迷無法就地參與社群貢獻。
2. **回報門檻過高與歷史情報流失**：
   樂迷若欲提供情報，先前必須跳轉至首頁或頁尾尋找勘誤信箱，並手動鍵入複雜的演出日期、活動名稱與場館名稱，往往導致寶貴的一手歷史情報因此流失。
3. **時間欄位之情報收集提示**：
   對於已收錄完整歌單但缺乏開場/開演時間的場次，亦需要友善且不喧賓奪主的情報回報管道，以協助逐步補齊時間審計缺口。

## Decision
1. **樂迷情報協尋卡（Crowdsourced Setlist Quest Card）**：
   - 當場次曲目為空（`items.length === 0`）時，全面取代原本冰冷的靜態提示，渲染為符合票根工藝美學的獨立卡片（`SetlistQuestCard`，`data-testid="setlist-quest-card"`）。
   - 卡片採用點陣虛線邊框（`border-[1.5px] border-dashed border-ink/30`）、溫暖紙質底色（`bg-paper/60`）與實體墨水徽章（`📮`），以誠摯且具備歷史使命感的社群文案號召樂迷提供當年紙本歌單、門票票根、宣傳單（Flyer）或推特貼文。
2. **一鍵預填郵件回報協定（Prefilled Mailto URL Protocol）**：
   - 提供醒目的操作按鈕（`data-testid="quest-mailto-btn"`），遵循設計系統官方金色（`bg-band text-band-ink border border-ink/40`，符合 >= 7:1 AAA 高對比度規則）。
   - 封裝純函數 `buildSetlistMailto`（`site/src/lib/feedback.js`），自動對主旨與內文進行標準 URI 編碼：
     - 收件者：官方勘誤信箱 `hgdnlive@gmail.com`
     - 主旨格式：`[Official髭男dism 現場情報] YYYY-MM-DD 活動名稱 @ 場館`
     - 結構化內文範本：包含場次標準 ID、演出日期、活動名稱、演出場館、本篇曲目填寫區（`1. `, `2. `...）、安可填寫區（`EN1. `, `EN2. `...）、演出特徵備註（自彈自唱、翻唱、新歌初披露）與照片附件指引。
3. **缺失時間之就地協尋提示（Missing Time Inline Prompt）**：
   - 在 `ShowMetadataBox` 中，若場次已收錄歌曲（`songCount > 0`）但缺乏開場與開演時間，於時間列以精緻點陣虛線標籤渲染「⏰ 提供開演時間 →」（`data-testid="report-time-btn"`）。
   - 點擊喚起預填郵件，主旨格式為 `[Official髭男dism 開演時間情報] YYYY-MM-DD 活動名稱 @ 場館`，並附帶開場與開演時間填寫結構。
4. **四語系完全在地化與對稱支援**：
   - 協尋卡標題、說明文案、按鈕標籤與郵件內文範本完整支援 `zh-TW`、`ja`、`en`、`ko` 四種語系。
   - `buildSetlistBody` 與 `buildTimeBody` 依據樂迷當前使用語系生成流暢的母語郵件範本。
5. **模組化測試架構守護（Modular Slip Test Suite）**：
   - 在 `site/tests/ui/modular-slips.test.js` 建立無頭 React SSR 測試，驗證純函數 URL 生成、空歌單票根協尋卡渲染、完整歌單隱藏不變量與時間提示之邊界條件。

## Consequences
- **Positive**: 將 113 場空歌單歷史死胡同轉化為充滿溫度的樂迷社群共建入口，顯著降低情報回報門檻。
- **Positive**: 支援標準 `mailto:` 協定，桌面端與行動端皆可一鍵喚起預設郵件 App（Gmail、Apple Mail 等），完全免除繁複登入或第三方表單資安風險。
- **Positive**: 嚴格遵循實體票券工藝美學與無任意十六進位色彩 token 規範，視覺體驗融洽一致。
- **Positive**: 四語系對稱文案與無頭 SSR 測試全數通過驗證。
