import { spawn } from 'node:child_process';
import path from 'node:path';

/** Run ingest script in background when Temporal is unavailable. */
export function spawnIngestResync(tenantId: string, provider: string): boolean {
  const root = path.resolve(process.cwd(), '../..');
  const script = path.join(root, 'services/temporal-worker/scripts/resync-ingest.ts');
  try {
    const child = spawn('bun', ['run', script, tenantId, provider], {
      cwd: path.join(root, 'services/temporal-worker'),
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
