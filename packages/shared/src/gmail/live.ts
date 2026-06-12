import { getValidAccessToken } from '../auth/connected-accounts';

/** Fetch recent Gmail snippets for brain context when vector index has no mail yet. */
export async function fetchLiveGmailContext(tenantId: string, maxMessages = 5): Promise<string> {
  const token = await getValidAccessToken('google', tenantId);
  if (!token) return '';

  try {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxMessages}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!listRes.ok) return '';

    const list = (await listRes.json()) as { messages?: Array<{ id: string }> };
    const lines: string[] = [];

    for (const msg of list.messages ?? []) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
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
      const subject =
        data.payload?.headers?.find((h) => h.name.toLowerCase() === 'subject')?.value ??
        '(no subject)';
      const from =
        data.payload?.headers?.find((h) => h.name.toLowerCase() === 'from')?.value ?? 'Unknown';
      lines.push(`[gmail] From: ${from} | Subject: ${subject} | ${data.snippet ?? ''}`);
    }

    return lines.join('\n');
  } catch {
    return '';
  }
}
