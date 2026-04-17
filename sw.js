// ============================================================
//  sw.js  —  Luna's POS Service Worker (FIXED)
//  Place this file in the ROOT of your project
// ============================================================

const CACHE_NAME = 'lunas-pos-v2';
const API_PATH = '/api/';

// Core shell files to pre-cache on install
const PRECACHE_URLS = [
    '/',
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
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
];

// ── INSTALL: pre-cache the app shell ──────────────────────────
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            // Cache what we can; ignore failures for external URLs
            for (const url of PRECACHE_URLS) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                        console.log('[SW] Cached:', url);
                    }
                } catch (err) {
                    console.log('[SW] Could not pre-cache:', url, err);
                }
            }
        }).then(() => self.skipWaiting())
    );
});

// ── ACTIVATE: clean up old caches ─────────────────────────────
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
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

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // API calls — Network First (must always be fresh data)
    if (url.pathname.startsWith(API_PATH) || url.pathname.endsWith('.php')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Everything else — Cache First with network fallback
    event.respondWith(cacheFirst(request));
});

// ── Cache First strategy ──────────────────────────────────────
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        console.log('[SW] Cache hit:', request.url);
        return cached;
    }

    try {
        const networkResponse = await fetch(request);
        // Cache a clone of valid same-origin responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed for:', request.url);
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
    } catch (error) {
        console.log('[SW] Network failed, trying cache for:', request.url);
        const cached = await caches.match(request);
        if (cached) return cached;
        
        // API is unreachable — return a clean JSON error
        return new Response(
            JSON.stringify({ success: false, error: 'You are offline. Please check your connection.' }), 
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
