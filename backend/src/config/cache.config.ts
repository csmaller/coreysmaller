import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Injectable()
export class CacheConfig implements CacheOptionsFactory {
  constructor(private configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (redisUrl && isProduction) {
      // Use Redis in production
      return {
        store: redisStore,
        url: redisUrl,
        ttl: 300, // 5 minutes default TTL
        max: 1000, // Maximum number of items in cache
        isGlobal: true,
      };
    } else {
      // Use in-memory cache for development
      return {
        ttl: 300, // 5 minutes default TTL
        max: 100, // Maximum number of items in cache
        isGlobal: true,
      };
    }
  }
}