import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { DataSource, QueryRunner } from 'typeorm';
import { Reflector } from '@nestjs/core';

const TRANSACTION_KEY = 'transaction';

// Decorator to mark methods that should run in a transaction
export const Transaction = () => Reflect.defineMetadata(TRANSACTION_KEY, true, Reflect);

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionInterceptor.name);

  constructor(
    private dataSource: DataSource,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const useTransaction = this.reflector.get<boolean>(
      TRANSACTION_KEY,
      context.getHandler(),
    );

    if (!useTransaction) {
      return next.handle();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const request = context.switchToHttp().getRequest();
    request.queryRunner = queryRunner;

    this.logger.debug('Transaction started', {
      handler: context.getHandler().name,
      class: context.getClass().name,
    });

    return next.handle().pipe(
      tap(async () => {
        await queryRunner.commitTransaction();
        this.logger.debug('Transaction committed successfully');
      }),
      catchError(async (error) => {
        await queryRunner.rollbackTransaction();
        this.logger.error('Transaction rolled back due to error', {
          error: error.message,
          stack: error.stack,
          handler: context.getHandler().name,
          class: context.getClass().name,
        });
        return throwError(() => error);
      }),
      tap({
        finalize: async () => {
          await queryRunner.release();
          this.logger.debug('Transaction connection released');
        },
      }),
    );
  }
}