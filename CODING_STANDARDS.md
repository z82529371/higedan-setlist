# Coding Standards

Engineering standards, judgement baselines, and module test seams for code review and implementation.

## 1. Zero-Backend & Static Purity (ADR-0123)

- **Pure Client-Side**: This application is a 100% static client-side SPA hosted on Cloudflare Pages. It has zero backend runtime, zero serverless databases (e.g. D1), and zero external form webhooks.
- **Browser-Native Primitives**: When addressing client capabilities or system-level limitations (e.g. unconfigured desktop email clients), strictly choose browser-native web primitives (`mail.google.com` Web Compose, Clipboard API, Web Share API, deep URL hashes) over external SaaS services or backend proxies.
- **Zero Secrets**: Never introduce `.env` secrets or client-side API keys. Public static assets and client-side data sync (`pnpm sync`) drive all application state.

## 2. Fan Experience & Consumer-Friendly Copy

- **No Developer Jargon**: Never expose engineer-facing mechanics in UI copy, modals, or user alerts.
  - *Avoid*: `JSON 備份還原`, `Schema 驗證錯誤`, `Payload`, `Database`, `Envelope`, `HTTP 500`.
  - *Adopt*: `備份紀錄`, `轉移紀錄`, `檔案格式不符`, `請檢查網路連線`.
- **Low-Friction Interactions**: Minimize steps required for fan participation. Forms must provide immediate copy-to-clipboard or direct compose fallbacks with instant visual feedback.

## 3. Ticket Aesthetic & Token Discipline (DESIGN.md)

- **Visual Tokens**:
  - Border radius: Strictly adhere to `rounded-[3px]` for tickets, badges, and modals.
  - Shadows: Strictly use zero-blur `shadow-xs` / `dark:shadow-none`.
  - Monospace cue: Numbers, dates, codes, and setlist counters use `font-mono` (The Cue Monospace Rule); subtitles and explanatory labels use proportional typography.
- **Contrast**: Small text (<14px) and badge labels must meet AAA 7:1 contrast using semantic theme ink tokens (`text-ink`, `text-ink-muted`). Never introduce unvetted arbitrary hex colors (e.g. `text-[#...]`).

## 4. Multi-Lingual Parity (ADR-0107, ADR-0112)

- **Symmetric i18n**: All user-facing strings must be added simultaneously across all 4 supported locales:
  - Traditional Chinese (`zh-TW.js`)
  - Japanese (`ja.js`)
  - English (`en.js`)
  - Korean (`ko.js`)
- **No Bare CJK**: All JSX templates must use `t("...")` keys; bare CJK text outside locale files is forbidden and blocked by `pnpm check:i18n`.

## 5. Core Domain Seams & Test Map (`/tdd` & `/implement`)

When proposing and testing public seams during `/tdd` or `/implement`, target these canonical module boundaries and test suites:

| Domain Module (`site/src/lib/`) | Public Seam / Export | Target Test Suite (`site/tests/`) |
| :--- | :--- | :--- |
| `domain.js` | `buildIndex`, `computeTourStatistics`, `defaultShowId`, `getSongAlbum` | `tests/ui/tour-statistics.test.js`, `tests/pipeline/canonical-titles.test.js` |
| `resolve.js` | `resolve`, `assignCues`, `encoreStartOrderOf` | `tests/pipeline/resolve-monotonicity.test.js` |
| `routes.js` | `parseRoute`, `routeHash` | `tests/invariants/design-tokens.test.js`, `tests/ui/route-machine.test.js` |
| `ticket-book.js` | `loadTicketBook`, `toggleShowAttended`, `exportBackupFile`, `parseTransferCode` | `tests/ui/ticket-book.test.js` |
| `ticket-book-milestones.js` | `computeTicketBookMilestones`, `buildAlbumGroups` | `tests/ui/ticket-book-milestones.test.js` |
| `feedback.js` | `buildSetlistMailto`, `buildGmailWebComposeUrl`, `buildLeadFallbackText` | `tests/pipeline/feedback-lead.test.js`, `tests/ui/lead-drop-modal.test.js` |
| `locales/venues.js` | `localizeVenue`, `getNativeVenue`, `resolveVenueCanonical`, `matchVenue` | `tests/ui/venue-localization.test.js`, `tests/invariants/venue-profiles.test.js` |
