import { draftClientReply } from '@cortex/agent-core';
import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';

export const POST = withAuth(
  async (request, { tenant }) => {
    const body = (await request.json()) as {
      threadId?: string;
      emailBody?: string;
      subject?: string;
    };
    if (!body.emailBody?.trim()) {
      return NextResponse.json({ error: 'emailBody required' }, { status: 400 });
    }

    const emailContent = body.subject
      ? `Subject: ${body.subject}\n\n${body.emailBody}`
      : body.emailBody;

    const result = await draftClientReply(emailContent, {
      tenantId: tenant.tenantId,
      skipApproval: true,
    });

    return NextResponse.json({
      draft: result.draft,
      sources: result.sources,
      threadId: body.threadId,
    });
  },
  ['desk:write'],
);
