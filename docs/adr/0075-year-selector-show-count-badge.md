# ADR-0075: 演出年份膠囊場數標籤與分類動態統計 (Year Selector Show Count Badge and Category Scoped Accounting)

* **狀態**：已採納 (Accepted)
* **日期**：2026-10-06
* **影響層面**：首頁自助導航器 (`site/src/App.jsx`)、使用者體驗 (UX)、ADR-0070 第二層年份膠囊增強

---

## 背景與動機

在 [ADR-0070: 初心者友善單欄聚焦自助導航架構](0070-beginner-proof-single-column-kiosk-architecture.md) 中，首頁導入了「四層平鋪折行膠囊導航（分類 → 年份 → 活動 → 場次）」。其中第一層演出分類已標註該分類下的總場數（如 `[ 巡演專場 (150場) ] [ 音樂祭 (32場) ]`），然而第二層演出年份膠囊僅展示裸年份（如 `[ 2024 ] [ 2023 ]`）。

使用者在檢視時提出需求：「在年份旁也顯示場數」，以利直觀掌握各年度在該演出型態下的活躍度與場次規模（例如哪一年為密集巡演期、哪一年僅有零星特別場次）。

---

## 決策與架構規範

### 1. 統計維度與範疇（Category-Scoped Accounting）
年份膠囊旁顯示之場數，嚴格採納當前選中分類（`selCategory`）之範疇統計：
- 於 `site/src/App.jsx` 中建立 `yearStats` 映射表，僅累加當前分類下各單元（`unit`）之 `shows.length`。
- **嚴謹性保證**：該分類下所有年份之場數總和，精確等於第一層分類膠囊上之總場數（例如「巡演專場 (150場)」下，各年份場數加總即為 150 場），維持分類樹狀導航之一致性與單一真理。

### 2. 呈現格式與視覺代幣對齊
- **格式規範**：`{yr} ({count}場)`（例如 `2024 (15場)`）。
- **字型與樣式**：延續第一層膠囊之設計語彙，採用官網風格等寬字型與半透明副文字：
  ```jsx
  <span>{yr}</span>
  <span className="text-[11px] opacity-75 tabular-nums">
    ({count}場)
  </span>
  ```
  兼具數字對齊美感與視覺輕量化，不搶走主要年份文字的焦點。

### 3. 跨年份巡演歸屬（Cross-Year Tour Accounting）
- 依循 [ADR-0050](0050-cross-year-tour-unification-and-medley-propagation.md) 與 [ADR-0054](0054-cross-year-tour-slug-and-container-routing.md) 之單一容器原則，跨年份巡演（如《Tour 19/20 Hall Travelers》全 29 場）統一歸屬於巡演首場開始之年份（`unitEarliest`，即 2019 年）。
- 點選該年份時，第三步活動膠囊即直出該跨年份巡演，進入後完整檢視橫跨跨年度的所有場次，確保導航與計數之因果關聯完全一致。
