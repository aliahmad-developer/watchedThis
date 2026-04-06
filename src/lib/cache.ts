interface CacheEntry<T> {
  data: T
  ts: number
}

interface CacheOptions {
  ttl: number // ms
}

class ServerCache {
  private store = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string, ttl: number): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    if (Date.now() - entry.ts > ttl) {
      this.store.delete(key)
      return null
    }
    return entry.data
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, ts: Date.now() })
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key)
    }
  }
}

// Module-level singleton — persists across requests in the same server process
export const cache = new ServerCache()

export const TTL = {
  SHORT:  1000 * 60 * 5,   // 5 min
  MEDIUM: 1000 * 60 * 15,  // 15 min
  LONG:   1000 * 60 * 60,  // 1 hour
}