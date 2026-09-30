# 39. ADR 稽核：標記不搬檔與術語缺口修補

* Status: Accepted
* Date: 2026-09-30

## Context & Problem Statement

ADR 累積 38 份，多為實作 log 與 bugfix；另有取代未標（0001、0018、0031、
0008§4）與四處已驗證的術語/碼不一致（專輯分組缺 2015、`diff.note/kind`
陣列零使用、過場模板錨點死規格、自動匯入寫 `對樂團` 與全庫 `對バン` 分裂）。

## Decisions

1. **標記不搬檔**：0001/0018/0031 加 `Superseded`、0008 加部分取代註；
   0024/0025/0030/0032 加 `See also` 主文互鏈；不刪不搬。
2. 死規格註明保留（`diff.note/kind` 陣列供手寫擴充；過場改 `diff.insert` 錨點）。
3. 自動匯入 `對樂團` 改 `對バン`；專輯分組補 2015。
4. 往後新 ADR 拉高門檻（難反悔＋缺上下文看不懂＋真實取捨，三缺一即記 commit）。

## Consequences

* 真 ADR 約 15 份，其餘為互鏈的實作記錄；`validate` 通過。
