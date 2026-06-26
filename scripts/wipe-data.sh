#!/usr/bin/env bash
# Wipe all tenant data — schema intact. Ready for real OAuth ingestion.
set -euo pipefail
cd "$(dirname "$0")/.."

DB="${DATABASE_URL:-postgresql://cortex:cortex@localhost:5434/cortex}"
ES="${ELASTICSEARCH_URL:-http://localhost:9200}"
NEO4J_HTTP="${NEO4J_HTTP_URL:-http://localhost:7474}"
NEO4J_USER="${NEO4J_USER:-neo4j}"
NEO4J_PASS="${NEO4J_PASSWORD:-cortexneo4j}"

echo "→ Truncating Postgres tenant data…"
psql "$DB" <<'SQL'
TRUNCATE radar_alerts, decision_logs, hr_emergency_notice_reads,
  user_layouts, workflows, studio_notebooks, active_presence,
  hr_employee_approvals, hr_emergency_notices, hr_leave_requests, hr_payslips,
  hr_payroll_runs, hr_plugin_connections, hr_employees,
  employee_todos, employee_settings,
  user_project_assignments, tenant_github_scope, tenant_projects,
  connected_accounts, connector_credentials, ingestion_progress, embedding_cache,
  write_requests, audit_logs, connector_health, tenant_onboarding,
  cortex_edges, cortex_nodes, cortex_documents, cortex_approvals,
  cortex_agent_interactions, qa_logs, improvement_suggestions
  RESTART IDENTITY CASCADE;
TRUNCATE tenants RESTART IDENTITY CASCADE;
-- Better Auth tables (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user') THEN
    TRUNCATE "session", "account", "verification", "user" CASCADE;
  END IF;
END $$;
SQL

echo "→ Deleting Elasticsearch cortex-* indices…"
if [[ "${RAILWAY_ENV:-}" != "true" ]]; then
curl -sf "$ES/_cat/indices/cortex-*?h=index" 2>/dev/null | while read -r idx; do
  [ -n "$idx" ] && curl -sf -X DELETE "$ES/$idx" >/dev/null && echo "   deleted $idx"
done || echo "   (Elasticsearch unreachable — skip)"
else
  echo "   (skipped on Railway slim deploy)"
fi

echo "→ Clearing Neo4j graph…"
if [[ "${RAILWAY_ENV:-}" != "true" ]]; then
curl -sf -u "$NEO4J_USER:$NEO4J_PASS" \
  -H 'Content-Type: application/json' \
  -d '{"statements":[{"statement":"MATCH (n) DETACH DELETE n"}]}' \
  "$NEO4J_HTTP/db/neo4j/tx/commit" >/dev/null 2>&1 || echo "   (Neo4j unreachable — skip)"
else
  echo "   (skipped on Railway slim deploy)"
fi

echo "✅ Data wiped. Schema intact."
