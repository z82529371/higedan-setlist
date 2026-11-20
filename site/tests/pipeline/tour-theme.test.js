import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hexToRgb,
  computeContrastRatio,
  isValidEraTheme,
  resolveUnitEraTheme,
  resolveReleaseEraTheme,
  resolveRouteEraTheme,
  buildThemeCssVars,
  resolveMemorialAccent,
} from "../../src/lib/tour-theme.js";

const SAMPLE_THEME = {
  light: "#d96b0b",
  lightInk: "#000000",
  dark: "#f08524",
  darkInk: "#000000",
  source: "https://fc.higedan.com/feature/asiatour2026",
};

const YELLOW_THEME = {
  light: "#e5d93e",
  lightInk: "#000000",
  dark: "#f0e456",
  darkInk: "#000000",
  source: "https://event.higedan.com/feature/at20_tour2122",
};

describe("tour-theme domain seam (ADR-0149)", () => {
  it("parses valid 6-digit hex codes and rejects malformed inputs", () => {
    assert.deepEqual(hexToRgb("#d96b0b"), { r: 217, g: 107, b: 11 });
    assert.deepEqual(hexToRgb("#FFFFFF"), { r: 255, g: 255, b: 255 });
    assert.equal(hexToRgb("#fff"), null);
    assert.equal(hexToRgb("d96b0b"), null);
    assert.equal(hexToRgb(null), null);
  });

  it("computes WCAG 2.1 contrast ratios accurately", () => {
    assert.equal(Math.round(computeContrastRatio("#000000", "#ffffff")), 21);
    assert.equal(Math.round(computeContrastRatio("#ffffff", "#ffffff")), 1);
    assert.ok(computeContrastRatio("#d96b0b", "#000000") >= 5.5);
    assert.ok(computeContrastRatio("#8900ff", "#ffffff") >= 5.5);
  });

  it("validates era themes enforcing WCAG AA (>= 4.5:1) contrast", () => {
    assert.equal(isValidEraTheme(SAMPLE_THEME), true);
    assert.equal(isValidEraTheme(null), false);
    assert.equal(
      isValidEraTheme({
        light: "#ffffff",
        lightInk: "#eeeeee",
        dark: "#000000",
        darkInk: "#111111",
        source: "https://example.com",
      }),
      false
    );
  });

  it("resolves route era theme only in archive show/tour views and falls back to null elsewhere", () => {
    const unitData = new Map([
      ["asia-tour-2026", { unit: { id: "asia-tour-2026", theme: SAMPLE_THEME } }],
      ["free-live-tour-2015", { unit: { id: "free-live-tour-2015" } }],
    ]);
    const unitIdByShowId = new Map([
      ["show-asia-1", "asia-tour-2026"],
      ["show-free-1", "free-live-tour-2015"],
    ]);

    // Tour overview with theme -> resolves theme
    assert.deepEqual(
      resolveRouteEraTheme(
        { viewMode: "archive", tab: "show", selUnitId: "asia-tour-2026", selShow: null },
        { unitData, unitIdByShowId }
      ),
      SAMPLE_THEME
    );

    // Show belonging to themed tour -> resolves theme
    assert.deepEqual(
      resolveRouteEraTheme(
        { viewMode: "archive", tab: "show", selUnitId: "free-live-tour-2015", selShow: "show-asia-1" },
        { unitData, unitIdByShowId }
      ),
      SAMPLE_THEME
    );

    // Unthemed tour -> null (Stage Gold fallback)
    assert.equal(
      resolveRouteEraTheme(
        { viewMode: "archive", tab: "show", selUnitId: "free-live-tour-2015", selShow: "show-free-1" },
        { unitData, unitIdByShowId }
      ),
      null
    );

    // Non-show tabs & non-archive views -> always null
    for (const viewMode of ["landing", "tickets", "ranking", "releases", "journey"]) {
      assert.equal(
        resolveRouteEraTheme(
          { viewMode, tab: "show", selUnitId: "asia-tour-2026", selShow: "show-asia-1" },
          { unitData, unitIdByShowId }
        ),
        null
      );
    }
    for (const tab of ["song", "venue"]) {
      assert.equal(
        resolveRouteEraTheme(
          { viewMode: "archive", tab, selUnitId: "asia-tour-2026", selShow: "show-asia-1" },
          { unitData, unitIdByShowId }
        ),
        null
      );
    }
  });

  it("resolves release era theme in archive song view and falls back to null for unreleased songs (ADR-0150)", () => {
    const RELEASE_THEME = {
      light: "#74062a",
      lightInk: "#ffffff",
      dark: "#f9256a",
      darkInk: "#000000",
      source: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02c03d59ccf637e7ce5754e370",
    };
    const ELDER_THEME = {
      light: "#bcc086",
      lightInk: "#000000",
      dark: "#bdc185",
      darkInk: "#000000",
      source: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0248ca6b510aa5573fcc6b197d",
    };
    const FIRE_GROUND_THEME = {
      light: "#c1133f",
      lightInk: "#ffffff",
      dark: "#f14b75",
      darkInk: "#000000",
      source: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02a9b10c8532efb4e0d876678a",
    };
    const discographyIndex = {
      getAllReleases: () => [
        { id: "single-pretender", coverUrl: RELEASE_THEME.source, theme: RELEASE_THEME },
        { id: "digital-elder-flower", coverUrl: ELDER_THEME.source, theme: ELDER_THEME },
      ],
      getReleaseById: (id) => (id === "single-pretender" ? { id, theme: RELEASE_THEME } : null),
      getTrackThemeForSong: (songId) => (songId === "fire-ground" ? FIRE_GROUND_THEME : null),
    };
    const getSongReleaseIdFn = (songId) =>
      songId === "pretender" || songId === "elder-flower" ? "single-pretender" : null;
    const getSongCoverFn = (songId) =>
      songId === "elder-flower" ? { coverUrl: ELDER_THEME.source } : null;

    assert.deepEqual(resolveReleaseEraTheme({ id: "single-pretender", theme: RELEASE_THEME }), RELEASE_THEME);
    assert.equal(resolveReleaseEraTheme(null), null);

    // Track-level theme override takes precedence
    assert.deepEqual(
      resolveRouteEraTheme(
        { viewMode: "archive", tab: "song", selSong: "fire-ground" },
        { discographyIndex, getSongReleaseIdFn, getSongCoverFn }
      ),
      FIRE_GROUND_THEME
    );

    // Gradient theme emits --color-tape-gradient
    const gradVars = buildThemeCssVars({
      light: "#008fb0",
      lightInk: "#000000",
      dark: "#1cc8ef",
      darkInk: "#000000",
      gradient: ["#008fb0", "#e43d43", "#009332", "#f9bc01"],
    });
    assert.equal(
      gradVars["--color-tape-gradient"],
      "linear-gradient(90deg, #008fb0 0% 25%, #e43d43 25% 50%, #009332 50% 75%, #f9bc01 75% 100%)"
    );

    // Released song -> resolves release theme
    assert.deepEqual(
      resolveRouteEraTheme(
        { viewMode: "archive", tab: "song", selSong: "pretender" },
        { discographyIndex, getSongReleaseIdFn, getSongCoverFn }
      ),
      RELEASE_THEME
    );

    // Dual A-side digital debut song -> matches displayed jacket coverUrl first
    assert.deepEqual(
      resolveRouteEraTheme(
        { viewMode: "archive", tab: "song", selSong: "elder-flower" },
        { discographyIndex, getSongReleaseIdFn, getSongCoverFn }
      ),
      ELDER_THEME
    );

    // Unreleased song -> null (Stage Gold fallback)
    assert.equal(
      resolveRouteEraTheme(
        { viewMode: "archive", tab: "song", selSong: "fuusen" },
        { discographyIndex, getSongReleaseIdFn }
      ),
      null
    );

    // Releases catalog overview -> null (Stage Gold)
    assert.equal(
      resolveRouteEraTheme(
        { viewMode: "releases", tab: "song", selSong: "pretender" },
        { discographyIndex, getSongReleaseIdFn }
      ),
      null
    );
  });

  it("previews draftState era theme while FilterDrawer is open and reverts when closed", () => {
    const TOUR_THEME = {
      light: "#2167a8",
      lightInk: "#ffffff",
      dark: "#4fa3f7",
      darkInk: "#000000",
    };
    const SONG_THEME = {
      light: "#9e1c32",
      lightInk: "#ffffff",
      dark: "#f26b82",
      darkInk: "#000000",
    };
    const unitData = new Map([
      ["themed-tour", { unit: { id: "themed-tour", theme: TOUR_THEME } }],
      ["unthemed-tour", { unit: { id: "unthemed-tour" } }],
    ]);
    const unitIdByShowId = new Map([
      ["show-themed-1", "themed-tour"],
      ["show-unthemed-1", "unthemed-tour"],
    ]);
    const discographyIndex = {
      getTrackThemeForSong: (id) => (id === "themed-song" ? SONG_THEME : null),
    };
    const ctx = { unitData, unitIdByShowId, discographyIndex };

    // Committed route is unthemed, but drawer is open with a themed tour in draftState -> previews TOUR_THEME
    assert.deepEqual(
      resolveRouteEraTheme(
        {
          viewMode: "archive",
          tab: "show",
          selUnitId: "unthemed-tour",
          selShow: "show-unthemed-1",
          selSong: "unthemed-song",
          isFilterDrawerOpen: true,
          draftState: {
            tab: "show",
            unitId: "themed-tour",
            showId: "show-themed-1",
            songId: "unthemed-song",
          },
        },
        ctx
      ),
      TOUR_THEME
    );

    // Switching drawer tab to "song" with themed song -> previews SONG_THEME
    assert.deepEqual(
      resolveRouteEraTheme(
        {
          viewMode: "archive",
          tab: "show",
          selUnitId: "unthemed-tour",
          selShow: "show-unthemed-1",
          selSong: "unthemed-song",
          isFilterDrawerOpen: true,
          draftState: {
            tab: "song",
            unitId: "themed-tour",
            showId: "show-themed-1",
            songId: "themed-song",
          },
        },
        ctx
      ),
      SONG_THEME
    );

    // Switching drawer tab to "venue" or selecting unthemed item -> null (default brand fallback)
    assert.equal(
      resolveRouteEraTheme(
        {
          viewMode: "archive",
          tab: "show",
          selUnitId: "themed-tour",
          selShow: "show-themed-1",
          isFilterDrawerOpen: true,
          draftState: {
            tab: "venue",
            unitId: "themed-tour",
            showId: "show-themed-1",
            songId: "themed-song",
          },
        },
        ctx
      ),
      null
    );
    assert.equal(
      resolveRouteEraTheme(
        {
          viewMode: "archive",
          tab: "show",
          selUnitId: "themed-tour",
          selShow: "show-themed-1",
          isFilterDrawerOpen: true,
          draftState: {
            tab: "show",
            unitId: "unthemed-tour",
            showId: "show-unthemed-1",
          },
        },
        ctx
      ),
      null
    );

    // Closing drawer (isFilterDrawerOpen: false) reverts to committed routeState
    assert.deepEqual(
      resolveRouteEraTheme(
        {
          viewMode: "archive",
          tab: "show",
          selUnitId: "themed-tour",
          selShow: "show-themed-1",
          isFilterDrawerOpen: false,
          draftState: {
            tab: "song",
            unitId: "unthemed-tour",
            showId: "show-unthemed-1",
            songId: "themed-song",
          },
        },
        ctx
      ),
      TOUR_THEME
    );
  });

  it("builds light and dark CSS custom properties with derived alpha tokens", () => {
    const lightVars = buildThemeCssVars(SAMPLE_THEME, false);
    assert.equal(lightVars["--color-band"], "#d96b0b");
    assert.equal(lightVars["--color-band-ink"], "#000000");
    assert.equal(lightVars["--color-tape"], "#d96b0b");
    assert.equal(lightVars["--color-tape-tint"], "rgba(217, 107, 11, 0.2)");
    assert.equal(lightVars["--color-tape-soft"], "rgba(217, 107, 11, 0.45)");
    assert.equal(lightVars["--color-pool"], "#d96b0b");
    assert.equal(lightVars["--color-pool-wash"], "rgba(217, 107, 11, 0.14)");
    assert.equal(lightVars["--color-ambient-glow"], "rgba(217, 107, 11, 0.06)");

    const darkVars = buildThemeCssVars(SAMPLE_THEME, true);
    assert.equal(darkVars["--color-band"], "#f08524");
    assert.equal(darkVars["--color-band-ink"], "#000000");
    assert.equal(darkVars["--color-pool-wash"], "rgba(240, 133, 36, 0.18)");
    assert.equal(darkVars["--color-ambient-glow"], "rgba(240, 133, 36, 0.1)");

    assert.deepEqual(buildThemeCssVars(null, false), {});
  });

  it("resolves readable memorial card accents even for bright yellow themes on light paper", () => {
    const vintage = resolveMemorialAccent({ theme: YELLOW_THEME }, "vintage");
    assert.ok(vintage);
    assert.equal(vintage.accent, "#e5d93e");
    assert.equal(vintage.ink, "#000000");
    assert.ok(
      computeContrastRatio(vintage.textAccent, "#fcfaf2") >= 4.5,
      `Expected readable textAccent on vintage paper, got ${vintage.textAccent}`
    );

    const noir = resolveMemorialAccent({ theme: YELLOW_THEME }, "noir");
    assert.equal(noir.accent, "#f0e456");
    assert.ok(computeContrastRatio(noir.textAccent, "#111319") >= 4.5);

    assert.equal(resolveMemorialAccent({ id: "unthemed" }, "vintage"), null);
    assert.equal(resolveUnitEraTheme({ theme: SAMPLE_THEME }), SAMPLE_THEME);
  });
});
