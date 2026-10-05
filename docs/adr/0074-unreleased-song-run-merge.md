# ADR-0074: 未發行歌曲連續段落合併渲染規範 (Unreleased Song Run-Merge Architecture)

* **狀態**：已採納 (Accepted)
* **日期**：2026-10-06
* **影響層面**：歌單呈現層 (`site/src/components/slips.jsx`)、早期地下演出歌單視覺體驗、ADR-0012 部分推翻

---

## 背景與動機

在早期 [ADR-0012](0012-run-merge-of-consecutive-same-kind.md) 制定連續卡片合併渲染（Run-Merge）機制時，主要針對主流時期（2019–2024）巡演之 `satoshi-solo`（自彈自唱段落）與 `request`（即興點歌段落）。在當時的主流巡演中，未發行歌曲（unreleased）極為罕見，通常僅是在新曲發行前夕於安可單點首演一首，因此 ADR-0012 當初明確寫道：
> *「interlude（過場，無 songId）與 unreleased（由歌曲資料推得，非 kind）不參與合併。」*

然而，隨著早期地下獨立時期（2012–2015 Indies Era）完整演出曲目（如《今夜は髭とぅないと vol.2》、《松江B1 2013-11-17》等）的建檔與校準，樂團在主流出道以前的自主專場中，經常連續演出多達 3 至 7 首尚未實體發表之原創名曲（例如：週末、酔のfunkism → 小春日和 → テディの心情描写 → うたえもしないうた → ダッフルコートの甘い夢 → 土星とスピカ → 君と過ごせる夏なら）。

若未發行歌曲無法參與 run-merge，歌單畫面將連續堆疊 7 個外觀相同、各自懸掛「UNRELEASED」黃色標籤條的獨立紙籤卡片，導致畫面垂直節奏極度破碎且充斥重複的標籤雜訊。

---

## 決策與架構規範

### 1. 段落分組鍵（Run Key）升級
修改 `site/src/components/slips.jsx` 中 `runKey` 的計算邏輯，將原本限定 `k.length > 0`（僅顯式 `item.kind` 陣列）的限制推翻，改以各曲計算後的卡片主類型 `primaryOf(i)` 與完整標籤清單 `cardTabs(i)` 作為分組鍵：

```javascript
const runKey = (i) => {
  if (!i.songId) return null;
  const prim = primaryOf(i);
  if (!prim) return null;
  const tabs = cardTabs(i);
  return `${prim}::${tabs.join(",")}`;
};
```

### 2. 嚴格維持核心資料與呈現原則
- **多首合併單一卡片**：當連續演出曲目之主類型皆為 `unreleased` 且無其他干擾標籤時，其 `runKey` 皆為 `"unreleased::unreleased"`，前端會自動聚合成單一 UNRELEASED 紙籤卡片包裹。
- **逐行與獨立 Cue 號**：合併卡片內部維持逐行列出各曲，每曲保留其獨立之演出順序序號（如 M4、M5、M6...），絕不採用範圍縮寫（如 M4–M10），完整保留曲序與備註資訊（遵循 ADR-0012 既定規範）。
- **向下相容與單首獨立性**：單首未發行歌曲（如安可中僅演出一首）維持既有的單張紙籤卡片，不造成視覺回歸。
- **標籤異質自動切段**：若連續未發行曲目中某一首帶有額外標籤（如同時標記 `satoshi-solo`），其 `cardTabs` 衍生為 `["unreleased", "satoshi-solo"]`，因 key 不同而自動切段，維持標籤語意的純粹性。

---

## 驗證成果

1. 於《今夜は髭とぅないと vol.2》（2014-03-02）中，M4 至 M10 共 7 首連續未發行原創曲，由原先 7 張破碎卡片成功整合成 1 張整潔大氣的 UNRELEASED 紙籤區塊。
2. 全站資料校驗腳本 `validate-data.mjs`、同步腳本 `sync-data.mjs`、管道冒煙測試 `smoke-test.mjs` 與 Vite 生產環境建置均以 0 error 0 warning 通過。
