// TalentoEC · Service Worker v2
// La página SIEMPRE se pide primero a internet (así cada cambio se ve al instante).
// Solo si no hay conexión se muestra la última copia guardada.
// Al instalarse, borra las copias viejas que dejaban ver una versión anterior.
const CACHE = 'talentoec-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const claves = await caches.keys();
    await Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo archivos de talentoec.com; el servidor (Railway), pagos y fuentes van directo a internet
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const fresca = await fetch(req, { cache: 'no-store' });
      if (fresca && fresca.ok && fresca.type === 'basic') {
        const copia = fresca.clone();
        caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
      }
      return fresca;
    } catch (err) {
      const guardada = await caches.match(req);
      if (guardada) return guardada;
      if (req.mode === 'navigate') {
        const inicio = await caches.match('/') || await caches.match('/index.html');
        if (inicio) return inicio;
      }
      throw err;
    }
  })());
});
