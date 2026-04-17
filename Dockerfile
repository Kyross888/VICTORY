FROM php:8.2-apache

# Install system dependencies + PHP extensions + ImageMagick for icon generation
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    imagemagick \
    && docker-php-ext-install pdo pdo_mysql mysqli curl \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite headers

# Copy app files
COPY . /var/www/html/

# Fix permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    mkdir -p /var/www/html/img && \
    chown www-data:www-data /var/www/html/img

# Auto-generate PWA icons from the restaurant logo at build time
RUN SOURCE="/var/www/html/img/350980067_209708485284413_3662357125511446837_n.jpg" && \
    if [ -f "$SOURCE" ]; then \
        convert "$SOURCE" -resize 72x72!   /var/www/html/img/icon-72.png && \
        convert "$SOURCE" -resize 96x96!   /var/www/html/img/icon-96.png && \
        convert "$SOURCE" -resize 128x128! /var/www/html/img/icon-128.png && \
        convert "$SOURCE" -resize 144x144! /var/www/html/img/icon-144.png && \
        convert "$SOURCE" -resize 152x152! /var/www/html/img/icon-152.png && \
        convert "$SOURCE" -resize 192x192! /var/www/html/img/icon-192.png && \
        convert "$SOURCE" -resize 384x384! /var/www/html/img/icon-384.png && \
        convert "$SOURCE" -resize 512x512! /var/www/html/img/icon-512.png && \
        echo "PWA icons generated successfully." ; \
    else \
        echo "WARNING: Source image not found — PWA icons not generated." ; \
    fi

# Allow .htaccess and set DirectoryIndex
RUN echo '<Directory /var/www/html>' > /etc/apache2/conf-available/app.conf && \
    echo '    Options -Indexes +FollowSymLinks' >> /etc/apache2/conf-available/app.conf && \
    echo '    AllowOverride All' >> /etc/apache2/conf-available/app.conf && \
    echo '    Require all granted' >> /etc/apache2/conf-available/app.conf && \
    echo '    DirectoryIndex login.html index.html index.php' >> /etc/apache2/conf-available/app.conf && \
    echo '</Directory>' >> /etc/apache2/conf-available/app.conf && \
    a2enconf app

COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
