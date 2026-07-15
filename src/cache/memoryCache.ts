// two functions so we can swap it for Redis later without touching callers.

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

// Return a cached value, or null if it's missing or has expired.
export function readCached<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;

  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

// Cache a value for the given number of seconds.
export function writeCached(key: string, value: unknown, ttlSeconds: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function clearCache(): void {
  store.clear();
}
