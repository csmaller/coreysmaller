import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/base-response.dto';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    return next.handle().pipe(
      map((data: any) => {
        // Don't wrap already wrapped responses
        if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
          return data;
        }

        // Don't wrap file downloads or streams
        if (response.getHeader('content-type')?.includes('application/octet-stream') ||
            response.getHeader('content-disposition')?.includes('attachment')) {
          return data;
        }

        // Add API version to response headers
        const apiVersion = request.headers['api-version'] || '1.0';
        response.setHeader('API-Version', apiVersion);
        response.setHeader('X-Response-Time', Date.now() - request.startTime);

        // Wrap successful responses
        return new ApiResponseDto(data);
      }),
    );
  }
}