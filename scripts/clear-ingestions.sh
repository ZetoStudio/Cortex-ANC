#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

URL="${DATABASE_URL:-postgresql://cortex:cortex@localhost:5434/cortex}"
echo "→ Clearing ingestion data…"
psql "$URL" -f scripts/clear-ingestions.sql
echo "✅ Ingestion data cleared"
