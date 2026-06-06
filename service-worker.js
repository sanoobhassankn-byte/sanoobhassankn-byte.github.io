const CACHE_NAME = 'kns-pro-v3'; // v3 aakki - update kittan
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('KNS PRO Cache opened');
        // oru file fail aayalum baaki cache aakan
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch(err => {
        console.log('Cache addAll failed:', err);
      })
  );
  // Puthiya SW vegeham activate aakan
  self.skipWaiting();
});

// Fetch from cache first, then network
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache il undenkil athu kodukkuka
        if (response) {
          return response;
        }
        // Illenkil network il ninnu edukkan nokkuka
        return fetch(event.request).then(response => {
          // Valid response aanenkil cache cheyyuka
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
      .catch(() => {
        // Net um illa, cache um illa - offline page kaanikkan pattum
        // return caches.match('/offline.html');
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
  // Udane control edukkuka
  self.clients.claim();
});
