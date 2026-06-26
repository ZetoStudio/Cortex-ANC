-- Optional zero-downtime index rebuild for large production tables.
-- NOT run by `bun run db:migrate` — execute manually when needed:
--   psql $DATABASE_URL -f scripts/migrations/manual/012_indexes_concurrent.sql
--
-- Automated deploy uses non-CONCURRENT indexes inside 012_unified_documents.sql.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cortex_docs_acl_visibility
  ON cortex_documents USING gin(acl);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cortex_docs_content_hash
  ON cortex_documents(tenant_id, content_hash);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cortex_docs_source_id
  ON cortex_documents(tenant_id, source_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cortex_docs_entity_refs
  ON cortex_documents USING gin(entity_refs);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cortex_docs_doc_type
  ON cortex_documents(tenant_id, document_type);
