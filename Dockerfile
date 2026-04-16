FROM php:8.2-apache

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mysqli curl

# Enable Apache modules
RUN a2enmod rewrite headers

# Copy app files
COPY . /var/www/html/

# Fix permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    mkdir -p /var/www/html/img && \
    chown www-data:www-data /var/www/html/img

# Allow .htaccess and set DirectoryIndex
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
    DirectoryIndex login.html index.html index.php\n\
</Directory>' > /etc/apache2/conf-available/app.conf && \
    a2enconf app

# Create startup script
RUN echo '#!/bin/bash\n\
export APACHE_PORT=${PORT:-8080}\n\
echo "Listen ${APACHE_PORT}" > /etc/apache2/ports.conf\n\
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${APACHE_PORT}>/" /etc/apache2/sites-enabled/000-default.conf\n\
echo "Starting Apache on port ${APACHE_PORT}"\n\
exec apache2-foreground' > /start.sh && chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
