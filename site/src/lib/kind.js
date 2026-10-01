import {
  KIND_BADGE,
  KIND_ORDER,
  CUE_COLOR,
  SLIP_CARD,
  SLIP_TAB_COLOR,
  KIND_BADGE_CLASS,
} from "./constants.js";

// Normalize the stored kind value (string | array | undefined) to an array.
export function getKindArray(kindValue) {
  if (!kindValue) return [];
  return Array.isArray(kindValue) ? kindValue : [kindValue];
}

// Priority: premiere > unreleased > satoshi-solo > request.
// `unreleased` is derived by the caller (songUnreleased lookup), never stored.
export function primaryKind(kindArray, unreleased) {
  const k = kindArray ?? [];
  if (k.includes("premiere")) return "premiere";
  if (unreleased) return "unreleased";
  if (k.includes("satoshi-solo")) return "satoshi-solo";
  if (k.includes("request")) return "request";
  return null;
}

// Tabs shown on a slip card, in KIND_ORDER (unreleased included when derived).
export function kindTabs(kindArray, unreleased) {
  const set = new Set(kindArray ?? []);
  if (unreleased) set.add("unreleased");
  return KIND_ORDER.filter((k) => set.has(k));
}

// Badges shown in global Song/Title slips (KIND_BADGE keys only, no unreleased).
export function visibleBadges(kindValue) {
  return getKindArray(kindValue)
    .filter((k) => KIND_BADGE[k])
    .map((k) => ({ key: k, label: KIND_BADGE[k], cls: KIND_BADGE_CLASS(k) }));
}

export function slipClassFor(primary) {
  return (primary && SLIP_CARD[primary]) ?? "";
}

export function cueColorFor(primary) {
  return (primary && CUE_COLOR[primary]) ?? "text-muted";
}

export function songWeightFor(primary) {
  return primary ? "font-bold" : "font-medium";
}

export function tabColorFor(kindKey) {
  return SLIP_TAB_COLOR[kindKey] ?? "bg-ink";
}
