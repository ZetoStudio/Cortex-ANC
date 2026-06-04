import { llmClient } from '@cortex/shared';

import { hybridRetrieveContext } from './hybrid-retrieval';
import type { SourceCitation } from './retrieval';

export type ClientReplyResult = {
  draft: string;
  sources: SourceCitation[];
  pendingApprovalId?: string;
};

export async function draftClientReply(emailContent: string): Promise<ClientReplyResult> {
  const { context, sources, graphContext } = await hybridRetrieveContext(emailContent, 6);

  const draft = await llmClient.complete(
    `Client email:\n${emailContent}\n\nCompany context:\n${context || 'No context.'}${
      graphContext ? `\nGraph:\n${graphContext}` : ''
    }`,
    { agentRole: 'clientReply', temperature: 0.55, maxTokens: 512 },
  );

  return { draft, sources };
}
