# 34. 場館字典稽核修正與同步管線缺口修補

* Status: Accepted
* Date: 2026-09-30

## Context & Problem Statement

稽核 `data/venues.json` 發現三類錯誤，集中於機器自動新增區段：
1. **殘渣值**：`TBSテレビ → Tbs tv`；府縣欄竄入日期（`オンラインライブ → 2024.05.07`、
   `SUMMER SONIC 2025 → 2025.08.16`）。
2. **中式機翻舞台名**：`千葉Soga體育公園的蓮花舞臺`、`山中湖交易廣場Kirara的湖畔舞臺`，
   與同類 `AIR STAGE` 原文保留體例分裂。
3. **和制漢字與空區**：`熊本県/千葉県/山梨県/神奈川県` 混用；11 筆 `region` 留空。

## Decisions

1. 縣名轉 `縣`；`region` 回填（熊本九州、千葉/東京/橫濱關東、山梨中部、大阪關西；線上直播歸其他）。
2. `TBSテレビ → TBS電視台`；線上直播府縣清空。
3. 三舞台統一為場地中文＋舞台英文保留（蘇我 LOTUS、山中湖 Kirara LAKESIDE、萬博 AIR）。
4. `SUMMER SONIC 2025 → 千葉海洋球場（ZOZO Marine Stadium）`；熊本館名不動。
5. 管線修補（`validate-data.mjs`）：同步守衛由 truthy 改 `!== undefined`，
   空字串正名方可擴散；字典改值致舊正名孤兒（LOTUS/LAKESIDE/TBS 三場）手動遷移。

## Consequences

* 12 筆場次全數對上字典；`sync-data` 反向同步＋鏡像＋驗證通過。
* 待查未動：`Niterra` 前綴脫落、`Reed & Rose` 拼法、`SGC HALL ARIAKE` 譯名，低信心，另議。

## 追記（2026-10-01，三待查定案）
* `Niterra日本特殊陶業市民会館 フォレストホール` 官方冠名含 `Niterra`（命名權至令和10年），依品牌保留原文：`Niterra日本特殊陶業市民會館 Forest Hall`。
* `Reed & Rose` 維持英文拼法（官方即此）；`SGC HALL ARIAKE` 維持 `有明SGC會館`。三項關閉。
