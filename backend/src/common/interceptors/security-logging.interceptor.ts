import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { LOG_SECURITY_KEY } from '../decorators/log-security.decorator';

@Injectable()
export class SecurityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SecurityLogger');

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const securityEvent = this.reflector.get<string>(
      LOG_SECURITY_KEY,
      context.getHandler(),
    );

    if (!securityEvent) {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const userId = (request as any).user?.id || null;
    const email = (request as any).user?.email || null;

    return next.handle().pipe(
      tap((data) => {
        // Log successful security events
        this.logger.warn(
          `Security Event: ${securityEvent} - SUCCESS`,
          {
            event: securityEvent,
            status: 'SUCCESS',
            method,
            url,
            ip,
            userAgent,
            userId,
            email,
            timestamp: new Date().toISOString(),
            data: this.sanitizeData(data),
          },
        );
      }),
      catchError((error) => {
        // Log failed security events
        this.logger.error(
          `Security Event: ${securityEvent} - FAILED`,
          {
            event: securityEvent,
            status: 'FAILED',
            method,
            url,
            ip,
            userAgent,
            userId,
            email,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        );
        
        throw error;
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (!data) return null;
    
    // Remove sensitive information from logs
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.access_token;
    delete sanitized.refresh_token;
    
    return sanitized;
  }
}