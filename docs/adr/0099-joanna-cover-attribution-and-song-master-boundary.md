# ADR-0099: 《Joanna》翻唱考證與歌曲主檔邊界校正

## Status
Accepted

## Context

1. **早期地下曲《Joanna》之原創 vs 翻唱爭議**：
   - 在 2015 年 5 月 29 日於島根松江 AZTiC canova 舉行的《Official髭男dismワン曼ライブ ラブとピースは君の中》（場次 ID: `471261`）中，曲目清單第 6 首出現《Joanna》。
   - 在過去資料中，該曲被登記為獨立原創曲 ID `joanna`（LiveFans ID: `329561`），並列入《CONTEXT.md》地下獨立時期未正式音源化原創曲清單。
   - 經進一步考證與使用者研討分析：
     - Official 髭男 dism 主唱藤原聰深受 1970–1980 年代西洋放克、R&B 與靈魂樂影響，曾於個人電台廣播選播放克大團 Kool & The Gang 之作品。
     - Kool & The Gang 於 1983 年發行之全美告示牌亞軍經典抒情代表作即為《Joanna》，其鋼琴旋律與靈魂樂抒情編制高度符合藤原聰之音樂背景與現場彈唱翻唱偏好。
     - 過去樂團於島根時期亦多次翻唱西洋經典（如 Billy Joel 的《Uptown Girl》、《New York State Of Mind》，詳見 ADR-0072）。
   - 依據 ADR-0055「非本家原創曲目絕對不登錄於歌曲主檔」以及 ADR-0060「翻唱曲一律以純文字軌展示」之架構原則，若歌曲為翻唱作品，絕不可作為 `songId` 保留於 `data/songs.json`。

## Decision

1. **剔除 `data/songs.json` 之主檔**：
   - 移除 `joanna`（LiveFans ID: `329561`），消除非本家原創曲目對全域歌曲統計與檢索之污染。
2. **場次曲目改記純文字翻唱軌**：
   - 在 `data/events/love-to-peace-wa-kimi-no-naka-oneman-2015.json` 中，Order 6 由 `songId: "joanna"` 校正為 `"title": "Joanna [Kool & The Gang]"`。
3. **同步領域模型與本體語彙**：
   - 更新 `CONTEXT.md`，將《Joanna》從未發行原創曲清單中除名，並將 ADR-0099 納入未發行曲目本體演進參考依據。

## Consequences

- **正面影響**：
  - 貫徹 ADR-0055 與 ADR-0060 的純淨本家邊界，避免翻唱曲在歌曲專頁或全域搜尋中生成無效條目。
  - 統一西洋經典翻唱的標示格式（`曲名 [原唱者]`），維持與 Billy Joel、Queen 等翻唱曲目之架構一致性。
- **後續維護**：
  - 若未來樂團官方訪談或一手島根錄音資料揭露其他翻唱來源，直接調整場次 `title` 之原唱標註即可，無需變動 `songs.json` 架構。
