// Test 1.70: ohne Offline-Speicher. Dieser Service-Worker räumt nur auf und meldet sich selbst ab,
// damit iOS beim Start keinen Hintergrund-Helfer mehr hochfahren muss.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.registration.unregister(); }));
});
