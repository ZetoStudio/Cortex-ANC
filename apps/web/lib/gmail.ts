import { cacheDelete, cacheGet, cacheSet, getValidAccessToken } from '@cortex/shared';

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

const GMAIL_TIMEOUT_MS = 20_000;
const INBOX_CACHE_TTL_SEC = 45;
const BATCH_BOUNDARY = 'cortex_gmail_batch';

function inboxCacheKey(tenantId: string, maxResults: number): string {
  return `gmail:inbox:${tenantId}:${maxResults}`;
}

export function invalidateGmailInboxCache(tenantId: string): void {
  void cacheDelete(inboxCacheKey(tenantId, 30));
  void cacheDelete(inboxCacheKey(tenantId, 15));
}

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

function summaryFromThreadDetail(
  detail: {
    id: string;
    snippet?: string;
    messages?: Array<{
      labelIds?: string[];
      payload?: { headers?: Array<{ name: string; value: string }> };
    }>;
  },
  fallbackSnippet = '',
): GmailThreadSummary {
  const last = detail.messages?.[detail.messages.length - 1] ?? detail.messages?.[0];
  const headers = last?.payload?.headers;
  return {
    threadId: detail.id,
    snippet: detail.snippet ?? fallbackSnippet,
    from: header(headers, 'From') || 'Unknown',
    subject: header(headers, 'Subject') || '(no subject)',
    date: header(headers, 'Date') || new Date().toISOString(),
    unread: (last?.labelIds ?? []).includes('UNREAD'),
  };
}

function parseBatchJsonBodies(responseText: string): unknown[] {
  const results: unknown[] = [];
  const parts = responseText.split(`--${BATCH_BOUNDARY}`);
  for (const part of parts) {
    const jsonStart = part.indexOf('{');
    if (jsonStart === -1) continue;
    const jsonEnd = part.lastIndexOf('}');
    if (jsonEnd <= jsonStart) continue;
    try {
      results.push(JSON.parse(part.slice(jsonStart, jsonEnd + 1)));
    } catch {
      // skip malformed batch part
    }
  }
  return results;
}

/** Fetch thread metadata in one Gmail batch HTTP request (avoids N+1 round trips). */
async function batchFetchThreadMetadata(
  token: string,
  threads: Array<{ id: string; snippet?: string }>,
): Promise<GmailThreadSummary[]> {
  if (threads.length === 0) return [];

  const body =
    threads
      .map(
        (thread, index) =>
          `--${BATCH_BOUNDARY}\r\nContent-Type: application/http\r\nContent-ID: ${index + 1}\r\n\r\nGET /gmail/v1/users/me/threads/${thread.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date\r\n\r\n`,
      )
      .join('') + `--${BATCH_BOUNDARY}--`;

  const res = await fetch('https://www.googleapis.com/batch/gmail/v1', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/mixed; boundary=${BATCH_BOUNDARY}`,
    },
    body,
    signal: AbortSignal.timeout(GMAIL_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Gmail batch failed: ${await res.text()}`);
  }

  const responseText = await res.text();
  const parsed = parseBatchJsonBodies(responseText);
  const byId = new Map<string, (typeof parsed)[number]>();
  for (const item of parsed) {
    const row = item as { id?: string };
    if (row.id) byId.set(row.id, item);
  }

  return threads.map((thread) => {
    const detail = byId.get(thread.id) as
      | {
          id?: string;
          snippet?: string;
          messages?: Array<{
            labelIds?: string[];
            payload?: { headers?: Array<{ name: string; value: string }> };
          }>;
        }
      | undefined;

    if (!detail?.id) {
      return {
        threadId: thread.id,
        snippet: thread.snippet ?? '',
        from: 'Unknown',
        subject: '(no subject)',
        date: new Date().toISOString(),
        unread: false,
      };
    }

    return summaryFromThreadDetail(
      { id: detail.id, snippet: detail.snippet, messages: detail.messages },
      thread.snippet ?? '',
    );
  });
}

async function fetchThreadList(
  token: string,
  maxResults: number,
): Promise<Array<{ id: string; snippet?: string }>> {
  const listRes = await gmailFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}`,
    token,
  );
  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${await listRes.text()}`);
  }
  const list = (await listRes.json()) as {
    threads?: Array<{ id: string; snippet?: string }>;
  };
  return list.threads ?? [];
}

/** One Gmail API call — snippet-only inbox for instant first paint. */
export async function listGmailThreadsQuick(
  tenantId: string,
  maxResults = 30,
): Promise<GmailThreadSummary[]> {
  const token = await getGmailAccessToken(tenantId);
  const threads = await fetchThreadList(token, maxResults);
  return threads.map((thread) => ({
    threadId: thread.id,
    snippet: thread.snippet ?? '',
    from: '',
    subject: '',
    date: '',
    unread: false,
  }));
}

export async function listGmailThreads(
  tenantId: string,
  maxResults = 30,
  options?: { skipCache?: boolean },
): Promise<GmailThreadSummary[]> {
  const cacheKey = inboxCacheKey(tenantId, maxResults);
  if (!options?.skipCache) {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as GmailThreadSummary[];
      } catch {
        await cacheDelete(cacheKey);
      }
    }
  }

  const token = await getGmailAccessToken(tenantId);
  const threads = await fetchThreadList(token, maxResults);
  if (threads.length === 0) return [];

  let summaries: GmailThreadSummary[];
  try {
    summaries = await batchFetchThreadMetadata(token, threads);
  } catch {
    summaries = threads.map((thread) => ({
      threadId: thread.id,
      snippet: thread.snippet ?? '',
      from: 'Unknown',
      subject: '(no subject)',
      date: new Date().toISOString(),
      unread: false,
    }));
  }

  void cacheSet(cacheKey, JSON.stringify(summaries), INBOX_CACHE_TTL_SEC);
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

export async function sendGmailEmail(
  tenantId: string,
  input: { to: string; subject: string; body: string },
): Promise<void> {
  const token = await getGmailAccessToken(tenantId);
  const raw = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
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
    body: JSON.stringify({ raw: encoded }),
    signal: AbortSignal.timeout(GMAIL_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
  invalidateGmailInboxCache(tenantId);
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
  invalidateGmailInboxCache(tenantId);
}
