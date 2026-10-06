const CACHE_NAME = 'civic-v2';
const STATIC_ASSETS = [
  '/', '/index.html', '/css/main.css', '/css/phase1.css',
  '/js/app.js', '/js/home.js', '/js/auth.js', '/js/api.js',
  '/js/camera.js', '/js/geo.js', '/js/report.js', '/js/feed.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Solo estáticos propios; la API y /uploads (otro origen) van directo a la red.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
