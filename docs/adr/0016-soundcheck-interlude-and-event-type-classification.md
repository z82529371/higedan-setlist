# 0016 音樂祭彩排試音（Rehearsal）過場標記與專場／事件歸類

## 背景
音樂祭（Festivals）等非巡演事件常包含樂團正式演出前的試音彩排（Rehearsal / Soundcheck）試唱曲目，以及特定單發 Live（如 one-man live in TOYOTA ARENA TOKYO）。需確立其在 setlist 結構與演出類型（type）的歸類標準。

## 決策
1. **彩排試音（Soundcheck / Rehearsal）標記**：
   - 採 `type: "interlude"` 形式記錄於曲目清單中（`order: 0`），使用 `note: "リハ：曲目名"` 表示。
   - 不獨立佔用正式歌曲序號（`cueNo` 顯示為 `—`），在畫面呈現時與一般過場文字同享紙質壓花與淡色標記樣式。
2. **單發專場（One-man Live）的演出類型定義**：
   - 僅有一場或非巡演編制的獨立專場（如 TOYOTA ARENA TOKYO 2025），容器歸類於 `events/`（事件），但其演出類型欄位宣告為 `type: "專場"`。
   - 「專場」為唯一可跨容器（巡演與事件）存在的演出類型。音樂祭與對バン必然歸類為事件。
