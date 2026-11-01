/**
 * pwa.js — Progressive Web App Service Worker Registration & Update Lifecycle.
 *
 * Provides SSR-safe Service Worker registration and interactive update notifications
 * strictly isolated to supported client browser environments (ADR-0119, ADR-0134, ADR-0137).
 */

const CACHE_NAME_PREFIX = "higedan-setlist";
export const VISIBILITY_CHECK_THROTTLE_MS = 15 * 60 * 1000; // 15 minutes

const updateListeners = new Set();
let activeRegistration = null;
let waitingWorkerInstance = null;
let lastCheckTimestamp = 0;

function resolveClientEnv(env = {}) {
  const win = env.window || (typeof window !== "undefined" ? window : null);
  const nav = env.navigator || (typeof navigator !== "undefined" ? navigator : null);
  return { win, nav };
}

function notifyUpdateAvailable(registration, waitingWorker) {
  activeRegistration = registration || activeRegistration;
  waitingWorkerInstance = waitingWorker || (registration ? registration.waiting : null) || waitingWorkerInstance;
  for (const listener of updateListeners) {
    try {
      listener({ registration: activeRegistration, waitingWorker: waitingWorkerInstance });
    } catch (err) {
      console.warn("[PWA] Update listener failed:", err);
    }
  }
}

/**
 * Subscribes to new PWA version ready events.
 * If a waiting service worker is already queued, immediately notifies the subscriber.
 * Returns an unsubscribe callback.
 */
export function subscribeUpdateAvailable(callback) {
  if (typeof callback !== "function") {
    return () => {};
  }

  updateListeners.add(callback);

  const waiting = waitingWorkerInstance || activeRegistration?.waiting;
  if (waiting) {
    try {
      callback({ registration: activeRegistration, waitingWorker: waiting });
    } catch (err) {
      console.warn("[PWA] Immediate update listener failed:", err);
    }
  }

  return () => {
    updateListeners.delete(callback);
  };
}

/**
 * Instructs waiting Service Worker to skip waiting and reloads the window
 * on controller change to activate the new version.
 */
export function applyServiceWorkerUpdate(env = {}) {
  const { win, nav } = resolveClientEnv(env);
  const reg = env.registration || activeRegistration;
  const waitingWorker = env.waitingWorker || env.registration?.waiting || waitingWorkerInstance || reg?.waiting;

  if (nav?.serviceWorker && typeof nav.serviceWorker.addEventListener === "function") {
    nav.serviceWorker.addEventListener("controllerchange", () => {
      if (win?.location && typeof win.location.reload === "function") {
        win.location.reload();
      }
    });
  }

  if (waitingWorker && typeof waitingWorker.postMessage === "function") {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  } else if (win?.location && typeof win.location.reload === "function") {
    win.location.reload();
  }
}

export function registerServiceWorker(env = {}) {
  const { win, nav } = resolveClientEnv(env);

  if (!win || !nav || !("serviceWorker" in nav) || typeof nav.serviceWorker.register !== "function") {
    return Promise.resolve(null);
  }

  const register = () => {
    return nav.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        activeRegistration = registration;

        // 1. If a worker is already waiting in queue (e.g. installed on previous visit)
        if (registration.waiting) {
          notifyUpdateAvailable(registration, registration.waiting);
        }

        // 2. Track new incoming workers entering waiting/installed state
        if (typeof registration.addEventListener === "function") {
          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (installing && typeof installing.addEventListener === "function") {
              installing.addEventListener("statechange", () => {
                if (installing.state === "installed" && nav.serviceWorker.controller) {
                  notifyUpdateAvailable(registration, registration.waiting || installing);
                }
              });
            }
          });
        }

        // 3. Initial update check on page load
        if (typeof registration.update === "function") {
          registration.update().catch(() => {});
          lastCheckTimestamp = Date.now();
        }

        // 4. Background visibility check: when user returns to tab after 15+ minutes
        if (win.document && typeof win.document.addEventListener === "function") {
          win.document.addEventListener("visibilitychange", () => {
            if (win.document.visibilityState === "visible") {
              const now = Date.now();
              if (now - lastCheckTimestamp >= VISIBILITY_CHECK_THROTTLE_MS) {
                lastCheckTimestamp = now;
                if (typeof registration.update === "function") {
                  registration.update().catch(() => {});
                }
              }
            }
          });
        }

        return registration;
      })
      .catch((error) => {
        console.warn("ServiceWorker registration failed:", error);
        return null;
      });
  };

  if (win.document && win.document.readyState === "complete") {
    return register();
  } else if (typeof win.addEventListener === "function") {
    return new Promise((resolve) => {
      win.addEventListener("load", () => {
        resolve(register());
      });
    });
  } else {
    return register();
  }
}

export async function unregisterServiceWorkers(env = {}) {
  const { win, nav } = resolveClientEnv(env);

  updateListeners.clear();
  activeRegistration = null;
  waitingWorkerInstance = null;
  lastCheckTimestamp = 0;

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
