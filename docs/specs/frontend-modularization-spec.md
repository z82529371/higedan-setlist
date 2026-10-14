# Specification: 前端巨石檔案模組化與架構分層重構 (Frontend Modularization)

## Problem Statement

As the Official 髭男 dism Setlist Archive has evolved to support complex domain capabilities—including dual-mode spotlight landing and archive modes, eight performance categories, bidirectional song/show tracking, memory cards, and adaptive two-tier pagination—the core frontend codebase has coalesced into massive monolithic files. Specifically, the ticket slip rendering system and the root application coordinator each exceed two thousand lines of code.

From a developer and maintainer perspective, this extreme concentration creates severe cognitive load, slows down code navigation, makes localized modifications prone to unintended side effects, and hinders granular code reviews. From an end-user perspective, any accidental regression in monolithic state handling risks breaking URL hash navigation, deep-linking into specific shows or songs, or corrupting the single-column focus stream.

## Solution

Decompose the monolithic presentation and state management layers into a clean, layered architecture consisting of:
1. **Domain Slips**: Separate, focused slip components for Shows, Songs, and Venues with shared ticket visual decorations.
2. **Dedicated Navigators**: Independent navigation components for performance categories, song libraries, and venue chronicles, powered by an isolated adaptive pagination pill component.
3. **Custom State & Routing Hooks**: Decoupled state management encapsulating URL hash synchronization, deep linking, selection state, and category/year/album/region filtering.
4. **Top-Level Layout & Router**: A slim root coordinator that switches cleanly between the Spotlight Landing Page and the Archive Layout.

This architectural refactoring guarantees 100% behavioral equivalence, zero visual regression, and complete preservation of all established domain rules and single-column stream constraints.

## User Stories

1. As a fan browsing the archive, I want the URL hash deep link to immediately open the exact show slip, song slip, or venue slip I requested, so that I can bookmark and share specific performances without losing context.
2. As a mobile fan, I want the filter drawer and mobile search to open, display draft selections, and commit changes smoothly, so that I can filter large setlist records on a compact screen without UI lag.
3. As a desktop fan, I want the dual-mode toggle to transition seamlessly between the Spotlight Landing Page and the Archive Mode, so that I can enjoy a focused search experience or explore deep concert chronicles.
4. As a fan inspecting a concert, I want the show slip to clearly display the setlist, encore boundaries, version note annotations, guest appearances, and source record badges, so that I have access to authoritative live history.
5. As a fan investigating a song, I want the song slip to display the total performance count, first live appearance, career timeline, and acoustic or special version tags, so that I can understand how a track evolved across tours.
6. As a fan reviewing a venue, I want the venue slip to present the chronological concert log and career milestones for that specific hall or stadium, so that I can retrace the band's history at that location.
7. As a fan sharing a ticket, I want the commemorative memory card modal to export authentic, high-resolution ticket slips, so that I can save and post my concert memories to social media.
8. As a fan navigating long song lists or dozens of tour dates, I want adaptive two-tier pagination pills to group records into manageable chunks of fifty and pages of ten, so that I never face an endless wall of buttons or scrolling fatigue.
9. As a developer maintaining the codebase, I want show slip rendering logic to be encapsulated in its own domain module, so that changes to setlist presentation do not risk breaking song or venue slips.
10. As a developer maintaining the codebase, I want song slip tracking and statistics to be isolated in a dedicated module, so that modifications to song frequency calculations are easily tested and reviewed.
11. As a developer maintaining the codebase, I want venue slip history to reside in an independent module, so that venue-specific milestone rules are decoupled from other view layers.
12. As a developer enhancing navigation, I want show, song, and venue navigators to be separate modular components, so that category filtering, album grouping, and regional sorting can be maintained independently.
13. As a developer working on state management, I want URL hash routing and deep linking to be contained within a specialized custom hook, so that routing edge cases can be tested in isolation from rendering.
14. As a developer working on data display, I want filter calculations across the eight performance categories to be managed by a dedicated filtering hook, so that derived statistics remain memoized and predictable.
15. As a developer reviewing pull requests, I want diffs to be isolated to focused files under eight hundred lines, so that architectural changes are transparent, legible, and safe to merge.
16. As a CI automated pipeline, I want the entire build and smoke testing pipeline to pass cleanly with zero warnings or broken imports, so that continuous deployment remains uninterrupted.

## Implementation Decisions

- **Layered Architectural Separation**: The system will be divided into four distinct architectural tiers: Domain Presentation (Slips), Navigation Controls (Navigators), Stateful Logic (Hooks), and Application Shell (Layout & Coordinator).
- **Domain Slip Boundaries**: Presentation logic will strictly follow the domain model, maintaining distinct presentation boundaries for Show Slips, Song Slips, and Venue Slips. Shared ticket artifacts—such as perforation tear lines, vintage barcodes, and external source labels—will be extracted into a shared presentation module.
- **Unified Backward-Compatible Slip Export**: The slips module will expose a unified public export contract to preserve backward compatibility, allowing consumer modules to import slip components without breaking path changes.
- **Navigator Decomposition**: The eight-category tour/show navigator, the album-grouped song navigator, and the region-grouped venue navigator will be extracted into autonomous presentation modules, each accepting typed props and callbacks.
- **Adaptive Pagination Pill Isolation**: The two-tier chunked pagination control (chunking by fifty, paging by ten) will be isolated into a reusable common navigation component.
- **Route and State Decoupling via Custom Hooks**:
  - A dedicated routing hook will oversee URL hash parsing, history navigation, deep link penetration, and active slip selection.
  - A dedicated filtering hook will oversee category tab selection, year sorting, album grouping, regional filtering, and memoized count statistics.
- **Slim Application Coordinator**: The root application component will be stripped of deep rendering functions and raw filter state, retaining solely high-level coordination between the landing view and the archive layout.
- **Strict Adherence to Domain Constraints**: All refactored modules must honor existing domain vocabulary and constraints (such as single-column focus stream, dual-mode architecture, and eight performance categories) without introducing horizontal split views or button walls.

## Testing Decisions

- **Seam Selection**:
  - **Highest Seam (Production Build & Bundler Seam)**: The primary verification seam is the production compiler and bundler pipeline. This seam tests module resolution, JSX syntax validity, CSS module generation, and tree-shaking across all new and refactored units.
  - **Runtime Pipeline Seam (Smoke Tests)**: The pipeline smoke test suite verifies domain invariants, setlist monotonicity, template anchoring, and track key resolution across all synced tours, events, and songs.
  - **Interface Contract Seam**: Component prop surface verification ensuring identical input/output contracts (selection callbacks, data structures, and identifiers) across all extracted slips and navigators.
- **Good Test Characteristics**: Tests must evaluate external observable behavior (successful production compilation, valid bundle generation, and invariant data assertions) rather than internal file structure or private variable naming.
- **Prior Art**: The project relies on Node.js TAP smoke testing (`smoke-test.mjs`), data validation pipelines (`validate-data.mjs`), and Vite production builds.

## Out of Scope

- Modifying the underlying data models (`tours`, `events`, `songs` JSON structures) or sync scripts.
- Changing visual design tokens, color schemes, font families, or cardstock textures defined in the design guidelines.
- Altering the eight performance category classifications, album grouping order, or region order.
- Introducing external state management libraries (Redux, Zustand, MobX); vanilla React hooks and standard composition patterns must be retained.

## Further Notes

- Following this modularization, an Architectural Decision Record (`ADR-0101`) will be created under the project documentation to formalize this component hierarchy and file decomposition for future team members and agents.
