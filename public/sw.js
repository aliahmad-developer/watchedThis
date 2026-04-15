// WatchedThis PWA Service Worker
// Caches static assets for offline use

const CACHE_NAME = 'watchedthis-v1';
const STATIC_ASSETS = [
  '/',
  '/og',
  '/watchedthis.svg',
  '/android-chrome-512x512.png',
  '/site.webmanifest',
  '/globals.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => key !== CACHE_NAME && caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        return networkResponse;
      });
    }).catch(() => {
      if (e.request.destination === 'image') {
        return caches.match('/android-chrome-512x512.png');
      }
    })
  );
});
