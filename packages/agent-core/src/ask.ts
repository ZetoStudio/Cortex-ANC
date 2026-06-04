import { runOrchestrator } from './orchestrator';
import type { SourceCitation } from './retrieval';

export type AskQuestionResult = {
  answer: string;
  sources: SourceCitation[];
  pendingApprovalId?: string;
  steps?: string[];
  citationsFormatted?: string;
};

export async function askQuestion(prompt: string): Promise<AskQuestionResult> {
  const result = await runOrchestrator(prompt);
  return {
    answer: result.answer,
    sources: result.sources,
    pendingApprovalId: result.pendingApprovalId,
    steps: result.steps,
    citationsFormatted: result.citationsFormatted,
  };
}
