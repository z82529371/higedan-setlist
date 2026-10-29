# Agent Instructions (AGENTS.md)

Repository conventions and navigation pointers for AI agents working in this codebase.

## Navigation Pointers

- **Domain Glossary**: Consult [`GLOSSARY.md`](./GLOSSARY.md) for authoritative, implementation-free definitions of core live concert terminology (Tour, Event, Show, Setlist, 8 Categories, Ticket Book, Dual-Time Model).
- **Coding Standards & TDD Seams**: Consult [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) for zero-backend static purity (`ADR-0123`), consumer-friendly copy, design token invariants, multi-lingual parity rules, empirical geocoding provenance (`ADR-0124`), and the **Core Domain Seams & Test Map** for `/tdd`.
- **Domain Model & Data Invariants**: Consult [`CONTEXT.md`](./CONTEXT.md) for domain terminology, tour vs event boundaries (`data/tours/*.json` files are named by tour slug such as `one-man-tour-2021-2022-editorial.json` while `tour.id` inside the JSON uses chronological prefix `14-2021-editorial`), 8 performance categories, monotonicity rules, and placeholder track specs (`ADR-0098`).
- **Product Architecture**: Consult [`PRODUCT.md`](./PRODUCT.md) for spotlight landing mode, archive dual-mode toggle, and search ergonomics.
- **Visual Design**: Consult [`DESIGN.md`](./DESIGN.md) for ticket aesthetic tokens, perforation dividers, barcode footers, and contrast rules (small badge text <14px must strictly use high-contrast ink tokens with >= 7:1 AAA contrast; arbitrary unvetted hex colors like text-[#...] are prohibited).
- **URL Routing & Deep Links**: Consult [`site/src/lib/routes.js`](./site/src/lib/routes.js), [`ADR-0101`](./docs/adr/0101-url-hash-deep-linking-and-route-state-machine.md), [`ADR-0114`](./docs/adr/0114-concert-ticket-book-domain-refactoring-and-passport-deprecation.md), and [`ADR-0124`](./docs/adr/0124-interactive-venue-map-and-tour-journey-route-architecture.md) for bidirectional hash schemes (`#/song`, `#/show`, `#/venue`, `#/tour`, `#/tickets`, `#/map`, `#/map/journey`, `#/map/:target`). Note that the legacy `#/passport` route was permanently deprecated and purged in ADR-0114.
- **Architectural Decision Records**: Consult [`docs/adr/`](./docs/adr/) for all historical architectural records (0001–0134).
- **Typography & Multi-Lingual Font Architecture**: Consult [`DESIGN.md`](./DESIGN.md#typography), [`ADR-0112`](./docs/adr/0112-multi-lingual-typography-and-locale-isolated-font-stacks.md), and [`site/src/style.css`](./site/src/style.css) for `:lang()` font stacks (`ja`, `zh-TW`, `ko`, `en`), Google Fonts CDN specifications, dynamic `<html lang="...">` sync, and The Cue Monospace Rule.
- **Test Harness & Modular Suites**: Consult [`site/tests/`](./site/tests/), [`CODING_STANDARDS.md`](./CODING_STANDARDS.md#5-core-domain-seams--test-map-tdd--implement), and [`ADR-0109`](./docs/adr/0109-modular-test-architecture-and-headless-ssr-singleton.md) for 3-tier modular test suites (`pipeline/`, `invariants/`, `ui/`) and headless Vite SSR singleton harness (`site/tests/helpers/vite-server.js`).
- **CI/CD & Deployment Target**: Consult [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) and [`.nvmrc`](./.nvmrc) for runtime version alignment (Cloudflare Pages builds depend on `.nvmrc` and `engines.node >= 22.13.0` for pnpm 11 compatibility).
- **i18n & Context Providers Boundary**: Consult [`CONTEXT.md`](./CONTEXT.md#react-hooks-領域狀態與極端路由安全回退hooks-domain-state--hash-fallback-invariantsadr-0101), [`site/src/App.jsx`](./site/src/App.jsx), [`ADR-0107`](./docs/adr/0107-multi-language-localization-and-taxonomy-boundary.md), and [`ADR-0108`](./docs/adr/0108-administrative-geography-localization-and-venue-integrity.md) for the `<I18nProvider>` root wrapper requirement (`AppContent` pattern), the responsive switcher dichotomy, and administrative geography localization boundaries.
- **Venue & Geography Presentation Boundaries**: Consult [`ADR-0108`](./docs/adr/0108-administrative-geography-localization-and-venue-integrity.md), [`ADR-0110`](./docs/adr/0110-official-venue-localization-and-cross-lingual-presentation.md), [`ADR-0111`](./docs/adr/0111-venue-master-profiles-native-fallback-and-deep-link-resolution.md), [`ADR-0124`](./docs/adr/0124-interactive-venue-map-and-tour-journey-route-architecture.md), [`ADR-0128`](./docs/adr/0128-tour-slip-journey-and-ticket-book-footprint-integration-architecture.md), [`ADR-0129`](./docs/adr/0129-band-animal-avatars-and-ticket-book-footprint-export-architecture.md), [`ADR-0130`](./docs/adr/0130-native-emoji-avatars-japanese-rhd-solo-fan-expedition-and-ticket-book-layout-architecture.md), [`ADR-0131`](./docs/adr/0131-living-postcard-tour-footprint-video-recording-and-distance-omission-architecture.md), [`ADR-0132`](./docs/adr/0132-vector-canvas-engine-subsecond-retina-video-export.md), and [`ADR-0133`](./docs/adr/0133-tour-footprint-postcard-pure-png-export-and-live-memorial-architecture.md) for venue master profiles (`data/venue-profiles.json` as SSOT with verified `lat`/`lng`/`address`/`hubId` vs `data/venues.json` as crawler aliases), pure footprint & transit map engine (`site/src/lib/venue-map.js` + `site/src/lib/japan-map-paths.js`), official venue localization dictionaries (`site/src/lib/locales/venues.js`), native name fallbacks, cross-lingual route resolution (`resolveVenueCanonical`, `resolveMapTarget`), and the presentation touchpoints (`site/src/components/navigators/VenueNavigator.jsx`, `site/src/components/VenueMapCanvas.jsx`, `ShowMetadataBox`, `TourSlip`, `VenueSlip`, `SongSlip`, `SongMilestonesDrawer`, `MemorialCardModal`, `SearchBox`).
- **Ticket Book & Attendance Tracking (ADR-0114, ADR-0115, ADR-0116, ADR-0118)**: Consult [`ADR-0114`](./docs/adr/0114-concert-ticket-book-domain-refactoring-and-passport-deprecation.md), [`ADR-0115`](./docs/adr/0115-tour-stop-in-place-check-in-and-landing-quartet-architecture.md), [`ADR-0116`](./docs/adr/0116-ticket-book-holder-identity-and-milestone-chronicle-architecture.md), [`ADR-0118`](./docs/adr/0118-ticket-book-dual-track-backup-and-defensive-transfer-architecture.md), [`site/src/lib/ticket-book.js`](./site/src/lib/ticket-book.js), and [`site/src/components/ticket-book/`](./site/src/components/ticket-book/) for the personal concert ticket book domain model, `hg_ticket_book_v1` storage schema, in-place check-in interaction, landing feature quartet, dynamic milestones, and commemorative card export. The term "passport" is strictly deprecated in favour of "ticket-book / 巡演票夾 / チケットブック / 티켓북".
- **Discography & Album Affinity**: Consult [`site/src/lib/constants.js`](./site/src/lib/constants.js) (`ALBUM_MAP`, `ALBUM_ORDER`), [`site/src/lib/domain.js`](./site/src/lib/domain.js) (`getSongAlbum`), and [`site/src/lib/ticket-book-milestones.js`](./site/src/lib/ticket-book-milestones.js) (`buildAlbumGroups`) for canonical album era bucketing and repertoire checklist grouping.
- **Issue Tracking**: Consult GitHub Issues via `gh issue view <number>` or `gh issue list` for feature specs and task acceptance criteria.

## Multi-Agent Workspace Hygiene

Multiple autonomous agents frequently operate concurrently in this repository:

1. **Scratch Files Isolation**: Write all exploratory or temporary scripts to `scratch/` or `.scratch/` (both are git-ignored). Never commit or scatter ad-hoc verification scripts in repository root.
2. **Concurrent File Protection & Scoped Verification**: Never delete, restore, or modify working tree files outside your explicit task scope (e.g. data JSON files under active audit or other agents' in-flight components). When running verification commands (`pnpm check`, `pnpm test`), if test failures occur in foreign files currently modified by concurrent agents, strictly refrain from fixing or touching those foreign files; verify your own scoped test suites (`node --test <task-test>`) and note the foreign failures in your report.
3. **Task-Scoped Git Operations**: Always inspect git diff with `git --no-pager diff -- <path>` or path filters rather than unstaging or wiping untracked files wholesale, preventing Windows terminal pager hangs.
4. **Data Inspection & Script Hygiene**: Use `node -e` or scripts under `site/scripts/` rather than PowerShell `ConvertFrom-Json` to avoid Windows UTF-8 encoding distortion. In PowerShell, strictly avoid inline nested quote escaping issues: never run inline `node -e` containing backticks (`) or multiline template literals; always write logic directly to `.scratch/temp.mjs` and run `node .scratch/temp.mjs`. For codebase code/text searches, always prefer `git grep -n "<pattern>" -- <path>` over PowerShell `Select-String` (sub-100ms vs 15-30s). Pass clean command strings like `git status` without outer escaped quotes, and invoke single commands sequentially without `&&`. Use native file tools (`write_file`) or `New-Item -ItemType Directory -Force -Path <path>` instead of `mkdir -p`.
5. **Vite SSR & Scratch Scripts**: Execute ad-hoc snippets importing frontend modules (e.g. `domain.js`) via `pnpm eval "<code>"` or `site/scripts/eval.mjs` (which injects `loadModule('/src/lib/domain.js')` and `readJson('../data/...')`), avoiding Node.js strict ESM JSON attribute errors (`ERR_IMPORT_ATTRIBUTE_MISSING`).
6. **pnpm Monorepo Workspace Topology (ADR-0103)**: Repository uses root `pnpm-workspace.yaml` targeting `packages: ['site']` with root `pnpm-lock.yaml`. Invoke workspace scripts from root using `pnpm --filter ./site <cmd>`.
7. **Staging Hygiene Guardrail**: Run `pnpm check:staged` before committing to verify no concurrent agent files (`data/events/*.json`, `docs/reports/*.md`) were mistakenly staged, ADR indexing integrity, LF line-ending normalization, and banned/deprecated domain terms compliance. ADRs in `docs/adr/` are immutable historical records; never mutate accepted decision text in-place.
8. **Parallel Subagent Discipline**: Fan out subagents only across independent files; related files sharing locales or imports are edited sequentially by one agent. Subagent writes persist even when its response is lost to a restart — always re-verify with `git diff -- <path>` before repeating an edit.
9. **Solo Developer Workflow**: This is a solo developer repository. Commit or merge integration branches directly into `master` and push to origin; do not open GitHub Pull Requests unless explicitly instructed by the user.
10. **Synchronous Tool Timeout & Anti-Polling Discipline**: For all terminal commands expected to finish quickly (`git`, `pnpm check`, `pnpm test`, `pnpm build`, `pnpm test:ui`), set `WaitMsBeforeAsync` to `10000ms` (maximum). When any command enters the background, strictly adhere to reactive wakeup: stop calling tools immediately and await the system notification without polling `manage_task status`.
11. **Tool Schema & Environment Parameter Discipline**: Supply only declared schema parameters (`CommandLine`, `IsDaemon`, `WaitMsBeforeAsync`, `toolSummary` for `run_command`), and use native file tools (`read_file`, `write_file`, `edit_file`).
12. **Coding Standards Compliance**: Follow [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) for zero-backend browser-native architecture (`ADR-0123`), consumer-friendly non-jargon UI copy, and LF line-ending hygiene (`.gitattributes`).

## Verification Commands

### Inner Loop (Sub-Second Rapid Iteration)
- `pnpm check:fast`: Runs combined static linting and CJK checks in ~50ms (`oxlint` + `check-i18n`). Use for rapid sub-second verification before heavier test execution.
- `pnpm sync`: Compiles and syncs `data/*.json` and `data/{tours,events}` into `site/src/data/` and updates audit reports. Run whenever data files are updated.
- `pnpm lint`: Runs `oxlint` static linting in ~20ms (`oxlint src -c .oxlintrc.json`). Run immediately after editing any component to catch undeclared variables (`no-undef`) or unused variables (`no-unused-vars`) before heavier SSR test execution.
- `pnpm check:i18n`: Runs bare-CJK regression guard and self-tests across UI components (`site/scripts/check-i18n.mjs`).
- `pnpm test:pipeline`: Runs pure data pipeline & consensus algorithm tests in <50ms (`site/tests/pipeline/`).
- `pnpm test:invariants`: Runs repository structure, design tokens, cross-platform quoting, and AST invariant tests in ~120ms (`site/tests/invariants/`).

### Outer Loop (Integration & Pre-Commit Verification)
- `pnpm test:ui`: Runs headless React SSR, route state machine, and localization tests (`site/tests/ui/`).
- `pnpm check`: Master verification gate running `oxlint`, `check-i18n`, and all test suites. Run before every commit.
- `pnpm test`: Runs data sync, `check-i18n`, and all test suites.
- `pnpm build`: Production build via Vite compiler (`site/dist/`).

## Agent skills

### Issue tracker

Issues live as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels used as-is. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context with root `docs/adr/`. See `docs/agents/domain.md`.
