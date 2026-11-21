// Offline-Speicher der einfachen Stunden-App. Bei jeder neuen Version die Nummer hochzählen.
var CACHE = 'stunden-einfach-2.5';
var DATEIEN = ['./', 'index.html', 'pdf.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(DATEIEN.map(function (f) { return fetch(f, { cache: 'no-store' }).then(function (r) { return c.put(f, r); }); })); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('stunden-einfach-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
// Sofort aus dem Speicher (schneller Start, geht auch offline), im Hintergrund frisch nachladen
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  var frisch = fetch(e.request, { cache: 'no-store' }).then(function (r) { if (r && r.ok) { var k = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, k); }); } return r; });
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) { if (r) { e.waitUntil(frisch.catch(function () {})); return r; } return frisch.catch(function () { return caches.match('index.html'); }); }));
});
