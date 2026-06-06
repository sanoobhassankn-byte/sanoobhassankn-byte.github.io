const CACHE_NAME = 'kns-pro-v4'; // v4 aakki - ini update kittum
const urlsToCache = [
  '/',               // ./ maatti / aakki
  '/index.html',     // ./ kalayuka
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('KNS PRO: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('KNS PRO: Cache failed', err))
  );
  self.skipWaiting(); // Update vannal vegeham activate aakan
});

// Fetch from cache first, then network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return; // POST okke skip
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
      .catch(() => {
        // Net illenkil error varanda
        return new Response('KNS PRO Offline Mode');
      })
  );
});

// Update service worker - pazhaya cache kalayuka
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('KNS PRO: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Udane control edukkuka
});
