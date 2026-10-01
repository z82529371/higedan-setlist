# 0023 未知事件動態 Slug 歸檔與非髭男曲目表示法規範

## 背景
先前 `batch-import.mjs` 自動處理解析未預先註冊檔名的未知 LiveFans Show ID 時，存在以下局限：
1. 強制將未知名稱的 Event 集合存入 `unofficial-YYYY.json`，並一律被硬編碼加上 `-UNOFFICIAL-` 標籤。
2. 比對 LiveFans HTML 時，將 `sec-connect` 選單按鈕容器誤認為安可標籤，導致所有演出曲目皆被誤設為 `encore: true`。
3. 對於非 Official髭男dism 原唱歌曲（如 sumika 的《願い》），因未收錄在 `data/songs.json` 中，原腳本會將包含歌手名稱的標題文字直接強行寫入 `songId` 欄位（如 `songId: "願い [sumika]"`）。

## 決策
1. **未知 Event 動態提取標題與 Slug 檔名化**：
   - 精準提取 LiveFans DOM 中的 `<h4 class="liveName2">` 或 `<h1 class="eventTitle">` 活動標題。
   - 將活動標題轉為小寫與數字導向的 Slug 檔名（如 `tooy-1-2022.json`），並移除強制追加的 `-UNOFFICIAL-` 後綴，保留清潔原名。

2. **修正安可（Encore）誤判與 `p.memo` 標籤解析**：
   - 清除 `sec-connect` 的安可關鍵字觸發條件，僅在真正出現 `sec-encore` 或 `アンコール` 時設定 `encore: true`。
   - 擴充對 `<p class="memo">` 標籤之支援，確保現場 Solo、自彈自唱與翻唱備註不漏抓。

> See also 0030：安可定稿為分隔線傳染（出現後其後全為安可），本篇逐格偵測已收斂。

3. **規範非髭男原唱曲目表示法**：
   - 當曲目未在全域 `data/songs.json` 建立主檔時，統一採用 `"title": "曲名 [原唱歌手]"` 格式記錄於 `setlist`，維持 `songId` 的身份唯一性與專案 JSON 格式一致性。
