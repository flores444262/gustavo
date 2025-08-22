// Nombre de la caché (incrementamos la versión a v2)
const CACHE_NAME = 'evaluacion-agricola-cache-v2'; 
// Archivos necesarios para que la app funcione offline
const urlsToCache = [
  '/',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json', // Añadimos el manifest a la caché
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
  'https://placehold.co/192x192/27ae60/ffffff?text=App'
];

// Evento de instalación: borra cachés antiguas y guarda la nueva
self.addEventListener('install', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (CACHE_NAME !== cacheName) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(urlsToCache);
      });
    })
  );
});

// Evento de fetch: sirve los archivos desde la caché primero
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      }
    )
  );
});
