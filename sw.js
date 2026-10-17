const CACHE = 'echo-shell-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('echo-shell-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match(new URL('./index.html', self.registration.scope).href))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const fresh = fetch(request).then(async response => {
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
