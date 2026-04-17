#!/bin/bash
set -e

APACHE_PORT="${PORT:-8080}"
echo "==> Starting Apache on port: $APACHE_PORT"

# Completely rewrite ports.conf from scratch
echo "Listen $APACHE_PORT" > /etc/apache2/ports.conf

# Completely rewrite the default vhost from scratch
cat > /etc/apache2/sites-enabled/000-default.conf << VHOST
<VirtualHost *:${APACHE_PORT}>
    DocumentRoot /var/www/html
    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
VHOST

# Fix MPM conflict - disable event, enable prefork (required for mod_php)
a2dismod mpm_event 2>/dev/null || true
a2enmod mpm_prefork 2>/dev/null || true

echo "==> Apache config ready, starting..."
exec apache2-foreground
