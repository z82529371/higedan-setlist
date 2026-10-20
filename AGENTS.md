# Agent Instructions (AGENTS.md)

Repository conventions and navigation pointers for AI agents working in this codebase.

## Navigation Pointers

- **Domain Model & Data Invariants**: Consult [`CONTEXT.md`](./CONTEXT.md) for domain terminology, tour vs event boundaries, 8 performance categories, monotonicity rules, and placeholder track specs (`ADR-0098`).
- **Product Architecture**: Consult [`PRODUCT.md`](./PRODUCT.md) for spotlight landing mode, archive dual-mode toggle, and search ergonomics.
- **Visual Design**: Consult [`DESIGN.md`](./DESIGN.md) for ticket aesthetic tokens, perforation dividers, barcode footers, and contrast rules (small badge text <14px must strictly use high-contrast ink tokens with >= 7:1 AAA contrast; arbitrary unvetted hex colors like text-[#...] are prohibited).
- **URL Routing & Deep Links**: Consult [`site/src/lib/routes.js`](./site/src/lib/routes.js), [`ADR-0101`](./docs/adr/0101-url-hash-deep-linking-and-route-state-machine.md), and [`ADR-0114`](./docs/adr/0114-concert-ticket-book-domain-refactoring-and-passport-deprecation.md) for bidirectional hash schemes (`#/song`, `#/show`, `#/venue`, `#/tour`, `#/tickets`). Note that the legacy `#/passport` route was permanently deprecated and purged in ADR-0114.
- **Architectural Decision Records**: Consult [`docs/adr/`](./docs/adr/) for all historical architectural records (0001–0114).
- **Typography & Multi-Lingual Font Architecture**: Consult [`DESIGN.md`](./DESIGN.md#typography), [`ADR-0112`](./docs/adr/0112-multi-lingual-typography-and-locale-isolated-font-stacks.md), and [`site/src/style.css`](./site/src/style.css) for `:lang()` font stacks (`ja`, `zh-TW`, `ko`, `en`), Google Fonts CDN specifications, dynamic `<html lang="...">` sync, and The Cue Monospace Rule.
- **Test Harness & Modular Suites**: Consult [`site/tests/`](./site/tests/) and [`ADR-0109`](./docs/adr/0109-modular-test-architecture-and-headless-ssr-singleton.md) for 3-tier modular test suites (`pipeline/`, `invariants/`, `ui/`) and headless Vite SSR singleton harness (`site/tests/helpers/vite-server.js`).
- **CI/CD & Deployment Target**: Consult [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) and [`.nvmrc`](./.nvmrc) for runtime version alignment (Cloudflare Pages builds depend on `.nvmrc` and `engines.node >= 22.13.0` for pnpm 11 compatibility).
- **i18n & Context Providers Boundary**: Consult [`CONTEXT.md`](./CONTEXT.md#react-hooks-領域狀態與極端路由安全回退hooks-domain-state--hash-fallback-invariantsadr-0101), [`site/src/App.jsx`](./site/src/App.jsx), [`ADR-0107`](./docs/adr/0107-multi-language-localization-and-taxonomy-boundary.md), and [`ADR-0108`](./docs/adr/0108-administrative-geography-localization-and-venue-integrity.md) for the `<I18nProvider>` root wrapper requirement (`AppContent` pattern), the responsive switcher dichotomy, and administrative geography localization boundaries.
- **Venue & Geography Presentation Boundaries**: Consult [`ADR-0108`](./docs/adr/0108-administrative-geography-localization-and-venue-integrity.md), [`ADR-0110`](./docs/adr/0110-official-venue-localization-and-cross-lingual-presentation.md), and [`ADR-0111`](./docs/adr/0111-venue-master-profiles-native-fallback-and-deep-link-resolution.md) for venue master profiles (`data/venue-profiles.json` as SSOT vs `data/venues.json` as crawler aliases), official venue localization dictionaries (`site/src/lib/locales/venues.js`), native name fallbacks, cross-lingual route resolution (`resolveVenueCanonical`), and the presentation touchpoints (`VenueNavigator`, `ShowMetadataBox`, `TourSlip`, `VenueSlip`, `SongSlip`, `SongMilestonesDrawer`, `MemorialCardModal`, `SearchBox`).
- **Ticket Book & Attendance Tracking (ADR-0114)**: Consult [`ADR-0114`](./docs/adr/0114-concert-ticket-book-domain-refactoring-and-passport-deprecation.md), [`site/src/lib/ticket-book.js`](./site/src/lib/ticket-book.js), and [`site/src/components/ticket-book/`](./site/src/components/ticket-book/) for the personal concert ticket book domain model, `hg_ticket_book_v1` storage schema, dynamic milestones, and commemorative card export. The term "passport" is strictly deprecated in favour of "ticket-book / 巡演票夾 / チケットブック / 티켓북".
- **Issue Tracking**: Consult GitHub Issues via `gh issue view <number>` or `gh issue list` for feature specs and task acceptance criteria.

## Multi-Agent Workspace Hygiene

Multiple autonomous agents frequently operate concurrently in this repository:

1. **Scratch Files Isolation**: Write all exploratory or temporary scripts to `scratch/` or `.scratch/` (both are git-ignored). Never commit or scatter ad-hoc verification scripts in repository root.
2. **Concurrent File Protection**: Never delete, restore, or modify working tree files outside your explicit task scope (e.g. data JSON files under active audit or other agents' temporary scripts).
3. **Task-Scoped Git Operations**: Always inspect git diff with `git --no-pager diff -- <path>` or path filters rather than unstaging or wiping untracked files wholesale, preventing Windows terminal pager hangs.
4. **Data Inspection & Script Hygiene**: Use `node -e` or scripts under `site/scripts/` rather than PowerShell `ConvertFrom-Json` to avoid Windows UTF-8 encoding distortion. In PowerShell, strictly avoid inline nested quote escaping issues: never run inline `node -e` containing backticks (`) or multiline template literals; always write logic directly to `.scratch/temp.mjs` and run `node .scratch/temp.mjs`. For codebase code/text searches, always prefer `git grep -n "<pattern>" -- <path>` over PowerShell `Select-String` (sub-100ms vs 15-30s). Never wrap the entire `CommandLine` parameter in outer escaped quotes (e.g. `\"git status\"` will be treated by PowerShell as a single nonexistent executable path); pass clean command strings like `git status`. Never chain shell commands with `&&` in tool calls on Windows; invoke single commands sequentially.
5. **Vite SSR & Scratch Scripts**: Execute ad-hoc snippets importing frontend modules (e.g. `domain.js`) via `pnpm eval "<code>"` or `site/scripts/eval.mjs` (which injects `loadModule('/src/lib/domain.js')` and `readJson('../data/...')`), avoiding Node.js strict ESM JSON attribute errors (`ERR_IMPORT_ATTRIBUTE_MISSING`).
6. **pnpm Monorepo Workspace Topology (ADR-0103)**: Repository uses root `pnpm-workspace.yaml` targeting `packages: ['site']` with root `pnpm-lock.yaml`. Never create rogue `pnpm-workspace.yaml` inside subdirectories, and invoke workspace scripts from root using `pnpm --filter ./site <cmd>`.
7. **Staging Hygiene Guardrail**: Run `pnpm check:staged` before committing to verify no concurrent agent files (`data/events/*.json`, `docs/reports/*.md`) were mistakenly staged, ADR indexing integrity, and banned/deprecated domain terms compliance (e.g. `passport` deprecated by ADR-0114). ADRs in `docs/adr/` are immutable historical records; never mutate accepted decision text in-place. If sharing files touched by concurrent agents (e.g. `i18n.jsx`), use surgical staging via patch (`git apply --cached .scratch/*.patch`) or explicit hunk staging instead of blanket `git add <file>`.
8. **Parallel Subagent Discipline**: Fan out subagents only across independent files; related files sharing locales or imports are edited sequentially by one agent. Subagent writes persist even when its response is lost to a restart — always re-verify with `grep`/`git diff -- <path>` instead of assuming completion, and never repeat an edit without first reading the current file state.
9. **Solo Developer Workflow**: This is a solo developer repository. Commit or merge integration branches directly into `master` and push to origin; never open GitHub Pull Requests or Draft PRs unless explicitly instructed by the user.
10. **Synchronous Tool Timeout & Anti-Polling Discipline**: For all terminal commands expected to finish quickly (including git operations `git commit`, `git push`, `git add`, `pnpm check`, `pnpm test`, `pnpm build`, `pnpm test:ui`), always set `WaitMsBeforeAsync` to `10000ms` (maximum) to complete synchronously and minimize background task roundtrips. When any command does enter the background, strictly adhere to reactive wakeup: NEVER poll or loop on `manage_task status`; stop calling tools immediately and await the system notification.
11. **Tool Schema & Environment Parameter Discipline**: Adhere strictly to the declared schema of the current environment. For `run_command`, only supply `CommandLine`, `IsDaemon`, `WaitMsBeforeAsync`, and `toolSummary`; never inject unsupported foreign parameters like `Cwd` or `toolAction`. Use native tools (`read_file`, `write_file`, `edit_file`) rather than foreign agent tool names.
12. **Consumer-Friendly Terminology & Product Reality Check**: When designing or implementing user-facing features, never expose engineer-facing jargon (e.g. `JSON`, `Schema`, `Payload`, `Database`, `Envelope`) in UI copy or action labels. For issues introducing heavy developer mechanics into consumer flows, always verify user-facing terminology and product necessity first with the human, prioritizing simple, warm, non-intimidating fan experiences (e.g. 「備份紀錄」/「轉移紀錄」 instead of 「JSON 備份還原」).
13. **Line Ending & File Edit Hygiene**: In `edit_file`, prefer single-line exact anchors to avoid Windows CRLF mismatch failures, and ensure text files adhere to `.gitattributes` (`* text=auto eol=lf`).

## Verification Commands

### Inner Loop (Sub-Second Rapid Iteration)
- `pnpm sync`: Compiles and syncs `data/*.json` and `data/{tours,events}` into `site/src/data/` and updates audit reports. Run whenever data files are updated.
- `pnpm lint`: Runs `oxlint` static linting in ~20ms (`oxlint src -c .oxlintrc.json`). Run immediately after editing any component to catch undeclared variables (`no-undef`) or unused variables (`no-unused-vars`) before heavier SSR test execution.
- `pnpm check:i18n`: Runs bare-CJK regression guard and self-tests across UI components (`site/scripts/check-i18n.mjs`).
- `pnpm test:pipeline`: Runs pure data pipeline & consensus algorithm tests in <50ms (`site/tests/pipeline/`).
- `pnpm test:invariants`: Runs repository structure, design tokens, cross-platform quoting, and AST invariant tests in ~120ms (`site/tests/invariants/`).

### Outer Loop (Integration & Pre-Commit Verification)
- `pnpm test:ui`: Runs headless React SSR, route state machine, and localization tests (`site/tests/ui/`).
- `pnpm check`: Master verification gate running `oxlint`, `check-i18n`, and all 24 test suites (116 invariant assertions). Run before every commit.
- `pnpm test`: Runs data sync, `check-i18n`, and all 24 test suites (116 invariant assertions).
- `pnpm build`: Production build via Vite compiler (`site/dist/`).

## Agent skills

### Issue tracker

Issues live as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels used as-is. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context with root `docs/adr/`. See `docs/agents/domain.md`.
