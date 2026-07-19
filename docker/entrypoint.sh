#!/bin/sh
set -e

# Migrações no boot (default: ligado). Desligue com RUN_MIGRATIONS=false.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
    echo "[entrypoint] DATABASE_URL/DIRECT_URL ausentes — pulando migrate"
  else
    echo "[entrypoint] Aplicando migrations (prisma migrate deploy)..."
    prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma
  fi
fi

echo "[entrypoint] Iniciando Next.js em :${PORT:-3000}"
exec node server.js
