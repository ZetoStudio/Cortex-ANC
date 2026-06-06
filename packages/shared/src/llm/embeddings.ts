const EMBEDDING_DIMENSION = 768;

function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash << 5) - hash + token.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/** Deterministic fallback when no embedding API is configured (demo / Groq-only mode). */
export function fallbackEmbedText(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);

  for (const token of tokens) {
    const h = Math.abs(hashToken(token));
    const index = h % EMBEDDING_DIMENSION;
    vector[index] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

/** Embeddings — hash fallback only (Ollama/LiteLLM embed path disabled for demo). */
export async function embedText(text: string, _model?: string): Promise<number[]> {
  // Re-enable when Ollama returns:
  // - LiteLLM POST /v1/embeddings model cortex-ollama
  // - Ollama POST /api/embeddings nomic-embed-text
  return fallbackEmbedText(text);
}

export const EMBEDDING_SIZE = EMBEDDING_DIMENSION;
