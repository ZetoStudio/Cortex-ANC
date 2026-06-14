import { NextResponse } from 'next/server';

import { auditAction, withAuth } from '@/lib/auth';
import { queryWithTenant } from '@cortex/shared';
import { startIngestInitialDataWorkflow } from '@cortex/shared/temporal/client';

export const POST = withAuth(
  async (request, { tenant }) => {
    const body = (await request.json().catch(() => ({}))) as { providers?: string[] };

    const providers = body.providers ?? ['google-workspace', 'github'];
    const workflowId = await startIngestInitialDataWorkflow({
      tenantId: tenant.tenantId,
      providers,
    });

    await queryWithTenant(
      tenant,
      `UPDATE tenant_onboarding SET status = 'running', step = 'ingesting', workflow_id = $2, updated_at = NOW() WHERE tenant_id = $1`,
      [tenant.tenantId, workflowId],
    );

    await auditAction(tenant, 'ingestion.started', { metadata: { providers, workflowId } });

    return NextResponse.json({ workflowId, status: 'running' });
  },
  ['connector:manage'],
);
