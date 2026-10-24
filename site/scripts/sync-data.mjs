import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateAndCleanTours } from "./validate-data.mjs";
import { generateAuditReports } from "./generate-audit-reports.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const src = resolve(root, "data");
const dest = resolve(here, "..", "src", "data");

// Run validation and auto-cleaning prior to syncing data
validateAndCleanTours();

// In-place sync without wiping dest directory to prevent concurrent Vite SSR race conditions
mkdirSync(dest, { recursive: true });

cpSync(resolve(src, "songs.json"), resolve(dest, "songs.json"));
console.log("synced songs.json");

if (existsSync(resolve(src, "venue-profiles.json"))) {
  cpSync(resolve(src, "venue-profiles.json"), resolve(dest, "venue-profiles.json"));
  console.log("synced venue-profiles.json");
}

for (const sub of ["tours", "events"]) {
  const srcSub = resolve(src, sub);
  if (!existsSync(srcSub)) continue;
  const destSub = resolve(dest, sub);
  mkdirSync(destSub, { recursive: true });

  const srcFiles = new Set(readdirSync(srcSub));
  for (const existing of readdirSync(destSub)) {
    if (!srcFiles.has(existing)) {
      rmSync(resolve(destSub, existing), { force: true });
    }
  }
  cpSync(srcSub, destSub, { recursive: true });
  console.log("synced", sub);
}

// Automatically regenerate and sync audit reports
generateAuditReports();
