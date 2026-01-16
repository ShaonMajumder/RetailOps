#!/usr/bin/env bash

set -euo pipefail

php artisan queue:work database --sleep=3 --tries=3
