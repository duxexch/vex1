/* VEX Deals unified service worker — FCM push + production-grade caching.
   Bump SW_VERSION on any strategy change (triggers update + purges old caches). */
const SW_VERSION = 'vex-sw-v2';
const PAGES = SW_VERSION + '-pages';
const ASSETS = SW_VERSION + '-assets';
const API = SW_VERSION + '-api';

// ---------------------------------------------------------------------------
// Firebase Cloud Messaging (guarded — an unreachable/blocked gstatic CDN must
// never prevent this SW from installing, or caching would be lost entirely)
// ---------------------------------------------------------------------------
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: 'AIzaSyD4D7-axkkEw1e-2A7Tq_UkGPGum0UQ2tY',
    authDomain: 'ceremonial-ivy-3f6jr.firebaseapp.com',
    projectId: 'ceremonial-ivy-3f6jr',
    storageBucket: 'ceremonial-ivy-3f6jr.firebasestorage.app',
    messagingSenderId: '710426700225',
    appId: '1:710426700225:web:7003397cf3285f8a79a740',
  });
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || 'VEX Deals';
    // Same display options as the previous firebase-messaging-sw.js (known-working)
    self.registration.showNotification(title, {
      body: (payload.notification && payload.notification.body) || '',
      icon: '/icon-192.svg',
    });
  });
} catch (err) {
  console.warn('[sw] FCM unavailable (offline/blocked) — caching remains active', err);
}

// Focus (or open) the app when the user taps an OS notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })()
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES).then((cache) =>
      Promise.all(
        ['/', '/icon-192.svg', '/icon-512.svg'].map((url) => cache.add(url).catch(() => {}))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.indexOf(SW_VERSION) !== 0).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Only these public, domain-wide GET endpoints are safe to cache (never user-scoped)
const API_CACHE_PREFIXES = [
  '/api/companies',
  '/api/app-branding',
  '/api/payment-methods',
  '/api/sports/',
  '/api/notifications',
];

function isCacheableApi(url) {
  if (url.search) return false;
  return API_CACHE_PREFIXES.some(function (prefix) {
    return url.pathname.indexOf(prefix) === 0;
  });
}

async function networkFirstPage(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok && res.type === 'basic') {
      const cache = await caches.open(PAGES);
      cache.put(request, res.clone()).catch(function () {});
    }
    return res;
  } catch (err) {
    const cached = (await caches.match(request)) || (await caches.match('/'));
    if (cached) return cached;
    return new Response(
      '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VEX Deals</title><body style="font-family:sans-serif;text-align:center;padding:4rem 1rem;color:#334155"><h1>VEX Deals</h1><p>لا يوجد اتصال بالإنترنت — تحقق من الشبكة وحاول مجدداً.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok && res.type === 'basic') {
    const cache = await caches.open(cacheName);
    cache.put(request, res.clone()).catch(function () {});
    trimCache(cacheName, 400);
  }
  return res;
}

async function networkFirstApi(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const cache = await caches.open(API);
      cache.put(request, res.clone()).catch(function () {});
    }
    return res;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkUpdate = fetch(request)
    .then(function (res) {
      if (res && res.ok && res.type === 'basic') {
        cache.put(request, res.clone()).catch(function () {});
      }
      return res;
    })
    .catch(function () {});
  if (cached) return cached;
  const res = await networkUpdate;
  if (res) return res;
  const again = await cache.match(request);
  return again || Response.error();
}

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    const excess = keys.slice(0, keys.length - maxEntries);
    await Promise.all(excess.map((key) => cache.delete(key)));
  } catch (err) {
    /* best effort */
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network-first. Deploys delete old hashed assets, so a
  // stale HTML shell while online = broken app — never serve it from cache.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // Vite build output: content-addressed → cache-first forever
  if (url.pathname.indexOf('/assets/') === 0) {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }

  // Public API reads: network-first with offline fallback (others: network only)
  if (url.pathname.indexOf('/api/') === 0) {
    if (isCacheableApi(url)) {
      event.respondWith(networkFirstApi(request));
    }
    return;
  }

  // Same-origin static: icons/fonts (SWR). Skips html/js/txt/json/manifest so
  // manifests, robots and sw files always follow their HTTP cache rules.
  if (/\.(png|svg|jpe?g|webp|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, ASSETS));
  }
});
