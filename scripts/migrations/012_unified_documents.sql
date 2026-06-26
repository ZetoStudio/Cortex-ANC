BEGIN;

-- 1. Add columns (all IF NOT EXISTS, all with safe defaults)
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS acl jsonb NOT NULL
  DEFAULT '{"visibility":"role","allowedRoles":["ceo","client","super_admin"],"sourcePermission":"unknown"}'::jsonb;

ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS content_chunks jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS content_hash text NOT NULL DEFAULT '';
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS source_id text NOT NULL DEFAULT '';
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS source_url text NOT NULL DEFAULT '';
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS entity_refs jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS parent_doc_id text;
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS cursor_value text NOT NULL DEFAULT '';
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'page';
ALTER TABLE cortex_documents ADD COLUMN IF NOT EXISTS unified_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Backfill existing rows from the metadata column they already have
UPDATE cortex_documents
SET
  document_type = COALESCE(
    NULLIF(metadata->>'type', ''),
    NULLIF(metadata->>'documentType', ''),
    'page'
  ),
  source_id = COALESCE(
    NULLIF(metadata->>'sourceId', ''),
    NULLIF(metadata->>'id', ''),
    id::text
  ),
  source_url = COALESCE(
    NULLIF(metadata->>'url', ''),
    NULLIF(metadata->>'html_url', ''),
    NULLIF(metadata->>'link', ''),
    ''
  ),
  content_hash = COALESCE(
    NULLIF(metadata->>'contentHash', ''),
    md5(COALESCE(content, ''))
  ),
  unified_metadata = metadata
WHERE content_hash = ''
   OR source_id = ''
   OR document_type = 'page';

-- 3. Indexes (non-CONCURRENT for automated deploy; see manual/012_indexes_concurrent.sql for zero-downtime ops)
CREATE INDEX IF NOT EXISTS idx_cortex_docs_acl_visibility
  ON cortex_documents USING gin(acl);

CREATE INDEX IF NOT EXISTS idx_cortex_docs_content_hash
  ON cortex_documents(tenant_id, content_hash);

CREATE INDEX IF NOT EXISTS idx_cortex_docs_source_id
  ON cortex_documents(tenant_id, source_id);

CREATE INDEX IF NOT EXISTS idx_cortex_docs_entity_refs
  ON cortex_documents USING gin(entity_refs);

CREATE INDEX IF NOT EXISTS idx_cortex_docs_doc_type
  ON cortex_documents(tenant_id, document_type);

COMMIT;
