import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const userId = (request as any).user?.id || null;
    
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = response;
        const contentLength = response.get('content-length');
        const responseTime = Date.now() - startTime;

        // Log successful requests
        this.logger.log(
          `${method} ${url} ${statusCode} ${contentLength || 0}b - ${responseTime}ms`,
          {
            method,
            url,
            statusCode,
            contentLength: contentLength || 0,
            responseTime,
            userAgent,
            ip,
            userId,
            timestamp: new Date().toISOString(),
          },
        );
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        
        // Log failed requests
        this.logger.error(
          `${method} ${url} ERROR - ${responseTime}ms`,
          {
            method,
            url,
            responseTime,
            userAgent,
            ip,
            userId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          },
        );
        
        throw error;
      }),
    );
  }
}