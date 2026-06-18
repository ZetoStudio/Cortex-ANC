-- Clear all ingestion artifacts (documents, graph, progress). Safe to re-run.

DELETE FROM ingestion_progress;
DELETE FROM cortex_documents;
DELETE FROM cortex_nodes;
DELETE FROM cortex_edges;
DELETE FROM embedding_cache WHERE true;

UPDATE connector_health
SET status = 'disconnected', last_sync_at = NULL, metadata = '{}'::jsonb
WHERE true;
