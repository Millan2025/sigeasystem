const CACHE_PAGES = 'sigea-pages-v1';
const CACHE_STATIC = 'sigea-static-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_PAGES).then(c => c.add(OFFLINE_URL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_PAGES && k !== CACHE_STATIC).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE_PAGES);
        cache.put(req, res.clone());
        return res;
      } catch (err) {
        const cached = await caches.match(req);
        return cached || caches.match(OFFLINE_URL);
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cached = await caches.match(req);
    const net = fetch(req).then(res => {
      if (res && res.ok) {
        const clone = res.clone();
        caches.open(CACHE_STATIC).then(c => c.put(req, clone));
      }
      return res;
    }).catch(() => cached);
    return cached || net;
  })());
});
