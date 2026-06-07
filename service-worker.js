const CACHE_NAME = 'kns-pro-v4.1'; // Version kootti
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // CDN files koodi cache cheyyuka - offline il icons/fonts pottilla
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Install service worker - Core files cache cheyyuka
self.addEventListener('install', event => {
  console.log('KNS PRO: Installing SW...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('KNS PRO: Cache opened');
        // Individual file add cheyyuka, orennam fail aayalum baki add aakum
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn('KNS PRO: Failed to cache:', url, err);
            })
          )
        );
      })
  );
  self.skipWaiting(); // Puthiya SW immediate activate aakum
});

// Activate - Pazhaya cache ellam kalayuka
self.addEventListener('activate', event => {
  console.log('KNS PRO: Activating SW...');
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
  self.clients.claim(); // Ellam tabs um immediate control cheyyum
});

// Fetch - Cache first, then network + Dynamic caching
self.addEventListener('fetch', event => {
  // POST requests cache cheyyanda
  if (event.request.method !== 'GET') return;
  
  // Chrome extension requests ignore cheyyuka
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 1. Cache il undenkil athu kodukku
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 2. Illenkil network il ninnu eduth cache cheyyu
        return fetch(event.request)
          .then(networkResponse => {
            // Response valid aano enn nokku
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }
            
            // Response clone cheythu cache il iduka
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            
            return networkResponse;
          })
          .catch(() => {
            // 3. Network um illa, cache um illa - Offline fallback
            
            // HTML page request aanenkil app thanne load cheyyu
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            // CSS/JS fail aayal veena response
            if (event.request.destination === 'style' || event.request.destination === 'script') {
              return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
            }
            
            // Image fail aayal
            if (event.request.destination === 'image') {
              return new Response('', { status: 200, headers: { 'Content-Type': 'image/png' } });
            }
            
            // Default offline message
            return new Response('KNS PRO Offline Mode - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync - Optional, future use nu
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    console.log('KNS PRO: Background sync triggered');
  }
});
