import { GraphClient, searchSimilar, type SearchResult } from '@cortex/graph-core';
import type { LlmProvider } from '@cortex/shared';

import { ensureSeeded, toCitations, type SourceCitation } from './retrieval';

export type RetrieveOptions = {
  projectIds?: string[];
  provider?: LlmProvider;
};

const ENTITY_PATTERNS = [
  /\b(?:project|feature|ticket|issue)\s+([A-Za-z0-9_-]+)/gi,
  /\bAcme\b/gi,
  /\bBetaCorp\b/gi,
  /\bGlobal Dynamics\b/gi,
  /\b([A-Z]{2,}-\d+)\b/g,
];

function extractEntityHints(query: string): string[] {
  const hints = new Set<string>();
  for (const pattern of ENTITY_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    for (const m of query.matchAll(re)) {
      const val = (m[1] ?? m[0]).trim();
      if (val.length > 1) hints.add(val);
    }
  }
  if (/\bacme\b/i.test(query)) hints.add('Acme');
  if (/\bbetacorp\b/i.test(query)) hints.add('BetaCorp');
  if (/global\s*dynamics/i.test(query)) hints.add('Global Dynamics');
  return [...hints];
}

function rankResults(results: SearchResult[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  return [...results].sort((a, b) => {
    const aBoost =
      (a.metadata.project?.toLowerCase().includes('acme') && q.includes('acme') ? 0.15 : 0) +
      (a.text.toLowerCase().includes('blocked') && q.includes('status') ? 0.1 : 0);
    const bBoost =
      (b.metadata.project?.toLowerCase().includes('acme') && q.includes('acme') ? 0.15 : 0) +
      (b.text.toLowerCase().includes('blocked') && q.includes('status') ? 0.1 : 0);
    const scoreA = a.score + aBoost;
    const scoreB = b.score + bBoost;
    return scoreB - scoreA;
  });
}

export async function hybridRetrieveContext(
  query: string,
  topK = 5,
  options?: RetrieveOptions,
): Promise<{ context: string; sources: SourceCitation[]; graphContext: string }> {
  await ensureSeeded();
  const filters = options?.projectIds?.length ? { projectIds: options.projectIds } : undefined;
  const vectorResults = rankResults(await searchSimilar(query, topK * 2, filters), query).slice(
    0,
    topK,
  );
  const hints = extractEntityHints(query);

  const graphLines: string[] = [];
  const graphSources: SourceCitation[] = [];
  const seenNodeIds = new Set<string>();
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && hints.length > 0) {
    try {
      const graph = new GraphClient(dbUrl);
      for (const hint of hints.slice(0, 3)) {
        const nodes = await graph.findNodesByLabel(hint, 5, options?.projectIds);
        for (const node of nodes) {
          if (seenNodeIds.has(node.id)) continue;
          seenNodeIds.add(node.id);
          const { nodes: related, edges } = await graph.traverse(node.id, 2);
          graphLines.push(
            `Entity [${node.type}] ${node.label}: ${JSON.stringify(node.properties)}`,
          );
          graphSources.push({
            id: node.id,
            title: `${node.type} ${node.label}`,
            source: 'graph',
            excerpt: JSON.stringify(node.properties).slice(0, 160),
            score: 1,
          });
          for (const edge of edges) {
            graphLines.push(`  → ${edge.type} → ${edge.toId}`);
          }
          if (related.length > 1) {
            graphLines.push(`  Related: ${related.map((n) => n.label).join(', ')}`);
          }
        }
      }
      await graph.close();
    } catch {
      // graph optional when DB offline
    }
  }

  const dedupedVector = vectorResults.filter(
    (r, i, arr) => arr.findIndex((x) => x.id === r.id) === i,
  );
  const sources = [...toCitations(dedupedVector), ...graphSources];
  const vectorContext = vectorResults
    .map((r, i) => `[${i + 1}] (${r.metadata.source}) ${r.metadata.title}: ${r.text}`)
    .join('\n\n');

  const graphContext = graphLines.length ? graphLines.join('\n') : '';
  const context = [vectorContext, graphContext ? `Knowledge graph:\n${graphContext}` : '']
    .filter(Boolean)
    .join('\n\n');

  return { context, sources, graphContext };
}
