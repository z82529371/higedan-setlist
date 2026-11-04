# ADR-0145: 演出歌單曲目唱片封套懸浮名片與收據排版防護架構 (Setlist Song Jacket Hover Card & Receipt Typography Protection Architecture)

- **狀態**：已採納 (Accepted)
- **日期**：2026-11-04
- **決策者**：Core Development & Design Team

---

## 1. 背景與問題陳述 (Context & Problem Statement)

在官方唱片封面底冊（ADR-0143）與錄音室出版檔案（ADR-0144）確立後，全站各處（單曲票根 `SongSlip`、排行榜 `RankingPage`、導航器 `SongNavigator` 與搜尋框 `SearchBox`）均陸續引入官方專輯/單曲封面縮圖。

樂迷與開發者提出疑問：**「是否應該在單場演出歌單（`ShowSlip`）與巡演共識歌單（`TourSlip`）的每一行曲目旁，也常駐放上專輯封面縮圖？」**

經深入審查與領域分析，若在每行歌單左側常駐插入封面圖，會引發嚴重的領域模型與介面矛盾：
1. **設計隱喻衝突（Stage Setlist Run Sheet）**：
   `ShowSlip` 在設計系統（`DESIGN.md`）中被嚴格定義為**「舞台現場控台曲目單 / 票根收據」**（標題明確標記 `OFFICIAL HIGEDAN DISM // STAGE SETLIST RUN SHEET`）。其核心價值在於高資訊密度的等寬文字掃視性（Cue 編號 `M1`、`M2`、`EN1`、曲目名、版本註記與首演標籤）。
2. **高重複率視覺雜訊（Visual Noise Clutter）**：
   以巡演專場（如 *Editorial* 或 *Rejoice* 巡演）為例，22 首曲目中常有 10～14 首隸屬於同一張專輯。若每行皆塞入 36×36 或 48×48 縮圖，歌單將連續垂直排列十幾張完全一模一樣的封面圖，造成極度冗餘的視覺疲勞。
3. **未發表曲與過場的不規則空洞**：
   演唱會中的即興過場（Interlude）、未發表曲（如《風船》）或翻唱並無官方串流封面，若顯示空白或佔位塊會使排版參差不齊。
4. **行動端水平寬度受限**：
   手機螢幕寬度僅 360～390px，排版需容納 Cue 編號、曲名、長度註記、首演徽章與曲目連結，若再塞入圖片欄位將擠壓曲名導致頻繁折行。

因此，亟需一套**既能滿足樂迷「以封面視覺快速認歌」，又「絕不破壞舞台控台清單純粹節奏與手機端直達體驗」**的架構方案。

---

## 2. 決策方案 (Decision)

### 2.1 堅決拒絕常駐行內縮圖，確立「桌機懸浮名片（Mini Vinyl Sleeve Hover Card）」

- **歌單主體維持純文字控台排版**：
  `ShowSlip` 與 `TourSlip` 歌單行內維持原有的極簡清單排版，不常駐渲染任何靜態圖片，捍衛票券收據的設計純粹度。
- **桌機 Hover 意圖防抖喚醒（180ms Debounce）**：
  在支援精準游標的設備上，滑鼠懸停於曲目名稱上滿 **180ms** 時，平滑浮現迷你黑膠唱片封套卡片；游標移開立即淡出。180ms 延遲可徹底避免游標縱向快速滑過歌單時引發高頻閃爍干擾。
- **無封面曲目靜默回退（Silent Passthrough）**：
  若曲目為無官方封面的未音源化作品、即興過場或翻唱曲，完全不觸發懸浮名片，不產生任何灰階佔位方塊或干擾視窗。

### 2.2 實體迷你唱片封套視覺語彙（Ticket Token Aesthetic）

懸浮名片（`<SongJacketHoverCard>`）深度遵循專案實體紙質與黑膠美學：
- **容器規格**：`w-72 rounded-[3px] border border-ink/40 bg-card p-2.5 shadow-[4px_4px_0_rgba(0,0,0,0.18)]`。
- **左側唱片外觀**：64×64 高解析封面圖片，搭配微黑膠封套邊框（`rounded-[2px] border border-ink/20 shadow-2xs`）。
- **右側雙軌資訊**：
  - 歌曲名稱（`font-sans font-bold text-[12px]`）。
  - 官方單曲/專輯初登場出處（透過 `getSongReleaseProvenance`，例如 `2nd Single《Pretender》(2019) · 収録專輯《Traveler》`）。
  - 等寬引導文字（`viewSongHistory`：「點擊檢視單曲歷史 →」）。

### 2.3 觸控螢幕與行動裝置純淨直達策略（Touch & Mobile Fallback）

- **完全隔離觸控裝置**：
  透過 `@media (hover: hover)` 媒體查詢與游標特性檢測，在手機、平板等觸控螢幕上**完全不啟用**懸浮名片，亦不採用長按或雙擊等反直覺手勢。
- **原生單次點擊直達單曲票根**：
  行動端樂迷點擊曲名時，維持原生的單次點擊直接跳轉 `SongSlip`（`#/song/:id`），於單曲票根中瀏覽最完整的大尺寸黑膠封套（`AlbumJacketCard`）、Spotify 試聽舞台與歷年演出統計。

### 2.4 作用範圍統一封裝（Scope of Application）

將此能力抽象封裝為 `<SongJacketHoverCard>`，同步服務於：
1. **單場演出歌單（`ShowSlip`）**：本篇曲目與安可曲目。
2. **巡演共識歌單（`TourSlip`）**：固定曲目（Staple）、核心曲目（Core）與驚喜輪替曲目（Rotation/Surprise）。

---

## 3. 影響與架構驗證 (Consequences & Verification)

1. **視覺層次與專業感**：
   控台曲目單的「票根收據感」獲得 100% 完整保留；同時桌機樂迷在探索冷門或非主打歌時，能透過輕巧的 Hover 預覽瞬間確認其所屬專輯與視覺印象。
2. **極致效能與零額外網路負擔**：
   歌單載入時不發起任何圖片請求；僅在桌機使用者游標停留在特定曲目超過 180ms 時，才載入該張 64×64 封面圖片，並享有瀏覽器原生快取。
3. **四語系對稱性（4-Locale Symmetry）**：
   引導文字 `viewSongHistory` 全面對齊 `zh-TW`、`ja`、`en`、`ko`，通過 `node scripts/check-i18n.mjs` 靜態語系檢驗。
4. **單元測試守護**：
   新增專屬測試套件 `site/tests/ui/song-jacket-hover-card.test.js`，完整驗證：
   - 有封面曲目強制展開時之 mini sleeve 渲染與出處字串；
   - 無封面曲目（如《風船》）之純淨鏈結穿透與零浮層防護；
   - `ShowSlip` 與 `TourTrackItem`（固定曲目與輪替曲目）之整合相容性。
