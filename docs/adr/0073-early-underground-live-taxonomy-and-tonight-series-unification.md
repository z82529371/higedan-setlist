# ADR-0073: 早期地下專場系列命名統一、未發表曲庫擴充與 2013 松江場次校準

## Status
Accepted

## Context

1. **地下獨立時期原創曲庫考證（《週末、酔のfunkism》、《小春日和》、《うたえもしないうた》）**：
   - 2014 年 3 月 7 日於松江 AZTiC canova 舉行的《今夜は髭Tonight! vol.2 ～Official髭男dism ワンマンライブ～》（LiveFans 1916335，`tonight-vol-2-official-dism-2014.json`）中，曲目包含三首未建立 `songId` 的文字軌：
     - 《うたえもしないうた》（LiveFans ID: `936251`）
     - 《週末、酔のfunkism》（LiveFans ID: `936248`）
     - 《小春日和》（LiveFans ID: `936249`）
   - 經考證：
     - 《週末、酔のfunkism》與《小春日和》在 LiveFans 均獨立掛於 Official髭男dism 名下，為樂團早期在島根松江創作、尚未音源化的珍貴原創曲，非翻唱。應正式於 `data/songs.json` 建檔（`unreleased: true`）。
     - 《うたえもしないうた》為已建檔曲目《歌えもしない歌》（LiveFans ID `936256`，`utaemoshinai-uta`）的早期平假名標記版本，兩者為同一原創曲，應直接指向 `songId: "utaemoshinai-uta"`。

2. **自主企劃系列單元命名標準化（今夜は髭Tonight! 與 赤壁の髭湯会）**：
   - 原 `unofficial-2013-0322.json` 實際演出標題為《今夜は髭とぅないと》，即樂團自主企劃「今夜は髭Tonight!」的第一彈（Vol.1）。冠以泛用 `unofficial-*` 違反 ADR-0048 與 ADR-0051。
   - 原 `unofficial-2013.json` 實際演出標題為《赤壁の髭湯会》，為與 2015 年《赤壁の髭湯会 vol.2》（`sekiheki-no-higeyukai-vol-2-2015.json`）相對應之第一回專場。
   - 米子系列聯合專場《neverl∀nd》存在 `never-l-nd-vol-2-2013.json` 與 `neverl-nd-2014.json` 之連字號命名分歧。
   - 原 `unofficial-2012.json` 缺少月日後綴（2012-11-10），具碰撞隱患。

3. **2013-11-17 松江B1 專場歌序與《ねえ、ダーリン。》歸屬**：
   - 2013 年 11 月 17 日於松江 B1 舉辦之專場（LiveFans 1916954）：
     - 歌序需校正為：M1 為《ふりだす雨、ゴキゲンな君》、M2 為《夕暮れ沿い》、M3 為《愛なんだが…》、M4 為《Sweet Tweet》、M5 為《ごみ箱彼女》、EN1 為安可曲。
     - 安可曲《ねえ、ダーリン。》（LiveFans `936247`）：經歌詞對照，為《ダーリン。》（2015 年正式收錄於《ラブとピースは君の中》）未正式發表前的開頭歌詞（「ねえ、ダーリン。 どこへ行こうか」）。依 CONTEXT.md「全域共用的原曲主檔身份，不因改編或後續改名發行為條件」原則，以 `songId: "darin"` 正式歸屬。

---

## Decision

1. **擴充 `data/songs.json` 未發行曲庫**：
   - 新增 `shuumatsu-yoi-no-funkism`（週末、酔のfunkism，LiveFans: 936248，`unreleased: true`）。
   - 新增 `koharubiyori`（小春日和，LiveFans: 936249，`unreleased: true`）。
   - 新增 `nee-darin`（ねえ、ダーリン。，LiveFans: 936247，`unreleased: true`）。
   - `tonight-vol-2-official-dism-2014.json` 校準歌序（17 首）並全數關聯正規 `songId`（包含 `utaemoshinai-uta`, `shuumatsu-yoi-no-funkism`, `koharubiyori`）。

2. **自主企劃與聯合專場檔案重構**：
   - `unofficial-2013-0322.json` ➡️ **`tonight-vol-1-official-dism-2013.json`**（ID: `tonight-vol-1-official-dism-2013`，shortTitle: `今夜は髭Tonight! vol.1`）。
   - `unofficial-2013.json` ➡️ **`sekiheki-no-higeyukai-2013.json`**（ID: `sekiheki-no-higeyukai-2013`，shortTitle: `赤壁の髭湯会`）。
   - `never-l-nd-vol-2-2013.json` ➡️ **`neverland-vol-2-2013.json`**（ID: `neverland-vol-2-2013`）。
   - `neverl-nd-2014.json` ➡️ **`neverland-2014.json`**（ID: `neverland-2014`）。
   - `unofficial-2012.json` ➡️ **`unofficial-2012-1110.json`**（ID: `unofficial-2012-1110`）。

3. **2013-11-17 松江B1 專場正規化**：
   - 更名為 **`matsue-b1-2013-1117.json`**（ID: `matsue-b1-2013-1117`，shortTitle: `2013.11.17`）。
   - 校正歌序：
     - M1: `furidasu-ame-gokigen-na-kimi`
     - M2: `yugure-zoi`
     - M3: `ai-nandaga`
     - M4: `sweet-tweet`
     - M5: `gomibako-kanojo`
     - EN1 (M6): `nee-darin`（encore: true）

---

## Consequences

- 全面消除了 2012～2014 早期島根時期存根與專場的命名碰撞及語意含糊問題。
- 「今夜は髭Tonight!」三部曲（Vol.1 2013、Vol.2 2014、Vol.3 2015）與「赤壁の髭湯会」（2013、2015 Vol.2）達成命名體系完整一致。
- 早期地下曲庫獲得完整追蹤，`validate-data.mjs` 達到 0 warnings / 0 errors。
