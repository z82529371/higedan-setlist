# ADR-0092: 暖米白原色卡紙全面替代純白與零刺眼白底決策 (Warm Ivory Cardstock and Zero Pure White Architecture)

## 狀態
已廢止 (Superseded by [ADR-0094: 日系柔暖牛奶白卡紙與實體對比階梯決策](0094-soft-milk-white-cardstock-and-contrast-hierarchy.md))

## 背景 (Context)
在先前實作中，背景已升級為日系 5mm 方眼手帳筆記本與無酸紙質感（`#f0eee8`）。然而，前景組件（包括：場次/歌曲/場地三列切換欄、搜尋框、篩選器抽屜/導覽列、演出單據票根卡片等）過去預設使用數位純白（`#ffffff`）。

使用者明確反饋：**「我不想要底色是純白」、「是指場次三列、搜尋框、篩選器、票根等等」**。

在實體印刷與手帳工藝中：
1. **刺眼對比問題（Digital White Glare）**：高亮度螢幕上的純白 `#ffffff` 具有強烈發光感與刺眼生硬感，與暖調紙底（`#f0eee8`）產生過度生硬的數位冷硬落差。
2. **實體卡紙特質（Physical Cardstock Metaphor）**：實體演唱會門票、票根卡紙與手帳收納卡通常由未經漂白或微染的厚磅原色棉卡紙（Cream / Ivory Cardstock）印製，帶有微溫潤的米白本色。

經過 `/grill-with-docs` 審查與使用者確認，全站拍板採用 **選項 1：暖米白原色卡紙（Warm Ivory Cream `#faf8f5`）**，徹底消除全站組件的刺眼純白。

---

## 決策 (Decision)

### 1. 單一來源 Token 驅動卡紙底色 (`--color-card: #faf8f5`)
- 在 `site/src/style.css` 主題定義中，將 `--color-card` 錨定為 `#faf8f5`（相較於背景 `#f0eee8` 具有明度階梯，但非刺眼 `#ffffff`）：
  - **背景手帳頁面**：`--color-paper: #f0eee8`
  - **前景卡片/組件**：`--color-card: #faf8f5`
- 保持實體卡紙在手帳紙面上的浮凸層次與輪廓，同時消除刺眼發光感。

### 2. 全面覆蓋所有交互與展示組件
所有核心組件全面綁定 `bg-card`，消除任何殘留的硬編碼 `bg-white`：
- **場次三列切換欄（Top Navigation Tabs）**：場次、歌曲、場地分頁使用 `bg-card`。
- **搜尋框（SearchBox Input）**：輸入框底色使用 `bg-card`。
- **篩選導覽列與抽屜（Filter Navigators & Drawers）**：巡演篩選抽屜、分類導覽面板統一使用 `bg-card`。
- **演出單據票根（Ticket Slips `SLIP_ARTICLE`）**：票券本體採用 `bg-card`，票頭保持二色沉浸紙感 `bg-paper/40`。
- **特殊曲目卡片（`SLIP_CARD.request`）**：點歌卡片背景由原本硬編碼 `bg-white` 調整為 `bg-card`。

---

## 後果 (Consequences)

### 正面影響 (Positive)
1. **全站溫潤手感與一致性**：從手帳背景、和紙膠帶、穿孔虛線到票根卡紙與搜尋器，全部採用實體紙質色系，徹底告別冷硬純白。
2. **護眼與長文閱讀舒適性**：消除純白造成的螢幕眩光，提升長時間查閱曲目歷史與巡演紀錄的沉浸感與舒適度。
3. **無痛維護**：所有組件統一收斂於 `--color-card`，未來若需微調紙色明度僅需修改單一 CSS 變數。
