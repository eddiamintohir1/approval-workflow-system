/**
 * Simple in-memory cache for analytics data
 * Reduces database load by caching expensive analytics calculations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class AnalyticsCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with TTL
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const analyticsCache = new AnalyticsCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  OVERVIEW: 5 * 60 * 1000, // 5 minutes
  BY_TYPE: 5 * 60 * 1000,
  BY_DEPARTMENT: 5 * 60 * 1000,
  BY_STATUS: 5 * 60 * 1000,
  AVG_TIME: 10 * 60 * 1000, // 10 minutes
  COMPLETION_TREND: 5 * 60 * 1000,
  TIMELINE: 5 * 60 * 1000,
  DEPARTMENT_METRICS: 3 * 60 * 1000, // 3 minutes - more dynamic
  COST_BREAKDOWN: 3 * 60 * 1000,
};

/**
 * Helper function to wrap async functions with caching
 */
export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = analyticsCache.get<T>(cacheKey);
  if (cached !== null) {
    console.log(`📦 Cache HIT: ${cacheKey}`);
    return cached;
  }

  console.log(`🔄 Cache MISS: ${cacheKey} - fetching from database`);
  
  // Execute function and cache result
  const result = await fn();
  analyticsCache.set(cacheKey, result, ttl);
  
  return result;
}

/**
 * Invalidate all analytics caches (call when workflows are created/updated/deleted)
 */
export function invalidateAnalyticsCache() {
  console.log('🗑️  Invalidating all analytics cache');
  analyticsCache.invalidatePattern('analytics:.*');
}
