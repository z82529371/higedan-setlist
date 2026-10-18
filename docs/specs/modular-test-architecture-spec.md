# Specification: 測試架構抽離、領域模組化與無頭 SSR 單例最佳化 (Modular Test Architecture)

## Problem Statement

As the Official 髭男 dism Setlist Archive expanded across tours, dual-mode architectures, internationalization (ADR-0107), and canonical entity boundaries (ADR-0105, ADR-0106), the regression testing surface grew proportionally. However, all domain assertions, architecture guards, and headless SSR component tests remained concentrated inside a single monolithic script: `site/scripts/smoke-test.mjs`, spanning over 3,600 lines across 16 sub-suites.

From a developer and architectural perspective, this monolithic script creates several critical liabilities:
1. **Directory Boundary Violation**: `site/scripts/` is intended for data synchronization, validation, and maintenance tasks; collocating test suites inside it obscures project boundaries and violates modern workspace modularity.
2. **Coarse Execution & Development Friction**: Running any single invariant check requires booting the entire 3,600-line suite, executing all 82 assertions and spinning up an unnecessary Vite dev server even for pure mathematical or string parsing algorithms.
3. **High Cognitive Load**: Navigating a 3,600-line test file makes locating test failures difficult and complicates parallel branch development or subagent review.

From a reliability perspective, the lack of granular domain test boundaries increases the risk of undetected test harness regressions during refactoring.

## Solution

Decompose the monolithic smoke test file into a clean, domain-aligned test hierarchy inside a dedicated test package directory (`site/tests/`):
1. **Dedicated Test Directory (`site/tests/`)**: Completely separate automated test suites from data operations scripts (`site/scripts/`), upholding the workspace package boundary (ADR-0103).
2. **Three-Tier Domain Modularization**:
   - **`pipeline/`**: Pure data pipeline, parsing, and monotonicity algorithms (e.g., Bangkok reordering, member solo covers, noise filtering, canonical title aliases, re-recorded boundaries).
   - **`invariants/`**: Structural architecture rules, design token contracts, and workspace topology.
   - **`ui/`**: Headless React SSR rendering, custom hook routing machines, tour statistics, i18n dictionaries, localized search, and ticket card image export.
3. **Headless SSR Lazy Singleton Harness (`helpers/`)**: Extract a shared Vite SSR runner singleton. Pure algorithmic tests execute instantly in Node.js (<50ms) without spinning up Vite, while UI suites share a single headless Vite dev server instance without redundant reboot costs.
4. **Granular CLI Runners with 100% Backward Compatibility**: Add targeted npm scripts (`test:pipeline`, `test:ui`, `test:invariants`) while preserving `pnpm test`, `pnpm check`, and keeping `site/scripts/smoke-test.mjs` as a facade proxy.

## User Stories

1. As a developer modifying setlist diffing or consensus algorithms, I want to run `pnpm test:pipeline`, so that I receive instant test feedback in under 50 milliseconds without starting a Vite server.
2. As a developer refactoring UI components or localization dictionaries, I want to run `pnpm test:ui`, so that all SSR and layout assertions are validated against a shared Vite harness without repeating server boot overhead.
3. As a developer auditing workspace hygiene or design tokens, I want to run `pnpm test:invariants`, so that repository conventions and lint boundaries are verified independently.
4. As a developer maintaining the codebase, I want tests to be organized in modular files under 400 lines mapped 1:1 to their ADR topics, so that I can easily locate and maintain test logic.
5. As an autonomous agent running exploratory tasks, I want isolated test suites with clear domain boundaries, so that I can work on specific subsystems without cross-suite file locks or merge conflicts.
6. As a CI/CD workflow running in GitHub Actions, I want `pnpm check` and `pnpm test` to continue functioning identically and pass all 82 assertions, so that deployment pipelines remain uninterrupted.
7. As a developer accustomed to legacy scripts, I want `node scripts/smoke-test.mjs` to transparently execute all test suites, so that historical muscle memory and documentation links never break.
8. As a project maintainer, I want zero external test dependencies (no Vitest, Jest, or JSDOM), so that the dependency footprint remains minimal and execution uses Node.js 22 native primitives.

## Implementation Decisions

- **Dedicated Test Directory Topology**: Tests are located in `site/tests/`, adhering to `packages: ['site']` in `pnpm-workspace.yaml`. The root repository remains clean, and `site/scripts/` is reserved strictly for operational scripts.
- **Node.js 22 Native Runner**: The test framework strictly uses Node.js 22 native `node:test` and `node:assert/strict`. No external testing libraries or runner wrappers are introduced.
- **Headless Vite SSR Lazy Singleton**:
  - The shared test harness provides an asynchronous singleton module loader (`getViteServer()` / `renderComponent()`).
  - The Vite server is instantiated only when a test explicitly requests SSR rendering, and tears down cleanly in global hooks or process exit.
- **Three-Tier Domain Directory Structure**:
  - `pipeline/`: Six test files mapped to ADR-0042, ADR-0043/0032, ADR-0005/0025, ADR-0020/0028, ADR-0105, ADR-0106.
  - `invariants/`: Three test files mapped to ADR-0101 (modularization), DESIGN.md (design tokens), ADR-0103 (workspace topology).
  - `ui/`: Seven test files mapped to SSR mount, route machines, tour statistics (ADR-0102), and issues #16 through #19.
  - `helpers/`: Shared Vite server harness, mock datasets, and test lifecycle utilities.
- **Targeted CLI Scripts & Facade Seam**:
  - `site/package.json` provides `test`, `test:pipeline`, `test:invariants`, `test:ui`.
  - `site/scripts/smoke-test.mjs` is refactored into a facade that delegates to the test runner, maintaining backward compatibility.

## Testing Decisions

- **Primary Seam (CLI Entry Point & Invariant Verification Seam)**: The entire refactoring is tested at the highest operational seam: invoking `pnpm test` and `pnpm check` from workspace root and within `site/`. The observable behavior is that all 82 assertions across the 16 suites must execute and pass (0 failures), matching the baseline behavior exactly.
- **Sub-Suite Granularity Seams**: Each individual runner (`pnpm test:pipeline`, `pnpm test:invariants`, `pnpm test:ui`) forms an independent verification seam to ensure zero cross-module coupling.
- **Good Test Characteristics**: Tests test external contract behavior and system invariants (monotonic ordering, URL hash resolution, SSR markup tokens) rather than private variables.
- **Prior Art**: Node.js TAP smoke testing (`smoke-test.mjs`), `check-i18n.mjs`, and Node 22 native `node:test`.

## Out of Scope

- Introducing third-party testing frameworks (Vitest, Jest, Mocha, Playwright, Cypress).
- Modifying underlying domain production logic in `site/src/` or `data/`.
- Changing or deleting any of the existing 82 test assertions or invariant rules.
- Introducing browser DOM emulators (JSDOM, happy-dom).

## Further Notes

- Documented in ADR-0108 (`0108-modular-test-architecture-and-headless-ssr-singleton.md`).
- Aligned with Node.js 22 LTS runtime engine specifications.
