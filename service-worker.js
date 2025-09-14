// Simple cache-first PWA SW
const CACHE = "kensa-scan-v1";
const ASSETS = [
  "./",
  "./scan.html",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./tsh.png",
  "./assets/ui.css",
  "./assets/config.js",
  // libs (opaque cached)
  "https://unpkg.com/@zxing/browser@latest",
  "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js",
  "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // only GET
  if (req.method !== "GET") return;

  e.respondWith(
    caches.match(req).then(cached => {
      // Cache-first; fall back to network; update cache in background (SWr)
      const fetchPromise = fetch(req).then(res => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        } catch (_) {}
        return res;
      }).catch(() => cached); // offline
      return cached || fetchPromise;
    })
  );
});
