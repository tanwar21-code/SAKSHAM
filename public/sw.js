const CACHE_NAME = 'saksham-emergency-v1';
const PRECACHE = [
  '/',
  '/emergency',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isEmergency =
    url.pathname === '/emergency' ||
    url.pathname.startsWith('/api/emergency') ||
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/icons/');

  if (isEmergency) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const network = await fetch(request);
          cache.put(request, network.clone());
          return network;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          if (url.pathname === '/emergency') {
            const fallback = await cache.match('/emergency');
            if (fallback) return fallback;
          }
          throw new Error('Offline');
        }
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      return cached || Response.error();
    })
  );
});
