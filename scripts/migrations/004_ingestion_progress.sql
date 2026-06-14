-- Per-tenant ingestion progress for global status bar

CREATE TABLE IF NOT EXISTS ingestion_progress (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  total_documents INT NOT NULL DEFAULT 0,
  processed_documents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, provider)
);

CREATE INDEX IF NOT EXISTS ingestion_progress_tenant_idx ON ingestion_progress (tenant_id);

ALTER TABLE ingestion_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_ingestion_progress ON ingestion_progress;
CREATE POLICY tenant_ingestion_progress ON ingestion_progress
  USING (tenant_id = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));
