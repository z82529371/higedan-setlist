# 巡演與事件按自足資料單元分檔存放

資料層不再有集中的 tours.json 與 shows.json，改以「自足單元」為檔案單位：每個巡演一個 `data/tours/<id>.json`，內含 title、type、templateBasis、templateSetlist 與它自己的全部場次；每個非巡演場合（音樂祭、對バン、單發專場）一個 `data/events/<id>.json`，內含 title、type 與場次，每場 setlist 全文內嵌（不帶 order 錨點）。`data/songs.json` 維持全域單檔不拆。

各場次原本的 tour 與 templateId 欄位（後者從未被任何程式讀過）全數移除，巡演歸屬由所在檔案決定；type 上移單元層。效果：資料檔案本身就是主檔，改動巡演歸屬＝搬檔案，不會產生孿生欄位不同步的錯誤；音樂祭／對バン來時直接加一個 events 檔案，不需新結構。

網站於建置期以 Vite import.meta.glob 載入全部單元後自行攤平，場次曲目解析只在「取 items」處分支：巡演走模板＋diff、事件直接回 show.setlist。單元排序與導向列順序由單元最早場次日期推得（最新在前）而非手排。

本決定取代 ADR 0004 中「巡演在 tours.json 獨立存放一份模板曲目清單」的存放載體（模板＋diff 的機制不變）。