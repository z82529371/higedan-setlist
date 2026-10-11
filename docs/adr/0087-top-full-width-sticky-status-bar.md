# ADR-0087: 頂部全寬吸頂動態狀態列架構 (Top Full-Width Sticky Dynamic Status Bar Architecture)

## 狀態
已通過 (Accepted)

## 背景 (Context)
在先前版本中，頂部狀態欄（黃色 Ticker）存在三項體驗限制：
1. **未吸頂固定**：當使用者往下滾動閱讀 Setlist 單據或導航器時，黃色狀態欄會隨頁面滾出視窗，無法在深層滾動時隨時提供當前單據的標題與來源指引。
2. **寬度被容器限制**：原狀態欄嵌在 `max-w-[960px]` 版心容器內部，無法橫跨全螢幕，在大螢幕桌機兩側留有突兀灰邊。
3. **資訊單一侷限於場次**：過去狀態欄永遠只顯示 `current?.unit.title`，當切換至「歌曲」或「場地」分頁時，狀態欄與當前畫面脈絡完全脫節。

使用者要求黃條應該「固定跟著下來、並且全寬度、並且不是只有場次，也要跟著歌曲、場地動態變更」。

---

## 決策 (Decision)

### 1. 滿版置頂與吸頂滾動架構 (Full-Width Sticky Architecture)
- 將黃條抽離至全站頂層（`sticky top-0 z-40 w-full bg-band border-b border-ink/20 shadow-xs select-none`），橫跨 100% 視窗寬度（100vw），徹底打破 960px 邊界限制。
- 頁面向下滾動時，持續吸附於螢幕最頂端（Sticky），無縫伴隨使用者瀏覽。
- **版心對齊**：黃條外層背景橫跨全螢幕，內部內容則以 `mx-auto max-w-[960px] px-4 sm:px-6` 與下方核心版心完全對齊，兩側視覺整齊不散落。

### 2. 三向分頁動態對映 (Dynamic Context Binding across Show / Song / Venue)
黃條內容隨全域 `tab` 即時響應切換：
- **場次分頁（`tab === "show"`）**：
  - 左側：當前巡演／專場完整名稱（`current?.unit.title`）。
  - 右側：桌機為 `N 場 · M 首歌曲 ● 來源 LiveFans/官網`，手機簡約為 `N 場 ● 來源 LiveFans`。
- **歌曲分頁（`tab === "song"`）**：
  - 左側：`🎵 《歌曲名》（專輯／單曲歸屬／未發行標記）`。
  - 右側：桌機為 `累計演唱 N 場 ● 歌曲檔案`，手機為 `累計 N 場 ● 歌曲檔案`。
- **場地分頁（`tab === "venue"`）**：
  - 左側：`🏛️ 場館名稱（城市）`。
  - 右側：桌機為 `累計舉辦 N 場 ● 場地檔案`，手機為 `累計 N 場 ● 場地檔案`。

### 3. 一鍵快捷滾動錨點 (Click to Smooth Scroll to Slip)
點擊吸頂黃條任一處時，觸發平滑滾動（Smooth Scroll）直達當前單據卡片（`slipRef.current?.scrollIntoView({ behavior: "smooth" })`），提供強大人體工學導航能力。

---

## 後果 (Consequences)

### 正面影響 (Positive)
1. **全域脈絡常駐不迷失**：深層滾動時始終清楚當前正在查看哪部巡演、哪首歌曲或哪處場館。
2. **大螢幕大氣張力**：芥末黃品牌色滿版橫貫頂部，帶來鮮明的官方品牌視覺識別。
3. **三維分頁一致性**：歌曲、場地不再是「次等公民」，擁有與場次完全平起平坐的頂部全景狀態支援。
