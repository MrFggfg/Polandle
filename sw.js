const CACHE_NAME = "polandle-v2";
const APP_SHELL = [
    "./",
    "index.html",
    "potwordle.html",
    "przedmiotle.html",
    "bestiariusz.html",
    "przedmioty_baza.html",
    "geoguessr.html",
    "style.css",
    "manifest.json",
    "offline.html",
    "fonts/Amaranth-Bold.ttf",
    "fonts/BlackChancery.ttf",
    "images/icon-192.png",
    "images/icon-512.png",
    "images/icon.ico",
    "images/tlo2.png",
    "images/podpowiedz1.png",
    "images/podpowiedz2.png",
    "images/poddajsie.png",
    "js/baza_potworow.js",
    "js/przedmioty.js",
    "js/mapy.js",
    "js/game_mapy.js",
    "js/game.js",
    "js/game_przedmioty.js",
    "js/app.js",
    "js/app_przedmioty.js",
    "js/snow.js",
    "js/pwa.js",
    "js/modules/helpers.js",
    "js/modules/notifications.js",
    "js/modules/statistics.js",
    "js/modules/autocomplete.js",
    "js/modules/modal.js",
    "js/modules/game-mode.js",
    "js/modules/game-session.js"
];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )));
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            return response;
        }).catch(() => caches.match("offline.html")))
    );
});