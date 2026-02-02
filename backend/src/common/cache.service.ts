import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
}

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    // Note: reset method may not be available in all cache implementations
    // Use store-specific method if available
    if (typeof (this.cacheManager as any).reset === 'function') {
      await (this.cacheManager as any).reset();
    } else {
      // Fallback: clear cache by deleting keys (implementation dependent)
      console.warn('Cache reset not supported by current cache implementation');
    }
  }

  /**
   * Generate cache key for content lists
   */
  generateListKey(type: string, page?: number, limit?: number, filters?: Record<string, any>): string {
    const parts = [type, 'list'];
    
    if (page !== undefined) parts.push(`page:${page}`);
    if (limit !== undefined) parts.push(`limit:${limit}`);
    
    if (filters) {
      const filterStr = Object.entries(filters)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}:${value}`)
        .sort()
        .join(',');
      if (filterStr) parts.push(`filters:${filterStr}`);
    }
    
    return parts.join(':');
  }

  /**
   * Generate cache key for individual content items
   */
  generateItemKey(type: string, id: string): string {
    return `${type}:item:${id}`;
  }

  /**
   * Generate cache key for content stats
   */
  generateStatsKey(type?: string): string {
    return type ? `${type}:stats` : 'content:stats';
  }

  /**
   * Invalidate cache patterns (useful for cache busting)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Note: This is a simplified implementation
    // In production with Redis, you might want to use Redis SCAN command
    // For now, we'll implement basic pattern matching for common cases
    
    if (pattern.includes('*')) {
      // For wildcard patterns, we need to implement pattern matching
      // This is a basic implementation - in production, consider using Redis SCAN
      console.warn(`Pattern invalidation not fully implemented for: ${pattern}`);
    } else {
      await this.del(pattern);
    }
  }

  /**
   * Cache decorator function for methods
   */
  async cacheOrExecute<T>(
    key: string,
    executor: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== undefined) {
      return cached;
    }

    const result = await executor();
    await this.set(key, result, options.ttl);
    
    return result;
  }

  /**
   * Batch cache operations
   */
  async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async mset<T>(items: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    await Promise.all(
      items.map(item => this.set(item.key, item.value, item.ttl))
    );
  }
}