// Tectranz LMS Service Worker
const CACHE_NAME = 'tectranz-static-v1';

// Only cache static immutable assets: fonts, branding images, styles
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // STRICT RULE: Never cache authenticated API requests, reports, documents, or dynamic server actions
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/documents/') ||
    event.request.method !== 'GET'
  ) {
    // Network-only without caching
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Network offline. Actions cannot be performed while disconnected.',
            offline: true
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Network-first with cache fallback for navigation and static pages
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response('You are offline. Please reconnect to access authenticated Tectranz learning materials.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
