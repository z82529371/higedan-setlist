/**
 * Tour Era Accent Theme Engine (ADR-0149)
 * Pure domain helpers for validating, resolving, and projecting official tour/event
 * era accent colors onto the Stage Monitor Setlist accent & masking-tape layer.
 */

export const ERA_THEME_CSS_PROPS = [
  "--color-band",
  "--color-band-ink",
  "--color-tape",
  "--color-tape-tint",
  "--color-tape-soft",
  "--color-tape-gradient",
  "--color-pool",
  "--color-pool-wash",
  "--color-ambient-glow",
];

const HEX6_RE = /^#[0-9a-fA-F]{6}$/;

export function hexToRgb(hex) {
  if (typeof hex !== "string" || !HEX6_RE.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function relativeLuminance({ r, g, b }) {
  const linear = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function computeContrastRatio(hexA, hexB) {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 0;
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isValidEraTheme(theme) {
  if (!theme || typeof theme !== "object") return false;
  if (!hexToRgb(theme.light) || !hexToRgb(theme.lightInk)) return false;
  if (!hexToRgb(theme.dark) || !hexToRgb(theme.darkInk)) return false;
  if (computeContrastRatio(theme.light, theme.lightInk) < 4.5) return false;
  if (computeContrastRatio(theme.dark, theme.darkInk) < 4.5) return false;
  if (theme.gradient !== undefined) {
    if (!Array.isArray(theme.gradient) || theme.gradient.length < 2) return false;
    for (const stop of theme.gradient) {
      if (!hexToRgb(stop)) return false;
      if (computeContrastRatio(stop, theme.lightInk) < 4.5) return false;
      if (computeContrastRatio(stop, theme.darkInk) < 4.5) return false;
    }
  }
  return true;
}

export function resolveUnitEraTheme(unit) {
  if (!unit || typeof unit !== "object") return null;
  const candidate = unit.theme || unit.unit?.theme || null;
  return isValidEraTheme(candidate) ? candidate : null;
}

export function resolveReleaseEraTheme(release) {
  if (!release || typeof release !== "object") return null;
  return isValidEraTheme(release.theme) ? release.theme : null;
}

export function resolveRouteEraTheme(
  routeState,
  { unitData, unitIdByShowId, discographyIndex, getSongReleaseIdFn, getSongCoverFn } = {}
) {
  if (!routeState || routeState.viewMode !== "archive") {
    return null;
  }

  // Live preview staged FilterDrawer selections until drawer closes or commits
  const effectiveRoute =
    routeState.isFilterDrawerOpen && routeState.draftState
      ? {
          viewMode: routeState.viewMode,
          tab: routeState.draftState.tab || routeState.tab,
          selUnitId: routeState.draftState.unitId,
          selShow: routeState.draftState.showId,
          selSong: routeState.draftState.songId,
        }
      : routeState;

  if (effectiveRoute.tab === "show") {
    const { selShow, selUnitId } = effectiveRoute;
    const targetUnitId =
      (selShow && unitIdByShowId?.get?.(selShow)) ||
      selUnitId ||
      null;

    if (!targetUnitId || !unitData?.get) return null;
    const ud = unitData.get(targetUnitId);
    return resolveUnitEraTheme(ud?.unit || ud);
  }

  if (effectiveRoute.tab === "song" && effectiveRoute.selSong && discographyIndex) {
    const trackTheme = discographyIndex.getTrackThemeForSong?.(effectiveRoute.selSong);
    if (isValidEraTheme(trackTheme)) return trackTheme;

    const coverUrl = getSongCoverFn?.(effectiveRoute.selSong)?.coverUrl;
    if (coverUrl && typeof discographyIndex.getAllReleases === "function") {
      const matchedByCover = discographyIndex
        .getAllReleases()
        .find((rel) => rel?.coverUrl === coverUrl && isValidEraTheme(rel.theme));
      if (matchedByCover) return matchedByCover.theme;
    }

    if (getSongReleaseIdFn && typeof discographyIndex.getReleaseById === "function") {
      const releaseId = getSongReleaseIdFn(effectiveRoute.selSong);
      if (!releaseId) return null;
      const release = discographyIndex.getReleaseById(releaseId);
      return resolveReleaseEraTheme(release);
    }
  }

  return null;
}

export function buildThemeCssVars(theme, isDark = false) {
  if (!isValidEraTheme(theme)) return {};
  const accent = isDark ? theme.dark : theme.light;
  const ink = isDark ? theme.darkInk : theme.lightInk;
  const rgb = hexToRgb(accent);
  if (!rgb) return {};
  const { r, g, b } = rgb;

  const vars = {
    "--color-band": accent,
    "--color-band-ink": ink,
    "--color-tape": accent,
    "--color-tape-tint": `rgba(${r}, ${g}, ${b}, 0.2)`,
    "--color-tape-soft": `rgba(${r}, ${g}, ${b}, 0.45)`,
    "--color-pool": accent,
    "--color-pool-wash": `rgba(${r}, ${g}, ${b}, ${isDark ? 0.18 : 0.14})`,
    "--color-ambient-glow": `rgba(${r}, ${g}, ${b}, ${isDark ? 0.1 : 0.06})`,
  };
  if (Array.isArray(theme.gradient) && theme.gradient.length >= 2) {
    const n = theme.gradient.length;
    const stops = theme.gradient.map((color, i) => {
      const start = ((i * 100) / n).toFixed(2).replace(/\.00$/, "");
      const end = (((i + 1) * 100) / n).toFixed(2).replace(/\.00$/, "");
      return `${color} ${start}% ${end}%`;
    });
    vars["--color-tape-gradient"] = `linear-gradient(90deg, ${stops.join(", ")})`;
  }
  return vars;
}

function adjustForContrast(accentHex, bgHex, isDarkBg) {
  if (computeContrastRatio(accentHex, bgHex) >= 4.5) return accentHex;
  const base = hexToRgb(accentHex);
  if (!base) return isDarkBg ? "#f4f4f5" : "#1c1917";

  // Step smoothly toward dark ink (for light paper) or light ink (for dark card)
  for (let step = 1; step <= 20; step++) {
    const t = step / 20;
    const candidate = rgbToHex(
      isDarkBg
        ? {
            r: base.r + (255 - base.r) * t,
            g: base.g + (255 - base.g) * t,
            b: base.b + (255 - base.b) * t,
          }
        : {
            r: base.r * (1 - t),
            g: base.g * (1 - t),
            b: base.b * (1 - t),
          }
    );
    if (computeContrastRatio(candidate, bgHex) >= 4.6) {
      return candidate;
    }
  }
  return isDarkBg ? "#f4f4f5" : "#1c1917";
}

export function resolveMemorialAccent(unit, cardStyle = "vintage") {
  const theme = resolveUnitEraTheme(unit);
  if (!theme) return null;

  const isNoir = cardStyle === "noir";
  const accent = isNoir ? theme.dark : theme.light;
  const ink = isNoir ? theme.darkInk : theme.lightInk;
  const bgHex =
    cardStyle === "vintage"
      ? "#fcfaf2"
      : cardStyle === "white"
      ? "#ffffff"
      : "#111319";

  return {
    accent,
    ink,
    textAccent: adjustForContrast(accent, bgHex, isNoir),
    isEraThemed: true,
  };
}
