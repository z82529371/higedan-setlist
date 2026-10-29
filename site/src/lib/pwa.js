/**
 * pwa.js — Progressive Web App Service Worker Registration.
 *
 * Provides SSR-safe Service Worker registration strictly isolated to
 * supported client browser environments.
 */

const CACHE_NAME_PREFIX = "higedan-setlist";

function resolveClientEnv(env = {}) {
  const win = env.window || (typeof window !== "undefined" ? window : null);
  const nav = env.navigator || (typeof navigator !== "undefined" ? navigator : null);
  return { win, nav };
}

export function registerServiceWorker(env = {}) {
  const { win, nav } = resolveClientEnv(env);

  if (!win || !nav || !("serviceWorker" in nav) || typeof nav.serviceWorker.register !== "function") {
    return;
  }

  const register = () => {
    nav.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (typeof registration?.update === "function") {
          registration.update().catch(() => {});
        }
      })
      .catch((error) => {
        console.warn("ServiceWorker registration failed:", error);
      });
  };

  if (win.document && win.document.readyState === "complete") {
    register();
  } else if (typeof win.addEventListener === "function") {
    win.addEventListener("load", register);
  } else {
    register();
  }
}

export async function unregisterServiceWorkers(env = {}) {
  const { win, nav } = resolveClientEnv(env);

  if (!win || !nav || !("serviceWorker" in nav) || typeof nav.serviceWorker.getRegistrations !== "function") {
    return;
  }

  try {
    const registrations = await nav.serviceWorker.getRegistrations();
    if (Array.isArray(registrations)) {
      await Promise.all(registrations.map((reg) => reg?.unregister?.()));
    }

    if (win.caches && typeof win.caches.keys === "function") {
      const keys = await win.caches.keys();
      if (Array.isArray(keys)) {
        await Promise.all(
          keys
            .filter((cacheName) => typeof cacheName === "string" && cacheName.startsWith(CACHE_NAME_PREFIX))
            .map((cacheName) => win.caches.delete(cacheName))
        );
      }
    }
  } catch (err) {
    console.warn("ServiceWorker unregistration failed:", err);
  }
}
