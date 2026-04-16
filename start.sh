#!/bin/bash
set -e

APACHE_PORT="${PORT:-8080}"
echo "==> PORT env is: $PORT"
echo "==> Starting Apache on port: $APACHE_PORT"

# Rewrite ports.conf
echo "Listen $APACHE_PORT" > /etc/apache2/ports.conf

# Rewrite the VirtualHost line
sed -i "s/*:80/*:$APACHE_PORT/g" /etc/apache2/sites-enabled/000-default.conf

# Suppress ServerName warning
grep -q "ServerName" /etc/apache2/apache2.conf || echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Print config for debug
echo "==> ports.conf:"
cat /etc/apache2/ports.conf
echo "==> VirtualHost line:"
grep VirtualHost /etc/apache2/sites-enabled/000-default.conf

exec apache2-foreground
