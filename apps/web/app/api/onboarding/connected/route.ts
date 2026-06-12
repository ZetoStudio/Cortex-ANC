import { NextResponse } from 'next/server';

import { withAuth, auditAction } from '@/lib/auth';
import { queryWithTenant } from '@cortex/shared';
import { startIngestInitialDataWorkflow } from '@cortex/shared/temporal/client';

export const POST = withAuth(
  async (request, { tenant }) => {
    const body = (await request.json()) as { provider?: string };
    const provider = body.provider ?? 'google-workspace';

    const workflowId = await startIngestInitialDataWorkflow({
      tenantId: tenant.tenantId,
      providers: [provider],
    });

    await queryWithTenant(
      tenant,
      `UPDATE tenant_onboarding SET status = 'running', step = 'ingesting', workflow_id = COALESCE($2, workflow_id), updated_at = NOW() WHERE tenant_id = $1`,
      [tenant.tenantId, workflowId],
    );

    await auditAction(tenant, 'connector.connected', {
      metadata: { provider, workflowId },
    });

    return NextResponse.json({ workflowId, provider });
  },
  ['connector:manage'],
);
