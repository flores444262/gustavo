// Nombre de la caché
const CACHE_NAME = 'evaluacion-agricola-cache-v1';
// Archivos necesarios para que la app funcione offline
const urlsToCache = [
  '/',
  'index.html',
  'styles.css',
  'app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
  'https://placehold.co/192x192/27ae60/ffffff?text=App' // Cacheamos el ícono también
];

// Evento de instalación: se dispara cuando el service worker se instala
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de fetch: se dispara cada vez que la app pide un recurso (un archivo, una imagen, etc.)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en la caché, lo devolvemos desde ahí.
        if (response) {
          return response;
        }
        // Si no, lo pedimos a la red.
        return fetch(event.request);
      }
    )
  );
});
