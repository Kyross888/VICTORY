// ============================================================
//  js/api.js  —  Shared API helper for all POS pages
//  Include this on every page:  <script src="js/api.js"></script>
// ============================================================

const API_BASE = 'api'; // relative path — works on any server

const api = {
    // Generic fetch wrapper
    async request(endpoint, action, method = 'GET', body = null) {
        const url = `${API_BASE}/${endpoint}.php?action=${action}`;
        const opts = {
            method,
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(url, opts);
        const data = await res.json();
        return data;
    },

    // ── AUTH ──────────────────────────────────────────────────
    auth: {
        login: (email, password, role) =>
            api.request('auth', 'login', 'POST', { email, password, role }),
        register: (payload) =>
            api.request('auth', 'register', 'POST', payload),
        logout: () => api.request('auth', 'logout', 'POST'),
        me: () => api.request('auth', 'me'),
    },

    // ── PRODUCTS ─────────────────────────────────────────────
    products: {
        list: (params = {}) => {
            const qs = new URLSearchParams({ action: 'list', ...params }).toString();
            return fetch(`${API_BASE}/products.php?${qs}`, { credentials: 'same-origin' }).then(r => r.json());
        },
        create: (formData) => {
            // formData can be FormData (with image) or plain object
            if (formData instanceof FormData) {
                return fetch(`${API_BASE}/products.php?action=create`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData,
                }).then(r => r.json());
            }
            return api.request('products', 'create', 'POST', formData);
        },
        update: (id, data) => {
            // Accept FormData (with image) or plain object
            if (data instanceof FormData) {
                return fetch(`${API_BASE}/products.php?action=update&id=${id}`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: data, // browser sets multipart header automatically
                }).then(r => r.json());
            }
            return fetch(`${API_BASE}/products.php?action=update&id=${id}`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(r => r.json());
        },
        delete: (id) =>
            fetch(`${API_BASE}/products.php?action=delete&id=${id}`, {
                method: 'POST',
                credentials: 'same-origin',
            }).then(r => r.json()),
        adjustStock: (id, delta) =>
            fetch(`${API_BASE}/products.php?action=adjust_stock&id=${id}`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delta }),
            }).then(r => r.json()),
    },

    // ── ORDERS ───────────────────────────────────────────────
    orders: {
        place: (payload) => api.request('orders', 'place', 'POST', payload),
        list: (params = {}) => {
            const qs = new URLSearchParams({ action: 'list', ...params }).toString();
            return fetch(`${API_BASE}/orders.php?${qs}`, { credentials: 'same-origin' }).then(r => r.json());
        },
        get: (id) =>
            fetch(`${API_BASE}/orders.php?action=get&id=${id}`, { credentials: 'same-origin' }).then(r => r.json()),
        void: (id) =>
            fetch(`${API_BASE}/orders.php?action=void&id=${id}`, {
                method: 'POST',
                credentials: 'same-origin',
            }).then(r => r.json()),
    },

    // ── DASHBOARD ─────────────────────────────────────────────
    dashboard: {
        kpis: (branchId = '') =>
            fetch(`${API_BASE}/dashboard.php?action=kpis${branchId ? '&branch_id=' + branchId : ''}`, { credentials: 'same-origin' }).then(r => r.json()),
        revenueTrend: (branchId = '') =>
            fetch(`${API_BASE}/dashboard.php?action=revenue_trend${branchId ? '&branch_id=' + branchId : ''}`, { credentials: 'same-origin' }).then(r => r.json()),
        orderSources: (branchId = '') =>
            fetch(`${API_BASE}/dashboard.php?action=order_sources${branchId ? '&branch_id=' + branchId : ''}`, { credentials: 'same-origin' }).then(r => r.json()),
        topProducts: (branchId = '') =>
            fetch(`${API_BASE}/dashboard.php?action=top_products${branchId ? '&branch_id=' + branchId : ''}`, { credentials: 'same-origin' }).then(r => r.json()),
    },

    // ── SALES REPORT ─────────────────────────────────────────
    salesReport: {
        get: (params = {}) => {
            const qs = new URLSearchParams(params).toString();
            return fetch(`${API_BASE}/sales_report.php?${qs}`, { credentials: 'same-origin' }).then(r => r.json());
        },
    },

    // ── CUSTOMERS ────────────────────────────────────────────
    customers: {
        list: (search = '') =>
            fetch(`${API_BASE}/customers.php?action=list${search ? '&search=' + encodeURIComponent(search) : ''}`, { credentials: 'same-origin' }).then(r => r.json()),
        get: (id) =>
            fetch(`${API_BASE}/customers.php?action=get&id=${id}`, { credentials: 'same-origin' }).then(r => r.json()),
        create: (data) => api.request('customers', 'create', 'POST', data),
        update: (id, data) =>
            fetch(`${API_BASE}/customers.php?action=update&id=${id}`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(r => r.json()),
        delete: (id) =>
            fetch(`${API_BASE}/customers.php?action=delete&id=${id}`, {
                method: 'POST',
                credentials: 'same-origin',
            }).then(r => r.json()),
    },
};

// ── Auth Guard ────────────────────────────────────────────────
// Call this at the top of any protected page
async function requireLogin(redirectToAdmin = false) {
    const res = await api.auth.me().catch(() => null);
    if (!res || !res.success) {
        window.location.href = 'login.html';
        return null;
    }
    // Optionally update header greeting
    const el = document.getElementById('userGreeting');
    if (el) el.textContent = res.user.name;
    return res.user;
}

// Convenience: format Philippine Peso
function fmt(n) {
    return '₱' + parseFloat(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ── PWA: Register Service Worker + Install Prompt ────────────
(function initPWA() {

    // ── 1. Register Service Worker ────────────────────────────
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('[PWA] SW registered. Scope:', reg.scope))
                .catch(err => console.warn('[PWA] SW registration failed:', err));
        });
    }

    // ── 2. Detect environment ─────────────────────────────────
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    // Already installed — don't show any prompt
    if (isInStandaloneMode) return;

    // ── 3. Android / Chrome: beforeinstallprompt ─────────────
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('[PWA] beforeinstallprompt captured');
        showInstallBanner('android');
    });

    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed!');
        removeBanner();
        deferredPrompt = null;
    });

    // ── 4. iOS Safari: no beforeinstallprompt exists ──────────
    // Show manual instructions instead
    if (isIOS) {
        // Small delay so page finishes rendering before banner appears
        setTimeout(() => showInstallBanner('ios'), 2000);
    }

    // ── Banner builder ────────────────────────────────────────
    function showInstallBanner(type) {
        if (document.getElementById('pwa-install-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';

        if (type === 'ios') {
            banner.innerHTML = `
                <span>📲 Install Luna's POS: tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></span>
                <button id="pwa-dismiss-btn">✕</button>`;
        } else {
            banner.innerHTML = `
                <span>📲 Install Luna's POS as an app</span>
                <button id="pwa-install-btn">Install</button>
                <button id="pwa-dismiss-btn">✕</button>`;
        }

        Object.assign(banner.style, {
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#4f46e5',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: '9999',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '90vw',
            flexWrap: 'wrap',
        });

        const sharedBtnStyle = {
            border: 'none',
            borderRadius: '8px',
            padding: '6px 14px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '13px',
            flexShrink: '0',
        };

        const installBtn = banner.querySelector('#pwa-install-btn');
        if (installBtn) {
            Object.assign(installBtn.style, {
                ...sharedBtnStyle,
                background: 'white',
                color: '#4f46e5',
            });
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('[PWA] Outcome:', outcome);
                deferredPrompt = null;
                removeBanner();
            });
        }

        const dismissBtn = banner.querySelector('#pwa-dismiss-btn');
        Object.assign(dismissBtn.style, {
            ...sharedBtnStyle,
            background: 'transparent',
            color: 'white',
            padding: '6px 8px',
        });
        dismissBtn.addEventListener('click', removeBanner);

        // Wait for body to exist (script may run before body on some pages)
        const attach = () => document.body
            ? document.body.appendChild(banner)
            : setTimeout(attach, 50);
        attach();
    }

    function removeBanner() {
        const b = document.getElementById('pwa-install-banner');
        if (b) b.remove();
    }

})();
