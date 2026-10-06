# ADR-0076: 中央場館字典全量審計與地理資訊正名標準化 (Central Venue Dictionary Audit and Geographical Normalization)

* **狀態**：已採納 (Accepted)
* **日期**：2026-10-06
* **影響層面**：中央場館字典 (`data/venues.json`)、巡演場次資料 (`data/tours/`)、事件場次資料 (`data/events/`)、ADR-0013 / ADR-0018 / ADR-0034 規範落實

---

## 背景與動機

在早期自動化爬蟲匯入與機器翻譯過渡期中，部分場館（`venue`）、城市（`city`）、行政區（`prefecture`）與分區（`region`）欄位累積了若干歷史失真與雜訊：
1. **機器翻譯直譯與語意割裂**：
   - 埼玉《VIVA LA ROCK 2019》之舞台被直譯為「萬歲！埼玉超級競技場舞臺」（應為「埼玉超級競技場 VIVA! STAGE」）。
   - 名古屋《日本特殊陶業市民會館 Forest Hall》被機翻為「Nippon Special Cosmetics Civic Hall森林大廳」，且城市欄位被誤填為企業名稱「日本特殊陶業」。
   - 長野《長野市若里多目的體育館 (Big Hat)》被直譯為「大帽子」。
   - 神戶《神戶國際會館 國際廳》因日文平假名被重複轉譯為贅語「神戸国際會館こくさい會館」。
   - 新潟《新潟 TERRSA》被譯為贅字附帶的「新潟特爾薩(Niigata Telsa)」。
   - 橫濱《PACIFICO橫濱 國立大會堂》被譯為「PACIFICO YOKOHAMA國家大廳」。
2. **地理行政歸屬偏差**：
   - 福島縣磐城市（いわき市）之「いわき芸術文化交流館アリオス」場館為純英文「Iwaki Art and Culture Center Alios Hall」，且城市被誤退回縣名「福島」而非實體市名「磐城」。
   - 鹿兒島《鹿兒島縣文化中心 寶山會館》之分區（`region`）被誤標為泛指的「日本」，城市與縣名帶有日語新字體「鹿児島 / 鹿児島県」。
   - 線上直播（`オンラインライブ`）之城市屬性存在「東京」與「線上直播」不一致現象。
3. **日語新字體殘留**：
   - 「国立代々木競技場」未正體化為「國立代代木競技場」。
   - 「愛知県藝術劇場」殘留日字「県」。
   - 「松江学園Teddy's」殘留日字「学」。

---

## 決策與架構規範

### 1. 單一真理來源（Single Source of Truth）字典更新
依循 [ADR-0034](0034-venue-dictionary-audit.md) 原則，所有場館與地理修正一律於 `data/venues.json` 集中治理：
- **徹底清除機翻失真**：
  - `ビッグハット` $\rightarrow$ `長野市若里多目的體育館 (Big Hat)`
  - `新潟テルサ` $\rightarrow$ `新潟 TERRSA`
  - `日本特殊陶業市民会館 フォレストホール` $\rightarrow$ `日本特殊陶業市民會館 Forest Hall`（城市修正為「名古屋」）
  - `いわき芸術文化交流館アリオス 大ホール` $\rightarrow$ `磐城藝術文化交流館 Alios`（城市修正為「磐城」）
  - `神戸国際会館こくさいホール` $\rightarrow$ `神戶國際會館 國際廳`
  - `パシフィコ横浜 国立大ホール` $\rightarrow$ `PACIFICO橫濱 國立大會堂`
  - `中野サンプラザ ホール` $\rightarrow$ `中野太陽廣場會館`（對齊仙台太陽廣場會館標準）
  - `サンポートホール高松 大ホール` $\rightarrow$ `Sunport Hall 高松 大會堂`
  - `グランキューブ大阪 メインホール` $\rightarrow$ `Grand Cube大阪 大會堂`（清除機翻「大殿」）
  - `小樽市民会館 ホール` $\rightarrow$ `小樽市民會館`（清除贅語「會館 會館」）
  - `札幌文化芸術劇場hitaru 劇場` $\rightarrow$ `札幌文化藝術劇場 hitaru`（清除贅語「劇場」）
  - `長良川国際会議場 メインホール` $\rightarrow$ `長良川國際會議場 大會堂`（清除「大廳」）
  - `Aichi Sky Expo ホールA` $\rightarrow$ `Aichi Sky Expo Hall A`（清除「會館A」）
  - `広島県立総合体育館 広島グリーンアリーナ` $\rightarrow$ `廣島縣立綜合體育館 廣島綠色競技場`（補充標準空格）
  - `ぴあアリーナMM` $\rightarrow$ `Pia Arena MM`
  - `高松オリーブホール` $\rightarrow$ `高松 Olive Hall`
  - `オリンパスホール八王子` $\rightarrow$ `OLYMPUS HALL 八王子`
  - `大宮ソニックシティ 大ホール` $\rightarrow$ `大宮 Sonic City 大會堂`（清除機翻「索尼克市政廳」）
  - `熊本県農業公園カントリーパーク` $\rightarrow$ `熊本縣農業公園 Country Park`（清除機翻「郊野公園」與贅字）
- **全漢字正體化（Traditional Chinese Normalization）**：
  - `国立代々木競技場 第一体育館` $\rightarrow$ `國立代代木競技場 第一體育館`
  - `愛知県芸術劇場 大ホール` $\rightarrow$ `愛知縣藝術劇場 大會堂`
  - `松江学園Teddy's` $\rightarrow$ `松江學園Teddy's`
  - `栄Party'z` / `栄R.A.D` $\rightarrow$ `榮Party'z` / `榮R.A.D`
  - `なんばHatch` $\rightarrow$ `難波Hatch`
  - `なら100年会館 大ホール` $\rightarrow$ `奈良100年會館 大會堂`（遵循平假名地名全漢字化方針）
  - `鹿児島県文化センター 宝山ホール` $\rightarrow$ `鹿兒島縣文化中心 寶山會館`（城市「鹿兒島」、縣市「鹿兒島縣」、區域「九州」）
- **地理與分區統一**：
  - `山中湖交流廣場 Kirara`：城市統一為「山梨」（消歧義解決 2019 年甲府與 2025 年山梨之衝突）
  - `線上直播`：統一城市為「線上直播」，分區為「其他」，縣市留空。
- **歷史鍵值與別名相容映射（Alias Protection）**：
  - 將所有舊有錯誤名稱、機翻名稱、HTML 實體名稱（如 `&#039;`）全數保留作為別名鍵，指向正名後的真理紀錄，杜絕日後同步反向覆蓋。

### 2. 全量自動反向同步推進（Auto-propagation）
透過 `validate-data.mjs` 中的 `normalizeShowVenue` 核心管線，將字典最新正名與地理資訊強制覆寫同步至 `data/tours/` 與 `data/events/` 全體歷史場次檔案。

---

## 驗證成果

1. 執行全庫 422 場次深入查核，新字體殘留、機翻異常、區域錯誤達成 **Hard Zero（0 項殘留）**。
2. 資料同步管線 `sync-data.mjs`、校驗腳本 `validate-data.mjs`、冒煙測試 `smoke-test.mjs`（11/11 通過）與 Vite 生產建置全數以 0 error 0 warning 通過。
