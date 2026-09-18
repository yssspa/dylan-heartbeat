const CACHE_NAME = "du-home-harbor-v27";
const PRECACHE = ["/static/index.html", "/static/app.js", "/static/style.css", "/static/manifest.json", "/static/harbor-icon.png", "/static/assets/harbor-night.svg", "/static/assets/harbor-morning.svg", "/static/assets/harbor-evening.svg"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("du-home-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith("/static/")) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {const copy = response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));}
    return response;
  }).catch(async () => (await caches.match(event.request)) || new Response("离线资源暂不可用", { status: 503 })));
});
