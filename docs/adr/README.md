# Official 髭男 dism Setlist 檔案庫 — 架構決策記錄 (ADR)

本目錄收錄專案自創立以來的所有重大架構設計決策（ADR）。每一份決策記錄皆包含背景問題陳述、決策方案與影響驗證，並與 `CONTEXT.md` 同步作為系統領域邏輯之單一真理來源（Single Source of Truth）。

---

## 決策總覽清單（共 66 篇）

| 決策標題 | 狀態 | 日期 |
| :--- | :---: | :---: |
| [分級收錄公開演出，TV 暫不收](0001-graded-archive-scope.md) | 部分已被替代 (Partially Superseded) | TV 演出部分已被 ADR-0045 / ADR-0056 替代（已正式收錄電視演出） |
| [資料用 JSON，網站用 Vite 靜態部署](0002-static-json-vite.md) | 已採納 (Accepted) | - |
| [v1 只做雙向查詢，統計延後](0003-query-first-stats-later.md) | 已採納 (Accepted) | - |
| [同巡演場次以模板加差異存放](0004-template-diff-storage.md) | 已採納 (Accepted) | - |
| [曲目清單不記錄 MC 與 OPENING](0005-drop-mc-markers.md) | 已採納 (Accepted) | - |
| [找歌曲與找場地切換為全域主檔查詢](0006-global-song-query.md) | 已採納 (Accepted) | - |
| [前端架構重構為 React 靜態單頁應用 (SPA)](0007-react-refactor.md) | 已採納 (Accepted) | - |
| [LiveFans 歌單解析、歌曲 ID 對齊與 UI 三行式展現規範](0008-livefans-parsing-and-layout-rules.md) | 已採納 (Accepted) | - |
| [巡演與事件按自足資料單元分檔存放](0009-self-contained-data-units.md) | 已採納 (Accepted) | - |
| [kind 改為特別標籤陣列，新歌以巡演為單位標記](0010-kind-as-tag-array-and-premiere.md) | 已採納 (Accepted) | - |
| [自彈自唱升格為 kind 卡片標籤（SOLO）](0011-solo-as-kind-card.md) | 已採納 (Accepted) | - |
| [相連同 kind 卡片合併為一段渲染（run）](0012-run-merge-of-consecutive-same-kind.md) | 已採納 (Accepted) | - |
| [場館命名改為中文優先](0013-venue-chinese-first.md) | 已採納 (Accepted) | - |
| [單元選擇器按容器分群（巡演／事件），事件排用藤紫](0014-unit-selector-by-container.md) | 已被替代 (Superseded) | 被 ADR-0056（七大演出分類）與 ADR-0067、ADR-0070 替代 |
| [0015 次級分組篩選鈕列（歌曲按專輯、場地按地區、場次按演出類型）](0015-grouped-sub-filter-pill-bars.md) | 已採納 (Accepted) | - |
| [0016 音樂祭彩排試音（Rehearsal）過場標記與專場／事件歸類](0016-soundcheck-interlude-and-event-type-classification.md) | 已採納 (Accepted) | - |
| [0017 單場次 kind 標籤覆寫與前端防護規格](0017-diff-kind-override-and-array-normalization.md) | 已採納 (Accepted) | - |
| [0018 中央場館字典與新場地自動翻譯規範](0018-centralized-venue-dictionary-and-auto-translation.md) | 已採納 (Accepted) | - |
| [0019 場次二級年份過濾與開演時間解析規範](0019-two-level-year-filter-and-opens-at-parsing.md) | 已採納 (Accepted) | - |
| [0020 Diff 還原演算法與被跳過錨點保護規格](0020-diff-resolve-algorithm-fix.md) | 已採納 (Accepted) | - |
| [0021 自動化資料校驗與防錯修復流程規格](0021-automated-data-validation-pipeline.md) | 已採納 (Accepted) | - |
| [0022 跨巡演純 ID 批次匯入與現場 Interlude/副標題解析規格](0022-cross-tour-id-batch-import-and-interlude-parsing.md) | 已採納 (Accepted) | - |
| [0023 未知事件動態 Slug 歸檔與非髭男曲目表示法規範](0023-dynamic-event-slug-import-and-non-higedan-song-formatting.md) | 已採納 (Accepted) | - |
| [0024 中央場館字典單一真理來源與自動反向校正管線](0024-centralized-venue-dictionary-single-source-of-truth.md) | 已採納 (Accepted) | - |
| [25. cmt 註解過濾、點歌標籤自動辨識與共識標籤採樣規範](0025-cmt-parsing-request-tag-and-consensus-kind-rules.md) | Accepted | 2026-09-29 |
| [26. cmt 獨立過場之 DOM 相對依附排序規範](0026-cmt-dom-relative-attachment-sorting.md) | Accepted | 2026-09-29 |
| [27. TV拼盤類型、sl系解析相容與空解析保護](0027-tv-medley-sl-parsing-and-empty-guard.md) | Accepted | 2026-09-29 |
| [28. 同曲異註記的版本差異差異化與 kind 殘餘觸發規則](0028-same-song-version-note-diff.md) | Accepted | 2026-09-29 |
| [29. 單格多 cmt 全收錄、排序次鍵與事件過場過濾修正](0029-multi-cmt-capture-and-rehearsal-normalization.md) | Accepted | 2026-09-29 |
| [30. 安可分隔線語義：標記後全為安可（結構性分隔才傳染）](0030-encore-divider-propagation.md) | Accepted | 2026-09-29 |
| [31. 未知翻唱過場保留曲名：note 合併曲名與現場備註](0031-cover-interlude-keep-title.md) | Accepted | 2026-09-29 |
| [32. 翻唱曲改記無連結正式軌（title 軌，不進主檔）](0032-cover-title-track.md) | Accepted | 2026-09-30 |
| [33. 拼盤頁髭男過濾與未知匯入 TV 判別](0033-higedan-only-festival-filter.md) | Superseded by [0045-five-performance-categories-and-tv-parsing-boundary.md](0045-five-performance-categories-and-tv-parsing-boundary.md) (音樂祭過濾部分) | 2026-09-30 |
| [34. 場館字典稽核修正與同步管線缺口修補](0034-venue-dictionary-audit.md) | Accepted | 2026-09-30 |
| [35. 前端 Hash 深連結：子連結、前後頁與翻唱詳情](0035-hash-deep-links.md) | Accepted | 2026-09-30 |
| [36. Editorial 巡演批量匯入與管線缺口修補](0036-editorial-tour-batch-import.md) | Accepted | 2026-09-30 |
| [37. Editorial 未發表曲建檔與映射刷新](0037-editorial-unreleased-songs.md) | Accepted | 2026-09-30 |
| [38. indie 迷你專輯建檔與分組](0038-indie-mini-album.md) | Accepted | 2026-09-30 |
| [39. ADR 稽核：標記不搬檔與術語缺口修補](0039-adr-audit-cleanup.md) | Accepted | 2026-09-30 |
| [Tailwind v4 取代手寫 CSS（像素級還原＋薄客製層）](0040-tailwind-v4-migration.md) | 已採納 (Accepted) | - |
| [硬零自訂 CSS（ADR-0040 修正案）](0041-hard-zero-tailwind.md) | 已採納 (Accepted) | - |
| [42. 缺播放器索引曲目之模板對位排序規範](0042-missing-idx-template-anchoring.md) | Accepted | 2026-10-01 |
| [43. Cover 軌看內容判定與手排位置鎖定](0043-cover-content-rule-and-locked.md) | Accepted | 2026-10-01 |
| [44. LCS 最長公共子序列對齊與常駐 Smoke 測試](0044-lcs-optimal-diff-alignment-and-smoke-tests.md) | Accepted | 2026-10-01 |
| [45. 五大演出分類體系與電視／音樂祭解析邊界隔離](0045-five-performance-categories-and-tv-parsing-boundary.md) | 部分已被替代 (Partially Superseded) | 分類體系已被 ADR-0056 擴充為七大類；電視與音樂祭解析隔離規範依然有效 |
| [ADR-0046: 單元完整標題保留與按鈕自訂簡稱（shortTitle）覆寫機制](0046-unit-short-title-override.md) | 已採納 (Accepted) | - |
| [ADR-0047: 未收錄本家歌曲匯入警報（Tripwire）與曲庫雙向健康審計](0047-unregistered-song-import-tripwire.md) | 已採納 (Accepted) | - |
| [ADR-0048: 同年同節目事件邊界劃分與 Slug 碰撞日期消歧義](0048-event-granularity-and-slug-collision-disambiguation.md) | 已採納 (Accepted) | - |
| [ADR-0049: 全域分組檢索下拉選單（Global Categorized Search Dropdown）與穿透跳轉](0049-global-categorized-search-dropdown.md) | 已採納 (Accepted) | - |
| [ADR-0050: 跨年份巡演單一容器歸屬與連續組曲解析傳導規範](0050-cross-year-tour-unification-and-medley-propagation.md) | 已採納 (Accepted) | - |
| [ADR-0051: 未發行曲目《明け方のゲッタウェイ》建檔與純日文活動 Slug 防禦規範](0051-unreleased-song-akegata-no-getaway-and-pure-japanese-event-slugs.md) | 已採納 (Accepted) | - |
| [ADR-0052: one-man tour 2019 巡演建檔與 1049544 仙台場 Scrambled DOM 曲序校準鎖定](0052-one-man-tour-2019-import-and-scrambled-dom-calibration.md) | 已採納 (Accepted) | - |
| [ADR-0053: 聯合專場（Two-Man Live）系列活動聚合與腳本變數作用域修復](0053-joint-live-series-exemption-and-two-man-live-2019.md) | 已採納 (Accepted) | - |
| [ADR-0054: 跨年份巡演 Slug 生成防拆機制、巡演目錄導向與 one-man tour 18/19 建模](0054-cross-year-tour-slug-and-container-routing.md) | 已採納 (Accepted) | - |
| [ADR-0055: 非本家翻唱曲目與未發行作品庫邊界規範](0055-cover-songs-title-track-boundary.md) | 已採納 (Accepted) | - |
| [ADR-0056: 七大演出類型分類體系與學園祭／特別專場正規化規範](0056-seven-category-performance-taxonomy.md) | 已採納 (Accepted) | - |
| [ADR-0057: 巡演容器升格判定與 setlist 冗餘屬性清除機制](0057-tour-container-promotion-and-setlist-purge.md) | 已採納 (Accepted) | - |
| [ADR-0058: 純樂團名稱事件標題回退為樂團名加日期規範](0058-bare-artist-event-title-fallback-to-band-and-date.md) | 已採納 (Accepted) | - |
| [ADR-0059: 整輪巡演固定翻唱曲目納入共識模板規範](0059-tour-wide-fixed-cover-in-template-setlist.md) | 已採納 (Accepted) | - |
| [ADR-0060: 翻唱曲純文字呈現與 #/title/ 路由退役規範](0060-cover-songs-plain-text-display-and-title-route-retirement.md) | 已採納 (Accepted) | - |
| [ADR-0061: 無歌單場次隱藏模式與存根事件架構 (Hidden No-Setlist Mode and Stub Event Architecture)](0061-hidden-no-setlist-mode-and-stub-event-support.md) | 已採納 (Accepted) | - |
| [ADR-0062: 歌曲演出列表雙層分類與單元群組化架構 (Two-Layer Song Shows Categorization and Unit Grouping Architecture)](0062-two-layer-song-shows-categorization-and-unit-grouping.md) | 已採納 (Accepted) | - |
| [ADR-0066: 歌曲類型篩選按鈕平均分配、歌曲場次計數修正與場地列表 UI/UX 優化](0066-song-category-buttons-and-venue-ui-ux-optimization.md) | 已採納 (Accepted) | - |
| [ADR-0067: 精準對齊 Official 髭男 dism 官網 (higedan.com) 設計色系代幣](0067-official-higedan-color-palette-alignment.md) | 已採納 (Accepted) | - |
| [ADR-0070: 初心者友善單欄聚焦自助導航架構 (Beginner-Proof Single-Column Kiosk Architecture)](0070-beginner-proof-single-column-kiosk-architecture.md) | 已採納 (Accepted) | 替代早期 UI 草案 (ADR-0063~0069) |
| [ADR-0071: 合作單曲分類維度、聯合專場曲目收錄邊界與早期未發行曲庫擴充](0071-collaboration-single-taxonomy-and-joint-live-filtering.md) | 已採納 (Accepted) | - |
| [ADR-0072: 早期地下未發行曲庫擴充、Billy Joel 翻唱判定與場館命名標準化](0072-underground-unreleased-songs-billy-joel-covers-and-venue-normalization.md) | 已採納 (Accepted) | - |
| [ADR-0073: 早期地下專場系列命名統一、未發表曲庫擴充與 2013 松江場次校準](0073-early-underground-live-taxonomy-and-tonight-series-unification.md) | 已採納 (Accepted) | - |
| [ADR-0074: 未發行歌曲連續段落合併渲染規範 (Unreleased Song Run-Merge Architecture)](0074-unreleased-song-run-merge.md) | 已採納 (Accepted) | 部分推翻 ADR-0012 |
| [ADR-0075: 演出年份膠囊場數標籤與分類動態統計 (Year Selector Show Count Badge and Category Scoped Accounting)](0075-year-selector-show-count-badge.md) | 已採納 (Accepted) | 增強 ADR-0070 第二層導航 |
| [ADR-0076: 中央場館字典全量審計與地理資訊正名標準化 (Central Venue Dictionary Audit and Geographical Normalization)](0076-venue-and-geography-dictionary-full-audit-and-normalization.md) | 已採納 (Accepted) | 強化 ADR-0013 / ADR-0034 |
| [ADR-0077: 演出來源動態標籤識別與多渠道一手史料呈現 (Dynamic Provenance Source Labeling for X and Multi-Source Archives)](0077-dynamic-provenance-source-labeling-for-x-and-external-sources.md) | 已採納 (Accepted) | 擴充 ADR-0002 / ADR-0010 |
| [ADR-0078: 八大演出類型分類體系與店家活動（インストアイベント）收錄規範](0078-eight-category-performance-taxonomy-and-instore-events.md) | 已採納 (Accepted) | 擴充 ADR-0056，七大升級至八大分類 |




