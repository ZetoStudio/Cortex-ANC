#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

URL="${DATABASE_URL:?DATABASE_URL is required}"

echo "→ Running Cortex database migrations…"

for f in scripts/migrations/*.sql; do
  base=$(basename "$f")
  # 008 alters Better Auth "user" table — create auth schema first.
  if [ "$base" = "008_employee_portal.sql" ]; then
    echo "→ Better Auth tables (required before $base)…"
    bash scripts/migrate-auth.sh
  fi
  echo "  · $base"
  psql "$URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "✅ Migrations complete"
