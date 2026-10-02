/**
 * DIMISI OPS — Service Worker
 * 
 * Production-ready Service Worker for PWA offline shell capability,
 * static asset caching, and strict data isolation.
 * 
 * SECURITY & PRIVACY POLICY:
 * - NEVER caches API requests, authentication tokens, credentials, or private user/employee/account records.
 * - Only caches immutable static frontend assets, fonts, icons, and the application shell.
 */

const CACHE_VERSION = "dimisi-ops-v1.0.0";
const SHELL_CACHE_NAME = `dimisi-shell-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `dimisi-static-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `dimisi-images-${CACHE_VERSION}`;

// Application shell assets to precache on install
const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/manifest.json",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/assets/dimisi-mark.png",
  "/assets/dimisi-logo.png"
];

// Determine if a URL is an API or sensitive request that MUST NOT be cached
function isSensitiveOrApiRequest(url, request) {
  // Never cache non-GET requests (mutations, login, submissions, etc.)
  if (request.method !== "GET") {
    return true;
  }

  const pathname = url.pathname;

  // Explicit API and Auth path matching
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/v1") ||
    pathname.includes("/auth/") ||
    pathname.includes("/socket.io") ||
    pathname.includes("/_serverFn") ||
    pathname.includes("/nitro/")
  ) {
    return true;
  }

  // Cross-origin API calls (e.g. backend host api.dimisi.tech or localhost:5000)
  if (
    url.hostname.includes("api.") ||
    url.port === "5000" ||
    url.hostname.includes("ngrok") ||
    url.hostname.includes("identitytoolkit") ||
    url.hostname.includes("securetoken")
  ) {
    return true;
  }

  return false;
}

// Determine if request is for static assets (scripts, styles, fonts, media)
function isStaticAsset(url) {
  const pathname = url.pathname;
  return (
    pathname.endsWith(".js") ||
    pathname.endsWith(".mjs") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".ttf") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".json") ||
    pathname.endsWith(".webmanifest") ||
    pathname.startsWith("/_libs/") ||
    pathname.startsWith("/_ssr/") ||
    pathname.startsWith("/@fs/") ||
    pathname.startsWith("/@vite/") ||
    pathname.startsWith("/assets/") ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

// Determine if request is an image
function isImage(url) {
  const pathname = url.pathname;
  return (
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".avif")
  );
}

// Installation: Precache core static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn("[SW] Warning: Some assets failed to precache:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activation: Clean up previous cache versions and claim clients
self.addEventListener("activate", (event) => {
  const expectedCaches = [SHELL_CACHE_NAME, STATIC_CACHE_NAME, IMAGE_CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName.startsWith("dimisi-") &&
              !expectedCaches.includes(cacheName)
            ) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch handler: Intelligent routing with strict data isolation
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Strictly bypass service worker and cache for API, auth, or mutation requests
  if (isSensitiveOrApiRequest(url, request)) {
    return; // Standard network fetch, no caching
  }

  // 2. Navigation requests (HTML / Routes): Network-First with cached shell fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline, attempt to serve cached URL or fallback to cached root shell
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const rootShell = await caches.match("/");
          if (rootShell) {
            return rootShell;
          }
          return new Response(
            `<!DOCTYPE html>
            <html lang="en" class="dark">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>DIMISI OPS — Offline</title>
              <style>
                body { background: #070707; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
                .card { background: #151515; border: 1px solid rgba(201,169,97,0.2); border-radius: 16px; padding: 32px 24px; max-width: 420px; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.6); }
                h1 { color: #C9A961; font-size: 22px; margin: 0 0 12px; }
                p { color: #A0A0A0; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }
                button { background: #C9A961; color: #070707; border: none; font-weight: 600; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: opacity 0.2s; }
                button:hover { opacity: 0.9; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>DIMISI OPS is Offline</h1>
                <p>You are currently offline or your network connection was lost. Reconnect to resume live operations.</p>
                <button onclick="window.location.reload()">Retry Connection</button>
              </div>
            </body>
            </html>`,
            {
              headers: { "Content-Type": "text/html; charset=utf-8" }
            }
          );
        })
    );
    return;
  }

  // 3. Static Assets (Scripts, Styles, Fonts): Stale-While-Revalidate
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Images & Media: Cache-First with network fallback
  if (isImage(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // Default: Network with Cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Support manual skipWaiting from client updater
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
