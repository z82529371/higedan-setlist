# 0018 中央場館字典與新場地自動翻譯規範

> **Superseded by 0024**：字典概念保留，反向強制校正機制由 0024 接管。另見 0013（命名語言）、0034（稽核例）。

## 背景
先前場館中譯字典維護分散於 `batch-import.mjs`（`venueTranslationMap`）與 `refine-shows.mjs`（`venueMap`）兩處，造成雙頭維護。且新增日本地方公演時，無翻譯之新場館易遺漏中文轉換或引發格式不一致。

## 決策
1. **獨立中央字典 `data/venues.json`**：
   - 建立集中式 JSON 字典 [`data/venues.json`](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/data/venues.json)，定義原名與對應之中文名稱 (`venue`)、城市 (`city`)、地區 (`region`) 與都道府縣 (`prefecture`)。
   - `batch-import.mjs` 與 `refine-shows.mjs` 一律共享並載入此檔案。

2. **新場館自動翻譯與自動註冊機制**：
   - 當爬蟲腳本抓取到 `venues.json` 尚未收錄之全新場館時，先後通過「關鍵字正規替換規則（大ホール->大會堂、会館->會館、ドーム->巨蛋...）」與「翻譯 API」將其自動轉換為繁體中文。
   - 自動將新場館寫入註冊至 `data/venues.json`，免除人工逐一查閱與填寫之負擔。
