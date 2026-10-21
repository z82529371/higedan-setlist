import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerServiceWorker, unregisterServiceWorkers } from "../../src/lib/pwa.js";

const siteRoot = path.resolve(import.meta.dirname, "../..");
const publicDir = path.resolve(siteRoot, "public");
const manifestPath = path.resolve(publicDir, "manifest.webmanifest");
const swPath = path.resolve(publicDir, "sw.js");
const indexHtmlPath = path.resolve(siteRoot, "index.html");

describe("20. PWA Offline Support & Web App Manifest Invariants (ADR-0119)", () => {
  describe("Web App Manifest Specification", () => {
    it("guarantees manifest.webmanifest exists and is valid JSON", () => {
      assert.ok(fs.existsSync(manifestPath), "manifest.webmanifest must exist in site/public");
      const content = fs.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(content);
      assert.ok(manifest, "manifest must parse as a valid JSON object");
    });

    it("declares required PWA metadata, colors, and standalone display", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      assert.equal(manifest.name, "Official髭男dism Setlist 檔案庫");
      assert.equal(manifest.short_name, "髭男 Setlist");
      assert.equal(manifest.display, "standalone");
      assert.equal(manifest.start_url, "/");
      assert.equal(manifest.scope, "/");
      assert.equal(manifest.theme_color?.toLowerCase(), "#d19f00");
      assert.equal(manifest.background_color?.toLowerCase(), "#f0eee8");
    });

    it("declares standard and maskable icons in 192x192 and 512x512 resolutions", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      assert.ok(Array.isArray(manifest.icons), "manifest.icons must be an array");

      const icon192 = manifest.icons.find(
        (i) => i.sizes === "192x192" && (!i.purpose || i.purpose.includes("any"))
      );
      const icon512 = manifest.icons.find(
        (i) => i.sizes === "512x512" && (!i.purpose || i.purpose.includes("any"))
      );
      const maskable192 = manifest.icons.find(
        (i) => i.sizes === "192x192" && i.purpose?.includes("maskable")
      );
      const maskable512 = manifest.icons.find(
        (i) => i.sizes === "512x512" && i.purpose?.includes("maskable")
      );

      assert.ok(icon192, "Must declare standard 192x192 icon");
      assert.ok(icon512, "Must declare standard 512x512 icon");
      assert.ok(maskable192, "Must declare maskable 192x192 icon");
      assert.ok(maskable512, "Must declare maskable 512x512 icon");
    });

    it("verifies all manifest icon files exist on disk with matching dimensions", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      for (const icon of manifest.icons) {
        const iconRel = icon.src.replace(/^\//, "");
        const iconPath = path.resolve(publicDir, iconRel);
        assert.ok(fs.existsSync(iconPath), `Icon file ${icon.src} must exist at ${iconPath}`);
        const stat = fs.statSync(iconPath);
        assert.ok(stat.size > 0, `Icon file ${icon.src} must not be empty`);

        if (icon.type === "image/png" && icon.sizes && icon.sizes.includes("x")) {
          const [wExpected, hExpected] = icon.sizes.split("x").map(Number);
          const buf = fs.readFileSync(iconPath);
          const wActual = buf.readUInt32BE(16);
          const hActual = buf.readUInt32BE(20);
          assert.equal(wActual, wExpected, `Icon ${icon.src} width must match ${wExpected}`);
          assert.equal(hActual, hExpected, `Icon ${icon.src} height must match ${hExpected}`);
        }
      }
    });
  });

  describe("HTML Link & Meta Invariants", () => {
    it("links manifest.webmanifest and sets theme-color, standard and apple standalone meta tags in index.html", () => {
      const html = fs.readFileSync(indexHtmlPath, "utf-8");
      assert.match(
        html,
        /<link\s+[^>]*rel=["']manifest["'][^>]*href=["']\/manifest\.webmanifest["']/,
        "index.html must link to /manifest.webmanifest"
      );
      assert.match(
        html,
        /<meta\s+[^>]*name=["']theme-color["'][^>]*content=["']#d19f00["']/i,
        "index.html must define theme-color as #d19f00"
      );
      assert.match(
        html,
        /<meta\s+[^>]*name=["']mobile-web-app-capable["'][^>]*content=["']yes["']/i,
        "index.html must set mobile-web-app-capable to yes"
      );
      assert.match(
        html,
        /<meta\s+[^>]*name=["']apple-mobile-web-app-capable["'][^>]*content=["']yes["']/i,
        "index.html must set apple-mobile-web-app-capable to yes"
      );
    });
  });

  describe("Service Worker Architecture & SSR Safety", () => {
    it("guarantees sw.js implements Cache-First, precache, and cache pruning", () => {
      assert.ok(fs.existsSync(swPath), "sw.js must exist in site/public");
      const swCode = fs.readFileSync(swPath, "utf-8");

      assert.match(swCode, /CACHE_NAME/, "sw.js must declare a CACHE_NAME");
      assert.match(swCode, /addEventListener\(\s*["']install["']/, "sw.js must listen for install");
      assert.match(swCode, /addEventListener\(\s*["']activate["']/, "sw.js must listen for activate");
      assert.match(swCode, /addEventListener\(\s*["']fetch["']/, "sw.js must listen for fetch");
      assert.match(swCode, /caches\.match/, "sw.js must use caches.match for Cache-First");
      assert.match(swCode, /caches\.delete/, "sw.js must prune outdated caches on activate");
      assert.match(swCode, /skipWaiting\(\)/, "sw.js must call skipWaiting on install");
      assert.doesNotMatch(
        swCode,
        /caches\.match\([^)]+\)\s*\|\|/,
        "sw.js must not synchronously evaluate Promise-returning caches.match() with boolean OR"
      );
    });

    it("guarantees registerServiceWorker runs safely in Node.js SSR without navigator defined", () => {
      // In Node.js, navigator.serviceWorker is undefined or navigator is undefined
      assert.doesNotThrow(() => {
        registerServiceWorker();
      }, "registerServiceWorker must not throw in SSR / headless Node environment");
    });

    it("registers service worker when client navigator.serviceWorker is available", () => {
      let registeredUrl = null;
      const mockNavigator = {
        serviceWorker: {
          register: (url) => {
            registeredUrl = url;
            return Promise.resolve({ scope: "/" });
          },
        },
      };

      const mockWindow = {
        addEventListener: (event, handler) => {
          if (event === "load") {
            handler();
          }
        },
      };

      // Call registerServiceWorker with mock client environment
      registerServiceWorker({ window: mockWindow, navigator: mockNavigator });
      assert.equal(registeredUrl, "/sw.js", "registerServiceWorker must register /sw.js");
    });

    it("guarantees unregisterServiceWorkers runs safely in Node.js SSR without navigator defined", async () => {
      await assert.doesNotReject(async () => {
        await unregisterServiceWorkers();
      }, "unregisterServiceWorkers must not throw in SSR / headless Node environment");
    });

    it("unregisters active service workers and cleans caches when navigator.serviceWorker is available", async () => {
      let unregistered = false;
      const mockRegistrations = [
        {
          unregister: async () => {
            unregistered = true;
            return true;
          },
        },
      ];
      let cacheDeleted = false;
      const mockCaches = {
        keys: async () => ["higedan-setlist-v1", "other-cache"],
        delete: async (name) => {
          if (name.startsWith("higedan-setlist")) {
            cacheDeleted = true;
          }
          return true;
        },
      };
      const mockNavigator = {
        serviceWorker: {
          getRegistrations: async () => mockRegistrations,
        },
      };
      const mockWindow = {
        caches: mockCaches,
      };

      await unregisterServiceWorkers({ window: mockWindow, navigator: mockNavigator });
      assert.equal(unregistered, true, "unregisterServiceWorkers must unregister all active service workers");
      assert.equal(cacheDeleted, true, "unregisterServiceWorkers must prune dev caches");
    });

    it("verifies built sw.js in dist precaches compiled JS and CSS chunks when dist exists", () => {
      const distSwPath = path.resolve(siteRoot, "dist/sw.js");
      if (fs.existsSync(distSwPath)) {
        const distSw = fs.readFileSync(distSwPath, "utf-8");
        assert.match(distSw, /\/assets\/index-[^"']+\.js/, "dist/sw.js must precache compiled JS bundle");
        assert.match(distSw, /\/assets\/index-[^"']+\.css/, "dist/sw.js must precache compiled CSS bundle");
      }
    });
  });
});
