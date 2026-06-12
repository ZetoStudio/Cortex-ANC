import { createLogger, llmClient, type LlmProvider } from '@cortex/shared';

import { hybridRetrieveContext } from '../hybrid-retrieval';
import type { SourceCitation } from '../retrieval';
import { requestWriteAction } from '../tools/write-actions';

import { getCachedAnswer, setCachedAnswer } from './query-cache';

const log = createLogger('cortex-brain');

export type BrainState = {
  query: string;
  plan: string;
  context: string;
  graphContext: string;
  sources: SourceCitation[];
  answer: string;
  pendingApprovalId?: string;
  steps: string[];
};

export type BrainResult = {
  answer: string;
  sources: SourceCitation[];
  pendingApprovalId?: string;
  steps: string[];
  citationsFormatted: string;
};

function formatCitations(sources: SourceCitation[]): string {
  if (!sources.length) return '';
  return sources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.source}) — ${s.excerpt.slice(0, 80)}…`)
    .join('\n');
}

/**
 * Cortex Brain — multi-agent pipeline:
 * reasoning → hybrid retrieval → action gate → cited response
 */
export async function runBrain(
  query: string,
  options?: {
    skipCache?: boolean;
    tenantId?: string;
    projectIds?: string[];
    provider?: LlmProvider;
  },
): Promise<BrainResult> {
  const steps: string[] = [];
  const start = Date.now();

  if (!options?.skipCache) {
    const cached = getCachedAnswer(query);
    if (cached) {
      return {
        answer: cached,
        sources: [],
        steps: ['cache'],
        citationsFormatted: '',
      };
    }
  }

  const llmOpts = { provider: options?.provider, temperature: 0.3, maxTokens: 256 };

  steps.push('reasoning');
  const plan = await llmClient.complete(query, {
    ...llmOpts,
    agentRole: 'reasoning',
  });
  log.debug({ plan: plan.slice(0, 120) }, 'reasoning complete');

  steps.push('retrieval');
  const { context, sources, graphContext } = await hybridRetrieveContext(query, 8, {
    tenantId: options?.tenantId,
    projectIds: options?.projectIds,
    provider: options?.provider,
  });
  log.debug({ docCount: sources.length, graph: !!graphContext }, 'retrieval complete');

  steps.push('action');
  let pendingApprovalId: string | undefined;
  const needsApproval =
    /\b(send|post|create|reply|email|draft)\b/i.test(query) &&
    /\b(send|email|reply|client)\b/i.test(query);
  if (needsApproval) {
    pendingApprovalId = await requestWriteAction({
      actionType: 'send_email',
      connector: 'gmail',
      payload: { draft: true, query },
      requestedBy: 'brain',
    });
  }

  steps.push('response');
  const answer = await llmClient.complete(
    `Sub-questions to address:\n${plan}\n\nContext:\n${context || '(no documents)'}${
      graphContext ? `\n\nKnowledge graph:\n${graphContext}` : ''
    }\n\nQuestion: ${query}`,
    { ...llmOpts, agentRole: 'response', temperature: 0.45, maxTokens: 1024 },
  );

  log.info({ steps, ms: Date.now() - start }, 'brain run complete');

  setCachedAnswer(query, answer);

  return {
    answer,
    sources,
    pendingApprovalId,
    steps,
    citationsFormatted: formatCitations(sources),
  };
}
