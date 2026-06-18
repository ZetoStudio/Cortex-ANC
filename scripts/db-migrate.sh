#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

URL="${DATABASE_URL:?DATABASE_URL is required}"

echo "→ Running Cortex database migrations…"

for f in scripts/migrations/*.sql; do
  echo "  · $(basename "$f")"
  psql "$URL" -v ON_ERROR_STOP=1 -f "$f"
done

if [ -f scripts/migrate-auth.sh ]; then
  echo "→ Better Auth tables…"
  bash scripts/migrate-auth.sh || true
fi

echo "✅ Migrations complete"
