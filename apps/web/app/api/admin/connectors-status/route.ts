import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { queryWithTenant } from '@cortex/shared';

const CORE = ['google-workspace', 'github', 'notion', 'linear', 'slack'];

export const GET = withAuth(
  async (_request, { tenant }) => {
    const r = await queryWithTenant<{
      provider: string;
      status: string;
      last_sync_at: string | null;
    }>(tenant, `SELECT provider, status, last_sync_at FROM connector_health WHERE tenant_id = $1`, [
      tenant.tenantId,
    ]);

    const dbStatus: Record<string, { healthy: boolean; lastSync?: string }> = {};
    for (const row of r.rows) {
      dbStatus[row.provider] = {
        healthy: row.status === 'connected',
        lastSync: row.last_sync_at ?? undefined,
      };
    }

    const status = CORE.map((provider) => {
      const row = dbStatus[provider];
      if (row) return { provider, healthy: row.healthy, lastSync: row.lastSync };
      return { provider, healthy: false, reason: 'not connected' };
    });

    return NextResponse.json({ status });
  },
  ['admin:read'],
);
