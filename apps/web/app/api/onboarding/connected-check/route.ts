import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { queryWithTenant } from '@cortex/shared';

export const GET = withAuth(async (_request, { tenant }) => {
  const r = await queryWithTenant<{ provider: string; status: string }>(
    tenant,
    `SELECT provider, status FROM connector_health
     WHERE tenant_id = $1 AND provider IN ('google-workspace', 'github')`,
    [tenant.tenantId],
  );
  const connected = new Set(
    r.rows.filter((row) => row.status === 'connected').map((row) => row.provider),
  );
  const bothConnected = connected.has('google-workspace') && connected.has('github');

  return NextResponse.json({
    bothConnected,
    google: connected.has('google-workspace'),
    github: connected.has('github'),
    redirectTo: bothConnected ? '/executive-desk' : '/onboarding',
  });
});
