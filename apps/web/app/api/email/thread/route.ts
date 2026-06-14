import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { getGmailThread } from '@/lib/gmail';

export const GET = withAuth(
  async (request, { tenant }) => {
    const threadId = new URL(request.url).searchParams.get('threadId');
    if (!threadId) {
      return NextResponse.json({ error: 'threadId required' }, { status: 400 });
    }
    try {
      const thread = await getGmailThread(tenant.tenantId, threadId);
      return NextResponse.json(thread);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load thread';
      return NextResponse.json({ error: message }, { status: 502 });
    }
  },
  ['desk:read'],
);
