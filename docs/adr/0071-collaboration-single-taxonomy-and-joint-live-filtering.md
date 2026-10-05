# ADR-0071: 合作單曲分類維度、聯合專場曲目收錄邊界與早期未發行曲庫擴充

## Status
Accepted

## Context

1. **合作單曲（Collaboration Singles）的分類與主檔定位**：
   - 2015 年 2 月 11 日，Official 髭男 dism 與山根萬理奈（山根万理奈）共同聯名發行了雙 A 面實體/數位合作單曲《恋の最chu! / 不器用な二人で》：
     - 第一首《恋の最chu!》（LiveFans ID: `936712`，山根萬理奈作詞作曲、共同演唱演奏）。
     - 第二首《不器用な二人で》（LiveFans ID: `329560`，藤原聰作詞作曲、共同演唱演奏）。
   - 原系統的專輯分組桶（`ALBUM_MAP` / `ALBUM_ORDER`）僅設有 8 張原創專輯、`EP / 單曲` 與 `未發行曲目`：
     - 若將《恋の最chu!》與《不器用な二人で》混入 `EP / 單曲`，會模糊「樂團本家單曲」與「雙掛名外部聯名合作單曲」的產權與發行形式邊界。
     - 若將《恋の最chu!》視為翻唱（title 軌），則否定了該作品在官方音源與串流上作為「山根万理奈 & Official髭男dism」正式聯名發行之事實。
   - 使用者明確要求在全站「發行專輯」維度中，獨立擴充 **「合作單曲」** 分類。

2. **雙團聯合專場（2MAN Live / 對バン）的曲目收錄邊界**：
   - 在 2014 年 12 月 21 日於松江 AZTiC canova 舉行的雙團聯合專場（LiveFans 396502，`yamane-marina-official-higedandism-2014.json`）中，LiveFans 原始頁面登記了 20 首曲目：
     - M1 ~ M8：山根萬理奈個人獨唱段落（《君を好きになったんだろう》、《blue》、《Hahaha!Happy birthday》、《おやすみnight》、《蒼き日々》、《手紙》、《wonder》、《歌ってhappy!》）。
     - M9 ~ M18：Official 髭男 dism 完整樂團演出段落（10 首）。
     - M19 ~ M20：安可雙方同台共演段落（《恋の最chu!》、《不器用な二人で》）。
   - 過去對於對バン演出之邊界未有明確防護準則，若全數收錄他團曲目會引入大量與髭男無關之純標題曲目雜訊，干擾驗證器與統計；但若過濾過頭，又會誤殺雙方同台合奏之安可共演曲。

3. **早期地下獨立時期（2014～2015）未發表曲庫入庫**：
   - 髭男於 2014～2015 年在島根松江 AZTiC canova、米子 AZTiC laughs、松江學園 Teddy's 等地現場演出過多首未正式音源化的珍貴原創曲（如《ふりだす雨、ゴキゲンな君》、《朝になれば》、《Joanna》、《桜の涙》、《トライアングルを回せ》、《ごみ箱彼女》、《テディの心情描写》等）。
   - 過去文件（ADR-0037、ADR-0051）僅記錄了主流時期的未發行曲（如《明け方のゲッタウェイ》、《風船》等），缺乏對地下時期曲庫與 LiveFans 歌曲 ID 的統整規範。

---

## Decision

1. **新增「合作單曲」專輯分組維度**：
   - 在 `site/src/lib/constants.js` 的 `ALBUM_ORDER` 中，於 `"EP / 單曲"` 與 `"未發行曲目"` 之間正式增列 **`"合作單曲"`**，成為全站第 11 個發行維度：
     ```javascript
     export const ALBUM_ORDER = [
       "Rejoice (2024)",
       "Editorial (2021)",
       "Traveler (2019)",
       "エスカパレード (2018)",
       "Report (2017)",
       "What's Going On? (2016)",
       "MAN IN THE MIRROR (2016)",
       "ラブとピースは君の中 (2015)",
       "EP / 單曲",
       "合作單曲",
       "未發行曲目",
     ];
     ```
   - 在 `ALBUM_MAP` 中明確將聯名單曲曲目指向 `"合作單曲"`：
     ```javascript
     "koi-no-saichu": "合作單曲",
     "bukiyou-na-futari-de": "合作單曲",
     ```
   - 前端首頁與歌曲列表「2. 選擇發行專輯」篩選吧，將動態呈現 `[ 合作單曲 (2) ]` 按鈕，點擊後精準聚焦合作單曲作品。

2. **建立雙團 / 聯合專場歌單收錄邊界準則**：
   - **對手樂團純單獨演出曲目**：一律從場次 `setlist` 中捨去，不予收錄，杜絕非髭男原創曲目的純文字軌雜訊進入檔案庫。
   - **Official 髭男 dism 演出段落**：完整收錄其本篇全部曲目（具備 `songId`）。
   - **同台合奏安可 / 共演曲目（Joint Encore Tracks）**：
     - 若為官方共同聯名發行作品（如《恋の最chu!》、《不器用な二人で》），於 `songs.json` 正式建檔並以 `songId` 關聯，備註記錄 `w/ [合作音樂人]`（如 `note: "w/ 山根万理奈"`）。
     - 若為翻唱或他團原有曲目之同台共演，依 ADR-0032 規範以 `title: "曲名 [原唱歌手]"` 記錄，備註同台資訊。
     - 安可標記依 ADR-0030 嚴格設置 `encore: true`。

3. **早期地下原創未發表曲正式建檔規範**：
   - 凡於地下時期演唱會演出、經確認為 Official 髭男 dism 原創但未收錄於正式 CD/串流之曲目，於 `data/songs.json` 賦予標準語意 `id`，綁定 LiveFans 專屬歌曲編號，並標註 `"unreleased": true`：
     - `furidasu-ame-gokigen-na-kimi`（ふりだす雨、ゴキゲンな君，LiveFans: 329563）
     - `asa-ni-nareba`（朝になれば，LiveFans: 329565）
     - `joanna`（Joanna，LiveFans: 329561）
     - `sakura-no-namida`（桜の涙，LiveFans: 329562）
     - `triangle-wo-mawase`（トライアングルを回せ，LiveFans: 329567）
     - `gomibako-kanojo`（ごみ箱彼女，LiveFans: 329574）
     - `teddy-heart-drawing`（テディの心情描写，LiveFans: 936250）
   - 此類曲目於前端自動聚合於「未發行曲目」專輯分組，並在歌曲卡片標註 `UNRELEASED` 徽章。

---

## Consequences

- **分類維度精確**: 解決了雙掛名合作作品無法適當歸類的痛點，清晰呈現 Official 髭男 dism 早期的跨團合作歷程。
- **聯合專場歌單純淨**: 剔除對手樂團無關曲目，同時保留最具歷史價值的同台合奏安可曲目。
- **早期足跡完整**: 完整收錄 2014～2015 年未發表曲與 LiveFans 歌曲主檔映射，使早期松江與巡演歌單驗證達到 100% 覆蓋率，且通過 `validate-data.mjs` 零警告。
