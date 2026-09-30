# LiveFans 歌單解析、歌曲 ID 對齊與 UI 三行式展現規範

> **部分 Superseded**：§4 第二行「官方英文場館名」被 0013 中文優先推翻；排序細節見 0026。§1§2 有效；§2 呈現層已擴為四色卡（request／premiere／unreleased／satoshi-solo，見 0010／0011／0041），紅卡描述僅為其中一種。

## 1. LiveFans HTML 曲序與歌曲 ID 對齊
- **曲序判定**：LiveFans HTML 內的 tr 行順序或 pcslX 類名並非現場真實演唱順序。全站擷取時必須讀取播放按鈕中的 showBottomMusicPlayer(X, this) 索引值 X (0, 1, 2...)，並依據 X 進行升冪排序，還原現場 100% 正確曲序。當 HTML 中未渲染標準歌單表格時，自動回退解析頁面內嵌的 `window.dataObject.applemusic.playerQueue` 結構。
- **歌曲 ID 對齊**：歌曲比對優先採用 LiveFans 超連結數字 ID（/songs/(\d+)，如 /songs/547687 對應 115man-kiro-no-film），避免字體全半形、標點或字詞拼寫差異造成對齊失敗；找不到 ID 時才退回歌名文字比對。全站 songs.json 中的歌曲皆須綁定 livefansId。

## 2. 巡演曲目變更 (Substitution) 與點歌 (Request) 區分規範
- **曲目變更 (Substitution)**：當巡演中途發生主歌單更換（如某位置歌曲被跳過並更換為另一首固定曲），屬於巡演曲目變更而非現場點歌，資料庫中項目的 item 不帶 kind: " request\，前端渲染為標準曲目樣式（M1, M2...），不套用紅色 request-slip。
- **現場點歌 (Request)**：只有當歌曲純粹為現場觀眾點歌/加唱、非曲目替換時，資料庫項目明確標註 kind: \request\，前端方套用紅色 request-slip 高亮卡片。
- 全站與資料庫中均移除文字版 \リクエスト\ 附註。

## 3. 全面資料凍結與保護機制
- **資料凍結與保護**：現有所有已建檔與人工校對之巡演與事件歌單（包括 arena-tour-2024-rejoice, asia-tour-2024, stadium-tour-2025, one-man-tour-2026 等），在 `batch-import.mjs` 自動化處理腳本中已全面設定跳過（`continue`）與凍結保護，嚴禁自動化腳本重新計算、變更或覆寫手動校對之 diff、note 與 kind。

## 4. UI 3 行式場次標籤展示規範
- 為保證跨頁面與側邊欄的視覺一致性，全站場次標籤（側邊抽屜列表、SongSlip、VenueSlip 及 ShowSlip 主標題）統一拆分為三行展示：
 - 第一行：日期與星期（如 2026-04-04（六））
 - 第二行：官方英文場館名（如 Sendai Sunplaza Hall）
 - 第三行：中文城市名（如 （仙台））
