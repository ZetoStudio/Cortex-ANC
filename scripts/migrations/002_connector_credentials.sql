-- Direct OAuth tokens (replaces Nango)

CREATE TABLE IF NOT EXISTS connector_credentials (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, provider)
);

CREATE INDEX IF NOT EXISTS connector_credentials_tenant_idx ON connector_credentials (tenant_id);
