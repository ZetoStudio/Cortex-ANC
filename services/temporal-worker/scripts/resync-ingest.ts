#!/usr/bin/env bun
/** One-off re-sync: run ingest activities directly (bypasses Temporal). */
import { loadRootEnv } from '@cortex/shared';

loadRootEnv(import.meta.url);

const tenantId = process.argv[2] ?? 'tenant-571e0a33';
const provider = process.argv[3] ?? 'notion';

const {
  ingestGmailActivity,
  ingestGoogleDriveActivity,
  ingestGoogleCalendarActivity,
  ingestGoogleContactsActivity,
  ingestGoogleTasksActivity,
  ingestGitHubActivity,
  ingestNotionActivity,
  markIngestCompleteActivity,
} = await import('../src/ingest-activities.ts');

console.log(`[resync] tenant=${tenantId} provider=${provider}`);

let total = 0;
if (provider === 'notion') {
  total = await ingestNotionActivity({ tenantId });
} else if (provider === 'github') {
  total = await ingestGitHubActivity({ tenantId });
} else if (provider === 'google' || provider === 'google-workspace') {
  total += await ingestGmailActivity({ tenantId });
  total += await ingestGoogleDriveActivity({ tenantId });
  total += await ingestGoogleCalendarActivity({ tenantId });
  total += await ingestGoogleContactsActivity({ tenantId });
  total += await ingestGoogleTasksActivity({ tenantId });
} else {
  console.error('Unknown provider:', provider);
  process.exit(1);
}

await markIngestCompleteActivity(tenantId);
console.log(`[resync] done — ${total} document chunks indexed`);
