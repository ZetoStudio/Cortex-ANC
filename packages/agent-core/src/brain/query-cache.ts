const cache = new Map<string, { result: string; exp: number }>();
const TTL_MS = 60_000;

export function getCachedAnswer(query: string): string | null {
  const hit = cache.get(query.trim().toLowerCase());
  if (hit && hit.exp > Date.now()) return hit.result;
  return null;
}

export function setCachedAnswer(query: string, answer: string): void {
  cache.set(query.trim().toLowerCase(), { result: answer, exp: Date.now() + TTL_MS });
}
