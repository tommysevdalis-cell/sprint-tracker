const CACHE_NAME = 'sprint-tracker-v1';
const ASSETS = ['/', '/bundle.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  // For API calls, always go to network
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ races: [], rivals: [], shoes: [] }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }
  // For everything else, try cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
