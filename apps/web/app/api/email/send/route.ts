import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { getGmailThread, sendGmailReply } from '@/lib/gmail';

export const POST = withAuth(
  async (request, { tenant }) => {
    const body = (await request.json()) as {
      threadId?: string;
      replyText?: string;
      to?: string;
      subject?: string;
    };

    if (!body.threadId || !body.replyText?.trim()) {
      return NextResponse.json({ error: 'threadId and replyText required' }, { status: 400 });
    }

    try {
      let to = body.to;
      let subject = body.subject;
      if (!to || !subject) {
        const thread = await getGmailThread(tenant.tenantId, body.threadId);
        to = to ?? thread.from;
        subject = subject ?? thread.subject;
      }

      await sendGmailReply(tenant.tenantId, {
        threadId: body.threadId,
        to: to!,
        subject: subject!,
        body: body.replyText.trim(),
      });

      return NextResponse.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Send failed';
      return NextResponse.json({ error: message }, { status: 502 });
    }
  },
  ['desk:write'],
);
