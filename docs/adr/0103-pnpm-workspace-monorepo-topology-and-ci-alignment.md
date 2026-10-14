# ADR-0103: pnpm Monorepo Workspace 拓撲正規化與 CI 對齊 (pnpm Monorepo Workspace Topology and CI Alignment)

## Status
Accepted

## Context

1. **背景與痛點分析**：
   - 本儲存庫採用根目錄包覆前端子目錄 `site/` 的結構。
   - 原先在根目錄 [`package.json`](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/package.json) 中透過 `--dir site` 代理執行腳本，且在 `site/` 內部殘留了缺少 `packages:` 欄位的 [`site/pnpm-workspace.yaml`](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/site/pnpm-workspace.yaml)。
   - 在 GitHub Actions CI（[`.github/workflows/ci.yml`](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/.github/workflows/ci.yml)）流程中引發了以下阻礙：
     - **子目錄 Workspace 格式錯誤**：子目錄中的 `pnpm-workspace.yaml` 被 pnpm 偵測為 workspace 定義檔，但因欠缺 `packages:` 宣告而直接拋出 `ERROR packages field missing or empty`。
     - **依賴未安裝與快取失效**：CI 在根目錄執行 `pnpm install` 時，根目錄無 workspace 拓撲定義，導致 `site/node_modules` 未被安裝，拋出 `WARN Local package.json exists, but node_modules missing`。
     - **版本與 Corepack 規範漂移**：本機已使用 pnpm 11，但 CI 流程硬編碼指定 `version: 9`，容易因 Lockfile 格式版本演進產生不相容衝突。

2. **考量之替代方案**：
   - **替代方案 1（非 Monorepo 巢狀模式）**：
     - 刪除 `pnpm-workspace.yaml`，全面將 CI 安裝路徑改為 `pnpm --dir site install`。
     - 缺點：破壞標準 pnpm monorepo 生態相容性，且根目錄腳本需要以繁瑣且脆弱的 `--dir` 串接路徑。
   - **替代方案 2（正規化 pnpm Monorepo Workspace，選定）**：
     - 在根目錄建立標準 `pnpm-workspace.yaml`，指定 `packages: ['site']` 與安全建置配置 `onlyBuiltDependencies: ['esbuild']`。
     - 整合 Lockfile 至根目錄，並在根目錄 `package.json` 聲明 `packageManager` 作為單一事實來源（SSOT）。

## Decision

1. **根目錄 Workspace 拓撲**：
   - 於專案根目錄維護權威的 [`pnpm-workspace.yaml`](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/pnpm-workspace.yaml)：
     ```yaml
     packages:
       - 'site'
     onlyBuiltDependencies:
       - esbuild
     ```
   - 徹底移除子目錄中的 `site/pnpm-workspace.yaml`。

2. **Lockfile 與 Package Manager 規範**：
   - 在根目錄 [`package.json`](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/package.json) 中加入 Corepack 聲明 `"packageManager": "pnpm@11.18.0"`。
   - 廢止子目錄 `site/pnpm-lock.yaml`，統一於根目錄維護單一權威的 [`pnpm-lock.yaml`](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/pnpm-lock.yaml)。

3. **指令轉發與 CI 快取機制**：
   - 根目錄外層腳本採用標準 Workspace 語法：`pnpm --filter ./site <cmd>`。
   - CI 的 `pnpm/action-setup@v4` 移除硬編碼版本，自動依賴 `packageManager` 解析；`actions/setup-node@v4` 之 `cache: 'pnpm'` 直接快取根目錄之 Lockfile 雜湊。CI 之 Node.js 運行環境同步對齊 Node.js 22（滿足 pnpm 11 原生依賴 `node:sqlite` 之版本門檻）。

## Consequences

- **正面效益**：
  - CI 流程原生支援一鍵 `pnpm install`、`pnpm check` 與 `pnpm build`，根除路徑與 workspace 解析報錯。
  - 統一跨平台與跨代理人之依賴安裝行為。
  - 符合現代 pnpm monorepo 生態最佳實踐。
- **維護規範**：
  - 所有新增或變更之前端依賴一律透過 workspace 根目錄由 pnpm 統一解析，嚴禁在子目錄手動新增未定義 `packages` 之 `pnpm-workspace.yaml`。
