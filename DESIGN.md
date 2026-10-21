---
name: Higedan Setlist Archive
description: Official HIGE DANDISM 現場演出與曲目雙向檔案庫
colors:
  primary: "#d19f00"
  primary-ink: "#000000"
  neutral-bg: "#e6e6e6"
  surface: "#ffffff"
  text-primary: "#000000"
  text-muted: "#6b6366"
  border-line: "#bdbebe"
  tag-request: "#d9261c"
  tag-unreleased: "#4b3869"
  tag-premiere: "#8a5a0a"
  tag-solo: "#0e7a66"
typography:
  display:
    fontFamily: "'M PLUS Rounded 1c', 'Zen Kaku Gothic New', 'Noto Sans TC', sans-serif"
    fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.2
  headline:
    fontFamily: "'M PLUS Rounded 1c', 'Zen Kaku Gothic New', 'Noto Sans TC', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "'Noto Sans TC', 'Zen Kaku Gothic New', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "'Noto Sans TC', 'Zen Kaku Gothic New', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  xs: "2px"
  sm: "3px"
  md: "4px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-tab-active:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  button-tab-inactive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  pill-filter-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  pill-filter-inactive:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  card-slip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "46px 26px 24px"
---

# Design System: Higedan Setlist Archive

## Overview

**Creative North Star: "The Stage Monitor Setlist"（舞台音箱上的實體歌單）**

本系統以 Official 髭男 dism 巡演現場的「真實實體歌單（Setlist Slip）」為核心靈感。它重現了貼在舞台監聽音箱上的那張由工作人員親手固定、經過整場演出洗禮的白紙歌單：厚磅實體白紙、以金黃紙膠帶（Masking Tape）微角度斜貼固定、實體墨黑印刷邊界，以及帶著 1° 隨機微傾角標記的演出特徵彩色便簽。整體介面既有高保真歷史文獻的莊嚴感，又充滿搖滾樂團演出的現場生命力。

在美學哲學上，本系統嚴格遵循官網 `service.css` 之配色基調，全面拒絕虛浮無機的「現代 SaaS 儀表板風」（如柔焦模糊陰影、天藍色主色調、無差別 8px 大圓角）。取而代之的是明確的物理分層：以淺灰印刷用紙（#e6e6e6）為底，承托出墨黑描邊（1.5px border）的純白票券卡片（#ffffff），並施以硬邊無模糊位移投影（5px 5px 0）。所有的視覺語彙皆在服務「極速雙向檢索」與「高密度演出資料的絕對易讀性」。

**Key Characteristics:**
- **舞台實體質感**：紙膠帶貼附（Masking Tape）、微傾角便利貼（Tilted Cards）與硬邊位移投影（Zero-Blur Hard Cast Shadows）。
- **官方黑金對比**：以灰紙底襯托純白卡片，點綴官方標誌金（#d19f00）與墨黑（#000000），視覺權重層次分明。
- **單欄聚焦流動**：維持 `max-w-[960px]` 單一垂直視窗滾動，零多餘視窗切換，膠囊分層導航直觀流暢。
- **嚴謹演出色彩編碼**：以四色低飽和專屬特徵色區分點歌（紅）、未發行（夜紫）、初披露（琥珀棕）與自彈自唱（松綠）。

## Colors

以官網 `higedan.com` 配色系統為基準，結合巡演現場物料質感的 Stage Craft 色彩體系。

### Primary
- **Stage Gold (舞台標誌金)** (#d19f00): 官方主標誌與選取焦點色，用於膠帶（Tape）、作用中膠囊、焦點框選（Focus Ring）、文字選取反白以及懸停高光。

### Neutral
- **Body Paper (灰紙底色)** (#e6e6e6): 全站基礎背景，營造略帶暖調的實體印刷紙張底質。
- **Ticket White (票根白)** (#ffffff): 核心資料卡片與票券的底色，提供最高對比度的閱讀平面。
- **Printing Ink (印刷墨黑)** (#000000): 主標題、卡片描邊（1.5px）、活動標題與作用中主導航頁籤。
- **Warm Pencil Gray (暖鉛灰)** (#6b6366): 次要中繼資訊、日期、場館城市與場次備註，確保 WCAG AA 4.5:1 對比度。
- **Divider Line (分界灰線)** (#bdbebe): 區塊分隔線、非作用中按鈕邊框。

### Semantic Accents (演出特徵色)
- **Request Stamp Red (點歌紅)** (#d9261c): 標記現場點歌（Request），伴隨專屬淺紅底襯 (#fbe9e6)。
- **Unreleased Night Purple (未發行夜紫)** (#4b3869): 標記地下時期或未正式發行曲目，伴隨淡紫底襯。
- **Premiere Amber (新歌琥珀棕)** (#8a5a0a): 標記該巡演初登場之新歌／首唱，伴隨淡琥珀底襯 (#fffdf5)。
- **Acoustic Pine Green (自彈自唱松綠)** (#0e7a66): 標記主唱藤原聰自彈自唱（弾き語り），伴隨淡綠底襯 (#f2fbf8)。

### Named Rules
**The Gold Accent Reserve Rule.** 舞台金僅用於具有操作焦點、目前選中或膠帶裝飾的關鍵節點，在任何單一檢視視窗中佔比不超過 10%，維持金色的稀有與指引性。
**The Zero-Blur Contrast Rule.** 所有色彩過渡與投影皆維持清晰邊界，禁止使用擴散模糊彩色光暈（Glow），確保在各類螢幕下皆具備鋒利的清晰度。

## Typography

**Universal Label/Mono Font (All Locales):** "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace

**Locale-Isolated Font Stacks (ADR-0112):**
- **Japanese (`ja`):**
  - **Display:** "M PLUS Rounded 1c", "Zen Kaku Gothic New", sans-serif
  - **Body:** "Zen Kaku Gothic New", "Hiragino Sans", "Yu Gothic", sans-serif
- **Traditional Chinese (`zh-TW`):**
  - **Display:** "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif
  - **Body:** "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif
- **Korean (`ko`):**
  - **Display & Body:** "Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif
- **English (`en`):**
  - **Display & Body:** "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

**Character:** 標題在日語採用圓黑體展現 Official 髭男 dism 流行爵士的親和與現場周邊質感；繁體中文與韓文採用極清晰的思源家族與現代無襯線體，杜絕 CJK 異體字交叉污染；英語介面採用溫潤幾何質感的 Plus Jakarta Sans；序號與統計數字則跨語言堅守等寬字型（`IBM Plex Mono`），帶來專業演出工程清單的秩序感。

### Hierarchy
- **Display** (800, clamp(1.5rem, 3.5vw, 2.25rem), line-height 1.2): 頁面大標題與巡演全名，沉穩厚實。
- **Headline** (700, 1.25rem, line-height 1.3): 場次日期、歌曲大名、次級分類區塊抬頭。
- **Title** (600, 1rem, line-height 1.4): 曲目清單中的歌曲標題、分組導航抬頭。
- **Body** (400, 0.875rem, line-height 1.5): 場館名稱、演出說明、來源附註，行長維持極佳易讀性。
- **Label** (600, 0.75rem, line-height 1.2): 演出曲序（M01、EN1）、演出年份、歌曲計數標籤。

### Named Rules
**The Cue Monospace Rule.** 曲目序號（Cue Number，如 `M01`、`EN1`、`—`）一律強制使用等寬字型（`font-mono`）並開啟表格等寬數字（`tabular-nums`），確保垂直縱列視覺基準線絕對齊平。

## Layout

**佈局架構：單欄聚焦流（Single Column Focus Stream）**
全站桌面與行動端統一限制最大寬度 `max-w-[960px] mx-auto`，整個應用程式僅存在唯一的系統垂直滾動條。頂部提供全域搜尋框與四層平鋪折行膠囊導航（類型 → 年份 → 活動 → 場次），所有篩選項目皆以流式排布呈現。

當清單筆數超過 10 筆或超過 50 筆時，啟動「兩層自適應分段機制（`CHUNK_SIZE = 50`, `PAGE_SIZE = 10`）」：
- 當項目 ≤ 50 筆時：單層 10 筆分頁按鈕（最多 5 顆）。
- 當項目 > 50 筆時：上層為 50 筆大區間按鈕（例如 `1-50`, `51-100`），下層為當前區間內的 10 筆細分頁，徹底消除按鈕牆。

### Named Rules
**The Single Stream Rule.** 嚴禁在主頁面中建立雙欄獨立滾動或內部滾動抽屜。任何操作或跳轉皆平滑滾動至主視圖目標锚點，維持沉浸且不被滾動條割裂的瀏覽體驗。

## Elevation & Depth

本系統排斥數位虛擬柔光，全面採用**物理分層與硬邊位移投影（Physical Layering & Hard Cast Shadows）**。深度由物體在物理空間的真實堆疊所決定：灰紙底是舞台地面，白卡片是票根，而色塊便利貼則是覆貼其上的註記。

### Shadow Vocabulary
- **Slip Hard Shadow** (`box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.14)`): 應用於主要票根容器（`SLIP_ARTICLE`），賦予實體卡片清晰的厚度感。
- **Pill Active Shadow** (`box-shadow: 2px 2px 0 #d5a200`): 應用於作用中的次級膠囊按鈕，創造微突起的實體操作反饋。
- **Pill Dark Shadow** (`box-shadow: 1px 1px 0 #000000`): 應用於單元與場次選中膠囊。
- **Note Card Shadow** (`box-shadow: 4px 6px 0 var(--wash-color)`): 應用於曲目清單中特殊演出的微傾斜便利貼。

### Named Rules
**The Zero-Blur Shadow Rule.** 陰影擴散半徑（Blur Radius）永遠為 `0`。陰影是物理切面的剪影，不是發光二極體的暈染。

## Shapes

幾何輪廓以精準俐落的微圓角為基準，搭配擬物實體物件：
- **容器卡片圓角**: `3px`，極微小的收角，維持專業印刷品的方正質感。
- **特徵便利貼圓角**: `2px`，搭配左側 `7px` 實體色彩邊條（border-l-[7px]），呈現撕下便籤的層次。
- **膠囊按鈕圓角**: 次級分類採用 `4px` 圓角方塊，單元標籤採用全圓角 `9999px`（Pill）。
- **實體紙膠帶（Masking Tape）**: 寬度 `132px`、高度 `26px`，頂部居中懸掛，兩側帶有 `border-dashed` 虛線齒孔撕裂質感，並自帶 `rotate(1.5deg)` 微角度斜貼。

## Components

### Buttons & Tabs
- **主導航標籤（Query Tabs）**: 方正無圓角、全寬網格並列。作用中為墨黑背景（#000000）配白字；非作用中為白卡片底，懸停帶 10% 金色光澤。
- **篩選膠囊（Filter Pills）**: 1.5px 實體框線。作用中為舞台金底（#d19f00）配硬邊陰影；非作用中為灰紙底配墨黑字，懸停轉淡金色。

### The Stage Setlist Slip (舞台歌單主卡片)
- **外觀**: 純白背景、1.5px 墨黑外框、3px 微圓角、硬邊 5px 位移投影。
- **裝飾**: 頂部正中央貼附金色紙膠帶（`SLIP_TAPE`），創造被膠帶固定在舞台音箱上的視覺張力。
- **內部節奏**: 頂部留出 46px 空間容納膠帶，內部曲目條目帶有淺灰色細分隔線。

### Tilted Note Cards (特殊曲目便簽卡)
- **外觀**: 針對點歌、新歌、自彈自唱及未發行曲，各自帶有特定的微傾角（-1.2deg 至 1.1deg）、左側 7px 粗色帶與淡色底襯，猶如手寫便簽浮貼於歌單之上。

### Global Search Box (全域檢索框)
- **外觀**: 粗 2px 墨黑輪廓、純白底色、聚焦時呈現 2px 舞台金光圈。
- **待選下拉選單**: 懸浮於搜尋框正下方，以 🎵 歌曲、🎤 演出、📍 場地三組分組列表展示，支援全鍵盤巡覽（上下方向鍵、Enter、Escape）。

## Do's and Don'ts

### Do:
- **Do** 嚴格保持單欄聚焦流（`max-w-[960px]`），確保全頁面僅有單一垂直滾動軸。
- **Do** 堅持使用無模糊硬邊陰影（`Xpx Ypx 0`），維持實體印刷與工作票券的物理質感。
- **Do** 曲序號碼必須使用等寬字型（`font-mono`）與表格數字（`tabular-nums`）對齊。
- **Do** 大量資料（>50 筆）時務必採用兩層式分段分頁，防止按鈕牆產生。

### Don't:
- **Don't** 使用任何 SaaS 慣用的彩色模糊發光陰影（Blur Radius > 0）。
- **Don't** 引入 8px 以上的大圓角按鈕或卡片（膠囊標籤 full 圓角除外），避免流失樂團工作現場的粗獷俐落感。
- **Don't** 建立雙欄獨立滾動條或多重內部抽屜滾動。
- **Don't** 在場次標題中自創城市後綴或模糊演出八大類型分類。

## Touch Affordance & Active Feedback (小尺寸觸控認知與按壓反饋)

行動裝置觸控螢幕缺乏桌面端之懸浮（Hover）預覽能力。為平衡實體印刷美學與流暢的操作認知，本系統制定全域觸控反饋與熱區規範：

### 1. 墨水壓印回饋 (Flat Ink Stamp)
- **Token 與 Utility**: `.touch-stamp`（對應 `site/src/style.css` 與 `site/src/lib/constants.js` 的 `TOUCH_STAMP`）。
- **物理表現**: 手指按下瞬間呈現淡墨印痕（`active:bg-black/5`，深色模式 `dark:active:bg-white/10`），模擬將印章蓋在厚磅卡紙上的觸感。
- **Zero Shift 原則**: 嚴禁在小尺寸按壓時引發版面位移或晃動（零 micro-scale、零跳動），確保滑動或連點時極致穩定。
- **觸控延遲消除**: 強制搭配 `touch-action: manipulation` 與 `user-select: none`，消除行動瀏覽器 300ms 雙擊縮放延遲與文字誤選。

### 2. 漸進式實體暗示 (Progressive Affordance)
- **拒絕滿版超連結底線**: 舞台歌單曲目保持乾淨俐落的黑墨印刷字重（`font-semibold`），避免整頁充滿超連結藍字或下劃線。
- **實體標籤作為點擊靶點**: 跨場次導航與跳轉由右側明確的 `[🎫 →]` 或 `[🎫 城市 日期]` 實體膠囊承擔；收合區域固定以 `▸ / ▾` 三角指示符提示狀態。

### 3. 歌名精準熱區與防誤觸 (Title-Focused Scroll Safety)
- **熱區範圍**: 單場歌單（`ShowSlip`）的曲目點擊僅收斂於歌名文字區塊（搭配 `px-1 -mx-1 py-0.5 inline-block touch-stamp` 提供舒適的按壓範圍）。
- **滑動緩衝保護**: 左側演出序號（如 `M01`、`EN1`）及右側留白不綁定點擊事件，保留作為使用者大拇指上下滑動檢索時的安全非觸發區，徹底杜絕滑動時頻繁誤開彈窗。

## Attended Badges & Ticket Book Touchpoints (參戰標記徽章與票夾接觸點規範)

為呈現真實票根收納冊之實體工藝質感並確保無障礙對比標準，參戰記錄與票夾入口遵循以下設計規範：

### 1. 參戰標記徽章 (Attended Badge)
- **Token 契約**: 統一採用經典紙膠帶金底黑字 `bg-tape text-ink font-bold`，搭配極細墨黑邊框 `border border-ink/40` 與硬邊微投影 `shadow-2xs`。
- **對比度保證**: 徽章文字嚴格遵循 AAA 高對比規範（>= 7:1），禁止使用低對比或未經審核的彩色色碼。
- **小尺寸排版不變量**: 在導航膠囊（`ShowNavigator`）與日程項目（`TourSlip`）中的打勾徽章（`✓`）尺寸固定為 `w-3.5 h-3.5 text-[9px] rounded-full`，強制 `tabular-nums`、單一垂直居中與 `shrink-0`，防止文字過長造成按鈕擠壓或換行。

### 2. 票夾入口動態數字徽章 (Dynamic Count Badge)
- **零計數隱藏（Zero Invariant）**: 當參戰場次 `count === 0` 時，狀態列與行動懸浮球的數字徽章一律不渲染，保持視覺純淨；僅當 `count > 0` 時方動態渲染計數標記。
- **狀態列入口**: 桌面端底欄之 `[🎟️ 票夾]` 按鈕緊鄰「🏠 回首頁」，維持整齊的底部控制條美學。

### 3. 行動端雙側懸浮控制項 (Mobile Floating Dock)
- **左側導航群組**: 於手機螢幕左下角維持單手觸控垂直排列，`[🎟️ 票夾]` 懸浮按鈕（右上角帶圓點數字徽章）垂直疊加於 `[🏠 首頁] [↑ 置頂]` 之正上方，以 `gap-2` 分隔，確保互不遮擋且符合人體工學按壓區。
- **右側功能群組**: 右下角專供語言切換圓形懸浮球（`🌐 FAB`），選單向上彈出（`drop-up`），形成左右對稱清晰的職責分工。

## Atomic Date Presentation & Card Export Invariants (原子日期排版與小卡匯出不變量)

在單場紀念票券（`MemorialCardModal`，440px）與個人巡演票夾生涯里程碑小卡（`MilestoneCardModal`，540px）以及票券單據中，日期與星期之排版嚴格遵循以下不變量：

### 1. 原子演出日期不折行原則 (Atomic Show Date Invariant)
- **Unicode 斷行防護**: 西元日期與星期字串（例如 `2026-08-29（六）` 或 `2026-08-29 (Sat)`）因包含開啟括號（`（` 或 `(`，UAX #14 Open Punctuation），在容器寬度受限時極易被瀏覽器在括號前斷行造成 `(六)` 擠落。
- **排版契約**: 所有票卡、小卡及單據上顯示演出日期的節點，必須強制宣告 `whitespace-nowrap shrink-0`，確保整組日期為不可分割之原子單元。
- **次要資訊讓位**: 在並排排版中（如足跡清單之 `#{num} 日期` 與 `📍 地點`），次要資訊（地點、場館）必須宣告 `truncate min-w-0`（並限制最大寬度如 `max-w-[55%]`），在水平空間不足時優先截斷地點，絕對保全日期完整性。

### 2. 生涯小卡精簡巡演標題準則 (Milestone Card Short Title Presentation)
- **品牌冗餘消除**: 540px 生涯總結卡頂部已固定印刷大型樂團字標 `Official髭男dism`。下方「最初參戰」、「最近參戰」雙欄（每欄約 220px 寬度）及「參戰足跡全紀錄」清單中，巡演名稱一律優先採用 `shortUnitTitle(unit)`（如 `Rejoice`、`SHOCKING NUTS TOUR`），杜絕重疊的 `Official髭男dism` 前綴佔滿欄寬導致關鍵字被截斷。



