# Agent Instructions (AGENTS.md)

Repository conventions and navigation pointers for AI agents working in this codebase.

## Navigation Pointers

- **Domain Model & Data Invariants**: Consult [`CONTEXT.md`](./CONTEXT.md) for domain terminology, tour vs event boundaries, 8 performance categories, monotonicity rules, and placeholder track specs (`ADR-0098`).
- **Product Architecture**: Consult [`PRODUCT.md`](./PRODUCT.md) for spotlight landing mode, archive dual-mode toggle, and search ergonomics.
- **Visual Design**: Consult [`DESIGN.md`](./DESIGN.md) for ticket aesthetic tokens, perforation dividers, barcode footers, and contrast rules (small badge text <14px must strictly use high-contrast ink tokens with >= 7:1 AAA contrast; arbitrary unvetted hex colors like text-[#...] are prohibited).
- **URL Routing & Deep Links**: Consult [`site/src/lib/routes.js`](./site/src/lib/routes.js) and [`ADR-0101`](./docs/adr/0101-url-hash-deep-linking-and-route-state-machine.md) for bidirectional hash schemes (`#/song`, `#/show`, `#/venue`, `#/tour`).
- **Architectural Decision Records**: Consult [`docs/adr/`](./docs/adr/) for all historical architectural records (0001–0108).
- **CI/CD & Deployment Target**: Consult [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) and [`.nvmrc`](./.nvmrc) for runtime version alignment (Cloudflare Pages builds depend on `.nvmrc` and `engines.node >= 22.13.0` for pnpm 11 compatibility).
- **i18n & Context Providers Boundary**: Consult [`CONTEXT.md`](./CONTEXT.md#react-hooks-領域狀態與極端路由安全回退hooks-domain-state--hash-fallback-invariantsadr-0101), [`site/src/App.jsx`](./site/src/App.jsx), [`ADR-0107`](./docs/adr/0107-multi-language-localization-and-taxonomy-boundary.md), and [`ADR-0108`](./docs/adr/0108-administrative-geography-localization-and-venue-integrity.md) for the `<I18nProvider>` root wrapper requirement (`AppContent` pattern), the responsive switcher dichotomy, and administrative geography localization boundaries.
- **Issue Tracking**: Consult GitHub Issues via `gh issue view <number>` or `gh issue list` for feature specs and task acceptance criteria.

## Multi-Agent Workspace Hygiene

Multiple autonomous agents frequently operate concurrently in this repository:

1. **Scratch Files Isolation**: Write all exploratory or temporary scripts to `scratch/` or `.scratch/` (both are git-ignored). Never commit or scatter ad-hoc verification scripts in repository root.
2. **Concurrent File Protection**: Never delete, restore, or modify working tree files outside your explicit task scope (e.g. data JSON files under active audit or other agents' temporary scripts).
3. **Task-Scoped Git Operations**: Always inspect git diff with `git --no-pager diff -- <path>` or path filters rather than unstaging or wiping untracked files wholesale, preventing Windows terminal pager hangs.
4. **Data Inspection & Script Hygiene**: Use `node -e` or scripts under `site/scripts/` rather than PowerShell `ConvertFrom-Json` to avoid Windows UTF-8 encoding distortion. In PowerShell, avoid inline nested quote escaping issues by writing multi-line logic directly to `.scratch/temp.mjs` and running `node .scratch/temp.mjs`. Never chain shell commands with `&&` in tool calls on Windows; invoke single commands sequentially.
5. **Vite SSR & Scratch Scripts**: Execute ad-hoc snippets importing frontend modules (e.g. `domain.js`) via `pnpm eval "<code>"` or `site/scripts/eval.mjs` (which injects `loadModule('/src/lib/domain.js')` and `readJson('../data/...')`), avoiding Node.js strict ESM JSON attribute errors (`ERR_IMPORT_ATTRIBUTE_MISSING`).
6. **pnpm Monorepo Workspace Topology (ADR-0103)**: Repository uses root `pnpm-workspace.yaml` targeting `packages: ['site']` with root `pnpm-lock.yaml`. Never create rogue `pnpm-workspace.yaml` inside subdirectories, and invoke workspace scripts from root using `pnpm --filter ./site <cmd>`.
7. **Staging Hygiene Guardrail**: Run `pnpm check:staged` before committing to verify no concurrent agent files (`data/events/*.json`, `docs/reports/*.md`) were mistakenly staged, and review the echoed staged files manifest.
8. **Parallel Subagent Discipline**: Fan out subagents only across independent files; related files sharing locales or imports are edited sequentially by one agent. Subagent writes persist even when its response is lost to a restart — always re-verify with `grep`/`git diff -- <path>` instead of assuming completion, and never repeat an edit without first reading the current file state.
9. **Solo Developer Workflow**: This is a solo developer repository. Commit or merge integration branches directly into `master` and push to origin; never open GitHub Pull Requests or Draft PRs unless explicitly instructed by the user.
10. **Synchronous Tool Timeout Setting**: When invoking validation commands (`pnpm check`, `pnpm test`, `pnpm build`), set `WaitMsBeforeAsync` to `10000ms` (maximum) to guarantee synchronous completion within a single turn and avoid unnecessary background task roundtrips.

## Verification Commands

- `pnpm check`: Runs ultra-fast static linting (`oxlint`, checks undeclared variables and dead code in <20ms) and the full domain smoke test suite (`smoke-test.mjs`). Run after every code modification.
- `pnpm test`: Runs `oxlint` + `smoke-test.mjs` (13 invariant checks).
- `pnpm build`: Production build via Vite compiler (`site/dist/`).

## Agent skills

### Issue tracker

Issues live as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels used as-is. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context with root `docs/adr/`. See `docs/agents/domain.md`.
