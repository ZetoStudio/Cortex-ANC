import { isDirectIngestEnabled, isTemporalIngestEnabled } from '@cortex/shared';
import type { IngestInitialDataInput } from '@cortex/shared/temporal/types';
import {
  startIngestInitialDataWorkflow,
  startResyncAllWorkflow,
} from '@cortex/shared/temporal/client';

import { startDirectIngest } from './direct-ingest';

export const INGESTION_SKIPPED_MESSAGE =
  'Connector saved. Background sync could not be started in this deployment.';

export async function startIngestIfAvailable(
  input: IngestInitialDataInput,
): Promise<string | null> {
  if (isTemporalIngestEnabled()) {
    return startIngestInitialDataWorkflow(input);
  }
  if (isDirectIngestEnabled()) {
    return startDirectIngest(input);
  }
  return null;
}

export async function startResyncAllIfAvailable(tenantId: string): Promise<string | null> {
  if (isTemporalIngestEnabled()) {
    return startResyncAllWorkflow(tenantId);
  }
  if (isDirectIngestEnabled()) {
    const { spawnIngestResyncAll } = await import('./spawn-ingest');
    if (!spawnIngestResyncAll(tenantId, ['all'])) return null;
    return `direct-all-${Date.now()}`;
  }
  return null;
}
