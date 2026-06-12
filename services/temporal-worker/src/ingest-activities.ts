import { indexDocument } from '@cortex/graph-core';
import {
  getValidAccessToken,
  incrementIngestionProgress,
  llmClient,
  upsertIngestionProgress,
} from '@cortex/shared';
import { indexDocumentEs } from '@cortex/shared/graph/elasticsearch-client';
import { upsertNeo4jNode } from '@cortex/shared/graph/neo4j-client';
import pg from 'pg';

const GOOGLE_PROVIDERS = ['google-workspace', 'gmail', 'google'];
const GITHUB_PROVIDERS = ['github'];

function chunkText(text: string, maxChars = 2000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks.length ? chunks : [text];
}

async function updateOnboarding(tenantId: string, patch: Record<string, unknown>): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(
    `UPDATE tenant_onboarding SET progress = progress || $2::jsonb, updated_at = NOW() WHERE tenant_id = $1`,
    [tenantId, JSON.stringify(patch)],
  );
  await pool.end();
}

async function indexIngestDoc(input: {
  tenantId: string;
  docId: string;
  text: string;
  title: string;
  source: string;
  type: string;
  url?: string;
  extraMeta?: Record<string, unknown>;
}): Promise<number> {
  let count = 0;
  for (const [i, chunk] of chunkText(input.text).entries()) {
    const id = i === 0 ? input.docId : `${input.docId}:${i}`;
    await indexDocument(id, chunk, {
      title: input.title,
      source: input.source,
      type: input.type,
      tenant_id: input.tenantId,
      url: input.url,
      ...input.extraMeta,
    });
    await indexDocumentEs(input.tenantId, {
      id,
      content: chunk,
      title: input.title,
      source: input.source,
      sourceId: input.docId,
      url: input.url,
    });
    count += 1;
  }
  await upsertNeo4jNode(input.tenantId, 'Document', {
    id: input.docId,
    title: input.title,
    source: input.source,
  });
  return count;
}

export async function ingestGmailActivity(input: { tenantId: string }): Promise<number> {
  const token = await getValidAccessToken('google', input.tenantId);
  if (!token) return 0;

  await upsertIngestionProgress(input.tenantId, 'google', {
    status: 'running',
    total_documents: 500,
    processed_documents: 0,
  });

  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500',
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) {
    await upsertIngestionProgress(input.tenantId, 'google', { status: 'failed' });
    return 0;
  }
  const list = (await listRes.json()) as { messages?: Array<{ id: string }> };
  let count = 0;
  const total = list.messages?.length ?? 0;
  await upsertIngestionProgress(input.tenantId, 'google', {
    total_documents: total,
    processed_documents: 0,
    status: 'running',
  });

  for (const msg of list.messages ?? []) {
    const detail = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!detail.ok) continue;
    const data = (await detail.json()) as {
      snippet?: string;
      payload?: { headers?: Array<{ name: string; value: string }> };
    };
    const subject =
      data.payload?.headers?.find((h) => h.name.toLowerCase() === 'subject')?.value ?? 'Email';
    const text = data.snippet ?? '';
    const indexed = await indexIngestDoc({
      tenantId: input.tenantId,
      docId: `${input.tenantId}:gmail:${msg.id}`,
      text,
      title: subject,
      source: 'gmail',
      type: 'email',
      url: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
    });
    count += indexed;
    await incrementIngestionProgress(input.tenantId, 'google', indexed);
  }

  await upsertIngestionProgress(input.tenantId, 'google', {
    status: 'completed',
    total_documents: total,
    processed_documents: count,
  });
  await updateOnboarding(input.tenantId, { gmail: count });
  return count;
}

export async function ingestGoogleDriveActivity(input: { tenantId: string }): Promise<number> {
  const token = await getValidAccessToken('google', input.tenantId);
  if (!token) return 0;

  const listRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=200&fields=files(id,name,mimeType)&q=trashed=false',
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) return 0;
  const list = (await listRes.json()) as {
    files?: Array<{ id: string; name: string; mimeType: string }>;
  };
  let count = 0;

  for (const file of list.files ?? []) {
    const exportable =
      file.mimeType.startsWith('text/') ||
      file.mimeType === 'application/json' ||
      file.mimeType === 'application/javascript';
    if (!exportable) continue;
    const contentRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!contentRes.ok) continue;
    const text = (await contentRes.text()).slice(0, 50_000);
    if (!text.trim()) continue;
    count += await indexIngestDoc({
      tenantId: input.tenantId,
      docId: `${input.tenantId}:drive:${file.id}`,
      text,
      title: file.name,
      source: 'drive',
      type: 'file',
      url: `https://drive.google.com/file/d/${file.id}/view`,
    });
  }

  await updateOnboarding(input.tenantId, { drive: count });
  return count;
}

export async function ingestGoogleCalendarActivity(input: { tenantId: string }): Promise<number> {
  const token = await getValidAccessToken('google', input.tenantId);
  if (!token) return 0;

  const now = new Date();
  const min = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const max = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const listRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}&maxResults=250&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) return 0;
  const list = (await listRes.json()) as {
    items?: Array<{ id: string; summary?: string; description?: string; htmlLink?: string }>;
  };
  let count = 0;

  for (const event of list.items ?? []) {
    const text = `${event.summary ?? 'Event'}\n${event.description ?? ''}`;
    count += await indexIngestDoc({
      tenantId: input.tenantId,
      docId: `${input.tenantId}:calendar:${event.id}`,
      text,
      title: event.summary ?? 'Calendar event',
      source: 'calendar',
      type: 'event',
      url: event.htmlLink,
    });
  }

  await updateOnboarding(input.tenantId, { calendar: count });
  return count;
}

export async function ingestGoogleContactsActivity(input: { tenantId: string }): Promise<number> {
  const token = await getValidAccessToken('google', input.tenantId);
  if (!token) return 0;

  const listRes = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations&pageSize=500',
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) return 0;
  const list = (await listRes.json()) as {
    connections?: Array<{
      resourceName?: string;
      names?: Array<{ displayName?: string }>;
      emailAddresses?: Array<{ value?: string }>;
      organizations?: Array<{ name?: string }>;
    }>;
  };
  let count = 0;

  for (const person of list.connections ?? []) {
    const name = person.names?.[0]?.displayName ?? 'Contact';
    const email = person.emailAddresses?.[0]?.value ?? '';
    const org = person.organizations?.[0]?.name ?? '';
    const text = `${name}\n${email}\n${org}`;
    const id = person.resourceName?.replace('people/', '') ?? name;
    count += await indexIngestDoc({
      tenantId: input.tenantId,
      docId: `${input.tenantId}:contact:${id}`,
      text,
      title: name,
      source: 'contacts',
      type: 'contact',
    });
    await upsertNeo4jNode(input.tenantId, 'Person', {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
    });
  }

  await updateOnboarding(input.tenantId, { contacts: count });
  return count;
}

export async function ingestGoogleTasksActivity(input: { tenantId: string }): Promise<number> {
  const token = await getValidAccessToken('google', input.tenantId);
  if (!token) return 0;

  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listsRes.ok) return 0;
  const lists = (await listsRes.json()) as { items?: Array<{ id: string; title: string }> };
  let count = 0;

  for (const list of lists.items ?? []) {
    const tasksRes = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?maxResults=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!tasksRes.ok) continue;
    const tasks = (await tasksRes.json()) as {
      items?: Array<{ id: string; title?: string; notes?: string }>;
    };
    for (const task of tasks.items ?? []) {
      const text = `${task.title ?? 'Task'}\n${task.notes ?? ''}`;
      count += await indexIngestDoc({
        tenantId: input.tenantId,
        docId: `${input.tenantId}:task:${list.id}:${task.id}`,
        text,
        title: task.title ?? 'Task',
        source: 'tasks',
        type: 'task',
        extraMeta: { list: list.title },
      });
    }
  }

  await updateOnboarding(input.tenantId, { tasks: count });
  return count;
}

export async function ingestGitHubActivity(input: { tenantId: string }): Promise<number> {
  const token = await getValidAccessToken('github', input.tenantId);
  if (!token) return 0;

  await upsertIngestionProgress(input.tenantId, 'github', {
    status: 'running',
    total_documents: 200,
    processed_documents: 0,
  });

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };
  const reposRes = await fetch('https://api.github.com/user/repos?per_page=30&sort=updated', {
    headers,
  });
  if (!reposRes.ok) {
    await upsertIngestionProgress(input.tenantId, 'github', { status: 'failed' });
    return 0;
  }
  const repos = (await reposRes.json()) as Array<{
    full_name: string;
    html_url: string;
    default_branch?: string;
  }>;
  let count = 0;

  for (const repo of repos.slice(0, 10)) {
    await upsertNeo4jNode(input.tenantId, 'Project', { id: repo.full_name, name: repo.full_name });

    const issuesRes = await fetch(
      `https://api.github.com/repos/${repo.full_name}/issues?state=all&per_page=100`,
      { headers },
    );
    if (issuesRes.ok) {
      const issues = (await issuesRes.json()) as Array<{
        number: number;
        title: string;
        body?: string;
        html_url: string;
        pull_request?: unknown;
      }>;
      for (const issue of issues) {
        if (issue.pull_request) continue;
        const text = `${issue.title}\n${issue.body ?? ''}`;
        const docId = `${input.tenantId}:github:issue:${repo.full_name}:${issue.number}`;
        count += await indexIngestDoc({
          tenantId: input.tenantId,
          docId,
          text,
          title: issue.title,
          source: 'github',
          type: 'issue',
          url: issue.html_url,
          extraMeta: { project: repo.full_name },
        });
        await upsertNeo4jNode(input.tenantId, 'Issue', { id: docId, title: issue.title });
      }
    }

    const prsRes = await fetch(
      `https://api.github.com/repos/${repo.full_name}/pulls?state=all&per_page=100`,
      { headers },
    );
    if (prsRes.ok) {
      const prs = (await prsRes.json()) as Array<{
        number: number;
        title: string;
        body?: string;
        html_url: string;
      }>;
      for (const pr of prs) {
        const text = `${pr.title}\n${pr.body ?? ''}`;
        count += await indexIngestDoc({
          tenantId: input.tenantId,
          docId: `${input.tenantId}:github:pr:${repo.full_name}:${pr.number}`,
          text,
          title: pr.title,
          source: 'github',
          type: 'pull_request',
          url: pr.html_url,
          extraMeta: { project: repo.full_name },
        });
      }
    }

    const commitsRes = await fetch(
      `https://api.github.com/repos/${repo.full_name}/commits?per_page=100`,
      { headers },
    );
    if (commitsRes.ok) {
      const commits = (await commitsRes.json()) as Array<{
        sha: string;
        commit: { message: string };
        html_url: string;
      }>;
      for (const commit of commits) {
        count += await indexIngestDoc({
          tenantId: input.tenantId,
          docId: `${input.tenantId}:github:commit:${repo.full_name}:${commit.sha}`,
          text: commit.commit.message,
          title: commit.commit.message.split('\n')[0] ?? 'Commit',
          source: 'github',
          type: 'commit',
          url: commit.html_url,
          extraMeta: { project: repo.full_name },
        });
      }
    }

    const contentsRes = await fetch(`https://api.github.com/repos/${repo.full_name}/contents`, {
      headers,
    });
    if (contentsRes.ok) {
      const entries = (await contentsRes.json()) as Array<{
        name: string;
        path: string;
        type: string;
        download_url?: string;
      }>;
      for (const entry of entries) {
        if (entry.type !== 'file') continue;
        const ext = entry.name.split('.').pop()?.toLowerCase();
        if (!ext || !['ts', 'tsx', 'js', 'md', 'json'].includes(ext)) continue;
        if (!entry.download_url) continue;
        const fileRes = await fetch(entry.download_url, { headers });
        if (!fileRes.ok) continue;
        const text = (await fileRes.text()).slice(0, 30_000);
        count += await indexIngestDoc({
          tenantId: input.tenantId,
          docId: `${input.tenantId}:github:file:${repo.full_name}:${entry.path}`,
          text,
          title: entry.path,
          source: 'github',
          type: 'source_file',
          url: `https://github.com/${repo.full_name}/blob/${repo.default_branch ?? 'main'}/${entry.path}`,
          extraMeta: { project: repo.full_name },
        });
      }
    }
  }

  await upsertIngestionProgress(input.tenantId, 'github', {
    status: 'completed',
    total_documents: count,
    processed_documents: count,
  });
  await updateOnboarding(input.tenantId, { github: count });
  return count;
}

export async function extractEntitiesActivity(input: {
  tenantId: string;
  sampleText: string;
}): Promise<number> {
  const raw = await llmClient.complete(
    `Extract JSON {people:[],projects:[],departments:[]} from text:\n${input.sampleText.slice(0, 1500)}`,
    { temperature: 0, maxTokens: 512 },
  );
  let nodes = 0;
  try {
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}') as {
      people?: string[];
      projects?: string[];
    };
    for (const p of parsed.people ?? []) {
      await upsertNeo4jNode(input.tenantId, 'Person', {
        id: p.toLowerCase().replace(/\s+/g, '-'),
        name: p,
      });
      nodes += 1;
    }
    for (const p of parsed.projects ?? []) {
      await upsertNeo4jNode(input.tenantId, 'Project', {
        id: p.toLowerCase().replace(/\s+/g, '-'),
        name: p,
      });
      nodes += 1;
    }
  } catch {
    // skip
  }
  return nodes;
}

export async function markIngestCompleteActivity(tenantId: string): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('REINDEX INDEX IF EXISTS cortex_documents_embedding_idx');
  } catch {
    // non-fatal if index missing
  }
  await pool.query(
    `UPDATE ingestion_progress SET status = 'completed', updated_at = NOW()
     WHERE tenant_id = $1 AND status = 'running'`,
    [tenantId],
  );
  await pool.query(
    `UPDATE tenant_onboarding SET status = 'complete', step = 'done', updated_at = NOW() WHERE tenant_id = $1`,
    [tenantId],
  );
  await pool.end();
}

export function providerKind(provider: string): 'google' | 'github' | 'other' {
  if (GOOGLE_PROVIDERS.includes(provider)) return 'google';
  if (GITHUB_PROVIDERS.includes(provider)) return 'github';
  return 'other';
}
