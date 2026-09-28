import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const toursDir = resolve(root, "data", "tours");

function resolveShow(show, tpl) {
  const diff = show.diff ?? {};
  const skip = new Set(diff.skip ?? []);
  const inserts = {};
  for (const ins of diff.insert ?? []) {
    (inserts[ins.after] ??= []).push({ ...ins.item });
  }
  const result = [];
  if (inserts[0]) result.push(...inserts[0]);
  for (const item of tpl) {
    if (!skip.has(item.order)) {
      result.push({ ...item });
    }
    if (inserts[item.order]) {
      result.push(...inserts[item.order]);
    }
  }
  return result;
}

export function validateAndCleanTours() {
  const files = readdirSync(toursDir).filter((f) => f.endsWith(".json"));
  let totalIssuesFixed = 0;

  for (const file of files) {
    const filePath = resolve(toursDir, file);
    const tour = JSON.parse(readFileSync(filePath, "utf8"));
    if (!tour.templateSetlist || !tour.shows) continue;

    let modified = false;
    const tpl = tour.templateSetlist;
    const encoreStartOrder = tpl.find((t) => t.encore)?.order ?? 18;

    for (const show of tour.shows) {
      if (!show.diff) continue;

      // Fix 1: Auto-fix encore flag for inserts after encore start
      if (show.diff.insert) {
        for (const ins of show.diff.insert) {
          if (ins.after >= encoreStartOrder - 1 && ins.item.encore === false) {
            console.log(`[Validation Fix] ${show.id} (${show.title}): Setting encore: true for insert '${ins.item.songId}' after ${ins.after}`);
            ins.item.encore = true;
            modified = true;
            totalIssuesFixed++;
          }
        }
      }

      // Fix 2: Auto-prune redundant inserts that match templateSetlist
      if (show.diff.insert) {
        const initialCount = show.diff.insert.length;
        show.diff.insert = show.diff.insert.filter((ins) => {
          if (!ins.item.songId) return true; // skip non-song items like interludes
          const matchTpl = tpl.find((t) => t.order === ins.after || t.order === ins.after + 1);
          if (matchTpl && matchTpl.songId === ins.item.songId && !(show.diff.skip ?? []).includes(matchTpl.order)) {
            console.log(`[Validation Fix] ${show.id} (${show.title}): Removing redundant insert for '${ins.item.songId}' after ${ins.after}`);
            return false;
          }
          return true;
        });
        if (show.diff.insert.length < initialCount) {
          modified = true;
          totalIssuesFixed += initialCount - show.diff.insert.length;
          if (show.diff.insert.length === 0) delete show.diff.insert;
        }
      }

      // Check 3: Check for adjacent duplicate songs in resolved setlist
      const resolved = resolveShow(show, tpl).filter((x) => x.songId);
      for (let i = 0; i < resolved.length - 1; i++) {
        if (resolved[i].songId === resolved[i + 1].songId) {
          console.warn(`[Validation Warning] Show ${show.id} (${show.title} ${show.date}) has duplicate adjacent song: '${resolved[i].songId}' at positions ${i + 1} & ${i + 2}`);
        }
      }
    }

    if (modified) {
      writeFileSync(filePath, JSON.stringify(tour, null, 2) + "\n");
      console.log(`Updated ${file} with validation fixes.`);
    }
  }

  return totalIssuesFixed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateAndCleanTours();
}
