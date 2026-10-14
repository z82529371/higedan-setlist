import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");

const code = process.argv.slice(2).join(" ");
if (!code || code === "-h" || code === "--help") {
  console.log(`
Usage:
  node site/scripts/eval.mjs "<code>"
  pnpm eval "<code>"

Examples:
  pnpm eval "const d = await loadModule('/src/lib/domain.js'); console.log(d.getTourFrequencyTier(1, 3));"
  pnpm eval "const sn = readJson('../data/tours/shocking-nuts-tour-2022-2023.json'); console.log(sn.shows.length);"
`);
  process.exit(code ? 0 : 1);
}

const server = await createServer({
  root: siteRoot,
  server: { middlewareMode: true, watch: null },
  appType: "custom",
});

const loadModule = (modulePath) => server.ssrLoadModule(modulePath);
const readJson = (relativePath) => {
  const fullPath = path.resolve(siteRoot, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
};

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

try {
  const fn = new AsyncFunction(
    "server",
    "loadModule",
    "readJson",
    "fs",
    "path",
    `return (async () => { ${code} })();`
  );
  const result = await fn(server, loadModule, readJson, fs, path);
  if (result !== undefined) {
    console.log(result);
  }
} catch (err) {
  console.error("Eval Error:", err);
  process.exitCode = 1;
} finally {
  await server.close();
}
