// Bump this version number every time you make a real update and want to
// force-clear old cached data. It doesn't have to match anything else —
// it's just a label so old caches get cleaned up automatically below.
const CACHE_NAME = 'offline-survey-v2';
const urlsToCache = [
  './index.html',
  './'
];

self.addEventListener('install', (event) => {
  // Activate this new Service Worker immediately, instead of waiting for
  // every open tab/app instance to be closed first. This is the main fix
  // for "I deployed but the app still shows the old version."
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME) // delete any old cache versions
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim()) // take control of already-open tabs right away
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first: while online, always fetch the freshest copy from the
  // server and update the cache with it. Only fall back to the cached
  // copy if the network request fails (i.e. the device is offline) —
  // which is exactly when this app's offline mode should kick in.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
