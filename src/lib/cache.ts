interface CacheEntry<T> {
  data: T;
  ts: number;
  ok: boolean; 
}

class ServerCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, ttl: number): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.ts > ttl) {
      this.store.delete(key);
      return null;
    }
    // Never return cached error responses
    if (!entry.ok) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ok = true): void {
    // Never store error responses
    if (!ok) return;
    this.store.set(key, { data, ts: Date.now(), ok });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

export const cache = new ServerCache();

export const TTL = {
  SHORT: 1000 * 60 * 5,
  MEDIUM: 1000 * 60 * 15,
  LONG: 1000 * 60 * 60,
};
