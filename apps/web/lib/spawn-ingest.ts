import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

import { isDirectIngestEnabled } from '@cortex/shared';

function resolveTemporalWorkerDir(): string | null {
  const candidates = [
    path.join(process.cwd(), 'services/temporal-worker'),
    path.join(process.cwd(), '../../services/temporal-worker'),
    '/app/services/temporal-worker',
  ];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'scripts/resync-ingest.ts'))) return dir;
  }
  return null;
}

/** Run ingest script in background when Temporal is unavailable. */
export function spawnIngestResync(tenantId: string, provider: string): boolean {
  if (!isDirectIngestEnabled()) return false;

  const workerDir = resolveTemporalWorkerDir();
  if (!workerDir) return false;

  const script = path.join(workerDir, 'scripts/resync-ingest.ts');
  try {
    const child = spawn('bun', ['run', script, tenantId, provider], {
      cwd: workerDir,
      detached: true,
      stdio: 'ignore',
      env: process.env,
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

/** Spawn parallel resync for all connected providers (direct mode). */
export function spawnIngestResyncAll(tenantId: string, providers: string[]): boolean {
  if (providers.length === 1 && providers[0] === 'all') {
    return spawnIngestResync(tenantId, 'all');
  }

  const mapped = providers.map((p) => (p === 'google' ? 'google-workspace' : p));
  let ok = false;
  for (const provider of mapped) {
    if (spawnIngestResync(tenantId, provider)) ok = true;
  }
  return ok;
}
