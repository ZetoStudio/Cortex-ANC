import { httpClient } from '../http/client';

import { BRAIN_PROMPTS, type AgentRole } from './prompts';

export type LlmProvider = 'groq' | 'ollama';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmOptions {
  provider?: LlmProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  agentRole?: AgentRole;
}

// Ollama disabled for demo — kept for future re-enable
// function resolveProvider(_explicit?: LlmProvider): LlmProvider {
//   return 'groq';
// }

function buildMessages(prompt: string, options: LlmOptions): LlmMessage[] {
  const system =
    options.systemPrompt ?? (options.agentRole ? BRAIN_PROMPTS[options.agentRole] : undefined);
  const messages: LlmMessage[] = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  return messages;
}

function litellmBase(): string | null {
  const url = (process.env.LITELLM_URL ?? 'http://localhost:4000').replace(/\/$/, '');
  return url || null;
}

async function callLiteLLM(
  messages: LlmMessage[],
  model: string,
  temperature: number,
  maxTokens?: number,
): Promise<string> {
  const base = litellmBase()!;
  const key = process.env.LITELLM_MASTER_KEY ?? 'cortex-local-dev';
  const response = await httpClient.post<{
    choices: Array<{ message: { content: string } }>;
  }>(
    `${base}/v1/chat/completions`,
    {
      model: model.startsWith('cortex-') ? model : 'cortex-groq',
      messages,
      temperature,
      max_tokens: maxTokens,
    },
    { headers: { Authorization: `Bearer ${key}` } },
  );
  return response.data.choices[0]?.message.content ?? '';
}

async function callGroq(
  messages: LlmMessage[],
  model: string,
  temperature: number,
  maxTokens?: number,
): Promise<string> {
  if (litellmBase()) return callLiteLLM(messages, 'cortex-groq', temperature, maxTokens);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is required when using Groq provider');
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await httpClient.post<{
        choices: Array<{ message: { content: string } }>;
      }>(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeoutMs: 60_000,
        },
      );
      return response.data.choices[0]?.message.content ?? '';
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error('Groq request failed');
}

// Ollama disabled for demo
// async function callOllama(...) { ... }

async function llmChat(messages: LlmMessage[], options: LlmOptions = {}): Promise<string> {
  const temperature = options.temperature ?? 0.7;
  const model = options.model ?? process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
  return callGroq(messages, model, temperature, options.maxTokens);

  // Ollama path disabled for demo:
  // if (resolveProvider(options.provider) === 'ollama') {
  //   return callOllama(messages, options.model ?? 'llama3:8b', temperature);
  // }
}

export async function llmComplete(prompt: string, options: LlmOptions = {}): Promise<string> {
  return llmChat(buildMessages(prompt, options), options);
}

/** Cheap Groq pass for entity extraction / monitoring (Ollama disabled). */
export async function llmCompleteLocal(prompt: string, temperature = 0): Promise<string> {
  return llmChat([{ role: 'user', content: prompt }], {
    temperature,
    maxTokens: 256,
  });
}

export const llmClient = {
  complete: llmComplete,
  chat: llmChat,
  completeLocal: llmCompleteLocal,
};
