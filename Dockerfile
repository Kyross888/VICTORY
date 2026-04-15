FROM php:8.2-apache

# Install PHP extensions needed
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Install curl extension for SMS (forgot_password.php)
RUN apt-get update && apt-get install -y libcurl4-openssl-dev && \
    docker-php-ext-install curl && \
    rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite
RUN a2enmod rewrite headers

# Set working directory
WORKDIR /var/www/html

# Copy all app files
COPY . /var/www/html/

# Fix permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    mkdir -p /var/www/html/img && \
    chown www-data:www-data /var/www/html/img

# Apache config: allow .htaccess and set DirectoryIndex
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
    DirectoryIndex login.html index.html index.php\n\
</Directory>' > /etc/apache2/conf-available/app.conf && \
    a2enconf app

# Railway injects $PORT — Apache must listen on it
RUN echo 'Listen ${PORT}' > /etc/apache2/ports.conf && \
    sed -i 's/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/' /etc/apache2/sites-enabled/000-default.conf

EXPOSE 8080

CMD ["apache2-foreground"]
