FROM php:8.2-apache

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Install curl for SMS feature
RUN apt-get update && apt-get install -y libcurl4-openssl-dev && \
    docker-php-ext-install curl && \
    rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite headers

# Copy app files
COPY . /var/www/html/

# Fix permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    mkdir -p /var/www/html/img && \
    chown www-data:www-data /var/www/html/img

# Allow .htaccess overrides and set DirectoryIndex
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
    DirectoryIndex login.html index.html index.php\n\
</Directory>' > /etc/apache2/conf-available/app.conf && \
    a2enconf app

# ✅ KEY FIX: Railway uses $PORT env var — Apache must listen on it
CMD bash -c "sed -i 's/Listen 80/Listen ${PORT:-80}/' /etc/apache2/ports.conf && \
    sed -i 's/:80>/:${PORT:-80}>/' /etc/apache2/sites-enabled/000-default.conf && \
    apache2-foreground"
