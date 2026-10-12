# ADR-0097: 演出時間領域模型與開場開演雙時制對齊決策 (Performance Time Domain Model and Dual-Time Alignment)

## 狀態
已採納 (Accepted)

## 脈絡 (Context)
在補完 Official HIGE DANdism 2015–2017 早期商場活動、電台公開錄音與單曲發行 Instore Mini Live 的珍貴歷史資料時，深入考證了場次的演出時間（`opensAt` 開場時間、`startsAt` 開演時間）。

經對全站 541 個歷史場次進行資料盤點發現：
1. **資料欄位現況**：
   - 同時具備 `opensAt` 與 `startsAt`：10 場（主要為早期一日常態劃分 1部/2部、雙時間完備的活動）。
   - 僅有單一時間欄位（歷史爬蟲均寫入 `opensAt`）：320 場（大量巡演如 2019 Hall Travelers、One-Man Tour 等，記錄的 18:00 或 19:00 實質上為**開演時間 (Start Time)**）。
   - 僅有 `startsAt`：4 場。
   - 兩者皆無（無留存記錄之校園祭或未定活動）：207 場。
2. **前端顯示分歧與歷史 Bug**：
   - 票券元件 `ShowSlip` 先前寫為 `{s.opensAt && \` ${s.opensAt} 開場\`}`，導致 320 場主流巡演（如 18:00 開演）被誤導為「18:00 開場」。
   - 場館票券 `VenueSlip` 與紀念卡片 `MemorialCardModal` 先前寫為 `{show.opensAt && \` · \${show.opensAt} 開演\`}`，與 `ShowSlip` 語義衝突。
   - 歌單複製純文字（`handleCopySetlist`）先前寫為 `（開演：\${s.opensAt}）`。

使用者透過 `/grill-with-docs` 詢問：「open at 和 start at 是都會顯示在網頁上嗎？」並在多方考量後拍板選用：
- **方案 A（領域模型統一雙時制對齊）**：建立統一核心函式 `formatShowTime(show)`，在全站所有組件與輸出端保持完全一致的展示原則。

## 決定 (Decision)

1. **領域層核心時間格式化函式 (`site/src/lib/domain.js`)**：
   新增並匯出 `formatShowTime(show)`，規則如下：
   - **雙時間皆具備**（`opensAt` 且 `startsAt`）：格式化為 `${opensAt} 開場 / ${startsAt} 開演`。
   - **僅單一時間**（僅 `startsAt` 或歷史單一欄位 `opensAt`）：格式化為 `${startsAt || opensAt} 開演`（修正將 18:00/19:00 開演誤報為開場的歷史瑕疵）。
   - **無時間**（兩者皆無）：回傳 `null`。

2. **跨組件視圖端全面對齊**：
   - **`ShowSlip.jsx`**：主場次票券標題時間改用 `formatShowTime(s)`，雙時間時清晰呈現開場與開演。
   - **`VenueSlip.jsx`**：場館票券下近期場次改用 `formatShowTime(show)`。
   - **`MemorialCardModal.jsx`**：紀念卡片預覽標題與其「複製卡片純文字」均調用 `formatShowTime(show)`。
   - **Setlist 剪貼簿複製 (`handleCopySetlist`)**：同步改為 `【演出時間】\${formatShowTime(s)}`。

3. **資料驗證與排序對齊 (`site/scripts/validate-data.mjs`)**：
   - 同日多場次排序比對優先採用 `(a.startsAt || a.opensAt || "")`，確保開演早者排在前。
   - 白名單支援早期電台公開錄音缺漏歌單之客觀佔位符 `（曲目未詳）` 與 `（曲目不明）`，並在票券介面以柔和次要字色呈現。

## 後果 (Consequences)
- **正面效益**：
  - 徹底解決 320 場巡演將開演時間錯標為「開場」的事實誤導問題。
  - 當主辦單位釋出完整「開場 / 開演」雙時間時（如 13:30 開場 / 14:00 開演），UI 完整顯示無遺漏。
  - 全站 4 處時間呈現點（場次票券、場館近期演出、紀念卡片、純文字複製）100% 遵從同一領域模型。
- **維護指南**：
  - 未來錄入新場次時，若官方同時公佈開場與開演時間，請同時填寫 `opensAt` 與 `startsAt`；若僅有一項，則填寫 `startsAt`（或歷史慣例 `opensAt`）。
