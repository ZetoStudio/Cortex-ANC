import type { IngestInitialDataInput } from '@cortex/shared/temporal/types';

import { spawnIngestResync, spawnIngestResyncAll } from './spawn-ingest';

/** Start provider ingest via background Bun subprocess (Railway / no Temporal). */
export function startDirectIngest(input: IngestInitialDataInput): string | null {
  const normalized = input.providers.map((p) =>
    p === 'google' || p === 'gmail' ? 'google-workspace' : p,
  );

  if (input.providers.includes('*') || normalized.length === 0) {
    if (!spawnIngestResyncAll(input.tenantId, ['all'])) return null;
    return `direct-all-${Date.now()}`;
  }

  if (normalized.length === 1) {
    const provider = normalized[0]!;
    if (!spawnIngestResync(input.tenantId, provider)) return null;
    return `direct-${provider}-${Date.now()}`;
  }

  if (!spawnIngestResyncAll(input.tenantId, normalized)) return null;
  return `direct-multi-${Date.now()}`;
}
