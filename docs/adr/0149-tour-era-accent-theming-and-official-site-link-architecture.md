# ADR-0149: 巡演時代主題色、高對比深淺校色與官方特設頁直達架構 (Tour Era Accent Theming & Official Site Link Architecture)

- **狀態 (Status)**: 已採納 (Accepted)
- **日期 (Date)**: 2026-11-20

## 背景與問題 (Context)

Official 髭男 dism 歷年大型巡演（如 *Hall Travelers*、*Editorial*、*SHOCKING NUTS*、*Rejoice*、*LIVE at STADIUM 2025*、*FOUR-RE:ISM*、*one-man tour 2026*、*ASIA TOUR 2026*）與旗艦特別專場（如 *UNOFFICIAL 2024 / 2025*）皆擁有極具時代辨識度的官方特設網站與主視覺配色。

若全站始終單一呈現官方標誌金（`#d19f00`），雖具品牌一致性，但在瀏覽特定巡演或匯出該場紀念票根時，缺少重溫當年現場視覺氛圍的記憶觸點；反之，若採全頁背景換膚（Full-Surface Reskin），將與 `DESIGN.md` 的「舞台實體白紙歌單（Stage Monitor Setlist）」北極星美學、使用者淺／深色模式偏好及四種曲目特徵語意色（點歌紅、未發行紫、新歌琥珀、自彈自唱松綠）產生嚴重衝突。

## 決策 (Decision)

確立 **「巡演時代主題色（Tour Era Accent）」** 單層點綴動態主題架構：

1. **點綴與紙膠帶層限定（Accent & Tape Layer Only）**：
   - 保留全站底紙（`--color-paper`）、卡片底色（`--color-card`）、墨黑邊框（`--color-ink`）、使用者淺／深色模式設定與四種演出曲目特徵語意色。
   - 僅動態切換點綴與膠帶層變數（`--color-band`、`--color-band-ink`、`--color-tape`、`--color-tape-tint`、`--color-tape-soft`、`--color-pool`、`--color-pool-wash`、`--color-ambient-glow`）與選取反白（`::selection`）。
2. **觸發對象與優雅回退（Trigger Scope & Verified-Only Fallback）**：
   - 瀏覽巡演總覽（`TourSlip`）與所屬單一場次（`ShowSlip`）時自動套用該巡演（或具備官方海報考據之獨立特別專場事件）的主題色。
   - 切回首頁、歌曲、場館、排行殿堂、官方發行、個人票夾或無官方視覺考據之早期巡演時，自動靜默回退為經典官方標誌金 `#d19f00`，不憑空猜色，亦不增加手動開關負擔（Zero-Config）。
3. **SSOT 資料模型與淺／深對比度不變量**：
   - 內嵌於 `data/tours/*.json`（與可選 `data/events/*.json`）的 `theme` 欄位（`light`、`lightInk`、`dark`、`darkInk`、`source`），並同步收錄 `officialUrl` 官方特設網站連結。
   - `site/tests/invariants/tour-theme-data.test.js` 強制門禁所有主題色皆具備有效 6 碼色碼、一手來源考據，且淺／深模式配對皆達 WCAG AA（`>= 4.5:1`）對比度。
   - 全站弱底徽章（`bg-band/15`）改用 `text-ink` 取代 `text-band-ink`，杜絕深色巡演主色配白字時在淡底上隱形之風險。
4. **紀念票根同步與官方特設頁直達**：
   - `MemorialCardModal` 透過 `resolveMemorialAccent` 同步套用該巡演的時代主題色於頂部色帶、日期與安可序號（並自動調整亮黃等高亮度主色在白紙上的文字對比度）。
   - `TourSlip` 與 `ShowSlip` 於具備 `officialUrl` 時渲染多語系（`zh-TW`、`ja`、`en`、`ko`）的「🌐 官方特設頁 ↗」外連膠囊。

## 影響與結果 (Consequences)

- **正面**：歌迷切換不同巡演時代與匯出紀念票根時具備強烈的時代記憶感，同時 100% 維持白紙歌單的高易讀性、硬邊印刷美學與無障礙對比度；官方特設頁直達亦強化考據透明度。
- **維護注意**：未來新增巡演或特別專場海報配色時，需提供淺／深雙組校色與一手來源，並通過 `pnpm test:invariants` 對比度驗證。
