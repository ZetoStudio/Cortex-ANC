import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { queryWithTenant } from '@cortex/shared';

export const GET = withAuth(
  async (_request, { tenant }) => {
    const r = await queryWithTenant<{
      provider: string;
      status: string;
      last_sync_at: string | null;
    }>(tenant, `SELECT provider, status, last_sync_at FROM connector_health WHERE tenant_id = $1`, [
      tenant.tenantId,
    ]);

    const byProvider: Record<string, { connected: boolean; lastSync?: string }> = {};
    for (const row of r.rows) {
      byProvider[row.provider] = {
        connected: row.status === 'connected',
        lastSync: row.last_sync_at ?? undefined,
      };
    }

    return NextResponse.json({
      google: byProvider['google-workspace']?.connected ?? false,
      github: byProvider.github?.connected ?? false,
      notion: byProvider.notion?.connected ?? false,
      lastSync: {
        google: byProvider['google-workspace']?.lastSync,
        github: byProvider.github?.lastSync,
        notion: byProvider.notion?.lastSync,
      },
    });
  },
  ['desk:read'],
);
