// Hoops Stats offline cache. Bump VERSION when index.html changes.
const VERSION = 'hoops-v4';
const CORE = ['./', './index.html', './manifest.webmanifest'];
const ICONS = ['./icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  // Core files must cache; icons are best-effort so a missing icon can't block offline use.
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE);
    await Promise.allSettled(ICONS.map(f => c.add(f)));
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Open instantly from the cache; refresh the cache in the background when online.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
