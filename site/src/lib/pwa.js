/**
 * pwa.js — Progressive Web App Service Worker Registration.
 *
 * Provides SSR-safe Service Worker registration strictly isolated to
 * supported client browser environments.
 */

export function registerServiceWorker(env = {}) {
  const win = env.window || (typeof window !== "undefined" ? window : null);
  const nav = env.navigator || (typeof navigator !== "undefined" ? navigator : null);

  if (!win || !nav || !("serviceWorker" in nav) || typeof nav.serviceWorker.register !== "function") {
    return;
  }

  const register = () => {
    nav.serviceWorker.register("/sw.js").catch((error) => {
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
