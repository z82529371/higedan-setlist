# ADR-0093: 日系手帳同色卡紙純粹化與背景格線層級隔離架構 (Unified Notebook Cardstock and Background Stacking Context Architecture)

## 狀態
部分已被替代 (Partially Superseded by [ADR-0094](0094-soft-milk-white-cardstock-and-contrast-hierarchy.md)：卡片底色已被柔暖牛奶白替代；背景格線層級隔離 `z-0` vs `relative z-10` 依然有效)

## 背景 (Context)
在先前實作（ADR-0091、ADR-0092）中，背景引入了 20px 方眼手帳筆記本格線（`.notebook-grid`），而前景組件嘗試設定 `--color-card: #faf8f5`。

然而在實機與多種螢幕檢視下，使用者提出兩大核心反饋：
1. **「還是太白了」**：`#faf8f5` 的明度高達 97.5%，在主流高對比與廣色域螢幕上幾乎無法與數位純白（`#ffffff`）拉開肉眼可見的差距，依舊呈現數位高光感。
2. **「篩選器怎麼是背景透明的？」**：
   - 在 `index.html` 中，滿版固定定位的背景格線（`.notebook-grid`）與手感紙漿噪點（`.paper-grain`）使用了 `fixed inset-0`，但**缺少負向或明確層級控制**。
   - 桌機版篩選器容器（`ShowNavigator`、`SongNavigator`、`VenueNavigator`）屬於一般正常流區塊元素，未顯式設定 `position: relative`。
   - 根據 CSS 堆疊上下文（Stacking Context）規則，`position: fixed` 的背景格線在層級上物理覆蓋於無定位的區塊元素之上，導致 20px 方格線物理繪製在篩選器表面，形成嚴重的「透明穿透感」。

經過 `/grill-with-docs` 審查與使用者拍板決策，全站進入日系手帳原色一體化與層級隔離修復。

---

## 決策 (Decision)

### 1. 純粹手帳一體同色 (`--color-card: #f0eee8`)
- 將全站核心卡片、三列切換欄、搜尋框、篩選器與票根底色統一收斂至 `--color-card: #f0eee8`，與背景紙色（`--color-paper: #f0eee8`）達成 100% 同色。
- **立體層次重構**：完全由純黑線條框（`border-[1.5px] border-ink`）與實體卡紙投影（`shadow-[5px_5px_0_rgba(0,0,0,0.14)]`）建立卡片在手帳內頁上的立體浮凸感，徹底消滅任何「白光」。
- **票頭消光微層次**：在實體撕票穿孔虛線（`<TicketPerforationDivider />`）上方，改採極微暖灰消光微層次（`bg-black/[0.025] dark:bg-white/[0.025]`），保持老式雙色票根的細膩印刷分區。

### 2. 背景層級嚴格隔離（Stacking Context Isolation）
- 在 `site/index.html` 中，將背景的微光、方眼格線與紙漿微粒設定為 `fixed inset-0 z-0`，並將主應用容器 `#app` 設定為 `relative z-10`。
- 確保所有背景圖層永遠被鎖定在底層（z-0），主應用內容（z-10）所有帶有背景的卡片與面板皆能 100% 阻隔格線，徹底根除格線穿透導致的「偽透明」現象。
- 在三大篩選器容器全面補上 `relative bg-card`，消除任何意外穿透。

---

## 後果 (Consequences)

### 正面影響 (Positive)
1. **零白底沉浸手帳美學**：徹底告別任何刺眼白光，所有卡片如同黏貼在手帳筆記本內頁中的實體門票與表格。
2. **根除背景穿透 Bug**：透過清晰的 `z-0` vs `relative z-10` 堆疊上下文，確保所有前端元件皆能穩定遮蔽背景格線。
3. **長文護眼舒適度極致化**：長時間在螢幕前查閱巡演軌跡與歌單時，眼睛不再受到高明度亮白刺激。
