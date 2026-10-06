# ADR-0077: 演出來源動態標籤識別與多渠道一手史料呈現 (Dynamic Provenance Source Labeling for X and Multi-Source Archives)

* **狀態**：已採納 (Accepted)
* **日期**：2026-10-06
* **影響層面**：前台演出票券組件 (`site/src/components/slips.jsx`)、頂部狀態列與頁尾出處宣告 (`site/src/App.jsx`)、ADR-0002 / ADR-0010 多來源史料呈現架構

---

## 背景與動機

在原先的 UI 實作中，所有演出票券（Slips）底部之外部來源連結均寫死為 `livefans 來源紀錄`，頂部狀態列與頁尾亦固定顯示 `資料來源 livefans`。

然而，隨著歷史檔案深入考證，特別是 2012–2015 年獨立樂團時期，有諸多珍貴現場並未收錄於 LiveFans 商業資料庫，其唯一且最可靠的一手史料來源為 **X (Twitter) 官方推文（@officialhige）、團員貼文、或當日現場紙セトリ照片**。

若將來自 X 的連結（如 `https://x.com/officialhige/status/...`）仍舊顯示為「livefans 來源紀錄」，將造成：
1. **來源名實不符與使用者困惑**：點擊標註為 LiveFans 的連結卻跳轉至 X (Twitter)。
2. **抹煞史料價值**：未能彰顯該紀錄來自官方一手社群公佈之權威性。
3. **缺乏多來源擴展性**：無法支援未來引用的官網新聞稿、新聞報導或其他來源。

---

## 決策與架構規範

### 1. 票券層級動態來源標籤（Slip-Level Dynamic Provenance）
在 `site/src/components/slips.jsx` 中，解析各場次 `sourceUrls` 的域名特徵：
- 若 URL 包含 `x.com` 或 `twitter.com`：動態渲染為 **`🔗 X 來源紀錄`**。
- 若 URL 包含 `livefans.jp`：動態渲染為 **`🔗 LiveFans 來源紀錄`**。
- 其他外部域名：自動提取主機名（例如 `hostname`）並格式化為 **`🔗 {domain} 來源紀錄`**。
- 支援一場多來源：若一場演出並存 LiveFans 與 X 連結，依序並列渲染，不再僅截取第 0 個網址。

### 2. 企劃層級動態出處宣告（Unit-Level Source Summary）
在 `site/src/App.jsx` 頂部狀態列（Top Banner）與頁尾宣告（Footer）中：
- 遍歷當前活動或巡演所有場次之 `sourceUrls`，聚合所有來源管道名稱集合（`Set`）。
- 若全場來自 X，標記為 `資料來源 X`。
- 若由 LiveFans 與 X 共同組成，標記為 `資料來源 LiveFans · X`。

### 3. 首例落地：RKB廣播 百道濱夏日音樂祭 2015
收錄 `momochihama-summer-festa-2015.json`（2015-07-18），其 `sourceUrls` 指向官方推文 `https://x.com/officialhige/status/622325978291814400`，票券即刻動態呈現 `X 來源紀錄`。

---

## 效益

1. **資訊真實性**：徹底消除「點擊 LiveFans 卻開出 X」的矛盾體驗。
2. **文獻考據尊重**：明確區分商業集合站（LiveFans）與官方一手推文（X），提升資料庫學術嚴謹度。
