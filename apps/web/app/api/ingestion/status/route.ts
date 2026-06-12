import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { getIngestionProgress } from '@cortex/shared';

export const GET = withAuth(
  async (_request, { tenant }) => {
    const providers = await getIngestionProgress(tenant.tenantId);
    const active = providers.some((p) => p.status === 'running');
    return NextResponse.json({ active, providers });
  },
  ['desk:read'],
);
