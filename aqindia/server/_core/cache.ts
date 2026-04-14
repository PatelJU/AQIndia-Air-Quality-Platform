interface CacheItem<T> {
  value: T;
  expiry: number;
  lastAccessed: number;
}

interface LRUCacheOptions {
  max: number;
  ttl: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheItem<V>>;
  private max: number;
  private ttl: number;

  constructor(options: LRUCacheOptions) {
    this.cache = new Map();
    this.max = options.max;
    this.ttl = options.ttl;
  }

  get(key: K): V | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    item.lastAccessed = Date.now();
    this.cache.set(key, item);
    
    return item.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    if (this.cache.size >= this.max) {
      const keys = Array.from(this.cache.keys());
      if (keys.length > 0) {
        this.cache.delete(keys[0]);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
      lastAccessed: Date.now(),
    });
  }

  has(key: K): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.max,
      ttl: this.ttl,
    };
  }

  /**
   * Clean up expired items
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Pre-configured cache for AQIndia
export const aqiCache = new LRUCache<string, any>({
  max: 200,           // Max 200 cached items
  ttl: 5 * 60 * 1000, // 5 minutes TTL
});

// Periodic cleanup every 10 minutes
setInterval(() => {
  const cleaned = aqiCache.cleanup();
  if (cleaned > 0) {
    console.log(`[Cache] Cleaned ${cleaned} expired items`);
  }
}, 10 * 60 * 1000);
