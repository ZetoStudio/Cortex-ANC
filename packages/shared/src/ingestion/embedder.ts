// TODO: replace with dedicated embedding API (OpenAI text-embedding-3-small or Nomic)

import { EMBEDDING_SIZE } from '../llm/embeddings';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_EMBED_MODEL = 'llama-3.3-70b-versatile';
const CORE_EMBED_DIM = 32;

const EMBEDDING_SYSTEM_PROMPT =
  'You are a semantic embedding model. Given text, return ONLY a JSON array of exactly 32 numbers between -1 and 1 representing the semantic content. No explanation. No markdown. Just the JSON array.';

function zeroEmbedding(): number[] {
  return new Array<number>(EMBEDDING_SIZE).fill(0);
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

function padToEmbeddingSize(values: number[]): number[] {
  if (values.length === 0) return zeroEmbedding();

  const core = values.slice(0, CORE_EMBED_DIM).map(clamp);
  const result = new Array<number>(EMBEDDING_SIZE);

  for (let i = 0; i < EMBEDDING_SIZE; i++) {
    result[i] = core[i % core.length] ?? 0;
  }

  return result;
}

function parseEmbeddingArray(content: string): number[] | null {
  const trimmed = content.trim();

  const tryParse = (raw: string): number[] | null => {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      const nums = parsed
        .map((value) => (typeof value === 'number' ? value : Number(value)))
        .filter((value) => Number.isFinite(value));
      return nums.length > 0 ? nums : null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) {
    const fromFence = tryParse(fenced);
    if (fromFence) return fromFence;
  }

  const bracketed = trimmed.match(/\[[\s\S]*\]/);
  if (bracketed) {
    return tryParse(bracketed[0]);
  }

  return null;
}

async function callGroqEmbedding(text: string, groqApiKey: string): Promise<number[]> {
  const response = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_EMBED_MODEL,
      messages: [
        { role: 'system', content: EMBEDDING_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0,
      max_tokens: 256,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq embedding response missing content');
  }

  const values = parseEmbeddingArray(content);
  if (!values) {
    throw new Error('Groq embedding response was not a JSON array');
  }

  return padToEmbeddingSize(values);
}

export async function embedDocument(text: string, groqApiKey: string): Promise<number[]> {
  try {
    if (!groqApiKey.trim() || !text.trim()) {
      return zeroEmbedding();
    }
    return await callGroqEmbedding(text, groqApiKey);
  } catch {
    return zeroEmbedding();
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    let index = nextIndex;
    nextIndex += 1;
    while (index < items.length) {
      results[index] = await fn(items[index]!, index);
      index = nextIndex;
      nextIndex += 1;
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export async function embedBatch(
  texts: string[],
  groqApiKey: string,
  options?: { concurrency?: number },
): Promise<number[][]> {
  const concurrency = options?.concurrency ?? 3;
  return runWithConcurrency(texts, concurrency, (text) => embedDocument(text, groqApiKey));
}

export function shouldReembed(existingHash: string, newHash: string): boolean {
  return existingHash !== newHash;
}
