# ADR-0111: 場館實體主檔、原生名回退鏈與跨語系路由寬容解析架構（Venue Master Profiles, Native Fallback Chain & Deep Link Resolution）

## Status
Accepted

## Context
1. **多語系回退繁體中文之領域倒錯痛點（ADR-0110 後續反思）**：
   在 [`ADR-0110`](0110-official-venue-localization-and-cross-lingual-presentation.md) 中，全站建立了官方場館正名在地化架構。然而，底層歷史鍵值採用繁體中文（如 `愛媛縣縣民文化會館`、`永旺夢樂城日吉津`、`米子市文化會館 主廳`），當使用者切換至英文（`en`）或韓文（`ko`）介面時，全庫 240+ 處查無官方英韓譯名之日本場館，皆回退至繁體中文鍵值。這導致非中文使用者在查閱日本演出時，竟被迫閱讀台灣民間的繁體中文字樣，破壞了歷史檔案庫的專業度與文獻存真性。
2. **片假名場館之官方拉丁字母還原原則**：
   日語場館命名含有大量片假名（如 `アリーナ`、`ホール`、`プラザ`、`メッセ`，以及愛稱 `リーデンローズ`、`ミルハス`、`オーバード・ホール` 等）。在英文（`en`）環境下，應精準還原為場館官方建築外牆或登記之拉丁英文（如 `Reed & Rose`、`Milhas`、`Aubade Hall`、`Arena`、`Hall`）；而在日文（`ja`）環境下，則嚴格遵循官方演出日程公告之日語書寫習慣（Livehouse 維持英文招牌，公營體育館與會館保留新字體與片假名，杜絕台式混拼如 `横浜Arena`）。
3. **場館領域主檔職責解耦（SSOT）**：
   現存 [`data/venues.json`](../../data/venues.json) 含有 2,900+ 行，本質為「爬蟲原始字串別名對照表」。場館實體（Venue Entity）缺乏與歌曲主檔 [`data/songs.json`](../../data/songs.json) 對稱的領域主檔，多語資料分散在前端代碼，無法透過 CI 測試防護一手原生名之覆蓋率。
4. **URL 路由跨語系分享死穴**：
   現行 URL 路由僅匹配繁體中文標準鍵。海外社群貼文中若分享外文網址（如 `#/venue/横浜アリーナ` 或 `#/venue/Yokohama%20Arena`），現行系統判定無效並強制降級回退至預設場館。

## Decision
1. **建立專屬場館領域主檔 `data/venue-profiles.json`**：
   - 比照歌曲主檔 [`data/songs.json`](../../data/songs.json)，建立獨立的場館實體主檔 [`data/venue-profiles.json`](../../data/venue-profiles.json)，涵蓋全庫 339 處標準場館實體。
   - 每個場館實體定義：`id`（英數字元識別碼）、`canonical`（標準真理鍵）、`native`（一手在地原生名）、`names`（`zh-TW`、`ja`、`en`、`ko` 各語系官方正名）。
   - [`data/venues.json`](../../data/venues.json) 維持不可變，專注於爬蟲字串之別名對齊（Aliases Resolution）。
2. **多語回退鏈改採「一手在地原生名（Native Venue）」為核心不變量**：
   - 介面回退原則：
     - `zh-TW`：優先使用繁體中文譯名；無譯名時回退 `canonical`。
     - `ja`：優先使用官方日文新字體名；無譯名時 100% 回退一手在地原生名（`native`）。
     - `en`：優先使用官方拉丁英名；無譯名時 100% 回退一手在地原生名（`native`）。
     - `ko`：優先使用官方韓文名；無譯名時 100% 回退一手在地原生名（`native`）。
   - **絕對不變量**：非中文介面（`en` / `ko` / `ja`）在任何情況下皆**嚴禁顯示繁體中文譯名**。
3. **片假名與外來語還原規範**：
   - 英文介面（`en`）：片假名依該場館營運官方登錄之正式外文還原為拉丁英文字樣（`Reed & Rose`、`Milhas`、`Aubade Hall`、`Makuhari Messe` 等）。
   - 日文介面（`ja`）：官方一手公告本為英文之 Livehouse 與商標（如 `CLUB QUATTRO`、`Zepp`、`なんばHatch`、`canova`、`laughs`）維持英文；日本本土大型公營場館維持日本正統片假名與新字體（如 `横浜アリーナ`、`大阪城ホール`）。
4. **CI 測試管線 100% 原生名覆蓋防護（Gate）**：
   - 在 `pnpm test:pipeline` 與 `pnpm test:invariants` 中建立自動化斷言：全庫所有演出使用之場館，**一手原生名（`native`）覆蓋率必須達 100%**。
5. **場館詳情大票（VenueSlip）聖地巡禮增強**：
   - 標題副標列：若當前語系呈現名稱與該場館一手原生名（`native`）不同，在大標題下方顯示原生名對照（如英文版顯示 `Native: 横浜アリーナ`）。
   - 外部導航一手化：點擊「Google Maps」與「LiveFans」按鈕時，查詢參數全面採用一手原生名（`native`），保證海外導航與日方資料庫 100% 精準命中。
6. **URL 路由跨語系寬容解析（Postel's Law: 寬進嚴出）**：
   - **輸入寬容**：深層連結解析器（`parseRoute` / `useArchiveRoute`）接受 `canonical`、`native` 或任何語系的正名（例如點擊 `#/venue/横浜アリーナ` 或 `#/venue/Yokohama Arena` 皆能精準直達橫濱Arena票根）。
   - **輸出嚴格**：系統生成之分享網址統一採用權威標準鍵（`#/venue/:canonicalName?lang=:locale`），確保跨語言轉傳唯一性與向下相容。

## Consequences
- 徹底終結海外歌迷在非中文介面被迫閱讀台灣繁體中文字樣的長年視覺倒錯。
- 339 處場館全部具備經文獻考證之一手原生名與結構化主檔，並受 CI 覆蓋率硬門檻守護。
- 海外歌迷前往日本聖地巡禮時，可直接在 `VenueSlip` 取得精準的日文原生名稱與 Google Maps / LiveFans 導航。
- 海外社群分享之日文/英文深層連結 100% 寬容解析直達，全站無效連結率降為零。
- 全站既有 107 項測試全數相容，新增 Suite 19 / Suite Invariants 完整校驗覆蓋。
