# ADR-0098: 歷史缺漏歌單佔位曲目規範與雙維度審查索引架構 (Placeholder Track Specification and Dual Missing Data Audit Architecture)

## 狀態
已採納 (Accepted)

## 脈絡 (Context)
在深入考證 Official HIGE DANdism 2012–2018 早期地下時期、商場 Free Live、廣播公開錄音與校園祭歷史演出時，經常面臨文獻記錄不完整的挑戰：
1. **非連續曲序缺漏（Fragmented Track Numbering）**：例如日本歌迷部落格或參與者記下「01 love love love … 05 恋の前ならえ」，中間第 2、3、4 首曲目未標或遺漏。若直接壓扁曲序將第 5 首改寫為第 2 首，將徹底破壞演出時長與現場曲目位置的客觀真實性；若只記載於 note 備註，則遺失結構化曲序。
2. **缺乏全域缺漏追蹤清單**：全站 541 場演出中，有大量早期歷史場次缺少曲目或演出時間，考證過程若缺乏全局清單，容易零散盲目。

因此，需要在領域模型與資料管線中確立「佔位曲目（Placeholder Track）」的正規標準，並建立雙維度審查索引文件。

## 決定 (Decision)

1. **佔位曲目領域模型 (Placeholder Track Model)**：
   - 當文獻明確記載非連續曲序時，缺漏之序號使用 `title: "（曲目未詳）"` 或 `title: "（曲目不明）"` 填補。
   - 佔位曲目不綁定 `songId`，純以客觀文字軌佔位，確保後續曲目序號（如 M5）忠實反映當日演出順序。

2. **校驗腳本白名單豁免 (`site/scripts/validate-data.mjs`)**：
   - 擴充 `suspiciousTitleTracks` 白名單，包含 `未詳` 與 `不明`，避免將合理的歷史佔位曲目誤報為「未建檔歌曲」或格式錯誤。

3. **前端票券視覺弱化呈現 (`site/src/components/slips.jsx`)**：
   - 在場次票券（`ShowSlip`）中，偵測到曲名包含 `未詳` 或 `不明` 時，自動應用次要弱化字色樣式（`text-muted/70 italic font-mono`），與確認的原創曲或翻唱曲形成清晰辨識層次。

4. **歌曲履歷與統計指標隔離 (`site/src/lib/domain.js`)**：
   - 全站有效歌曲統計、歌曲演出履歷（`Track Shows Map`）與全域搜尋索引自動排除佔位曲目，絕不將「未詳」當作樂團已發表的正式曲目。

5. **雙維度缺漏審查索引架構 (Dual Missing Data Audit Architecture)**：
   - 在專案 [`docs/reports/`](file:///C:/Users/User/髭男%20演唱會/docs/reports) 落地兩份全域歷史追蹤文件（單一事實來源）：
     - **[`docs/reports/missing-setlists.md`](file:///C:/Users/User/髭男%20演唱會/docs/reports/missing-setlists.md)**：列出全庫曲目完全空白（Stub 0 首）或僅具佔位符（全場皆未詳）之重度缺漏場次，標註年份與性質。
     - **[`docs/reports/missing-times.md`](file:///C:/Users/User/髭男%20演唱會/docs/reports/missing-times.md)**：列出全庫開場（opensAt）與開演（startsAt）時間皆缺之雙缺場次。只要具備開演或登場時間即不列為缺失。
   - 納入常態工程管線：由 [`site/scripts/generate-audit-reports.mjs`](file:///C:/Users/User/髭男%20演唱會/site/scripts/generate-audit-reports.mjs) 模組化實作，並原生串接於 `pnpm sync`（`site/scripts/sync-data.mjs`）管線尾端。每次歷史資料庫增修變更時自動重算最新年份分佈與排序清單，杜絕文檔與資料脫節。

## 後果 (Consequences)
- **正面效益**：
  - 徹底解決早期殘缺紀錄「若壓扁則失真、若不記則斷層」的資料建模兩難。
  - 確立了歷史考證的客觀嚴謹性，未來任何維護者皆可一目了然得知哪些曲目是「確認演出但曲名待考」。
  - 建立了系統性的缺漏追蹤索引，大幅加速後續考古補完的效率。
- **維護約束**：
  - 嚴禁將「完全未記錄歌單」的整場演出塞滿佔位符；整場皆無歌單者維持 `setlist: []` 空陣列 Stub，佔位符僅用於「已知部分曲序」之破片還原。
