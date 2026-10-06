# ADR-0078: 八大演出類型分類體系與店家活動（インストアイベント）收錄規範

* **狀態**：已採納 (Accepted)
* **日期**：2026-10-07
* **影響層面**：演出分類體系（從七大升級至八大）、前端導航按鈕 (`site/src/App.jsx`)、全域搜尋 Badge (`site/src/components/SearchBox.jsx`)、資料驗證管線 (`site/scripts/validate-data.mjs`)、爬蟲腳本 (`site/scripts/batch-import.mjs`)、`data/tours/` 與 `data/events/` 資料層

---

## 背景與動機

1. **日本樂團文化與維基百科專門分類**：
   在 J-POP 樂團文化與日語維基百科架構中，「インストアイベント」（In-store Events，包含於唱片行、購物中心中庭舉辦之發售紀念 Mini Live、Free Live 與簽名握手特典會）歷來皆獨立於「ライブツアー（巡演專場）」與「フェス・イベント出演（音樂祭/聯合專場）」之外，具備明確的獨立地位。

2. **Official髭男dism 早期奮鬥史料的核心足跡**：
   在 2015 至 2018 年間（從獨立發行《ラブとピースは君の中》到主流主流大熱前夕的《Stand By You》），髭男走遍了全日本從島根、鳥取、大阪、愛知到東京、神奈川各大 TSUTAYA、Tower Records、永旺夢樂城（AEON MALL）及啦啦寶都等商場，舉辦了多達 30 餘場零距離接觸歌迷的免費演出。

3. **從七大擴展至八大分類**：
   在 [ADR-0056](0056-seven-category-performance-taxonomy.md) 中，網站確立了七大分類，當時將校園演出獨立為「學園祭」（5 場）。相比之下，「店家活動」擁有超過 30 場珍貴演出，規模與文化特性更具獨立分類的份量。將其獨立為 **`店家活動`**（In-store），可讓樂迷在前端一鍵檢視髭男早期的商場與唱片行奮鬥足跡，不致混入大型巡演或純單發專場中。

---

## 決策與架構規範

### 1. 確立八大演出分類（Eight Categories）
全站演出單元嚴格歸入以下八類之一，前端導覽 Pill 按鈕依固定語意優先序排列：
1. **巡演專場**（`tour`）：多場次售票全國或跨國巡迴（`data/tours/`，全數具備 `templateSetlist` 差異機制）。
2. **特別專場**（`special`）：非巡演之實體單發或特殊限定專場（如 FC 限定 -UNOFFICIAL-、新場館開館、Road to 熱身等）。
3. **聯合專場**（`collab`）：雙團（Two-Man）、對バン（vs）、多組藝人聯合企劃。
4. **店家活動**（`instore`）：唱片行、商場中庭、店鋪發行紀念 Mini Live、Free Live、簽名特典會與店頭演出。
5. **音樂祭**（`fest`）：大型戶外／室內商業搖滾音樂節及綜合音樂祭典。
6. **學園祭**（`campus`）：大專院校校園祭典現場演出。
7. **電視演出**（`tv`）：電視音樂特輯節目現場段落。
8. **線上直播**（`stream`）：無現場實體觀眾之線上串流或廣播錄音室現場。

### 2. 資料庫層級（JSON）規範
- `unit.type` 欄位標準值擴充：
  `["巡演專場", "特別專場", "聯合專場", "店家活動", "音樂祭", "學園祭", "電視演出", "線上直播"]`。
- 多場次店家巡演存於 `data/tours/`（例如 `love-to-peace-wa-kimi-no-naka-release-mini-live-2015.json`），`type` 設為 `"店家活動"`。
- 單場店家活動存於 `data/events/`（例如 `pretender-2019.json`、`stand-by-you-ep-free-acoustic-live-2018.json`），`type` 設為 `"店家活動"`。

### 3. 現有資料遷移（Migration）
即刻將以下已在庫中之店頭/商場發行活動從舊型別修正為 `"店家活動"`：
- `data/tours/love-to-peace-wa-kimi-no-naka-release-mini-live-2015.json`（原 `巡演專場` $\rightarrow$ `店家活動`）
- `data/events/stand-by-you-ep-free-acoustic-live-2018.json`（原 `特別專場` $\rightarrow$ `店家活動`）
- `data/events/pretender-2019.json`（原 `特別專場` $\rightarrow$ `店家活動`）
- `data/events/unofficial-2018.json`（原 `特別專場` $\rightarrow$ `店家活動`，2018-04-08 小田原 Dynacity）

### 4. 驗證與爬蟲管線同步
- **資料校驗**（`site/scripts/validate-data.mjs`）：
  在 `VALID_EVENT_TYPES` 白名單加入 `"店家活動"`，並允許 `data/tours/` 之企劃標記為 `"店家活動"`。
- **爬蟲匯入**（`site/scripts/batch-import.mjs`）：
  若標題含 `インストア|インストアライブ|ミニライブ|サイン会|発売記念フリーライブ|Free Live`，自動識別為 `"店家活動"`。
- **前端邏輯**（`site/src/App.jsx`、`site/src/components/SearchBox.jsx`）：
  - 擴充 `CATEGORY_DEFS` 支援 `{ id: "instore", label: "店家活動" }`。
  - `getUnitCategory(u)` 解析 `u.type === "店家活動"` 為 `"instore"`。

---

## 效益

1. **分類維度精準還原史實**：忠實呈現日本樂團店頭文化與維基百科分表結構。
2. **早期史料檢索極度便捷**：使用者可一鍵過濾出 2015–2018 年所有商場與唱片行的成長印記。
3. **資料庫架構工整統一**：長篇商場巡演與單發商場活動皆擁有清晰一致的類型標籤。
