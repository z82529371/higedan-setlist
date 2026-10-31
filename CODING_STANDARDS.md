# Coding Standards

Engineering standards, judgement baselines, and module test seams for code review and implementation.

## 1. Zero-Backend & Static Purity (ADR-0123)

- **Pure Client-Side**: This application is a 100% static client-side SPA hosted on Cloudflare Pages. It has zero backend runtime, zero serverless databases (e.g. D1), and zero external form webhooks.
- **Browser-Native Primitives**: When addressing client capabilities or system-level limitations (e.g. unconfigured desktop email clients), strictly choose browser-native web primitives (`mail.google.com` Web Compose, Clipboard API, Web Share API, deep URL hashes) over external SaaS services or backend proxies.
- **Zero Secrets**: Never introduce `.env` secrets or client-side API keys. Public static assets and client-side data sync (`pnpm sync`) drive all application state.

## 2. Fan Experience & Consumer-Friendly Copy

- **No Developer or Technical Layout Jargon**: Never expose engineer-facing mechanics or internal layout specifications in UI copy, modals, or user alerts.
  - *Avoid*: `JSON 備份還原`, `Schema 驗證錯誤`, `Payload`, `Database`, `Envelope`, `HTTP 500`, `// 540PX`, `540px`, `遠征踏破`.
  - *Adopt*: `備份紀錄`, `轉移紀錄`, `檔案格式不符`, `請檢查網路連線`, clean titles without internal dimension suffixes, `參戰紀念` (`LIVE MEMORIAL`).
- **Commemorative Card Export Modals Ergonomics**: Modals dedicated to saving commemorative cards (such as `MilestoneCardModal` or `FootprintCardModal`) must stay focused on souvenir preview and one-click export (`exportElementToPng`). Never clutter export modal toolbars with player transport widgets (playback speed selectors `[1×][2×][4×]`, timeline scrubbers, replay loops) — interactive playback belongs exclusively in primary exploration views (e.g. `TicketBookFootprintMap`).
- **Low-Friction Interactions**: Minimize steps required for fan participation. Forms must provide immediate copy-to-clipboard or direct compose fallbacks with instant visual feedback.

## 3. Ticket Aesthetic & Token Discipline (DESIGN.md)

- **Visual Tokens**:
  - Border radius: Strictly adhere to `rounded-[3px]` for tickets, badges, and modals.
  - Shadows: Strictly use zero-blur `shadow-xs` / `dark:shadow-none`.
  - Monospace cue: Numbers, dates, codes, and setlist counters use `font-mono` (The Cue Monospace Rule); subtitles and explanatory labels use proportional typography.
  - Atomic Show Date Invariant: Whenever rendering a show date alongside a venue or city name, keep the date in a dedicated `font-mono whitespace-nowrap shrink-0` span and apply `truncate` only to the sibling venue/city span so dates never clip or wrap.
  - 540px Postcard & Ticket Slip Mobile Fluidity: Components intended for standard 540px offline export must remain 100% fluid on mobile screens. Outer card containers must strictly use `w-full max-w-[540px]`, never fixed unconstrained `w-[540px]` or hardcoded inline `width: 540px`. Inner rows (such as postmark stamps and summary metrics) must remain resilient across narrow 360px~390px viewports without vertical displacement or awkward clipping.
- **Contrast**: Small text (<14px) and badge labels must meet AAA 7:1 contrast using semantic theme ink tokens (`text-ink`, `text-ink-muted`). Never introduce unvetted arbitrary hex colors (e.g. `text-[#...]`).

## 4. Multi-Lingual Parity (ADR-0107, ADR-0112)

- **Symmetric i18n**: All user-facing strings must be added simultaneously across all 4 supported locales:
  - Traditional Chinese (`zh-TW.js`)
  - Japanese (`ja.js`)
  - English (`en.js`)
  - Korean (`ko.js`)
- **No Bare CJK**: All JSX templates must use `t("...")` keys; bare CJK text outside locale files is forbidden and blocked by `pnpm check:i18n`.

## 5. Empirical Geographic Data & Geocoding Provenance (ADR-0124)

- **No LLM-Memorized Coordinates**: Never estimate or hardcode `lat`/`lng` or `address` in `data/venue-profiles.json` from LLM parametric memory. Every physical venue must store both verified 4-decimal WGS84 `lat`/`lng` and its official `address` (starting with the Japanese `都道府県` for domestic venues).
- **Authoritative Geocoding Recipe**:
  1. **Wikipedia GeoData API**: Query `https://{ja|en}.wikipedia.org/w/api.php?action=query&titles=...&redirects=1&prop=coordinates&colimit=500&format=json` (always pass `&colimit=500`; default `10` truncates batched queries).
  2. **GSI Japan Official Address & Reverse Geocoder**: `msearch.gsi.go.jp/address-search/AddressSearch?q=...` is strictly a street-address (`都道府県+市区町村+町丁・番地`) geocoder — never pass raw POI/venue names (causes substring false-positives in wrong prefectures). Pair coordinates with `msearch.gsi.go.jp/reverse-geocoder/LonLatToAddress` + `maps.gsi.go.jp/js/muni.js` (`GSI.MUNI_ARRAY`) to verify exact municipality and chome.
  3. **Overseas Venues**: Use `nominatim.openstreetmap.org` with a descriptive `User-Agent` header. Do not use `photon.komoot.io` (connection timeouts).

## 6. Core Domain Seams & Test Map (`/tdd` & `/implement`)

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
| `venue-map.js` | `projectLatLngToSvg`, `buildPrefectureMapStats`, `computeSpiderfyOffsets`, `buildJourneySequence`, `resolveMapTarget`, `formatMapBadgeLabel` | `tests/pipeline/venue-map.test.js`, `tests/invariants/venue-profiles.test.js`, `tests/ui/venue-map-ui.test.js` |
| `japan-map-paths.js` | `JAPAN_PREFECTURE_PATHS`, `OVERSEAS_INSET_COUNTRIES`, `getZoomViewBox` | `tests/pipeline/venue-map.test.js`, `tests/ui/venue-map-ui.test.js` |
| `song-media.js` | `parseTimestamp`, `formatTimestamp`, `buildYouTubeEmbedUrl`, `buildYouTubeWatchUrl`, `extractSongMedia`, `resolveActiveMedia` | `tests/pipeline/song-media.test.js`, `tests/ui/song-media-modal.test.js` |
