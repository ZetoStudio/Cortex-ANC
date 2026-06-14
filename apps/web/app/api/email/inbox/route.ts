import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { listGmailThreads } from '@/lib/gmail';

export const maxDuration = 60;

export const GET = withAuth(
  async (_request, { tenant }) => {
    try {
      const threads = await listGmailThreads(tenant.tenantId, 30);
      return NextResponse.json(threads);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load inbox';
      return NextResponse.json({ error: message, threads: [] }, { status: 502 });
    }
  },
  ['desk:read'],
);
