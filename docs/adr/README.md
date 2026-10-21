# Official 髭男 dism Setlist 檔案庫 — 架構決策記錄 (ADR)

本目錄收錄專案自創立以來的所有重大架構設計決策（ADR）。每一份決策記錄皆包含背景問題陳述、決策方案與影響驗證，並與 `CONTEXT.md` 同步作為系統領域邏輯之單一真理來源（Single Source of Truth）。

---

## 決策總覽清單（共 97 篇）

> [!NOTE]
> **編號跳號說明**：本目錄編號自 ADR-0001 起至 ADR-0113 止。其中 ADR-0063、ADR-0064、ADR-0065、ADR-0068、ADR-0069 共 5 篇為早期介面排版草案，後續已被 ADR-0070 單欄聚焦架構完整吸收與替代，故無獨立保留歷史檔案；實體決策文件共計 97 篇。

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
| [31. 未知翻唱過場保留曲名：note 合併曲名與現場備註](0031-cover-interlude-keep-title.md) | 已廢止 (Superseded by [ADR-0032](0032-cover-title-track.md)) | 2026-09-29 |
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
| [45. 五大演出分類體系與電視／音樂祭解析邊界隔離](0045-five-performance-categories-and-tv-parsing-boundary.md) | 部分已被替代 (Partially Superseded) | 分類體系已被 ADR-0056/ADR-0078 擴充為八大類；電視與音樂祭解析隔離規範依然有效 |
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
| [ADR-0056: 七大演出類型分類體系與學園祭／特別專場正規化規範](0056-seven-category-performance-taxonomy.md) | 部分已被替代 (Partially Superseded) | 分類體系已被 ADR-0078 擴充為八大分類（新增店家活動） |
| [ADR-0057: 巡演容器升格判定與 setlist 冗餘屬性清除機制](0057-tour-container-promotion-and-setlist-purge.md) | 已採納 (Accepted) | - |
| [ADR-0058: 純樂團名稱事件標題回退為樂團名加日期規範](0058-bare-artist-event-title-fallback-to-band-and-date.md) | 已採納 (Accepted) | - |
| [ADR-0059: 整輪巡演固定翻唱曲目納入共識模板規範](0059-tour-wide-fixed-cover-in-template-setlist.md) | 已採納 (Accepted) | - |
| [ADR-0060: 翻唱曲純文字呈現與 #/title/ 路由退役規範](0060-cover-songs-plain-text-display-and-title-route-retirement.md) | 已採納 (Accepted) | - |
| [ADR-0061: 無歌單場次隱藏模式與存根事件架構 (Hidden No-Setlist Mode and Stub Event Architecture)](0061-hidden-no-setlist-mode-and-stub-event-support.md) | 已採納 (Accepted) | - |
| [ADR-0062: 歌曲演出列表雙層分類與單元群組化架構 (Two-Layer Song Shows Categorization and Unit Grouping Architecture)](0062-two-layer-song-shows-categorization-and-unit-grouping.md) | 已採納 (Accepted) | - |
| [ADR-0066: 歌曲類型篩選按鈕平均分配、歌曲場次計數修正與場地列表 UI/UX 優化](0066-song-category-buttons-and-venue-ui-ux-optimization.md) | 已採納 (Accepted) | - |
| [ADR-0067: 精準對齊 Official 髭男 dism 官網 (higedan.com) 設計色系代幣](0067-official-higedan-color-palette-alignment.md) | 已採納 (Accepted) | - |
| [ADR-0070: 初心者友善單欄聚焦自助導航架構 (Beginner-Proof Single-Column Kiosk Architecture)](0070-beginner-proof-single-column-kiosk-architecture.md) | 已採納 (Accepted) | 替代早期 UI 草案 (ADR-0063~0065, ADR-0068~0069) |
| [ADR-0071: 合作單曲分類維度、聯合專場曲目收錄邊界與早期未發行曲庫擴充](0071-collaboration-single-taxonomy-and-joint-live-filtering.md) | 已採納 (Accepted) | - |
| [ADR-0072: 早期地下未發行曲庫擴充、Billy Joel 翻唱判定與場館命名標準化](0072-underground-unreleased-songs-billy-joel-covers-and-venue-normalization.md) | 已採納 (Accepted) | - |
| [ADR-0073: 早期地下專場系列命名統一、未發表曲庫擴充與 2013 松江場次校準](0073-early-underground-live-taxonomy-and-tonight-series-unification.md) | 已採納 (Accepted) | - |
| [ADR-0074: 未發行歌曲連續段落合併渲染規範 (Unreleased Song Run-Merge Architecture)](0074-unreleased-song-run-merge.md) | 已採納 (Accepted) | 部分推翻 ADR-0012 |
| [ADR-0075: 演出年份膠囊場數標籤與分類動態統計 (Year Selector Show Count Badge and Category Scoped Accounting)](0075-year-selector-show-count-badge.md) | 已採納 (Accepted) | 增強 ADR-0070 第二層導航 |
| [ADR-0076: 中央場館字典全量審計與地理資訊正名標準化 (Central Venue Dictionary Audit and Geographical Normalization)](0076-venue-and-geography-dictionary-full-audit-and-normalization.md) | 已採納 (Accepted) | 強化 ADR-0013 / ADR-0034 |
| [ADR-0077: 演出來源動態標籤識別與多渠道一手史料呈現 (Dynamic Provenance Source Labeling for X and Multi-Source Archives)](0077-dynamic-provenance-source-labeling-for-x-and-external-sources.md) | 已採納 (Accepted) | 擴充 ADR-0002 / ADR-0010 |
| [ADR-0078: 八大演出類型分類體系與店家活動（インストアイベント）收錄規範](0078-eight-category-performance-taxonomy-and-instore-events.md) | 已採納 (Accepted) | 擴充 ADR-0056，七大升級至八大分類 |
| [ADR-0079: 官方網站一手公告來源全量回填與巡演來源繼承規範 (Official Website News Provenance and Tour Inheritance Architecture)](0079-official-website-news-provenance-and-tour-inheritance.md) | 已採納 (Accepted) | 擴充 ADR-0077 多來源史料架構 |
| [ADR-0080: 現場舞台單據與巡演紀念小卡領域分工暨三主題體系 (Stage Run Sheet Slip and Memorial Setlist Card Architecture)](0080-stage-run-sheet-slip-and-memorial-card-modal.md) | 已採納 (Accepted) | 網頁母單純白與小卡三主題解耦、曲目行徽章純淨化 |
| [ADR-0081: 全站正名、官方翹鬍子品牌識別與頂部 Micro-Hero 數據引導架構 (Brand Identity Normalization and Micro-Hero Architecture)](0081-brand-identity-normalization-and-micro-hero-architecture.md) | 已採納 (Accepted) | 拔除亞洲巡演舊標籤、全站正名、官方翹鬍子 Favicon 向量鏈、Header 去煽情化與 Micro-Hero 數據膠囊列 |
| [ADR-0082: 行動端浮動導航抽屜、雙向喚起與全站 RWD 人體工學架構 (Mobile-First Bottom Sheet Navigation and RWD Architecture)](0082-mobile-first-bottom-sheet-navigation-and-rwd-architecture.md) | 已採納 (Accepted) | 解決窄螢幕四階導航壓迫、iOS Safari 防縮放、工具列分流與拇指友善巡演步進器 |
| [ADR-0083: 場地票券演出類型分流標籤列與雙票券體驗一致性規範 (VenueSlip Category Filter Tabs and Slip Consistency)](0083-venue-category-filter-tabs-and-slip-consistency.md) | 已採納 (Accepted) | 場地票券新增動態演出類型分流標籤，與歌曲票券達成 100% 心智模型與架構對稱 |
| [ADR-0084: 多階導航折疊手風琴與單據實用工具集成架構 (Collapsible Multi-Tier Navigators and Slip Utilities)](0084-collapsible-navigators-and-slip-utilities.md) | 已採納 (Accepted) | 解決多階導航佔據視窗高度問題，整合對比與分析工具抽屜 |
| [ADR-0085: 行動端獨立雙操作 FAB 塢與聚光燈搜尋架構 (Mobile Dual Action Dock and Spotlight Search)](0085-mobile-dual-action-dock-and-spotlight-search.md) | 已採納 (Accepted) | 分離搜尋與篩選按鈕，建立滿版串流聚光燈搜尋體驗 |
| [ADR-0086: 日系溫潤紙質色盤與全景網點背景架構 (Warm Paper Palette and Dot Grid Background Architecture)](0086-warm-paper-palette-and-dot-grid-background.md) | 部分已被替代 (Partially Superseded) | 暖米紙色盤保留；網點背景已被 ADR-0091（5mm 方眼手帳格線）替代 |
| [ADR-0087: 頂部全寬吸頂動態狀態列架構 (Top Full-Width Sticky Dynamic Status Bar Architecture)](0087-top-full-width-sticky-status-bar.md) | 已採納 (Accepted) | 頂部黃條全寬置頂吸附，動態響應場次／歌曲／場地切換並支援點擊回跳 |
| [ADR-0088: 實體演唱會門票擬物工藝：不透明封箱膠帶、雙側撕票缺口與典藏條碼 (Authentic Concert Ticket Notches, Opaque Gaffer Tape, and Vintage Barcode)](0088-authentic-ticket-notches-and-opaque-tape.md) | 部分已被替代 (Partially Superseded) | 撕票缺口與條碼底欄保留；膠帶部分已被 ADR-0089（手撕和紙膠帶）替代 |
| [ADR-0089: 日系手撕和紙膠帶、微縮防偽線與實體票券雙色結構工藝 (Serrated Washi Tape, Microprint Security Stripe, and Two-Tone Ticket Stub Architecture)](0089-washi-tape-and-concert-stub-craftsmanship.md) | 已採納 (Accepted) | 膠帶升級齒刀鋸齒邊與微消光纖維，新增雙色票根分界與微縮文字安全帶 |
| [ADR-0090: 日系典藏手感紙質有機微紋理與控台聚光微光架構 (Tactile Archival Paper Grain and Soundboard Lamp Ambient Spotlight Architecture)](0090-tactile-archival-paper-and-ambient-spotlight.md) | 已採納 (Accepted) | 導入有機紙漿微粒與檯燈柔光聚光暈 |
| [ADR-0091: 日系 5mm 方眼手帳筆記本與檯燈聚光背景架構 (Japanese 5mm Graph Notebook and Desk Lamp Ambient Glow Architecture)](0091-japanese-graph-notebook-background.md) | 已採納 (Accepted) | 滿版鋪設 20px 方眼手帳格線與檯燈柔光，完美契合紙膠帶票券剪貼本隱喻 |
| [ADR-0092: 暖米白原色卡紙全面替代純白與零刺眼白底決策 (Warm Ivory Cardstock and Zero Pure White Architecture)](0092-warm-ivory-cardstock-and-zero-pure-white.md) | 已廢止 (Superseded) | 前景卡色已被 ADR-0094（柔暖牛奶白 #f8f7f4）替代 |
| [ADR-0093: 日系手帳同色卡紙純粹化與背景格線層級隔離架構 (Unified Notebook Cardstock and Background Stacking Context Architecture)](0093-unified-notebook-cardstock-and-stacking-context.md) | 部分已被替代 (Partially Superseded) | 背景格線層級隔離保留；卡色已被 ADR-0094（柔暖牛奶白 #f8f7f4）替代 |
| [ADR-0094: 日系柔暖牛奶白卡紙與實體對比階梯決策 (Soft Milk White Cardstock and Physical Contrast Hierarchy Architecture)](0094-soft-milk-white-cardstock-and-contrast-hierarchy.md) | 已採納 (Accepted) | 鎖定 #f8f7f4 柔暖牛奶白，杜絕 #ffffff 死白刺眼眩光，建立清晰實體票券紙張對比階梯 |
| [ADR-0095: 純淨聚光燈首頁門面與雙模檔案庫檢索架構 (Spotlight Minimalist Landing Page and Dual-Mode Architecture)](0095-spotlight-minimalist-landing-page-and-dual-mode-architecture.md) | 已採納 (Accepted) | 建立純淨留白之聚光燈首頁門面，結合雙模切換、深層連結穿透與緊湊檔案庫 AppBar |
| [ADR-0096: 日期智能檢索、日曆懸浮視窗與日期有場次受限交互規範 (Date Search and Calendar Modal Architecture)](0096-date-search-and-calendar-modal-architecture.md) | 已採納 (Accepted) | 支援多種日期格式全域搜尋直達場次，並提供有場次才可點選的專屬演出日曆懸浮視窗 |
| [ADR-0097: 演出時間領域模型與開場開演雙時制對齊決策 (Performance Time Domain Model and Dual-Time Alignment)](0097-performance-time-domain-model-and-dual-time-alignment.md) | 已採納 (Accepted) | 統一雙時間與單時間開場開演領域模型（formatShowTime），消弭 320 場歷史單時誤標開場之歧義 |
| [ADR-0098: 歷史缺漏歌單佔位曲目規範與雙維度審查索引架構 (Placeholder Track Specification and Dual Missing Data Audit Architecture)](0098-placeholder-track-specification-and-missing-data-audit-architecture.md) | 已採納 (Accepted) | 確立曲序缺漏以（曲目未詳）客觀佔位保留時序，並建立全庫 155 場缺歌單與 207 場缺時間之審查索引清單 |
| [ADR-0099: 《Joanna》翻唱考證與歌曲主檔邊界校正 (Joanna Cover Attribution and Song Master Boundary Calibration)](0099-joanna-cover-attribution-and-song-master-boundary.md) | 已採納 (Accepted) | 考證藤原聰喜愛 Kool & The Gang 脈絡，將早期《Joanna》由地下原創主檔校正為純文字翻唱軌，貫徹 ADR-0055 邊界 |
| [ADR-0100: 離屏隔離渲染與真透明圓角圖片匯出架構 (Offscreen Isolated Rendering and True Alpha Rounded Image Export Architecture)](0100-offscreen-rendering-and-true-alpha-rounded-image-export.md) | 已採納 (Accepted) | 建立離屏沙盒深層複製與固定寬度量測機制，消弭行動端小尺寸圖片跑版與底部留白，保留純淨 Alpha 透明圓角 |
| [ADR-0101: 前端巨石檔案模組化與架構分層重構決策 (Frontend Modularization and Component Hierarchy Architecture)](0101-frontend-modularization-and-component-hierarchy.md) | 已採納 (Accepted) | 解耦 slips.jsx 與 App.jsx 兩大巨石檔案，建立 Slips、Navigators、Hooks、Layout 清晰四層架構 |
| [ADR-0102: 巡演總覽領域實體與雙模切換架構 (Tour Summary Slip and Shared Route Architecture)](0102-tour-slip-and-shared-route-architecture.md) | 已採納 (Accepted) | 建立巡演總覽（TourSlip）、四級登場頻率、非模板雙日輪替對稱專區、純淨票券排版與 #/tour/:unitId 雙向路由 |
| [ADR-0103: pnpm Monorepo Workspace 拓撲正規化與 CI 對齊 (pnpm Monorepo Workspace Topology and CI Alignment)](0103-pnpm-workspace-monorepo-topology-and-ci-alignment.md) | 已採納 (Accepted) | 建立根目錄 pnpm-workspace.yaml、整合統一 pnpm-lock.yaml，聲明 packageManager 對齊 GitHub Actions CI 與快取 |
| [ADR-0104: 全域小尺寸觸控認知與墨水壓印架構 (Global Mobile Touch Affordance and Flat Ink Stamp Architecture)](0104-mobile-touch-affordance-and-flat-ink-stamp.md) | 已採納 (Accepted) | 建立全域 .touch-stamp 墨水壓印反饋、漸進式實體暗示與歌名精準熱區防誤觸架構 |
| [ADR-0105: 官方一手歌曲主標題與雙語別名檢索架構 (Song Canonical Titles and Dual-Language Alias System)](0105-song-canonical-titles-and-alias-system.md) | 已採納 (Accepted) | 嚴守日本官方一手原創曲名為不可變主檔，結合官方英文別名索引與副標展示，嚴禁民間自創俗稱 |
| [ADR-0106: 官方正式商業發行重編版本之獨立歌曲邊界判定準則 (Official Re-recorded Version Song Entity Boundary)](0106-official-re-recorded-version-song-boundary.md) | 已採納 (Accepted) | 以官方商業發行 Tracklist 作為獨立歌曲客觀判準，修正 Rejoice ver. 實體並清除巡演模板冗餘虛擬差異 |
| [ADR-0107: 多國語言在地化架構與實體領域邊界 (Multi-Language Localization and Taxonomy Boundary)](0107-multi-language-localization-and-taxonomy-boundary.md) | 已採納 (Accepted) | 建立四語系 UI 與分類層在地化架構、?lang= 路由縫合、票券美學切換器、搜尋框多語索引與實體不可變邊界 |
| [ADR-0108: 行政地名多語在地化與場館一手真實邊界 (Administrative Geography Localization & Venue Integrity Boundary)](0108-administrative-geography-localization-and-venue-integrity.md) | 已採納 (Accepted) | 確立城市與都道府縣四語在地化、全域搜尋跨語檢索，守護場館建築實體一手真理不可變邊界 |
| [ADR-0109: 測試架構抽離、領域模組化與無頭 SSR 單例最佳化 (Modular Test Architecture and Headless SSR Singleton)](0109-modular-test-architecture-and-headless-ssr-singleton.md) | 已採納 (Accepted) | 將 4000 行巨石測試解構為 pipeline、invariants、ui 三層領域模組與 Vite 惰性單例，提供細粒度指令與透明轉發門面 |
| [ADR-0110: 官方場館正名在地化與多語雙向呈現架構 (Official Venue Localization & Cross-Lingual Presentation)](0110-official-venue-localization-and-cross-lingual-presentation.md) | 已採納 (Accepted) | 確立場館官方正名在地化、日本新字體歸位、安全回退原生名、URL 路由解耦與全域搜尋跨語雙向檢索 |
| [ADR-0111: 場館實體主檔、原生名回退鏈與跨語系路由寬容解析架構 (Venue Master Profiles, Native Fallback Chain & Deep Link Resolution)](0111-venue-master-profiles-native-fallback-and-deep-link-resolution.md) | 已採納 (Accepted) | 建立專屬場館領域主檔 venue-profiles.json、一手在地原生名回退鏈與 URL 路由跨語系寬容解析 |
| [ADR-0112: 多語言字體架構、語言專屬字體棧與 CJK 異體字隔離 (Multi-Lingual Typography and Locale-Isolated Font Stacks)](0112-multi-lingual-typography-and-locale-isolated-font-stacks.md) | 已採納 (Accepted) | 建立動態 html lang 同步、CSS :lang() 四語專屬字體棧、擴充 Noto Sans KR 與 Plus Jakarta Sans，杜絕 CJK 異體字污染 |
| [ADR-0113: 個人巡演護照、打卡持久化、動態生涯指標與自製小卡領域架構 (Personal Concert Passport, Attendance Persistence, Dynamic Milestones & Commemorative Card Architecture)](0113-personal-concert-passport-and-commemorative-card-architecture.md) | 已被取代 (Superseded by ADR-0114) | 建立純前端 LocalStorage 持久化、專屬 #/passport 路由、動態生涯里程碑計算與雙模態小卡透明 PNG 匯出管線 |
| [ADR-0114: 巡演票夾領域重構、意象升級與 Passport 概念廢棄架構 (Concert Ticket Book Domain Refactoring, Metaphor Upgrade & Passport Deprecation Architecture)](0114-concert-ticket-book-domain-refactoring-and-passport-deprecation.md) | 已採納 (Accepted) | 徹底廢棄護照出國意象與 #/passport 路由，升級為現場票券收納本（巡演票夾 Ticket Book）、#/tickets 一級路由與自動升級遷移管線 |
| [ADR-0115: 巡演日程就地收錄、首頁四大核心特色與全域票夾動態接觸點架構 (Tour Stop In-Place Check-in, Landing Feature Quartet & Ticket Book Dynamic Touchpoints Architecture)](0115-tour-stop-in-place-check-in-and-landing-quartet-architecture.md) | 已採納 (Accepted) | 確立首頁純淨聚光燈與票夾發現性權衡、四大特色亮點卡、巡演日程就地收進票夾與全域動態徽章接觸點 |
| [ADR-0116: 票夾歌迷身分識別、歌曲解鎖率未發表曲邊界與生涯小卡編年史重構 (Ticket Book Holder Identity, Unreleased Song Coverage Boundary & Career Milestone Chronicle Architecture)](0116-ticket-book-holder-identity-and-milestone-chronicle-architecture.md) | 已採納 (Accepted) | 擴充 holderName 全域身分與雙卡同步、歌曲解鎖率嚴格排除未發表曲、生涯小卡重構為雙行足跡編年史與時間軸空間緊緻化 |
| [ADR-0117: 原子演出日期防折行不變量與生涯里程碑小卡巡演標題精簡架構 (Atomic Show Date Invariant & Milestone Card Short Title Presentation Architecture)](0117-atomic-show-date-invariant-and-milestone-card-short-title-presentation.md) | 已採納 (Accepted) | 確立演出日期 whitespace-nowrap shrink-0 原子防擠下不變量，並將生涯小卡巡演名稱全面改採 shortTitle 精簡呈現 |
| [ADR-0118: 個人巡演票夾雙軌備份、跨裝置轉移與防禦性檢核架構 (Ticket Book Dual-Track Backup, Cross-Device Transfer & Defensive Ingestion Architecture)](0118-ticket-book-dual-track-backup-and-defensive-transfer-architecture.md) | 已採納 (Accepted) | 實作票夾模式 C 雙軌備份與轉移、6 道防禦檢核、本地優先不可篡改原則、孤兒場次寬容保留、變更預覽狀態機與完全去工程黑話介面 |




