import { getValidAccessToken } from '../auth/connected-accounts';

export type LiveEmail = {
  id: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  isMostRecent: boolean;
};

function headerValue(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

/** Fetch recent inbox messages with full From/Date/Subject metadata. */
export async function fetchLiveGmailMessages(
  tenantId: string,
  maxMessages = 5,
): Promise<LiveEmail[]> {
  const token = await getValidAccessToken('google', tenantId);
  if (!token) return [];

  try {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxMessages}&labelIds=INBOX`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!listRes.ok) return [];

    const list = (await listRes.json()) as { messages?: Array<{ id: string }> };
    const emails: LiveEmail[] = [];

    for (const [i, msg] of (list.messages ?? []).entries()) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(8_000),
        },
      );
      if (!detailRes.ok) continue;
      const data = (await detailRes.json()) as {
        snippet?: string;
        payload?: { headers?: Array<{ name: string; value: string }> };
      };
      const headers = data.payload?.headers ?? [];
      emails.push({
        id: msg.id,
        from: headerValue(headers, 'From') || 'Unknown sender',
        date: headerValue(headers, 'Date') || 'Unknown date',
        subject: headerValue(headers, 'Subject') || '(no subject)',
        snippet: data.snippet ?? '',
        isMostRecent: i === 0,
      });
    }

    return emails;
  } catch {
    return [];
  }
}

export function formatLiveEmailForContext(email: LiveEmail): string {
  const label = email.isMostRecent ? 'MOST RECENT EMAIL' : 'Email';
  return `[gmail] ${label}
From: ${email.from}
Date: ${email.date}
Subject: ${email.subject}
Preview: ${email.snippet}`;
}

/** Plain-text block for LLM context. */
export async function fetchLiveGmailContext(tenantId: string, maxMessages = 5): Promise<string> {
  const emails = await fetchLiveGmailMessages(tenantId, maxMessages);
  return emails.map(formatLiveEmailForContext).join('\n\n');
}
