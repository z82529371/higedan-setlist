/**
 * vite-server.js — Headless Vite Dev Server Lazy Singleton & SSR Test Harness.
 *
 * Provides a zero-dependency, in-process SSR runner for Node.js 22 native tests.
 * The Vite server is instantiated lazily on first request and shared across UI test
 * suites to avoid redundant boot costs.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

let serverInstance = null;
let reactModule = null;
let renderToStaticMarkupFn = null;

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "../..");

/**
 * Returns the cached Vite dev server instance, creating it if not already running.
 */
export async function getViteServer() {
  if (!serverInstance) {
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
  return server.ssrLoadModule(specifier);
}

/**
 * Returns React and renderToStaticMarkup.
 */
export async function getReactAndRenderer() {
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
