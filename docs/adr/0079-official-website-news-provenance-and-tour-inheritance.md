# ADR-0079: 官方網站一手公告來源全量回填與巡演來源繼承規範 (Official Website News Provenance and Tour Inheritance Architecture)

* **狀態**：已採納 (Accepted)
* **日期**：2026-10-07
* **影響層面**：前台演出票券組件 (`site/src/components/slips.jsx`)、頂部狀態列與頁尾出處宣告 (`site/src/App.jsx`)、資料庫層所有專場與活動 (`data/tours/` 與 `data/events/`)、ADR-0077 多來源史料呈現架構

---

## 背景與動機

1. **官方一手文獻的權威性**：
   在先前的架構中，演出資料庫之外部來源主要仰賴 LiveFans 歌迷回報投稿，或少數 X (Twitter) 推文。然而，Official 髭男 dism 官方網站（`higedan.com`）自 2016 年 2 月起，系統性發布了包含全國巡迴開跑、追加公演、音樂祭受邀、學園祭出演、電視特輯生放送等全方位歷史公告。

2. **多來源史料並列需求**：
   使用者明確要求將官網的公告紀錄全量納入來源紀錄中（「我也想要把官網的紀錄也加進去來源紀錄」、「每個演出有在官網提到的也都增加來源紀錄」）。

3. **巡演層級公告與場次關聯的領域模型決策**：
   官網發布巡演消息時，多為整組巡迴專場（如 `one-man tour 2017`、`Tour 19/20 - Hall Travelers -`、`Arena Tour 2024 - Rejoice -`）之總體發表或主視覺／售票公告。對於巡演專場（`data/tours/`），需要明確規範該公告如何關聯至所屬場次。

---

## 決策與架構規範

### 1. 全量爬取與索引建立（Full Official News Crawl）
- 完整爬取 `higedan.com/news/3/` 自第 1 頁至第 69 頁共 680 則官方歷史公告。
- 提取每則公告之刊載日期、所屬分類（`INFO`、`LIVE`、`RELEASE`、`MEDIA`）、公告標題與對應之官方歷史分頁網址（`https://higedan.com/news/3/?page=N`）。

### 2. 巡演專場全場次繼承原則（Tour-Level Announcement Inheritance）
- **領域規則**：當巡演專場匹配到該巡演之核心發表／主視覺／售票公告時，該官網公告網址**同步附加至該巡迴旗下所有場次**（`shows[].sourceUrls`）中。
- **優先序**：官網來源網址插入至 `sourceUrls` 第 0 位，享有最高權威優先序，隨後並列 LiveFans 或其他補充來源。
- **涵蓋範圍**：覆蓋 2016 至 2026 年共 20 組巡演專場（超過 200 個演出場次）。早於官網建置之 2015 年早期巡演（2 組）維持原有文獻，不強行捏造。

### 3. 單場活動（Events）精準對齊原則（Strict Event Matching）
- 單場活動（音樂祭、聯合專場、店家活動、學園祭、電視特輯）必須依據「演出年份、月日（`MM/DD`）、活動名稱、場次編號與主辦單位」五維嚴格判定，杜絕同名不同年或同日不同場的誤配。
- 經嚴格審計，全庫 76 場官方正式發布新聞之活動演出全數完成來源關聯。

### 4. 前端動態來源標籤擴充（Provenance Badge Expansion）
- 在 `site/src/components/slips.jsx` 之 `getSourceLabel` 擴充支援：
  - `higedan.com` $\rightarrow$ **`🔗 官方網站 來源紀錄`**
  - `wikipedia.org` $\rightarrow$ **`🔗 維基百科 來源紀錄`**
  - `youtube.com` $\rightarrow$ **`🔗 YouTube 來源紀錄`**
  - `x.com` / `twitter.com` $\rightarrow$ **`🔗 X 來源紀錄`**
  - `livefans.jp` $\rightarrow$ **`🔗 LiveFans 來源紀錄`**
- 在 `site/src/App.jsx` 頂部狀態列與頁尾出處動態聚合宣告中，支援呈現：
  - `資料來源 官方網站 · LiveFans · 維基百科`

---

## 效益

1. **一手權威史料背書**：每筆重要演出皆能一鍵直達官方網站歷史公告頁面，奠定樂團編年史的官方真實性。
2. **多來源互補驗證**：官方公告提供正確演出形式、主視覺與日方文案；LiveFans 提供歌迷回報曲目；兩者相輔相成。
3. **前台體驗精緻透明**：票券清楚標示出處類別，不再將官網或維基百科鏈結籠統顯示為外部網域。
