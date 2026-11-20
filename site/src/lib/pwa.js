/**
 * pwa.js — Progressive Web App Service Worker Registration & Update Lifecycle.
 *
 * Provides SSR-safe Service Worker registration and interactive update notifications
 * strictly isolated to supported client browser environments (ADR-0119, ADR-0134, ADR-0137).
 */

const CACHE_NAME_PREFIX = "higedan-setlist";
export const VISIBILITY_CHECK_THROTTLE_MS = 15 * 60 * 1000; // 15 minutes
export const PASSIVE_HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes
export const UPDATE_RELOAD_FALLBACK_MS = 1500; // Fallback reload if controllerchange never fires

const updateListeners = new Set();
let activeRegistration = null;
let waitingWorkerInstance = null;
let lastCheckTimestamp = 0;
let heartbeatTimerId = null;

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

  let hasReloaded = false;
  let fallbackTimerId = null;

  const scheduleTimeout = typeof win?.setTimeout === "function" ? win.setTimeout.bind(win) : setTimeout;
  const cancelTimeout = typeof win?.clearTimeout === "function" ? win.clearTimeout.bind(win) : clearTimeout;

  const triggerReload = () => {
    if (hasReloaded) {
      return;
    }
    hasReloaded = true;
    if (fallbackTimerId !== null) {
      cancelTimeout(fallbackTimerId);
      fallbackTimerId = null;
    }
    if (win?.location && typeof win.location.reload === "function") {
      win.location.reload();
    }
  };

  // If no waiting worker exists or it has already activated/become redundant (e.g. via another tab),
  // reload immediately instead of waiting indefinitely for controllerchange.
  if (
    !waitingWorker ||
    typeof waitingWorker.postMessage !== "function" ||
    waitingWorker.state === "activated" ||
    waitingWorker.state === "redundant"
  ) {
    triggerReload();
    return;
  }

  if (nav?.serviceWorker && typeof nav.serviceWorker.addEventListener === "function") {
    nav.serviceWorker.addEventListener("controllerchange", triggerReload);
  }

  fallbackTimerId = scheduleTimeout(triggerReload, UPDATE_RELOAD_FALLBACK_MS);
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
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

        const triggerThrottledCheck = () => {
          const now = Date.now();
          if (now - lastCheckTimestamp >= VISIBILITY_CHECK_THROTTLE_MS) {
            lastCheckTimestamp = now;
            if (typeof registration?.update === "function") {
              registration.update().catch(() => {});
            }
          }
        };

        // 3. Initial update check on page load
        if (typeof registration.update === "function") {
          registration.update().catch(() => {});
          lastCheckTimestamp = Date.now();
        }

        // 4. Background visibility check: when user returns to tab after 15+ minutes
        if (win.document && typeof win.document.addEventListener === "function") {
          win.document.addEventListener("visibilitychange", () => {
            if (win.document.visibilityState === "visible") {
              triggerThrottledCheck();
            }
          });
        }

        // 5. SPA Route Change check: when user navigates between songs/shows/tours (hashchange)
        if (typeof win.addEventListener === "function") {
          win.addEventListener("hashchange", triggerThrottledCheck);
        }

        // 6. Passive foreground heartbeat: every 60 minutes for perpetually open tabs
        if (typeof win.setInterval === "function") {
          if (heartbeatTimerId && typeof win.clearInterval === "function") {
            win.clearInterval(heartbeatTimerId);
          }
          heartbeatTimerId = win.setInterval(() => {
            if (!win.document || win.document.visibilityState === "visible") {
              triggerThrottledCheck();
            }
          }, PASSIVE_HEARTBEAT_INTERVAL_MS);
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

  if (heartbeatTimerId && win && typeof win.clearInterval === "function") {
    win.clearInterval(heartbeatTimerId);
    heartbeatTimerId = null;
  }

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
