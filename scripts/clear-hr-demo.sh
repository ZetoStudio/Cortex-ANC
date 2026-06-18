#!/usr/bin/env bash
set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://cortex:cortex@localhost:5434/cortex}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Clearing HR / employee demo data (tenant-hr-dev)…"
psql "$DB_URL" -f "$ROOT/scripts/clear-hr-demo-data.sql" -v ON_ERROR_STOP=1
echo "✅ HR demo data cleared. Dev sign-in users remain; add employees via /hr/upload."
