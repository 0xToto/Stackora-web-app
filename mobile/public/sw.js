// STACKORA PWA: cache only the offline HTML fallback, never private game data or API responses.
const CACHE = 'stackora-shell-v1';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/manifest.json', '/icon-192.png', '/icon-512.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});
// Intentionally do not intercept gameplay requests; games require a live server.
