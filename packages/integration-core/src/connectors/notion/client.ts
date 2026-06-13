import { Client } from '@notionhq/client';
import type {
  BlockObjectResponse,
  PartialBlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

type NotionBlock = BlockObjectResponse | PartialBlockObjectResponse;

function richTextPlain(rich: RichTextItemResponse[] | undefined): string {
  return (rich ?? []).map((t) => t.plain_text).join('');
}

function blockPlainText(block: NotionBlock): string {
  if (!('type' in block)) return '';
  const b = block as BlockObjectResponse;
  switch (b.type) {
    case 'paragraph':
      return richTextPlain(b.paragraph.rich_text);
    case 'heading_1':
      return richTextPlain(b.heading_1.rich_text);
    case 'heading_2':
      return richTextPlain(b.heading_2.rich_text);
    case 'heading_3':
      return richTextPlain(b.heading_3.rich_text);
    case 'bulleted_list_item':
      return richTextPlain(b.bulleted_list_item.rich_text);
    case 'numbered_list_item':
      return richTextPlain(b.numbered_list_item.rich_text);
    case 'to_do':
      return richTextPlain(b.to_do.rich_text);
    case 'quote':
      return richTextPlain(b.quote.rich_text);
    case 'code':
      return richTextPlain(b.code.rich_text);
    case 'callout':
      return richTextPlain(b.callout.rich_text);
    case 'toggle':
      return richTextPlain(b.toggle.rich_text);
    default:
      return '';
  }
}

/** Recursively extract plain text from Notion block objects. */
export function extractTextFromBlocks(blocks: NotionBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    const text = blockPlainText(block);
    if (text.trim()) parts.push(text);
    if ('has_children' in block && block.has_children && 'id' in block) {
      // Nested children fetched separately during ingestion
    }
  }
  return parts.join('\n').trim();
}

export async function searchAllPages(accessToken: string) {
  const notion = new Client({ auth: accessToken });
  const results: Awaited<ReturnType<Client['search']>>['results'] = [];
  let cursor: string | undefined;
  do {
    const page = await notion.search({
      filter: { property: 'object', value: 'page' },
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...page.results);
    cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results;
}

export async function listDatabases(accessToken: string) {
  const notion = new Client({ auth: accessToken });
  const results: Awaited<ReturnType<Client['search']>>['results'] = [];
  let cursor: string | undefined;
  do {
    const page = await notion.search({
      filter: { property: 'object', value: 'database' },
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...page.results);
    cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results;
}

export async function queryDatabase(accessToken: string, databaseId: string) {
  const notion = new Client({ auth: accessToken });
  const results: Awaited<ReturnType<Client['databases']['query']>>['results'] = [];
  let cursor: string | undefined;
  do {
    const page = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...page.results);
    cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results;
}

export async function getPageContent(accessToken: string, pageId: string): Promise<string> {
  const notion = new Client({ auth: accessToken });

  async function fetchBlocks(blockId: string): Promise<NotionBlock[]> {
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      });
      for (const block of res.results) {
        blocks.push(block);
        if ('has_children' in block && block.has_children && 'id' in block) {
          const nested = await fetchBlocks(block.id);
          blocks.push(...nested);
        }
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return blocks;
  }

  const blocks = await fetchBlocks(pageId);
  return extractTextFromBlocks(blocks);
}

/** @deprecated Use getPageContent which returns plain text directly */
export async function getPageBlocks(accessToken: string, pageId: string) {
  const notion = new Client({ auth: accessToken });
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return blocks;
}

export async function validateNotionToken(
  accessToken: string,
): Promise<{ ok: true; workspace?: string }> {
  const notion = new Client({ auth: accessToken });
  await notion.search({ page_size: 1 });
  try {
    const me = await notion.users.me({});
    const name = me.type === 'bot' && me.bot?.workspace_name ? me.bot.workspace_name : undefined;
    return { ok: true, workspace: name };
  } catch {
    return { ok: true };
  }
}

export function pageTitleFromProperties(properties: Record<string, unknown> | undefined): string {
  if (!properties) return 'Untitled';
  for (const prop of Object.values(properties)) {
    const p = prop as { type?: string; title?: Array<{ plain_text?: string }> };
    if (p.type === 'title' && p.title?.length) {
      return p.title.map((t) => t.plain_text ?? '').join('') || 'Untitled';
    }
  }
  return 'Untitled';
}
