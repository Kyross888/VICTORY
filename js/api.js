// ── PWA: Register Service Worker + install prompt ───────────
(function initPWA() {
    // Inject <link rel="manifest"> into <head> automatically if missing
    if (!document.querySelector('link[rel="manifest"]')) {
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = '/manifest.json';
        document.head.appendChild(link);
    }

    // Inject theme-color meta tag
    if (!document.querySelector('meta[name="theme-color"]')) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#4f46e5';
        document.head.appendChild(meta);
    }

    // Register the service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    console.log('[PWA] Service Worker registered. Scope:', reg.scope);
                    // Check for updates
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        console.log('[PWA] New service worker installing...');
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[PWA] Update available!');
                                // Show update notification to user
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
        });
    }

    // ── Install prompt (Add to Home Screen) ──────────────────
    let deferredPrompt = null;
    let installBannerShown = false;

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Don't show the banner if user already dismissed it recently
        const bannerDismissed = localStorage.getItem('pwa_banner_dismissed');
        if (bannerDismissed && Date.now() - parseInt(bannerDismissed) < 7 * 24 * 60 * 60 * 1000) {
            return;
        }
        
        // Show install banner only once per session or if not dismissed recently
        if (!installBannerShown) {
            installBannerShown = true;
            showInstallBanner();
        }
    });

    function showInstallBanner() {
        // Remove any existing banner
        const existingBanner = document.getElementById('pwa-install-banner');
        if (existingBanner) existingBanner.remove();

        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fa-solid fa-mobile-screen-button" style="font-size: 24px;"></i>
                    <div>
                        <strong style="font-size: 14px;">Install Luna's POS</strong>
                        <span style="font-size: 12px; opacity: 0.8;">Get app-like experience</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button id="pwa-install-btn" style="background: white; color: #4f46e5; border: none; border-radius: 20px; padding: 8px 18px; cursor: pointer; font-weight: 700; font-size: 13px;">Install</button>
                    <button id="pwa-dismiss-btn" style="background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 8px 14px; cursor: pointer; font-size: 13px;">✕</button>
                </div>
            </div>
        `;
        
        Object.assign(banner.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            background: '#4f46e5',
            color: 'white',
            padding: '14px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
            zIndex: '9999',
            fontSize: '14px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
        });

        const installBtn = banner.querySelector('#pwa-install-btn');
        const dismissBtn = banner.querySelector('#pwa-dismiss-btn');

        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                // Fallback: show instructions
                alert('To install: Tap the share button (⎋) and select "Add to Home Screen"');
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('[PWA] Install prompt outcome:', outcome);
            deferredPrompt = null;
            banner.remove();
            if (outcome === 'accepted') {
                localStorage.removeItem('pwa_banner_dismissed');
            }
        });

        dismissBtn.addEventListener('click', () => {
            banner.remove();
            localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
        });

        document.body.appendChild(banner);
    }

    function showUpdateNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 15px;">
                <span>🔄 New version available! Refresh to update.</span>
                <button id="pwa-refresh-btn" style="background: white; color: #4f46e5; border: none; border-radius: 20px; padding: 6px 14px; cursor: pointer; font-weight: 600;">Refresh</button>
            </div>
        `;
        Object.assign(notification.style, {
            position: 'fixed',
            top: '70px',
            left: '20px',
            right: '20px',
            background: '#4f46e5',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '12px',
            zIndex: '9998',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        });
        
        document.body.appendChild(notification);
        
        document.getElementById('pwa-refresh-btn')?.addEventListener('click', () => {
            window.location.reload();
        });
        
        setTimeout(() => notification.remove(), 8000);
    }

    window.addEventListener('appinstalled', () => {
        console.log('[PWA] Luna\'s POS installed successfully!');
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.remove();
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.innerHTML = '✅ Luna\'s POS installed successfully!';
        Object.assign(successMsg.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: '#38a169',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            zIndex: '9999',
            fontSize: '14px',
        });
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    });
})();
