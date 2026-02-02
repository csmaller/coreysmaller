import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance, ClassConstructor } from 'class-transformer';

@Injectable()
export class SerializationInterceptor<T> implements NestInterceptor {
  constructor(private dto: ClassConstructor<T>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: any) => {
        if (data === null || data === undefined) {
          return data;
        }

        // Handle arrays
        if (Array.isArray(data)) {
          return data.map(item => 
            plainToInstance(this.dto, item, {
              excludeExtraneousValues: true,
              enableImplicitConversion: true,
            })
          );
        }

        // Handle paginated responses
        if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
          return {
            ...data,
            data: data.data.map(item => 
              plainToInstance(this.dto, item, {
                excludeExtraneousValues: true,
                enableImplicitConversion: true,
              })
            ),
          };
        }

        // Handle single objects
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        });
      }),
    );
  }
}

export function Serialize<T>(dto: ClassConstructor<T>) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (descriptor) {
      // Method decorator
      const originalMethod = descriptor.value;
      descriptor.value = function (...args: any[]) {
        const result = originalMethod.apply(this, args);
        if (result && typeof result.then === 'function') {
          // Handle promises
          return result.then((data: any) => {
            if (data === null || data === undefined) {
              return data;
            }
            
            if (Array.isArray(data)) {
              return data.map(item => 
                plainToInstance(dto, item, {
                  excludeExtraneousValues: true,
                  enableImplicitConversion: true,
                })
              );
            }

            if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
              return {
                ...data,
                data: data.data.map(item => 
                  plainToInstance(dto, item, {
                    excludeExtraneousValues: true,
                    enableImplicitConversion: true,
                  })
                ),
              };
            }

            return plainToInstance(dto, data, {
              excludeExtraneousValues: true,
              enableImplicitConversion: true,
            });
          });
        }
        return result;
      };
    } else {
      // Class decorator - use interceptor
      return target;
    }
  };
}