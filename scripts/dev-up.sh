#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f ".env" ]; then
  cp docker/environment/.env.local .env
fi

docker compose up -d --build

if [ -d "frontend" ]; then
  (cd frontend && nohup npm run dev >/dev/null 2>&1 &)
fi
