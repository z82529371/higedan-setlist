# Agent Instructions (AGENTS.md)

Repository conventions and navigation pointers for AI agents working in this codebase.

## Navigation Pointers

- **Domain Glossary**: Consult [`GLOSSARY.md`](./GLOSSARY.md) for authoritative, implementation-free definitions of core live concert terminology (Tour, Event, Show, Setlist, 8 Categories, Ticket Book, Dual-Time Model).
- **Coding Standards & TDD Seams**: Consult [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) for zero-backend static purity (`ADR-0123`), consumer-friendly copy, design token invariants, multi-lingual parity rules, empirical geocoding provenance (`ADR-0124`), and the **Core Domain Seams & Test Map** for `/tdd`.
- **Domain Model & Data Invariants**: Consult [`CONTEXT.md`](./CONTEXT.md) for domain terminology, tour vs event boundaries (`data/tours/*.json` files are named by tour slug such as `one-man-tour-2021-2022-editorial.json` while `tour.id` inside the JSON uses chronological prefix `14-2021-editorial`), 8 performance categories, monotonicity rules, and placeholder track specs (`ADR-0098`).
- **Product Architecture**: Consult [`PRODUCT.md`](./PRODUCT.md) for spotlight landing mode, archive dual-mode toggle, and search ergonomics.
- **Visual Design**: Consult [`DESIGN.md`](./DESIGN.md) for ticket aesthetic tokens, zero-blur shadows, perforation dividers, barcode footers, and contrast rules.
- **URL Routing & Deep Links**: Consult [`site/src/lib/routes.js`](./site/src/lib/routes.js) and [`ADR-0101`](./docs/adr/0101-url-hash-deep-linking-and-route-state-machine.md) for bidirectional hash schemes (`#/passport` was deprecated in `ADR-0114`).
- **Architectural Decision Records**: Consult [`docs/adr/README.md`](./docs/adr/README.md) for the full index of all architectural decisions and feature specs.
- **Test Harness & Modular Suites**: Consult [`site/tests/`](./site/tests/) and [`CODING_STANDARDS.md`](./CODING_STANDARDS.md#6-core-domain-seams--test-map-tdd--implement) for the 3-tier test suites (`pipeline/`, `invariants/`, `ui/`) and headless Vite SSR harness (`site/tests/helpers/vite-server.js`).
- **CI/CD & Runtime**: Consult [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) and [`.nvmrc`](./.nvmrc) for Node `>= 22.13.0` / pnpm 11 alignment.
- **Issue Tracking**: Consult GitHub Issues via `gh issue view <number>` or `gh issue list` for feature specs and task acceptance criteria.
- **Data Audit Exclusions**: Consult [`docs/reports/cancelled-appearances.md`](./docs/reports/cancelled-appearances.md) before flagging missing shows during external source audits.

## Multi-Agent Workspace Hygiene

Multiple autonomous agents frequently operate concurrently in this repository:

1. **Scratch Files Isolation**: Write exploratory scripts (`.scratch/*.mjs`) to `scratch/` or `.scratch/` (git-ignored). Write generated JSON/text outputs from `node` scripts to `<appDataDir>/brain/<conversation-id>/scratch/` (Windows sandbox blocks `fs.writeFileSync` into `.scratch/` with `EPERM`). Keep repository root clean.
2. **Concurrent File Protection & Scoped Verification**: Never delete, restore, or modify working tree files outside your explicit task scope (e.g. data JSON files under active audit or other agents' in-flight components). When running verification commands (`pnpm check`, `pnpm test`), if test failures occur in foreign files currently modified by concurrent agents, strictly refrain from fixing or touching those foreign files; verify your own scoped test suites (`node --test <task-test>`) and note the foreign failures in your report.
3. **Task-Scoped Git Operations & Worktree Isolation**: When multiple agents edit shared UI or locale files concurrently, prefer an isolated `git worktree` (or stage only task-specific hunks). Always inspect git diff with `git --no-pager diff -- <path>` rather than unstaging or wiping untracked files wholesale, preventing Windows terminal pager hangs.
4. **Data Inspection & Script Hygiene**: Put exploratory/one-off scripts in `.scratch/*.mjs` (run via `node .scratch/<script>.mjs`) rather than inline `node -e` or PowerShell `ConvertFrom-Json`. Use `git grep -n "<pattern>" -- <path>` for codebase searches. In **Windows PowerShell 5.1**, chain commands with `;`, slice output with `Select-Object -First/-Last N`, pass unescaped command strings, and create files/directories with native tools (`write_file`, `New-Item -ItemType Directory -Force -Path <path>`).
5. **Vite SSR & Scratch Scripts**: Execute ad-hoc snippets importing frontend modules (e.g. `domain.js`) via `pnpm eval "<code>"` or `site/scripts/eval.mjs` (which injects `loadModule('/src/lib/domain.js')` and `readJson('../data/...')`), avoiding Node.js strict ESM JSON attribute errors (`ERR_IMPORT_ATTRIBUTE_MISSING`).
6. **pnpm Monorepo Workspace Topology (ADR-0103)**: Repository uses root `pnpm-workspace.yaml` targeting `packages: ['site']` with root `pnpm-lock.yaml`. Invoke workspace scripts from root using `pnpm --filter ./site <cmd>`.
7. **Staging Hygiene Guardrail**: Run `pnpm check:staged` before committing to verify no concurrent agent files (`data/events/*.json`, `docs/reports/*.md`) were mistakenly staged, ADR indexing integrity, LF line-ending normalization, and banned/deprecated domain terms compliance. ADRs in `docs/adr/` are immutable historical records; never mutate accepted decision text in-place.
8. **Parallel Subagent Discipline**: Fan out subagents only across independent files; related files sharing locales or imports are edited sequentially by one agent. Subagent writes persist even when its response is lost to a restart — always re-verify with `git diff -- <path>` before repeating an edit.
9. **Solo Developer Workflow**: This is a solo developer repository. Commit or merge integration branches directly into `master` and push to origin; do not open GitHub Pull Requests unless explicitly instructed by the user.

## Verification Commands

All workspace scripts live in [`site/package.json`](./site/package.json) and root [`package.json`](./package.json):

- **Inner loop**: `pnpm check:fast` (`oxlint` + `check-i18n` + `test:invariants` in <200ms).
- **Pre-commit gate**: `pnpm check` (full lint, `check-i18n`, and all `pipeline`/`invariants`/`ui` suites; run `pnpm sync` first when `data/` changed) + `pnpm check:staged` (see [`site/scripts/check-staged.mjs`](./site/scripts/check-staged.mjs) for `STAGED_ALLOW_EVENTS` allowlist flags).
- **Windows sandbox**: Always run `git add`, `git commit`, `git push`, `pnpm sync`, and workspace `Remove-Item` deletions with `BypassSandbox: true` (sandbox blocks `.git/index.lock`, `site/src/data/` writes, and file deletions with `EPERM`/`Access denied`).

## Agent skills

### Issue tracker

Issues live as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels used as-is. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context with root `docs/adr/`. See `docs/agents/domain.md`.
