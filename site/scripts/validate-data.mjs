import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
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
  const venuesPath = resolve(root, "data", "venues.json");
  const venueTranslationMap = JSON.parse(readFileSync(venuesPath, "utf8"));

  const songsPath = resolve(root, "data", "songs.json");
  const validSongIds = new Set(JSON.parse(readFileSync(songsPath, "utf8")).songs.map((s) => s.id));

  const dirs = ["tours", "events"];
  let totalIssuesFixed = 0;

  for (const dirName of dirs) {
    const targetDir = resolve(root, "data", dirName);
    if (!existsSync(targetDir)) continue;

    const files = readdirSync(targetDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = resolve(targetDir, file);
      const unit = JSON.parse(readFileSync(filePath, "utf8"));
      if (!unit.shows) continue;

      let modified = false;

      for (const show of unit.shows) {
        // Venue normalization against data/venues.json
        for (const [rawKey, val] of Object.entries(venueTranslationMap)) {
          if (
            show.venue === rawKey ||
            show.venue === val.venue ||
            (rawKey === "KSPO DOME" && (show.venue.includes("高尺") || show.venue.includes("KSPO")))
          ) {
            if (show.venue !== val.venue) {
              console.log(`[Venue Sync] ${show.id}: Normalized venue '${show.venue}' -> '${val.venue}'`);
              show.venue = val.venue;
              modified = true;
            }
            if (val.city !== undefined && show.city !== val.city) {
              show.city = val.city;
              modified = true;
            }
            if (val.region !== undefined && show.region !== val.region) {
              show.region = val.region;
              modified = true;
            }
            if (val.prefecture !== undefined && show.prefecture !== val.prefecture) {
              show.prefecture = val.prefecture;
              modified = true;
            }
            break;
          }
        }

        if (unit.templateSetlist && show.diff) {
          const tpl = unit.templateSetlist;
          const encoreStartOrder = tpl.find((t) => t.encore)?.order ?? 18;

          // Fix 1: Auto-fix encore flag for inserts after encore start
          if (show.diff.insert) {
            for (const ins of show.diff.insert) {
              if (ins.after >= encoreStartOrder - 1 && ins.item.encore === false) {
                console.log(`[Validation Fix] ${show.id} (${show.title}): Setting encore: true for insert '${ins.item.songId}' after ${ins.after}`);
                ins.item.encore = true;
                modified = true;
                totalIssuesFixed++;
              }
              if (
                ins.item.songId &&
                !validSongIds.has(ins.item.songId) &&
                !ins.item.songId.includes("[") &&
                !ins.item.songId.includes("～")
              ) {
                console.warn(`[Validation Warning] Show ${show.id} insert has unknown songId: '${ins.item.songId}'`);
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
        } else if (show.setlist) {
          // Validation for Single Event setlists
          for (let i = 0; i < show.setlist.length; i++) {
            const item = show.setlist[i];
            if (item.songId && !validSongIds.has(item.songId)) {
              console.warn(`[Validation Warning] Single Event ${show.id} (${show.title}) has unknown songId: '${item.songId}'`);
            }
            if (i < show.setlist.length - 1 && item.songId && item.songId === show.setlist[i + 1].songId) {
              console.warn(`[Validation Warning] Single Event ${show.id} (${show.title}) has duplicate adjacent song: '${item.songId}'`);
            }
          }
        }
      }

      // Check if shows need date sorting
      const originalShowsStr = JSON.stringify(unit.shows.map((s) => s.id));
      unit.shows.sort((a, b) => (a.date < b.date ? -1 : 1));
      if (JSON.stringify(unit.shows.map((s) => s.id)) !== originalShowsStr) {
        modified = true;
      }

      if (modified) {
        writeFileSync(filePath, JSON.stringify(unit, null, 2) + "\n");
        console.log(`Updated ${file} with validation/venue fixes.`);
      }
    }
  }

  return totalIssuesFixed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateAndCleanTours();
}
