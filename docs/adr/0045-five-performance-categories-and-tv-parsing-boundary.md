# 45. 五大演出分類體系與電視／音樂祭解析邊界隔離

* Status: Accepted
* Date: 2026-10-02
* Supersedes: [0033-higedan-only-festival-filter.md](0033-higedan-only-festival-filter.md) (音樂祭過濾部分)
* Related: [0015-grouped-sub-filter-pill-bars.md](0015-grouped-sub-filter-pill-bars.md), [0016-soundcheck-interlude-and-event-type-classification.md](0016-soundcheck-interlude-and-event-type-classification.md), [0032-cover-title-track.md](0032-cover-title-track.md), [0043-cover-content-rule-and-locked.md](0043-cover-content-rule-and-locked.md)

## Context & Problem Statement

1. **演出類別擴展與 UI 佈局**：全站演出場合隨收錄豐富度提升，原本粗糙的巡演／事件分類已無法滿足檢索需求。演出跨及專場巡演、樂團對邦（聯合專場）、音樂節（音樂祭）、電視特輯（TV 拼盤）與官方網路/廣播現場（線上直播）。
2. **電視演出與音樂祭解析邊界混淆（ADR-0033 缺陷）**：
   - ADR-0033 原本將 `unit.type === "音樂祭"` 與 `TV拼盤` 一同開啟 `extractSongsFromHtml(html, { higedanOnly: true })`。
   - **實證衝突**：LiveFans 上電視節目（THE MUSIC DAY、紅白、FNS、CDTV 等）刊載全天數十組藝人節目表，單元格內含 `<span>Official髭男dism</span>` 標籤，必須過濾；但**音樂祭頁面（Summer Sonic、Rock in Japan、1Chance 等）是樂團專屬子頁面，完全沒有 `<span>` 藝人標籤**。對音樂祭開啟 `higedanOnly` 會抓出 0 首歌曲，導致整場 10 首歌被虛假判定為全部 `skip`。
3. **場次標題地域後綴噪音**：常規場次標題附加 `{城市}`（如 `SUMMER SONIC 2025 千葉`），但電視轉播與線上直播為無地域邊界之全國/全球放送，附加城市名或 LiveFans 尾端帶有之 `＠ 日本テレビ (東京都)` 攝影棚雜訊會造成標題冗長且不符語意。
4. **未登錄新事件映射漏洞**：`batch-import.mjs` 在自動建立未註冊新事件時，曾使用手動 `.map` 分支，造成非原唱項目（含過場/MC）被無差別填入 `item.title`，破壞了過場不得帶 `title` 的不變量，引發前端重複渲染標題與誤配序號（如 Road to 仮 N2）。

## Decisions

1. **確立五大演出分類體系與兩行式次級篩選**：
   - 演出場合統一歸屬為五大類型：`巡演專場`、`聯合專場`、`音樂祭`、`電視演出`（相容 `TV拼盤`）、`線上直播`。
   - 「專場」為唯一跨容器類型（巡演專場必在 `tours/`，實體單發專場在 `events/`）；其餘四類必屬 `events/`。
   - 前端場次次級篩選列強制固定為兩行結構：第一行為五大分類按鈕（順序固定），第二行為開始年份。

2. **電視演出雙重識別與純淨標題規則**：
   - **雙重自動識別**：特輯標題關鍵字（THE MUSIC DAY、紅白、FNS、CDTV、Mステ、Venue101、SONGS、バズリズム等）＋場館電視台/攝影棚名（日本テレビ、TBS、フジテレビ、テレビ朝日、テレビ東京、NHKスタジオ 等）自動識別為 `"電視演出"`。
   - **標題雜訊過濾與純淨標題**：
     - 解析標題時過濾尾端 `＠ 日本テレビ (東京都)` 等電視台攝影棚雜訊。
     - 電視演出與線上直播場次之 `title` **嚴禁附加城市後綴**（維持如 `THE MUSIC DAY 音楽は止まらない`、`Editorial 発売記念 ONLINE FREE LIVE`）。

3. **過濾邊界解耦（更正 ADR-0033）**：
   - `higedanOnly: true` **嚴格限縮於 `電視演出`（及 `TV拼盤`）**。
   - 音樂祭、巡演專場、聯合專場與線上直播嚴禁開啟 `higedanOnly`。

4. **新舊事件映射管道單一真實來源化**：
   - 不論是更新既有事件或自動匯入未登錄新事件，統一透過 [`mapPageSongsToEventSetlist`](../site/scripts/lib/consensus.js) 產出 setlist。
   - 嚴格守護過場不變量：`type === "interlude"` 項目僅保留 `note`，**絕不填入 `title` 或 `songId`**，確保前端保持 `cue: null` 且不產生重複文字。

## Consequences

* 音樂祭場次（如 Summer Sonic 2025）正常抓取完整曲目，不再發生整場誤判全 skip 的假差異。
* 電視節目（如 THE MUSIC DAY 2021、FNS、音樂之日）精確保留髭男演出段落，排除上百首他團歌曲與節目表過場。
* 電視與線上直播場次標題簡潔專業，不帶多餘的地域與攝影棚雜訊。
* 全庫徹底消除過場帶 `title` 的髒資料，曲目卡片序號與渲染行為 100% 吻合設計規範。
