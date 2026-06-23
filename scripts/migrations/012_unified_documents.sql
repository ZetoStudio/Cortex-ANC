-- Unified ingestion document schema (ACL, chunks, dedup, entity refs)

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS acl jsonb NOT NULL DEFAULT '{"visibility":"role","allowedRoles":["ceo","admin"],"sourcePermission":"unknown"}'::jsonb;

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS content_chunks jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS content_hash text NOT NULL DEFAULT '';

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS source_id text NOT NULL DEFAULT '';

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS source_url text NOT NULL DEFAULT '';

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS entity_refs jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS parent_doc_id text;

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS cursor_value text NOT NULL DEFAULT '';

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'page';

ALTER TABLE cortex_documents
  ADD COLUMN IF NOT EXISTS unified_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_cortex_docs_acl_visibility
  ON cortex_documents USING gin (acl);

CREATE INDEX IF NOT EXISTS idx_cortex_docs_content_hash
  ON cortex_documents (tenant_id, content_hash);

CREATE INDEX IF NOT EXISTS idx_cortex_docs_source_id
  ON cortex_documents (tenant_id, source_id);

CREATE INDEX IF NOT EXISTS idx_cortex_docs_entity_refs
  ON cortex_documents USING gin (entity_refs);

CREATE INDEX IF NOT EXISTS idx_cortex_docs_doc_type
  ON cortex_documents (tenant_id, document_type);
