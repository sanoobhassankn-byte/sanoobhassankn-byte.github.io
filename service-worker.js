const CACHE_NAME = 'kns-pro-v4.1'; // 'const' ചെറിയ അക്ഷരത്തിലാക്കി
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // CDN files - ഓഫ്‌ലൈനിലും ഫോണ്ടുകളും ഐക്കണുകളും വർക്ക് ചെയ്യും
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Install service worker - ഫയലുകൾ കാഷെ ചെയ്യുന്നു
self.addEventListener('install', event => {
  console.log('KNS PRO: Installing SW...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('KNS PRO: Cache opened');
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn('KNS PRO: Failed to cache:', url, err);
            })
          )
        );
      })
  );
  self.skipWaiting(); 
});

// Activate - പഴയ കാഷെ ഫയലുകൾ നീക്കം ചെയ്യുന്നു
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
  self.clients.claim(); 
});

// Fetch - ഒഫ്ലൈൻ സപ്പോർട്ടിനായി കാഷെ ഫസ്റ്റ് സ്ട്രാറ്റജി
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }
            
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            
            return networkResponse;
          })
          .catch(() => {
            // ഓഫ്‌ലൈൻ ഫാൾബാക്ക്
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            if (event.request.destination === 'style' || event.request.destination === 'script') {
              return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
            }
            if (event.request.destination === 'image') {
              return new Response('', { status: 200, headers: { 'Content-Type': 'image/png' } });
            }
            return new Response('KNS PRO Offline Mode - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    console.log('KNS PRO: Background sync triggered');
  }
});
