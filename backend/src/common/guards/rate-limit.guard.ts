import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const RATE_LIMIT_KEY = 'rateLimit';

// Decorator to set rate limit options
export const RateLimit = (options: RateLimitOptions) => 
  Reflect.defineMetadata(RATE_LIMIT_KEY, options, Reflect);

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(private reflector: Reflector) {
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request);
    const now = Date.now();

    let requestData = this.requestCounts.get(key);

    // Initialize or reset if window has passed
    if (!requestData || now > requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: now + rateLimitOptions.windowMs,
      };
    }

    // Increment request count
    requestData.count++;
    this.requestCounts.set(key, requestData);

    // Check if limit exceeded
    if (requestData.count > rateLimitOptions.maxRequests) {
      const timeUntilReset = Math.ceil((requestData.resetTime - now) / 1000);
      
      this.logger.warn(`Rate limit exceeded for ${key}`, {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        endpoint: `${request.method} ${request.url}`,
        count: requestData.count,
        limit: rateLimitOptions.maxRequests,
        resetIn: timeUntilReset,
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: rateLimitOptions.message || 'Too many requests',
          retryAfter: timeUntilReset,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private generateKey(request: Request): string {
    // Use IP address and user ID (if authenticated) for the key
    const userId = (request as any).user?.id || 'anonymous';
    return `${request.ip}:${userId}`;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }
}