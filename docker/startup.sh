#!/usr/bin/env bash

set -e

export COMPOSER_CACHE_DIR=/composer/cache

cd /var/www/html

if [ ! -d "docker/environment" ]; then
  echo "Error: docker/environment/ directory not found."
  exit 1
fi

if [ ! -f ".env" ]; then
  if [ -n "$APP_ENV_FILE" ] && [ -f "docker/environment/$APP_ENV_FILE" ]; then
    cp "docker/environment/$APP_ENV_FILE" ./.env
  elif [ -f "docker/environment/.env.local" ]; then
    cp "docker/environment/.env.local" ./.env
  fi
fi

/usr/local/bin/wait-for.sh db 3306 mysql
/usr/local/bin/wait-for.sh redis 6379 redis

if [ ! -f vendor/autoload.php ]; then
  echo "Installing composer dependencies..."
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if [ -f artisan ]; then
  if ! grep -q "^APP_KEY=" .env || [ -z "$(grep "^APP_KEY=" .env | cut -d '=' -f2)" ]; then
    echo "APP_KEY missing. Generating..."
    php artisan key:generate --force
  fi
fi

if [ -f artisan ] && [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
  echo "Running migrations..."
  php artisan migrate --force
fi

if [ -f artisan ] && [ "${RUN_SEEDERS:-0}" = "1" ]; then
  echo "Running seeders..."
  php artisan db:seed --force
fi

mkdir -p /var/www/html/logs/supervisor
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/logs
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

exec "$@"
