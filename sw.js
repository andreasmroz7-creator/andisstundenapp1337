// Offline-Speicher. Bei jeder neuen Version die Nummer hochzählen.
var CACHE = 'stunden-3.80';
var DATEIEN = ['./', 'index.html', 'rechnen.js', 'pdf.js', 'manifest.webmanifest', 'cockpit-180.png', 'cockpit-192.png', 'cockpit-512.png', 'cockpit-start.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(DATEIEN.map(function (f) { return fetch(f, { cache: 'no-store' }).then(function (r) { return c.put(f, r); }); }));
  }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
// Immer zuerst frisch aus dem Netz (ohne Zwischenspeicher), ohne Netz aus dem Offline-Speicher
// Sofort aus dem Speicher antworten (schneller Start, kein heller Blitz), im Hintergrund frisch nachladen.
// Neue Versionen sind damit beim nächsten Öffnen da.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  var frisch = fetch(e.request, { cache: 'no-store' }).then(function (r) { if (r && r.ok) { var k = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, k); }); } return r; });
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    if (r) { e.waitUntil(frisch.catch(function () {})); return r; }
    return frisch.catch(function () { return caches.match('index.html'); });
  }));
});
