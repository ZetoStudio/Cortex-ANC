import { runBrain, type BrainResult } from './brain';

export type OrchestratorResult = BrainResult;

/** LangGraph-style pipeline — delegates to Cortex Brain. */
export async function runOrchestrator(prompt: string): Promise<OrchestratorResult> {
  return runBrain(prompt);
}
