const memoryCache = new Map<string, { value: string; exp: number }>();

export async function cacheGet(key: string): Promise<string | null> {
  const hit = memoryCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  return null;
}

export async function cacheSet(key: string, value: string, ttlSec = 300): Promise<void> {
  memoryCache.set(key, { value, exp: Date.now() + ttlSec * 1000 });
}
