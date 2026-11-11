// DEVKIT service worker
// Strategy:
//   - App shell (HTML, JS, CSS bundles): stale-while-revalidate from the cache.
//   - Static assets (/devkit/*, /_next/static/*, fonts): cache-first.
//   - API requests: NEVER cached. Always go to the network.
//   - Credentials, AI provider keys, GitHub tokens: NEVER stored in cache.

const CACHE_VERSION = 'devkit-v1.0.0-v1';
const APP_SHELL = [
  '/',
  '/devkit/manifest.json',
  '/devkit/icon-192.png',
  '/devkit/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // NEVER cache API requests or anything that could contain credentials
  if (url.pathname.startsWith('/api/')) {
    return; // let the browser handle it
  }

  // Only handle same-origin GET requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // App shell navigation requests: network-first, fall back to cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put('/', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('/').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/devkit/')) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (c) => {
        const cached = await c.match(req);
        const networkPromise = fetch(req).then((res) => {
          if (res && res.status === 200) c.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }

  // Everything else: try network, fall back to cache.
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((r) => r || Response.error()))
  );
});

// Allow the page to trigger updates
self.addEventListener('message', (event) => {
  if (event.data === 'devkit-skip-waiting') self.skipWaiting();
});
