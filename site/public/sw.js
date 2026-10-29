/**
 * Higedan Setlist Archive — Progressive Web App Service Worker
 * Network-First for Navigation + Cache-First for Hashed Assets (ADR-0134)
 */

const CACHE_NAME = "higedan-setlist-v1"; /* __CACHE_NAME_INJECTION__ */

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/favicon.ico",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  /* __VITE_ASSETS_INJECTION__ */
];

const NAVIGATION_TIMEOUT_MS = 1800;

function putInCache(request, networkResponse) {
  if (
    networkResponse &&
    networkResponse.status === 200 &&
    (networkResponse.type === "basic" || networkResponse.type === "cors")
  ) {
    const responseToCache = networkResponse.clone();
    caches.open(CACHE_NAME).then((cache) => {
      cache.put(request, responseToCache);
      const url = new URL(request.url);
      if (url.pathname === "/") {
        cache.put("/index.html", responseToCache.clone());
      }
    });
  }
}

function fetchWithTimeout(request, timeoutMs) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const signal = controller ? controller.signal : undefined;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (controller) {
        try {
          controller.abort();
        } catch (_) {}
      }
      reject(new Error("Network navigation timed out"));
    }, timeoutMs);

    fetch(request, { signal })
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Install: precache app shell and assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up outdated cache versions and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name.startsWith("higedan-setlist"))
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-First for HTML navigation; Cache-First for hashed static assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  if (!url.protocol.startsWith("http")) {
    return;
  }

  const isNavigation =
    event.request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname === "/index.html" ||
    (event.request.headers.get("accept") &&
      event.request.headers.get("accept").includes("text/html"));

  if (isNavigation) {
    // Network-First with timeout fallback for navigation (ADR-0134)
    event.respondWith(
      fetchWithTimeout(event.request, NAVIGATION_TIMEOUT_MS)
        .then((networkResponse) => {
          putInCache(event.request, networkResponse);
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cached shell (handles offline and weak-signal concert conditions)
          return caches.match("/index.html").then((res) => res || caches.match("/"));
        })
    );
    return;
  }

  // Cache-First for static assets (Vite hashed bundles, images, icons)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        putInCache(event.request, networkResponse);
        return networkResponse;
      });
    })
  );
});
