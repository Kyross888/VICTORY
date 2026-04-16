#!/bin/bash
set -e

# Railway injects $PORT — default to 8080 if not set
APACHE_PORT="${PORT:-8080}"

echo "==> Starting Apache on port $APACHE_PORT"

# Replace the Listen directive
echo "Listen $APACHE_PORT" > /etc/apache2/ports.conf

# Replace the VirtualHost port
sed -i "s/\*:80/*:$APACHE_PORT/" /etc/apache2/sites-enabled/000-default.conf

# Also update the ServerName to avoid warnings
echo "ServerName localhost" >> /etc/apache2/apache2.conf

exec apache2-foreground
