#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_URL="${DATABASE_URL:-postgresql://cortex:cortex@localhost:5434/cortex}"

echo "→ Applying HR migrations (if needed)…"
for migration in 006_tenant_projects.sql 007_hr_module.sql 008_employee_portal.sql; do
  if [ -f "$ROOT/scripts/migrations/$migration" ]; then
    psql "$DB_URL" -f "$ROOT/scripts/migrations/$migration" -v ON_ERROR_STOP=1
  fi
done

echo "→ Seeding HR demo data (tenant-hr-dev)…"
psql "$DB_URL" -f "$ROOT/scripts/seed-hr-demo.sql" -v ON_ERROR_STOP=1

echo "✅ HR demo seed complete."
echo "   HR login:      hr@cortex.local (use Sign in as HR on login page)"
echo "   Employee login: employee@cortex.local (Sign in as Employee)"
echo "   5 employees, payroll, payslips, leave, notices, and todos loaded."
