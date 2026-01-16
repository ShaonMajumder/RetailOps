FROM php:8.4-fpm

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    PHP_OPCACHE_VALIDATE_TIMESTAMPS=1 \
    COMPOSER_CACHE_DIR=/composer/cache

RUN apt-get update && apt-get install -y \
    bash \
    git \
    unzip \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libssl-dev \
    libicu-dev \
    supervisor \
    dos2unix \
    netcat-openbsd \
    procps \
    && docker-php-ext-configure intl \
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip sockets intl \
    && git clone --depth 1 -b 6.1.0 https://github.com/phpredis/phpredis.git /tmp/phpredis \
    && cd /tmp/phpredis \
    && phpize \
    && ./configure \
    && make -j"$(nproc)" \
    && make install \
    && docker-php-ext-enable redis \
    && rm -rf /tmp/phpredis \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

COPY ./docker/supervisord.conf /etc/supervisord.conf

RUN git config --global --add safe.directory /var/www/html

COPY ./docker/startup.sh /usr/local/bin/startup.sh
COPY ./docker/scripts/wait-for.sh /usr/local/bin/wait-for.sh
COPY ./docker/scripts/worker.sh /usr/local/bin/worker.sh
RUN dos2unix /usr/local/bin/startup.sh /usr/local/bin/wait-for.sh /usr/local/bin/worker.sh \
    && chmod +x /usr/local/bin/startup.sh /usr/local/bin/wait-for.sh /usr/local/bin/worker.sh

ENTRYPOINT ["/usr/local/bin/startup.sh"]

EXPOSE 9000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
