# Agent Instructions (AGENTS.md)

Repository conventions and navigation pointers for AI agents working in this codebase.

## Navigation Pointers

- **Domain Model & Data Invariants**: Consult [`CONTEXT.md`](./CONTEXT.md) for domain terminology, tour vs event boundaries, 8 performance categories, monotonicity rules, and placeholder track specs (`ADR-0098`).
- **Product Architecture**: Consult [`PRODUCT.md`](./PRODUCT.md) for spotlight landing mode, archive dual-mode toggle, and search ergonomics.
- **Visual Design**: Consult [`DESIGN.md`](./DESIGN.md) for ticket aesthetic tokens, perforation dividers, barcode footers, and contrast rules (small badge text <14px must strictly use high-contrast ink tokens with >= 7:1 AAA contrast; arbitrary unvetted hex colors like text-[#...] are prohibited).
- **URL Routing & Deep Links**: Consult [`site/src/lib/routes.js`](./site/src/lib/routes.js) and [`ADR-0101`](./docs/adr/0101-url-hash-deep-linking-and-route-state-machine.md) for bidirectional hash schemes (`#/song`, `#/show`, `#/venue`, `#/tour`).
- **Architectural Decision Records**: Consult [`docs/adr/`](./docs/adr/) for all historical architectural records (0001–0103).
- **Issue Tracking**: Consult GitHub Issues via `gh issue view <number>` or `gh issue list` for feature specs and task acceptance criteria.

## Multi-Agent Workspace Hygiene

Multiple autonomous agents frequently operate concurrently in this repository:

1. **Scratch Files Isolation**: Write all exploratory or temporary scripts to `scratch/` or `.scratch/` (both are git-ignored). Never commit or scatter ad-hoc verification scripts in repository root.
2. **Concurrent File Protection**: Never delete, restore, or modify working tree files outside your explicit task scope (e.g. data JSON files under active audit or other agents' temporary scripts).
3. **Task-Scoped Git Operations**: Always inspect git diff with `git --no-pager diff -- <path>` or path filters rather than unstaging or wiping untracked files wholesale, preventing Windows terminal pager hangs.
4. **Data Inspection**: Use `node -e` or scripts under `site/scripts/` rather than PowerShell `ConvertFrom-Json` to avoid Windows UTF-8 encoding distortion.
5. **Vite SSR & Scratch Scripts**: Scratch scripts importing frontend modules (e.g. `domain.js` importing JSON assets) must run inside `site/` or resolve `site/node_modules`, and configure Vite with `server: { middlewareMode: true, watch: null }` in `createServer()` to avoid Node.js strict ESM JSON attribute errors and Windows Chokidar file-watcher hangs.
6. **pnpm Monorepo Workspace Topology (ADR-0103)**: Repository uses root `pnpm-workspace.yaml` targeting `packages: ['site']` with root `pnpm-lock.yaml`. Never create rogue `pnpm-workspace.yaml` inside subdirectories, and invoke workspace scripts from root using `pnpm --filter ./site <cmd>`.

## Verification Commands

- `pnpm check`: Runs ultra-fast static linting (`oxlint`, checks undeclared variables and dead code in <20ms) and the full domain smoke test suite (`smoke-test.mjs`). Run after every code modification.
- `pnpm test`: Runs `oxlint` + `smoke-test.mjs` (13 invariant checks).
- `pnpm build`: Production build via Vite compiler (`site/dist/`).
