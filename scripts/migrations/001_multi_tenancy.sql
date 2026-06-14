-- Cortex v2 Phase 1: multi-tenancy, RLS, audit, connectors, onboarding

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_tenant_idx ON audit_logs (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS connector_health (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  nango_connection_id TEXT,
  last_sync_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (tenant_id, provider)
);

CREATE TABLE IF NOT EXISTS tenant_onboarding (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  step TEXT NOT NULL DEFAULT 'connect_tools',
  workflow_id TEXT,
  progress JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS write_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  connector TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by TEXT,
  decided_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

-- tenant_id on data tables
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE cortex_nodes ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE cortex_edges ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE cortex_approvals ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE cortex_agent_interactions ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE qa_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS cortex_documents_tenant_idx ON cortex_documents (tenant_id);
CREATE INDEX IF NOT EXISTS cortex_nodes_tenant_idx ON cortex_nodes (tenant_id);
CREATE INDEX IF NOT EXISTS cortex_edges_tenant_idx ON cortex_edges (tenant_id);

-- RLS
ALTER TABLE cortex_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortex_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortex_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortex_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortex_agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE write_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_docs ON cortex_documents;
CREATE POLICY tenant_docs ON cortex_documents
  USING (tenant_id IS NOT NULL AND tenant_id = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_nodes ON cortex_nodes;
CREATE POLICY tenant_nodes ON cortex_nodes
  USING (tenant_id IS NOT NULL AND tenant_id = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_edges ON cortex_edges;
CREATE POLICY tenant_edges ON cortex_edges
  USING (tenant_id IS NOT NULL AND tenant_id = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_approvals ON cortex_approvals;
CREATE POLICY tenant_approvals ON cortex_approvals
  USING (tenant_id IS NOT NULL AND tenant_id = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_interactions ON cortex_agent_interactions;
CREATE POLICY tenant_interactions ON cortex_agent_interactions
  USING (tenant_id IS NOT NULL AND tenant_id = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_audit ON audit_logs;
CREATE POLICY tenant_audit ON audit_logs
  USING (tenant_id = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_connectors ON connector_health;
CREATE POLICY tenant_connectors ON connector_health
  USING (tenant_id = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_onboarding_rls ON tenant_onboarding;
CREATE POLICY tenant_onboarding_rls ON tenant_onboarding
  USING (tenant_id = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_writes ON write_requests;
CREATE POLICY tenant_writes ON write_requests
  USING (tenant_id = current_setting('app.current_tenant_id', true));
