const CACHE_NAME = 'kns-pro-v4'; 
const urlsToCache = [
  './',              // ✅ Sheri - repo folder
  './index.html',    // ✅ Sheri
  './manifest.json', // ✅ Sheri
  './icon-192.png',  // ✅ Sheri
  './icon-512.png'  // ✅ Sheri
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
  self.skipWaiting();
});

// Fetch from cache first, then network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
      .catch(() => {
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
  self.clients.claim();
});
