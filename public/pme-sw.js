// Service worker d'AGRIKEY PME (portée /pme).
// Il ne met en cache AUCUNE donnée privée : seulement une page « hors ligne »
// affichée quand le téléphone n'a pas de réseau.
const CACHE = "agrikey-pme-v1";
const HORS_LIGNE = "/pme/hors-ligne.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([HORS_LIGNE, "/pme/icone-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((cle) => cle !== CACHE).map((cle) => caches.delete(cle))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Seules les ouvertures de page passent par ici : réseau d'abord, page hors ligne en secours.
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(HORS_LIGNE)));
});
