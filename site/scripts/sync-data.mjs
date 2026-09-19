import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const src = resolve(root, "data");
const dest = resolve(here, "..", "src", "data");

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

cpSync(resolve(src, "songs.json"), resolve(dest, "songs.json"));
console.log("synced songs.json");

for (const sub of ["tours", "events"]) {
  const dir = resolve(src, sub);
  if (!existsSync(dir)) continue;
  mkdirSync(resolve(dest, sub), { recursive: true });
  cpSync(dir, resolve(dest, sub), { recursive: true });
  console.log("synced", sub);
}