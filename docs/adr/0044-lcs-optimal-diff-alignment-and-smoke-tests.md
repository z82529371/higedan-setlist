# 44. LCS 最長公共子序列對齊與常駐 Smoke 測試

* Status: Accepted
* Date: 2026-10-01

## Context & Problem Statement

1. **貪心比對引發假差異**：先前的 `computeDiff` 採用貪心往前查找（`nextTMatch`）與啟發式代換判定。當現場出現曲目調換（Transposition，如 A-B-C-D 唱成 A-D-B-C）或提早唱出後面的歌時，貪心法會將中間未比對的模板曲一次全量 `skip`，造成非必要的串聯刪除與重新插入（Fake Skips & Inserts）。
2. **管線零常駐測試**：`parse`、`computeDiff`、`resolve` 與各類特殊標籤過濾過去缺乏常駐回歸測試，多仰賴一次性丟棄的驗證腳本，重構底層演算法時風險極高。
3. **DOM 逆序與無索引告警**：部分 LiveFans 頁面（如曼谷 1981872、1456558、1353359）存在 DOM 順序與播放器索引（`idx`）不一致或歌曲缺少 `idx` 的狀況，管線過去靜默猜測，錯了難以在匯入當下察覺。

## Decisions

1. **`computeDiff` 重構為 LCS 動態規劃（DP）最優對齊**：
   - 建立 $M \times N$ 的 LCS DP 矩陣（過場與 `isCmt` 不參與模板比對），精確求出巡演模板與現場 setlist 的最長公共子序列。
   - 落在 LCS 骨架上的歌曲：保留為共識錨點；若包含版本備註差異（ADR-0028 アレンジ），依約定以 `skip`＋`insert` 替換。
   - 模板中未落在 LCS 上的曲目：標記為 `diff.skip`。
   - 現場 setlist 中未落在 LCS 上的曲目（換歌、加唱、過場、solo cover）：以 `diff.insert` 掛載於其在現場演出前一首匹配曲的 template order 錨點（無前置則為 `after: 0`）。
   - 保證了還原時的單調性與最小操作數，徹底根治貪心跳躍導致的假差異。

2. **建立常駐 Smoke 測試（`site/scripts/smoke-test.mjs`）**：
   - 使用 Node 原生 `node:test` 與 `node:assert/strict`（零外部依賴，毫秒級執行）。
   - 鎖死四大核心管線不變量（Invariants）：
     1. 曼谷無 `idx` 曲目以模板對位重排（ADR-0042）。
     2. 團員 solo 翻唱轉過場（`isMemberSoloText`，無 title、不編號）vs 正式翻唱保留 `title` 軌（ADR-0043, ADR-0032）。
     3. 裝飾性與裸標記 MC / OPENING / SE 剔除，帶內容 MC 保留（ADR-0005, ADR-0025）。
     4. `resolve` 順序、`skip` 錨點下 `insert` 保全（ADR-0020）、版本差異置換（ADR-0028）與 LCS 調換對齊最小化。
   - 於 root 與 site 的 `package.json` 配置 `pnpm test`，作為提交前標準檢查門檻。

3. **雙重 DOM 亂序告警與摘要報告**：
   - `domScrambleInfo` 檢驗兩項指標：(1) 有 `playIndex` 歌曲之間的逆序數；(2) 正式歌曲缺少 `playIndex`（如曼谷 Pretender）。
   - 命中時印出 `[SCRAMBLED DOM]`（已標手排者標示 `[SCRAMBLED DOM (LOCKED)]`），並於批次結束時輸出統整清單。

4. **`site/src/data` 取消追蹤與唯寫變更**：
   - 將 `site/src/data` 納入 `.gitignore`，自 git index 移除。
   - `batch-import` 採用標準化字串比對，無內容變更之檔案跳過寫入（`[UNCHANGED]`），根除 mtime 污染。

## Consequences

* 任何曲序調換均可被 LCS 最佳化為最少數量的 `skip` 與 `insert`，不會引發連鎖跳過。
* `pnpm test` 全數通過，日後管線微調具備自動化防護網。
* 匯入新場次時能立即現形亂序與無索引頁面，便於手排標註 `locked`。
