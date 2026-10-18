# ADR-0110: 官方場館正名在地化與多語雙向呈現架構（Official Venue Localization & Cross-Lingual Presentation）

## Status
Accepted

## Context
1. **多語系介面下之一手場館視覺割裂與日文新字體痛點**：
   在 [`ADR-0108`](0108-administrative-geography-localization-and-venue-integrity.md) 中，系統成功實裝城市與都道府縣之四語系在地化。然而，為防範民間自創翻譯侵蝕領域模型，ADR-0108 全面凍結了場館名稱（`venue`）的翻譯。
   這導致了兩大體驗痛點：
   - **海外歌迷認知斷層**：海外知名場館（如 `台北小巨蛋` 在官方英文巡演文宣中名為 `Taipei Arena`、韓國 `KSPO DOME (奧林匹克體操競技場)`）在切換至英文版或韓文版時仍強制顯示中文，無法發音或辨識。
   - **日本原生場館之繁體中文化倒錯**：底層資料庫 [`data/venues.json`](../../data/venues.json) 歷史上以繁體中文建立，日本本土場館被記為繁體字（如 `橫濱Arena`、`愛媛縣縣民文化會館`、`廣島文化學園 HBG會館`、`國立代代木競技場 第一體育館`）。當日本歌迷切換至日本語（`ja`）介面時，看到的反而是一手文獻中不存在的台灣繁體字。
2. **正名（Official Localized Name）與民間翻譯之嚴格邊界**：
   若不釐清「官方正名」的成立要件，任意英文化或機器翻譯會嚴重破壞歷史文獻真實度。必須建立與 [`ADR-0105`](0105-song-canonical-titles-and-alias-system.md) 歌曲別名體系同等嚴格的客觀判定標準：**僅當場館營運機構官方註冊外文名、或巡演主辦一手外文官方文宣正式載明時，方屬「官方正名」；查無官方正名之小型 Livehouse 絕不硬翻**。
3. **儲存層與狀態機穩定性不變量（Decoupled Storage & URL Invariants）**：
   全庫 422+ 筆場次歷史資料、資料校驗管線與 URL 雙向 Hash（[`ADR-0101`](0101-frontend-modularization-and-component-hierarchy.md) 之 `#/venue/:name`）必須維持權威標準鍵（Canonical Key），避免跨國分享連結失效或引發破壞性重構。

## Decision
1. **確立「官方正名在地化」與「原生一手名回退」之呈現層級**：
   - **直接替換呈現（Direct UI Replacement）**：全站所有介面元件（`VenueNavigator`、`ShowMetadataBox`、`TourSlip`、`VenueSlip`、`SongSlip`、`SongMilestonesDrawer`、`MemorialCardModal`）在該語系具備官方正名時，全面直接替換為官方正名。
   - **優雅安全回退（Graceful Fallback Invariant）**：全庫中小型 Livehouse（如 `松江 canova`、`米子 laughs`）若在該語系無官方正名，**100% 安全回退場館原生一手名**，系統接納清單中客觀的「部分正名、部分原文」混合狀態，嚴禁機器翻譯或民間拼音。
2. **各語系正名歸位規範**：
   - **日本語（`ja`）**：
     - 日本在地場館：全面還原為日本本土官方一手新字體與假名（如 `横浜アリーナ`、`愛媛県県民文化会館`、`広島文化学園HBGホール`、`国立代々木競技場 第一体育館`）。
     - 海外場館：採日方一手巡演官方公告正名（如 `台北小巨蛋` 呈現為 `台北アリーナ`）。
   - **English（`en`）**：
     - 具備官方註冊或主辦文宣英名之大型體育館、巨蛋、會館及海外場地，採用正式英文正名（如 `Taipei Arena`、`Yokohama Arena`、`Nippon Budokan`、`Osaka-Jo Hall`、`Saitama Super Arena`、`KSPO DOME`、`The Star Theatre`、`UOB LIVE` 等）；無英文正名之小型場地回退日文原文。
   - **한국어（`ko`）**：
     - 韓國在地場館採官方韓文名（如 `KSPO DOME (올림픽체조경기장)`）；具備官方巡演正名之海外大型場館呈現韓文名（如 `타이베이 아레나`、`요코하마 아레나`、`일본 무도관`、`오사카성 홀`）；其餘小型場地回退原生名。
   - **繁體中文（`zh-TW`）**：
     - 維持現有繁體中文標準正名（如 `台北小巨蛋`、`橫濱Arena`、`日本武道館`）。
3. **儲存層與 URL 路由解耦（Decoupled SSOT & Route Stability）**：
   - 底層 [`data/venues.json`](../../data/venues.json) 與歷史場次 JSON 結構維持不可變，以繁體中文標準標籤作為單一真理來源（SSOT）。
   - URL 路由 Hash `#/venue/:name` 統一使用標準識別碼（如 `#/venue/台北小巨蛋?lang=en`），確保跨語系分享無死連結。
   - 在地化純粹於展示層驅動，獨立抽離模組 [`site/src/lib/locales/venues.js`](../../site/src/lib/locales/venues.js)，導出 `localizeVenue(rawVenue, locale)` 與 `matchVenue(needle, rawVenue)` 純函式，並透過 `useI18n()` 注入全站 Context。
4. **全域搜尋多語雙向無障礙檢索（Cross-Lingual Venue Indexing）**：
   - 全域搜尋框（`SearchBox`）同時索引該場館的底層真理鍵及所有語系之官方正名。使用者鍵入 `Taipei Arena`、`台北アリーナ` 或 `台北小巨蛋`，皆能即時在場館候選與演出候選清單中命中同一場館。
5. **紀念票卡長圖與歌單純文字匯出一致性**：
   - 紀念票卡長圖（`MemorialCardModal`）與票根複製文字管線（`buildVenueHistoryText`、`buildSongHistoryText`、`formatShowVenueCity`）同步輸出當前語系之官方正名，確保海外社群分享之視覺一致性。

## Consequences
- 徹底解決了海外歌迷在巡演日程、場館票根中的語言障礙，並消除了日語使用者面對繁體字日本場館的長年視覺倒錯。
- 嚴格守護「非官方正名絕不硬翻」的文獻存真邊界，兼顧國際化體驗與一手文獻嚴謹性。
- 底層資料庫與 URL 狀態機保持零破壞性變更，歷史書籤與社群分享 100% 穩定。
- 新增 Suite 18 端對端驗證，全站 107 項測試在 11 秒內全數通過，Static Build 極速完成。
