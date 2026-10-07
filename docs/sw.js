/* Service worker BFR-Chantier — application hors connexion.
   Stratégie : réseau d'abord (la nouvelle version est prise dès la prochaine
   ouverture avec du réseau), puis le cache. Si le réseau met plus de 3,5 s,
   le cache est servi sans attendre. Le nom du cache contient l'empreinte du
   build : chaque publication remplace la précédente. */
const CACHE = 'bfr-chantier-4244500421';
const FICHIERS = ['./', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './favicon.png', './apple-touch-icon.png'];
const DELAI_RESEAU = 3500;

const delai = (ms) => new Promise((ok) => setTimeout(ok, ms));

function servir(requete, estPage) {
  const optionsFetch = (estPage || requete.url.includes('manifest')) ? { cache: 'no-cache' } : {};
  const reseau = fetch(requete, optionsFetch).then((rep) => {
    if (rep && rep.ok) {
      const copie = rep.clone();
      caches.open(CACHE).then((c) => c.put(requete, copie)).catch(() => {});
    }
    return rep && rep.ok ? rep : null;
  }).catch(() => null);

  return Promise.race([reseau, delai(DELAI_RESEAU)]).then((vite) =>
    vite || caches.match(requete)
      .then((c) => c || (estPage ? caches.match('./') : null))
      .then((c) => c || reseau)
      .then((c) => c || new Response('Hors connexion', { status: 503 }))
  );
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.action === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(servir(e.request, e.request.mode === 'navigate'));
});
