// ============================================================
//  sw.js  —  Luna's POS Service Worker
//  Place this file in the ROOT of your project (same level as login.html)
//
//  Strategy:
//    - Static assets (HTML, CSS, JS, images) → Cache First
//    - API calls (/api/*.php)                → Network First (always fresh)
// ============================================================

const CACHE_NAME = 'lunas-pos-v1';
const API_PATH = '/api/';

// Core shell files to pre-cache on install
const PRECACHE_URLS = [
    '/login.html',
    '/dashboard.html',
    '/pos_terminal.html',
    '/inventory.html',
    '/analytics.html',
    '/customer.html',
    '/salesreport.html',
    '/settings.html',
    '/admin.html',
    '/register.html',
    '/forgot_password.html',
    '/js/api.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
];

// ── INSTALL: pre-cache the app shell ──────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Cache what we can; ignore failures for external URLs
            return Promise.allSettled(
                PRECACHE_URLS.map(url =>
                    cache.add(url).catch(() => console.warn('[SW] Could not pre-cache:', url))
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// ── ACTIVATE: clean up old caches ─────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                .filter(key => key !== CACHE_NAME)
                .map(key => {
                    console.log('[SW] Deleting old cache:', key);
                    return caches.delete(key);
                })
            )
        ).then(() => self.clients.claim())
    );
});

// ── FETCH: route requests ─────────────────────────────────────
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. Skip non-GET and cross-origin requests (except CDN fonts/icons)
    if (request.method !== 'GET') return;

    // 2. API calls — Network First (must always be fresh data)
    if (url.pathname.startsWith(API_PATH) || url.pathname.endsWith('.php')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // 3. Everything else (HTML, JS, images, fonts) — Cache First
    event.respondWith(cacheFirst(request));
});

// ── Cache First strategy ──────────────────────────────────────
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const networkResponse = await fetch(request);
        // Cache a clone of valid same-origin responses
        if (networkResponse.ok && new URL(request.url).origin === self.location.origin) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        // Offline fallback: return login page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/login.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
}

// ── Network First strategy ────────────────────────────────────
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch {
        // API is unreachable — return a clean JSON error so the UI handles it gracefully
        return new Response(
            JSON.stringify({ success: false, error: 'You are offline. Please check your connection.' }), { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 
