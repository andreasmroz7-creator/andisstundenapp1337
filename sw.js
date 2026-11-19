// Offline-Speicher. Bei jeder neuen Version die Nummer hochzählen.
var CACHE = 'stunden-1.2';
var DATEIEN = ['./', 'index.html', 'rechnen.js', 'pdf.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(DATEIEN); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })); self.clients.claim(); });
// Erst Netz (damit Updates sofort kommen), ohne Netz aus dem Speicher
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) { var k = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, k); }); return r; })
    .catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); }); }));
});
