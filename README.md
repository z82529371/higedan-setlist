# Official髭男dism Setlist 檔案庫

<p align="center">
  <strong>Official HIGEDAN DISM Live Archive (2012–Present)</strong><br />
  系統性收錄 Official 髭男 dism 公開演出的場次與曲目，提供歌曲與場次的雙向極速檢索，完整保存自獨立時期至主流巡演之現場歷史足跡。
</p>

<p align="center">
  <a href="https://higedan-setlist.pages.dev"><strong>🌐 前往線上檔案庫 (Live Demo) »</strong></a>
</p>

<p align="center">
  <a href="https://github.com/z82529371/higedan-setlist/actions/workflows/ci.yml"><img src="https://github.com/z82529371/higedan-setlist/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <a href="https://higedan-setlist.pages.dev"><img src="https://img.shields.io/badge/Deployed%20with-Cloudflare%20Pages-F38020?logo=cloudflarepages&logoColor=white" alt="Cloudflare Pages" /></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/i18n-4%20Languages-10b981" alt="4 Languages" />
</p>

---

## 📖 專案簡介

在參與演唱會前/後、聆聽專輯或探索樂團編年史時，歌迷常需在社群或碎片化的網路資訊中費力拼湊歷史紀錄。

**Official髭男dism Setlist 檔案庫** 為解決此痛點而生——這是一座專為 Official 髭男 dism 樂迷打造的高精度、高檢索效率之雙向現場資料庫。從 2012 年在松江與米子 Livehouse 的草創時期，到 Hall 巡迴、日本武道館、各大體育館（Arena）專場巡演與大型音樂祭舞台，全方位記錄每一場演出的曲目單、版本限定改編（アレンジ）與演出足跡。

---

## ✨ 核心特色

### 1. 🎛️ 雙模切換架構（Dual-Mode Experience）
- **聚光燈首頁門面（Spotlight Landing）**：進站映入眼簾的是極致留白的大型聚焦搜尋框、編輯推薦的熱門探索標籤與特色亮點卡，提供官方檔案館般的高級體驗。
- **檔案庫檢索模式（Archive Mode）**：一鍵切換至單欄聚焦流（`max-w-[960px]`），支援類型 → 年份 → 活動 → 場次的四層自適應階層導航，杜絕雙滾動條拉扯與雜亂視窗干擾。

### 2. ⚡ 雙向穿透檢索（Bi-Directional Query）
- **從歌曲看現場**：查看特定歌曲的出賽履歷、首演（初披露）年份、自彈自唱（弾き語り）次數、歷年演唱頻率與改編版本紀錄。
- **從場次看曲目**：瀏覽單場專屬票根、本篇與安可曲目單，並自動比對展示與「前一場次之曲目差異（Setlist Diff）」。

### 3. 🏟️ 系統性收錄八大演出形態
嚴格遵循領域本體分類，涵蓋所有公開演出情境：

| 演出類型 | 說明 | 代表場合 |
| :--- | :--- | :--- |
| **巡演專場** | 具備多場次集合與定番共識模板之官方巡演 | *SHOCKING NUTS TOUR*, *Arena Tour 2024 -Rejoice-* |
| **特別專場** | 單發或限定企劃之獨立專場演出 | *Road to Budokan*, *武道館單發專場* |
| **聯合專場** | 與其他樂團同台對打之對聯專場（対バン） | 樂團聯名企劃巡演 |
| **音樂祭** | 國內外大型搖滾音樂節正式登台 | *ROCK IN JAPAN*, *SUMMER SONIC*, *SWEET LOVE SHOWER* |
| **學園祭** | 日本各大專院校學園祭邀請演出 | 歷年大學學園祭巡演 |
| **店家活動** | 唱片行、商場等一日店長或發片紀念活動 | Tower Records、HMV 店面活動 |
| **電視演出** | 電視節目特企或典禮現場連線演奏 | *NHK 紅白歌合戰*, *MUSIC STATION SUPER LIVE* |
| **線上直播** | 無觀眾線上直播或虛擬串流演唱會 | *FC Online Live*, *ONLINE LIVE 2020 -Arena Travelers-* |

### 4. 🎟️ 實體票根美學與個人紀念卡匯出
- **票券設計語彙**：全站貫徹撕角穿孔線（Perforation）、防偽條碼序號、仿舊質感戳章與對比印刷細節。
- **專屬紀念卡匯出**：在任何專場票根中，可一鍵渲染並下載高解析度個人紀念長圖卡（PNG），永久珍藏參戰回憶。

### 5. 🌐 四語系在地化支援
- 提供 **繁體中文 (`zh-TW`)**、**日本語 (`ja`)**、**English (`en`)** 與 **한국어 (`ko`)** 四語系介面。
- **場館與地名雙向映射**：日本各地都道府縣、海外巡演城市（台北、首爾等）與指標性場館（如「横浜アリーナ / Yokohama Arena」、「日本武道館 / Nippon Budokan」、「台北小巨蛋 / Taipei Arena」）均建立官方多語正名對照，搜尋框支援跨語系即時命中。

---

## 🔍 資料考證與資料治理

本檔案庫秉持「**真實資料為本（Truth in Data）**」原則：
- **可驗證性**：所有場次與曲目資訊均交叉考證自 [LiveFans](https://www.livefans.jp/)、Official 髭男 dism 官方公告、特設巡演網站、官方周邊場刊與公開新聞記錄，每場演出均具備可溯源的一手佐證資料。
- **巡演共識模板演算法**：巡演專場以全體場次之共識模板（Template Setlist）為基準，各場次僅記錄差異（Diff），忠實呈現定番曲與輪換驚喜曲。
- **雙時制領域模型**：嚴格區分開場進場時刻（`opensAt`）與正式開演時刻（`startsAt`），音樂祭與電視節目精確對齊樂團實際登台時間。

---

## ⚖️ 免責聲明（Disclaimer）

1. 本專案為歌迷社群獨立整理之**非官方、非營利**開放原始碼檔案庫，與 Official 髭男 dism 及所屬經紀公司無直接隸屬關係。
2. 網站中提及之樂團名稱、商標、歌曲名稱、歌詞、專輯封面及相關影音資產之著作權與智慧財產權，均屬 **Official 髭男 dism**、**IRORI Records / PONY CANYON INC.** 及各相關權利人所有。
3. 歷史演出資料僅供歌迷學術探索、交流與紀念使用，資料庫內容力求精準，若有未盡之處歡迎提供一手資料反饋（聯絡信箱：`hgdnlive@gmail.com`）。

---

<details>
<summary>🛠️ <strong>技術規格與本地運行（Technical Details & Setup）</strong></summary>

### 技術堆疊
- **核心框架**：React 19 (`packages/site`)
- **建置工具**：Vite 6
- **樣式系統**：Tailwind CSS
- **程式碼檢查**：oxlint
- **部署平台**：Cloudflare Pages
- **套件管理**：pnpm 11 (Workspace Monorepo)

### 本地開發指南

```bash
# 1. 複製專案
git clone https://github.com/z82529371/higedan-setlist.git
cd higedan-setlist

# 2. 安裝依賴（需求 Node.js >= 22.13.0）
pnpm install

# 3. 同步資料與編譯快照
pnpm sync

# 4. 啟動本地開發伺服器
pnpm dev

# 5. 執行全域資料不變量與 SSR 測試
pnpm check
```

### 領域架構深度文件
- 📐 **[領域模型與資料不變量（CONTEXT.md）](./CONTEXT.md)**：包含巡演邊界、八大演出分類定義與單一真理來源（SSOT）規範。
- 🎯 **[產品架構與互動原則（PRODUCT.md）](./PRODUCT.md)**：雙模架構、單欄聚焦流約束與資訊檢索人體工學。
- 🎨 **[視覺設計規範（DESIGN.md）](./DESIGN.md)**：票券 Token、穿孔打孔分割線、色彩對比度與排版規則。
- 📜 **[架構決策紀錄（docs/adr/）](./docs/adr/)**：收錄專案歷來 100+ 篇架構決策與資料管道演進紀錄。

</details>

---

<p align="center">
  Crafted with ❤️ for Official 髭男 dism fans around the world.
</p>
