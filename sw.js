
const CACHE_NAME = "milistacompras-v3";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalar y guardar archivos de la aplicación
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_FILES)
    )
  );
  self.skipWaiting();
});

// Eliminar cachés antiguos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Priorizar la versión actualizada de la aplicación
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  // No interferir con Firebase ni servicios externos
  if (new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Para páginas HTML, intentar primero Internet
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(request, copy)
          );
        }
        return response;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Para imágenes y archivos locales, usar caché
  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request)
    )
  );
});
