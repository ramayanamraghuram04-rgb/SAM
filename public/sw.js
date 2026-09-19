// SAM PWA Service Worker - Safe UI shell caching
const CACHE_NAME = 'sam-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy for safety with Firestore / Auth
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip Firebase / external APIs
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  
  if (
    url.hostname.includes('firebase') || 
    url.hostname.includes('googleapis') || 
    url.hostname.includes('google')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and put into cache if valid response
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
