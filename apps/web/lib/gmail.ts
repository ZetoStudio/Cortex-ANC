import { getValidAccessToken } from '@cortex/shared';

export type GmailThreadSummary = {
  threadId: string;
  snippet: string;
  from: string;
  subject: string;
  date: string;
  unread: boolean;
};

export type GmailThreadDetail = {
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  messageId: string;
};

const GMAIL_TIMEOUT_MS = 12_000;

function header(headers: Array<{ name: string; value: string }> | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function decodeBody(payload: {
  body?: { data?: string };
  parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
}): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf8');
  }
  for (const part of payload.parts ?? []) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return Buffer.from(part.body.data, 'base64url').toString('utf8');
    }
  }
  for (const part of payload.parts ?? []) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      const html = Buffer.from(part.body.data, 'base64url').toString('utf8');
      return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  return '';
}

async function gmailFetch(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(GMAIL_TIMEOUT_MS),
  });
}

export async function getGmailAccessToken(tenantId: string): Promise<string> {
  const token = await getValidAccessToken('google', tenantId);
  if (!token) throw new Error('Gmail not connected. Connect Google Workspace on onboarding.');
  return token;
}

async function mapInParallel<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function listGmailThreads(
  tenantId: string,
  maxResults = 50,
): Promise<GmailThreadSummary[]> {
  const token = await getGmailAccessToken(tenantId);

  const listRes = await gmailFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}`,
    token,
  );
  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Gmail list failed: ${err}`);
  }
  const list = (await listRes.json()) as {
    threads?: Array<{ id: string; snippet?: string }>;
  };

  const threads = list.threads ?? [];
  if (threads.length === 0) return [];

  const summaries = await mapInParallel(threads, 8, async (thread) => {
    try {
      const detailRes = await gmailFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        token,
      );
      if (!detailRes.ok) {
        return {
          threadId: thread.id,
          snippet: thread.snippet ?? '',
          from: 'Unknown',
          subject: '(no subject)',
          date: new Date().toISOString(),
          unread: false,
        };
      }
      const detail = (await detailRes.json()) as {
        id: string;
        snippet?: string;
        messages?: Array<{
          labelIds?: string[];
          payload?: { headers?: Array<{ name: string; value: string }> };
        }>;
      };
      const last = detail.messages?.[detail.messages.length - 1] ?? detail.messages?.[0];
      const headers = last?.payload?.headers;
      return {
        threadId: detail.id,
        snippet: detail.snippet ?? thread.snippet ?? '',
        from: header(headers, 'From') || 'Unknown',
        subject: header(headers, 'Subject') || '(no subject)',
        date: header(headers, 'Date') || new Date().toISOString(),
        unread: (last?.labelIds ?? []).includes('UNREAD'),
      };
    } catch {
      return {
        threadId: thread.id,
        snippet: thread.snippet ?? '',
        from: 'Unknown',
        subject: '(no subject)',
        date: new Date().toISOString(),
        unread: false,
      };
    }
  });

  return summaries;
}

export async function getGmailThread(
  tenantId: string,
  threadId: string,
): Promise<GmailThreadDetail> {
  const token = await getGmailAccessToken(tenantId);
  const res = await gmailFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    token,
  );
  if (!res.ok) throw new Error(`Gmail thread fetch failed: ${await res.text()}`);
  const detail = (await res.json()) as {
    id: string;
    messages?: Array<{
      id: string;
      payload?: {
        headers?: Array<{ name: string; value: string }>;
        body?: { data?: string };
        parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
      };
    }>;
  };
  const last = detail.messages?.[detail.messages.length - 1] ?? detail.messages?.[0];
  if (!last) throw new Error('Thread has no messages');
  const headers = last.payload?.headers;
  return {
    threadId: detail.id,
    subject: header(headers, 'Subject') || '(no subject)',
    from: header(headers, 'From'),
    to: header(headers, 'To'),
    date: header(headers, 'Date') || new Date().toISOString(),
    body: decodeBody(last.payload ?? {}) || '',
    messageId: last.id,
  };
}

export async function sendGmailReply(
  tenantId: string,
  input: { threadId: string; to: string; subject: string; body: string; inReplyTo?: string },
): Promise<void> {
  const token = await getGmailAccessToken(tenantId);
  const subject = input.subject.startsWith('Re:') ? input.subject : `Re: ${input.subject}`;
  const raw = [
    `To: ${input.to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    input.body,
  ].join('\r\n');
  const encoded = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ threadId: input.threadId, raw: encoded }),
    signal: AbortSignal.timeout(GMAIL_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
}
