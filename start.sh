#!/bin/bash
set -e

APACHE_PORT="${PORT:-8080}"
echo "==> Starting Apache on port: $APACHE_PORT"

# Completely rewrite ports.conf from scratch
echo "Listen $APACHE_PORT" > /etc/apache2/ports.conf

# Completely rewrite the default vhost — includes all PWA-required headers
cat > /etc/apache2/sites-enabled/000-default.conf << VHOST
<VirtualHost *:${APACHE_PORT}>
    DocumentRoot /var/www/html
    DirectoryIndex login.html index.html index.php

    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # MIME types required for PWA installability
    AddType application/manifest+json   .json
    AddType application/javascript      .js
    AddType image/png                   .png

    # Service Worker must be served with no-cache so browsers always get the latest
    <Files "sw.js">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "0"
        Header set Service-Worker-Allowed "/"
    </Files>

    # Manifest must be served with correct Content-Type
    <Files "manifest.json">
        Header set Content-Type "application/manifest+json"
        Header set Cache-Control "no-cache"
    </Files>

    # Protect db.php from direct browser access
    <Files "db.php">
        Require all denied
    </Files>

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
VHOST

# Fix MPM conflict - disable event, enable prefork (required for mod_php)
a2dismod mpm_event 2>/dev/null || true
a2enmod mpm_prefork 2>/dev/null || true

echo "==> Apache config ready, starting..."
exec apache2-foreground
