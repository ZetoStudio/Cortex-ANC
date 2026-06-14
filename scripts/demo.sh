#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🚀 Cortex v2 bootstrap (no demo seed)"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — set GROQ_API_KEY, BETTER_AUTH_SECRET, Google OAuth"
fi

echo "→ Starting infrastructure (12 Docker services)…"
bun run infra:up
sleep 5

echo "→ Initializing schema + Better Auth tables…"
bun run db:init

echo "→ Wiping any leftover demo data…"
bun run db:wipe || true

echo "→ Building packages…"
bun run build

echo ""
echo "✅ Ready. Start stack:"
echo "   bun run start:all"
echo ""
echo "1. Sign up at http://localhost:3000/auth/login (Google or email)"
echo "2. Connect Google Workspace + GitHub at /onboarding"
echo "3. Ask real questions on Executive Desk with citations"
