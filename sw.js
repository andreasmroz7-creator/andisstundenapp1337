// TEST (1.70): Offline-Speicher abgeschaltet, um zu prüfen, ob der helle Blitz beim Start dadurch verschwindet.
// Dieser Helfer räumt sich selbst weg: Speicher löschen und abmelden. Kein fetch-Handler mehr.
var CACHE = 'stunden-1.70-test';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.registration.unregister(); }));
});
