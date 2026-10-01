// Shared setlist restore + encore rule (node-safe, zero dependencies).
// Consumed by the Vite frontend (lib/domain.js) and the node pipeline
// (scripts/lib/consensus.js, scripts/validate-data.mjs).

export function resolve(diff, tpl) {
  const notes = Object.fromEntries(
    (diff.note ?? []).map((n) => [n.order, n.note])
  );
  const kinds = Object.fromEntries(
    (diff.kind ?? []).map((k) => [k.order, k.kind])
  );
  const skip = new Set(diff.skip ?? []);

  const inserts = {};
  for (const ins of diff.insert ?? []) {
    (inserts[ins.after] ??= []).push({ ...ins.item });
  }

  const result = [];
  if (inserts[0]) {
    result.push(...inserts[0]);
  }

  for (const item of tpl) {
    if (!skip.has(item.order)) {
      const copy = { ...item };
      if (copy.order in notes) copy.note = notes[copy.order];
      if (copy.order in kinds) copy.kind = kinds[copy.order];
      result.push(copy);
    }
    if (inserts[item.order]) {
      result.push(...inserts[item.order]);
    }
  }

  return result;
}

export function resolveShowItems(unit, show) {
  if (unit.templateSetlist)
    return resolve(show.diff ?? {}, unit.templateSetlist);
  return show.setlist ?? [];
}

// First encore order in a template (raw or mapped shape); 18 when unknown.
export function encoreStartOrderOf(tpl) {
  return (tpl ?? []).find((t) => t.encore)?.order ?? 18;
}

// Anchor at/after (startOrder - 1) counts as encore territory.
export function isEncorePosition(after, startOrder) {
  return after >= startOrder - 1;
}

// Number a split setlist with the given prefix (M / EN). Interludes
// (neither songId nor title) take no number. Pure: input items untouched.
export function assignCues(list, prefix) {
  let n = 0;
  return (list ?? []).map((item) => {
    if (!item.songId && !item.title) return { item, cue: null };
    n += 1;
    return { item, cue: `${prefix}${n}` };
  });
}
