# 33. 拼盤頁髭男過濾與未知匯入 TV 判別

* Status: Superseded by [0045-five-performance-categories-and-tv-parsing-boundary.md](0045-five-performance-categories-and-tv-parsing-boundary.md) (音樂祭過濾部分)
* Date: 2026-09-30

> **音樂祭過濾 Superseded by 0045**：實證確認 LiveFans 音樂祭頁面為樂團專屬頁面且無 `<span>` 藝人標籤，開過濾會誤判全 skip；`higedanOnly` 已嚴格限縮於電視演出。

## Context & Problem Statement

`nhk-kohaku-2022` 的 `1490967`（紅白）：LiveFans 單頁刊載全出演者 66 曲，
解析器照單全收，存檔塞入 60+ 他團 `title` 軌與節目表過場，並連帶兩起誤判：
NiziU「CLAP CLAP」經曲名映射誤植為我方 `songId: clap-clap`；
AI「ハート」備註「[メドレー] 弾き語り」誤標 `kind: satoshi-solo`。
紅白 66 曲中髭男僅 `Subtitle` 1 首。

## Decisions

1. **類型驅動過濾**：`unit.type` 為 `TV拼盤` 或 `音樂祭` 時，
   `extractSongsFromHtml(html, { higedanOnly: true })` 只收藝人標註含髭男之歌曲格；
   他團歌曲與節目表過場全捨。巡演（專場）與對バン不動（對バン需留對方曲）。
2. **未知匯入補 TV 判別**：`detectedType` 新增 `TV拼盤`（紅白/歌合戦/CDTV/Mステ/
   ミュージックステーション/FNS歌謡祭/音楽の日/テレ東音楽祭/うたコン），
   否則 CDTV 類掉進預設專場重蹈污染；判別提前至解析前以決定過濾旗。
3. 誤映射與誤標不另修：過濾後非髭男格根本不進映射，兩起誤判連帶消除；
   專場頁皆髭男，曲名映射維持現狀。

## Consequences

* 該場重建為單曲 `{songId: subtitle, note: 101スタジオ}`；`validate-data` 通過。
* 全量重跑時同類拼盤場一併收斂為髭男段落；`CONTEXT.md` TV拼盤條目由「完整收錄」改為「僅收髭男段落」。
