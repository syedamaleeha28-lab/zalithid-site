// Service worker for the "Cek UUID Minecraft" tool (scoped to /cek-uuid-minecraft only).
// Registered with an explicit narrower scope from cek-uuid-minecraft.html, so it never
// touches the rest of the ZalithID site.
const CACHE_NAME = 'zalithid-uuid-tool-v2';
const ASSETS_TO_CACHE = [
  '/cek-uuid-minecraft',
  '/style.css',
  '/manifest.json',
  '/assets/favicon.webp',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only cache-manage our own same-origin GET requests. Let the UUID-lookup API
  // call (playerdb.co) and anything else pass straight through to the network.
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
