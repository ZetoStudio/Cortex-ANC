import { Client, Connection } from '@temporalio/client';

import type { ApprovalDecision, IngestInitialDataInput, IngestProgress } from './types';

const TASK_QUEUE = 'cortex-approvals';

let clientPromise: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (!clientPromise) {
    const address = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
    clientPromise = Connection.connect({ address }).then(
      (connection) => new Client({ connection }),
    );
  }
  return clientPromise;
}

export function workflowIdForApproval(approvalId: string): string {
  return `client-reply-${approvalId}`;
}

export async function startHandleClientReplyWorkflow(input: {
  approvalId: string;
  emailContent: string;
  draft: string;
}): Promise<string | null> {
  if (!process.env.TEMPORAL_ADDRESS) return null;
  try {
    const client = await getClient();
    const workflowId = workflowIdForApproval(input.approvalId);
    await client.workflow.start('handleClientReply', {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [input],
    });
    return workflowId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already started')) return workflowIdForApproval(input.approvalId);
    console.warn('[temporal] start workflow failed:', message);
    return null;
  }
}

export function workflowIdForIngest(tenantId: string, provider: string): string {
  const slug = provider.replace(/[^a-z0-9-]/gi, '-');
  return `ingest-${tenantId}-${slug}`;
}

export async function startIngestInitialDataWorkflow(
  input: IngestInitialDataInput,
): Promise<string | null> {
  if (!process.env.TEMPORAL_ADDRESS) return null;
  const provider = input.providers[0] ?? 'google-workspace';
  const workflowId = workflowIdForIngest(input.tenantId, provider);
  try {
    const client = await getClient();
    await client.workflow.start('ingestInitialData', {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [input],
    });
    return workflowId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already started')) return workflowId;
    console.warn('[temporal] ingest start failed:', message);
    return null;
  }
}

const INGEST_PROVIDERS = ['google-workspace', 'github'];

export async function getIngestWorkflowStatus(tenantId: string): Promise<IngestProgress | null> {
  if (!process.env.TEMPORAL_ADDRESS) return null;
  try {
    const client = await getClient();
    let running = 0;
    let completed = 0;
    for (const provider of INGEST_PROVIDERS) {
      try {
        const handle = client.workflow.getHandle(workflowIdForIngest(tenantId, provider));
        const desc = await handle.describe();
        if (desc.status.name === 'COMPLETED') completed += 1;
        if (desc.status.name === 'RUNNING') running += 1;
      } catch {
        // workflow not started for this provider
      }
    }
    if (running > 0) {
      return { step: 'ingesting', documentsIndexed: 0, graphNodes: 0, percent: 50 };
    }
    if (completed > 0) {
      return { step: 'complete', documentsIndexed: 0, graphNodes: 0, percent: 100 };
    }
    return null;
  } catch {
    return null;
  }
}

export async function signalClientReplyApproval(
  approvalId: string,
  decision: ApprovalDecision,
): Promise<boolean> {
  if (!process.env.TEMPORAL_ADDRESS) return false;
  try {
    const client = await getClient();
    const handle = client.workflow.getHandle(workflowIdForApproval(approvalId));
    await handle.signal('approvalDecision', decision);
    return true;
  } catch (err) {
    console.warn('[temporal] signal failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
