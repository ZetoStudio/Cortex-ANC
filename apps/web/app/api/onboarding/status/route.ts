import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { getIngestWorkflowStatus } from '@cortex/shared/temporal/client';
import { queryWithTenant } from '@cortex/shared';

export const GET = withAuth(async (_request, { tenant }) => {
  const row = await queryWithTenant<{
    status: string;
    step: string;
    progress: Record<string, unknown>;
  }>(tenant, `SELECT status, step, progress FROM tenant_onboarding WHERE tenant_id = $1`, [
    tenant.tenantId,
  ]);

  const onboarding = row.rows[0];
  const workflow = await getIngestWorkflowStatus(tenant.tenantId);

  return NextResponse.json({
    status: onboarding?.status ?? 'pending',
    step: onboarding?.step ?? 'connect_tools',
    progress: onboarding?.progress ?? {},
    workflow,
  });
});
