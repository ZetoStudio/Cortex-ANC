import { condition, defineSignal, proxyActivities, setHandler } from '@temporalio/workflow';

import type { ApprovalDecision, HandleClientReplyInput, IngestInitialDataInput } from './types';

const { executeApprovedActionActivity } = proxyActivities<typeof import('./activities')>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 3 },
});

const ingestActivities = proxyActivities<typeof import('./ingest-activities')>({
  startToCloseTimeout: '15 minutes',
  retry: { maximumAttempts: 2 },
});

export const approvalDecisionSignal = defineSignal<[ApprovalDecision]>('approvalDecision');

export async function handleClientReply(input: HandleClientReplyInput): Promise<{
  status: 'sent' | 'denied' | 'timeout';
  result?: unknown;
}> {
  let approved: boolean | null = null;
  setHandler(approvalDecisionSignal, (value: ApprovalDecision) => {
    approved = value.approved;
  });

  const gotDecision = await condition(() => approved !== null, '24 hours');
  if (!gotDecision || approved === null) return { status: 'timeout' };
  if (!approved) return { status: 'denied' };

  const result = await executeApprovedActionActivity(input.approvalId);
  return { status: 'sent', result };
}

export async function ingestInitialData(input: IngestInitialDataInput): Promise<{
  status: 'complete';
  documentsIndexed: number;
}> {
  let total = 0;
  const googleProviders = ['google-workspace', 'gmail', 'google'];
  const wantsGoogle = input.providers.some((p) => googleProviders.includes(p));
  const wantsGitHub = input.providers.includes('github');

  if (wantsGoogle) {
    total += await ingestActivities.ingestGmailActivity({ tenantId: input.tenantId });
    total += await ingestActivities.ingestGoogleDriveActivity({ tenantId: input.tenantId });
    total += await ingestActivities.ingestGoogleCalendarActivity({ tenantId: input.tenantId });
    total += await ingestActivities.ingestGoogleContactsActivity({ tenantId: input.tenantId });
    total += await ingestActivities.ingestGoogleTasksActivity({ tenantId: input.tenantId });
  }
  if (wantsGitHub) {
    total += await ingestActivities.ingestGitHubActivity({ tenantId: input.tenantId });
  }

  await ingestActivities.extractEntitiesActivity({
    tenantId: input.tenantId,
    sampleText: `tenant ${input.tenantId} ingestion complete`,
  });
  await ingestActivities.markIngestCompleteActivity(input.tenantId);

  return { status: 'complete', documentsIndexed: total };
}
