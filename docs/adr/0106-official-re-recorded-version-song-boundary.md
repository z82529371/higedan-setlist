# ADR-0106: 官方正式商業發行重編版本之獨立歌曲邊界判定準則（Official Re-recorded Version Song Entity Boundary）

## Status
Accepted

## Context
1. **歌曲邊界與版本差異的歷史規則**：
   在早期架構與 `CONTEXT.md` 中，定義「歌曲」為全域共用的原曲主檔身份，不因改編或短版而分開，並在專輯歸屬條款中明訂「不隨後續再收錄或版本名（如 Rejoice ver.）搬家；避免版本名另立歌曲」。所有現場改編、彈唱演繹均由現場曲目（`ShowItem`）之 `diff.insert` 與 `note` 差異承擔（ADR-0028）。
2. **官方商業發行音源事實**：
   2022 年 1 月 7 日，官方發行數位單曲《Anarchy》（電影《信用詐欺師JP：英雄篇》主題曲）。2024 年 7 月 24 日發行之第三張主流完整原創專輯《Rejoice》第 10 軌，官方 Tracklist 獨立命名為《Anarchy (Rejoice ver.)》，不僅曲名具備版本標註，且樂團進錄音室進行了全管樂重新錄製與實質大幅重新編曲。
3. **巡演共識模板（`templateSetlist`）語意失真**：
   在《Arena Tour 2024 - Rejoice -》（10 場）及《Asia Tour 2024 - Rejoice -》（3 場）中，樂團實際演出的共識曲目皆為《Anarchy (Rejoice ver.)》。先前因資料庫僅有單一 `anarchy` 歌曲，導致巡演模板誤記為 `anarchy`，全巡演 13 場演出被迫每場都產生一筆人工差異（`skip: [16]` 加上 `insert: { songId: "anarchy", note: "Rejoice ver." }`），嚴重違背了巡演模板共識去重的核心初衷。

## Decision
1. **確立「嚴格官方商業發行主義」歌曲邊界**：
   - 僅限官方於商業發行物（實體 CD / 數位串流之專輯、EP、單曲）之正式 Tracklist 具備帶版本名稱之獨立曲名、且實質重新錄音／編曲者（如《Anarchy (Rejoice ver.)》之於《Anarchy》），方可在 `data/songs.json` 建立獨立歌曲實體。
   - 純現場演出發生之改編（如 Blooming Universe アレンジ、自彈自唱、現場加長版等），無獨立商業音源曲目者，一律嚴格維持以現場曲目 `diff.insert` 之 `note` 差異記錄，嚴禁任意拆立歌曲主檔。
2. **歌曲主檔與專輯歸屬分立**：
   - `anarchy`：正名為《Anarchy》，`livefansId: "702214"`，專輯歸屬回歸 **`"EP / 單曲"`** 桶（2022 年數位單曲）。
   - `anarchy-rejoice-ver`：曲名《Anarchy (Rejoice ver.)》，`livefansId: "702214"`，專輯歸屬指派為 **`"Rejoice (2024)"`** 桶。
3. **巡演模板與歷史演出紀錄對齊**：
   - 《Arena Tour 2024 - Rejoice -》與《Asia Tour 2024 - Rejoice -》之 `templateSetlist` 修正為 `songId: "anarchy-rejoice-ver"`，清除全體 13 場演出冗餘的 `skip` 與 `insert` 差異。
   - 2024-07-23 Zepp Haneda 發片前夕專場（`data/events/unofficial-2024.json`）曲序 16 修正為 `songId: "anarchy-rejoice-ver"`，清除 redundant note。
   - 2025–2026 年（FOUR-RE:ISM、2026 巡演）演出原曲《Anarchy》時，歌迷在 LiveFans 留下的對比備註「通常ver.」屬於冗餘修飾，予以清除對齊模板。
4. **領域模型更新**：
   - 同步修正 `CONTEXT.md` 之「歌曲」與「專輯歸屬」條款，明確界定官方商業發行重編版本之立歌判準與豁免條件。

## Consequences
- 完美契合日本官方實體 CD 與數位串流一手 Tracklist 表記事實，與國際權威音樂資料庫及歌單站保持語意對齊。
- 消除 Rejoice 系列巡演全部 13 場虛擬 `diff`，共識模板恢復 100% 純淨度。
- 透過「商業正式發行曲名」作為客觀可檢驗之門檻，杜絕現場改編版本無限分裂的實體膨脹風險。
- 既有 57 項領域不變量與端對端測試全數通過（57 tests, 13 suites pass）。
