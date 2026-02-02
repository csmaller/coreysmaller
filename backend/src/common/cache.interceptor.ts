import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { Reflector } from '@nestjs/core';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Decorator to set cache key for a method
 */
export const CacheKey = (key: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, key, descriptor.value);
    return descriptor;
  };
};

/**
 * Decorator to set cache TTL for a method
 */
export const CacheTTL = (ttl: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Get cache metadata
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, handler);
    const cacheTTL = this.reflector.get<number>(CACHE_TTL_METADATA, handler);

    if (!cacheKey) {
      return next.handle();
    }

    // Generate dynamic cache key based on request parameters
    const dynamicKey = this.generateCacheKey(cacheKey, request);

    // Try to get from cache
    const cachedResult = await this.cacheService.get(dynamicKey);
    if (cachedResult !== undefined) {
      return of(cachedResult);
    }

    // Execute the handler and cache the result
    return next.handle().pipe(
      tap(async (result) => {
        if (result !== undefined && result !== null) {
          await this.cacheService.set(dynamicKey, result, cacheTTL);
        }
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const { params, query } = request;
    
    // Replace parameters in the cache key
    let key = baseKey;
    
    // Replace path parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        key = key.replace(`:${param}`, String(value));
      });
    }

    // Add query parameters for list endpoints
    if (query && Object.keys(query).length > 0) {
      const queryStr = Object.entries(query)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}:${value}`)
        .sort()
        .join(',');
      
      if (queryStr) {
        key += `:query:${queryStr}`;
      }
    }

    return key;
  }
}