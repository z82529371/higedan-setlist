# ADR-0072: 早期地下未發行曲庫擴充、Billy Joel 翻唱判定與場館命名標準化

## Status
Accepted

## Context

1. **早期地下未發行曲 vs 翻唱之考證與定位**：
   - 2014 年 Official 髭男 dism 於島根松江 Pianoman 的專場與特別演出中（LiveFans 1916986 與 1916984），曲目清單中出現多首未見於主流發行物的歌曲：
     - 《土星とスピカ》（LiveFans ID: `936253`）
     - 《歌えもしない歌》（LiveFans ID: `936256`）
     - 《ダッフルコートの甘い夢》（LiveFans ID: `936252`）
     - 《君と過ごせる夏なら》（LiveFans ID: `936254`）
     - 《New York State Of Mind》
     - 《Uptown Girl》
   - 經考證：
     - 《土星とスピカ》、《歌えもしない歌》、《ダッフルコートの甘い夢》、《君と過ごせる夏なら》皆在 LiveFans 上登記為 Official 髭男 dism 之獨立曲目 ID，為樂團早期自創且未曾音源化之珍貴地下原創曲，應比照《ふりだす雨、ゴキゲンな君》與《ごみ箱彼女》，正式在 `data/songs.json` 建檔，標註 `unreleased: true`。
     - 《New York State Of Mind》（1976 年發表）與《Uptown Girl》（1983 年發表）為美國歌手 Billy Joel 之世界知名經典名曲，此處為藤原聰及髭男的翻唱。依據 ADR-0032、ADR-0055、ADR-0060 之翻唱規範，不建立歌曲主檔，而以曲目標題軌 `"title": "New York State Of Mind [Billy Joel]"` 及 `"title": "Uptown Girl [Billy Joel]"` 收錄。

2. **場館名稱與字典標準化（ADR-0013, ADR-0024, ADR-0034）**：
   - 音樂祭 MINAMI WHEEL 2014（LiveFans 378995）在原始爬蟲中帶入之場館為 `CONPASS at MINAMI WHEEL 2014会場`。此類將「活動名/會場」贅詞與實體 Livehouse 名稱混雜者，違反場館字典單一真相原則。
   - 實體 Livehouse 應統一標準化為 `CONPASS`（位於大阪市中央區東心齋橋，大阪府關西地區）。
   - 特別專場場館 `松江Pianoman`（位於島根縣松江市，中國地區）亦同步納入場館字典。

3. **事件檔名與識別碼去泛用化（ADR-0048, ADR-0051）**：
   - 原暫存檔名 `unofficial-2014.json` 與 `unofficial-2014-0612.json` 採泛用年號命名，未能反映演出的實體特質且易致檔名衝突。
   - 依據演出性質與既有專場命名慣例（如 `acoustic-one-man-matsue-teddys-2015.json`、`matsue-canova-2015-0313.json`），分別更名為：
     - `acoustic-one-man-matsue-pianoman-2014.json`（ID: `acoustic-one-man-matsue-pianoman-2014`，shortTitle: `アコースティックワンマン 松江`）
     - `matsue-pianoman-2014-0612.json`（ID: `matsue-pianoman-2014-0612`，shortTitle: `2014.06.12`）

---

## Decision

1. **擴充 `data/songs.json` 未發行曲庫**：
   - 新增 4 首地下時期原創曲：
     - `dosei-to-spica`: 《土星とスピカ》（LiveFans ID: 936253）
     - `utaemoshinai-uta`: 《歌えもしない歌》（LiveFans ID: 936256）
     - `duffle-coat-no-amai-yume`: 《ダッフルコートの甘い夢》（LiveFans ID: 936252）
     - `kimi-to-sugoseru-natsu-nara`: 《君と過ごせる夏なら》（LiveFans ID: 936254）
   - 前端發行專輯維度自動依 `unreleased: true` 歸入「未發行曲目」。

2. **翻唱曲記錄格式收斂**：
   - 《New York State Of Mind》記錄為 `"title": "New York State Of Mind [Billy Joel]"`
   - 《Uptown Girl》記錄為 `"title": "Uptown Girl [Billy Joel]"`

3. **場館字典與檔名標準化**：
   - `data/venues.json` 新增 `CONPASS` 與 `松江Pianoman`，並將 `CONPASS at MINAMI WHEEL 2014会場` 映射正規化。
   - 清除泛用 `unofficial-2014*.json`，改用精準語意檔名。

4. **場次曲目次序校正**：
   - `minami-wheel-2014.json`: M6 校正為《ごみ箱彼女》（`gomibako-kanojo`）。
   - `acoustic-one-man-matsue-pianoman-2014.json`:
     M1 夏模様の猫、M2 パレード、M3 SWEET TWEET、M4 始発が導く幸福論、M5 土星とスピカ、M6 ダーリン。、M7 歌えもしない歌、M8 ダッフルコートの甘い夢、M9 君と過ごせる夏なら、M10 夕暮れ沿い、M11 愛なんだが…、M12 ごみ箱彼女、EN1(M13) ふりだす雨、ゴキゲンな君、EN2(M14) Uptown Girl [Billy Joel]。
   - `matsue-pianoman-2014-0612.json`:
     M1 愛なんだが…、M2 New York State Of Mind [Billy Joel]、M3 土星とスピカ、M4 始発が導く幸福論、M5 ふりだす雨、ゴキゲンな君。

---

## Consequences

- 補齊了 Official 髭男 dism 2014 年早期在島根松江時期的原創曲庫，使未發行曲目能參與全站歌曲搜尋、雙向場次關聯與發行專輯維度。
- 資料校驗管線（`validate-data.mjs`、`sync-data.mjs`、`smoke-test.mjs`）與 Vite build 均 100% 通過。
