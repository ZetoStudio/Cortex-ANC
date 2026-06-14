#!/usr/bin/env bash
# Create Better Auth tables in Postgres (Kysely adapter).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://cortex:cortex@localhost:5434/cortex}"

echo "→ Migrating Better Auth schema…"
cd apps/web
DATABASE_URL="$DATABASE_URL" bunx @better-auth/cli@latest migrate --config ./lib/auth-server.ts --yes

echo "✅ Better Auth migration complete"
