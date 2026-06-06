#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🚀 Cortex demo bootstrap"

if [ -f .env ] && ! grep -q NEXTAUTH_SECRET .env 2>/dev/null; then
  echo "NEXTAUTH_SECRET=cortex-demo-secret-change-in-prod" >> .env
fi

echo "→ Starting infrastructure…"
bun run infra:up
sleep 5

echo "→ Initializing database…"
bun run db:init

echo "→ Seeding brain data…"
bun run seed:brain

echo "→ Building packages…"
bun run build

echo ""
echo "✅ Demo ready. Start services in separate terminals:"
echo "   bun run services:dev   # integration + event-consumer + temporal-worker"
echo "   bun run dev            # web on http://localhost:3000"
echo ""
echo "Demo logins (password: password):"
echo "   admin@cortex.anc  — full access + admin"
echo "   ceo@cortex.anc    — Acme + Global Dynamics"
echo "   client@cortex.anc — BetaCorp only"
echo ""
echo "Try:"
echo "   Client → Executive Desk → 'What is the status of my project?'"
echo "   CEO    → same question → sees Acme + Global Dynamics"
echo "   Admin  → /admin dashboard + /brain Ollama toggle"
