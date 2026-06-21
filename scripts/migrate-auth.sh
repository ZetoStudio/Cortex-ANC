#!/usr/bin/env bash
# Apply Better Auth tables via SQL (no CLI — avoids better-sqlite3 on Railway).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DATABASE_URL="${DATABASE_URL:-postgresql://cortex:cortex@localhost:5434/cortex}"

echo "→ Better Auth schema (SQL)…"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/migrations/007b_better_auth.sql
echo "✅ Better Auth migration complete"
