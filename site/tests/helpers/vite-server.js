/**
 * vite-server.js — Headless Vite Dev Server Lazy Singleton & SSR Test Harness.
 *
 * Provides a zero-dependency, in-process SSR runner for Node.js 22 native tests.
 * The Vite server is instantiated lazily on first request and shared across UI test
 * suites to avoid redundant boot costs.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let serverInstance = null;
let reactModule = null;
let renderToStaticMarkupFn = null;

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "../..");
const repoDataRoot = path.resolve(siteRoot, "../data");
const siteDataDest = path.resolve(siteRoot, "src/data");

function ensureSiteDataSynced() {
  if (!existsSync(repoDataRoot)) return;
  mkdirSync(siteDataDest, { recursive: true });
  for (const file of ["songs.json", "venue-profiles.json"]) {
    const srcFile = path.resolve(repoDataRoot, file);
    const dstFile = path.resolve(siteDataDest, file);
    if (existsSync(srcFile) && !existsSync(dstFile)) {
      cpSync(srcFile, dstFile);
    }
  }
  for (const sub of ["tours", "events"]) {
    const srcSub = path.resolve(repoDataRoot, sub);
    const dstSub = path.resolve(siteDataDest, sub);
    if (!existsSync(srcSub)) continue;
    mkdirSync(dstSub, { recursive: true });
    const srcFiles = new Set(readdirSync(srcSub));
    const dstFiles = new Set(readdirSync(dstSub));
    for (const existing of dstFiles) {
      if (!srcFiles.has(existing)) {
        rmSync(path.resolve(dstSub, existing), { force: true });
      }
    }
    for (const f of srcFiles) {
      if (!dstFiles.has(f)) {
        cpSync(path.resolve(srcSub, f), path.resolve(dstSub, f));
      }
    }
  }
}

/**
 * Returns the cached Vite dev server instance, creating it if not already running.
 */
export async function getViteServer() {
  if (!serverInstance) {
    ensureSiteDataSynced();
    const vite = await import("vite");
    serverInstance = await vite.createServer({
      root: siteRoot,
      server: { middlewareMode: true, watch: null, hmr: false, ws: false },
      appType: "custom",
    });
    if (serverInstance.watcher) {
      await serverInstance.watcher.close();
    }
    try {
      const { after } = await import("node:test");
      after(async () => {
        await closeViteServer();
      });
    } catch {
      // Ignore if called outside describe block
    }
  }
  return serverInstance;
}

/**
 * Loads a module in the SSR environment via Vite.
 * @param {string} specifier - Module path relative to site root or absolute path.
 */
export async function loadModule(specifier) {
  const server = await getViteServer();
  try {
    return await server.ssrLoadModule(specifier);
  } catch (err) {
    if (err?.code === "ERR_LOAD_URL" && String(err?.message).includes("/src/data/")) {
      ensureSiteDataSynced();
      server.moduleGraph.invalidateAll();
      return await server.ssrLoadModule(specifier);
    }
    throw err;
  }
}

let consoleErrorHooked = false;
function installReactWarningGuardrail() {
  if (consoleErrorHooked) return;
  consoleErrorHooked = true;
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const message = args.map((a) => (typeof a === "string" ? a : (a?.message || ""))).join(" ");
    if (
      message.includes('Each child in a list should have a unique "key" prop') ||
      message.includes("https://react.dev/link/warning-keys")
    ) {
      originalConsoleError.apply(console, args);
      throw new Error(`[React Key Invariant Violation]: ${message}`);
    }
    originalConsoleError.apply(console, args);
  };
}

/**
 * Returns React and renderToStaticMarkup.
 */
export async function getReactAndRenderer() {
  installReactWarningGuardrail();
  if (!reactModule || !renderToStaticMarkupFn) {
    const reactMod = await import("react");
    reactModule = reactMod.default || reactMod;
    const rdomMod = await import("react-dom/server");
    renderToStaticMarkupFn = rdomMod.renderToStaticMarkup;
  }
  return { React: reactModule, renderToStaticMarkup: renderToStaticMarkupFn };
}

/**
 * Renders a React element to static HTML markup.
 */
export async function renderComponent(element) {
  const { renderToStaticMarkup } = await getReactAndRenderer();
  return renderToStaticMarkup(element);
}

/**
 * Runs an async callback scoped to a temporary URL hash.
 */
export async function withHash(hash, fn) {
  const prev = globalThis.window?.location?.hash ?? "";
  try {
    if (globalThis.window?.location) {
      globalThis.window.location.hash = hash;
    }
    return await fn();
  } finally {
    if (globalThis.window?.location) {
      globalThis.window.location.hash = prev;
    }
  }
}

/**
 * Explicitly terminates the Vite dev server instance.
 */
export async function closeViteServer() {
  if (serverInstance) {
    await serverInstance.close();
    serverInstance = null;
  }
}

// Ensure clean exit if tests complete
process.on("exit", () => {
  if (serverInstance) {
    try {
      serverInstance.close();
    } catch {
      // Ignore cleanup error on process termination
    }
  }
});
