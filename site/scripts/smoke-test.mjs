#!/usr/bin/env node
/**
 * smoke-test.mjs — Backward-compatibility facade runner.
 *
 * Transparently delegates to Node.js 22 native test runner across all modular test
 * suites under `site/tests/` (pipeline, invariants, ui).
 *
 * Preserves 100% backward compatibility for existing CI workflows, developer
 * muscle memory (`node scripts/smoke-test.mjs`), and historical ADR links.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "..");

const child = spawn(
  process.execPath,
  ["--test", "tests/**/*.test.js"],
  {
    cwd: siteRoot,
    stdio: "inherit",
    env: process.env,
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
