#!/usr/bin/env bash

set -e

host="$1"
port="$2"
name="$3"

if [ -z "$host" ] || [ -z "$port" ]; then
  echo "Usage: wait-for.sh <host> <port> <name>"
  exit 1
fi

echo "Waiting for $name at $host:$port..."
for i in {1..60}; do
  if nc -z "$host" "$port" >/dev/null 2>&1; then
    echo "$name is ready."
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for $name."
exit 1
