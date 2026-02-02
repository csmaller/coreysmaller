import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).details || null;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      details = process.env.NODE_ENV === 'development' ? exception.message : null;
      
      // Log database errors with more detail
      this.logger.error(
        `Database Error: ${exception.message}`,
        {
          query: exception.query,
          parameters: exception.parameters,
          driverError: exception.driverError,
          url: request.url,
          method: request.method,
          userAgent: request.get('User-Agent'),
          ip: request.ip,
        },
      );
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : exception.message;
      details = process.env.NODE_ENV === 'development' ? exception.stack : null;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
    }

    // Log the error with appropriate level
    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log';
    const logMessage = `${request.method} ${request.url} - ${status} - ${message}`;
    
    const logContext = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      userId: (request as any).user?.id || null,
      exception: exception instanceof Error ? exception.name : 'Unknown',
      stack: exception instanceof Error && process.env.NODE_ENV === 'development' 
        ? exception.stack 
        : null,
    };

    this.logger[logLevel](logMessage, logContext);

    // Security: Don't expose sensitive information in production
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { 
        exception: exception instanceof Error ? exception.name : 'Unknown' 
      }),
    };

    response.status(status).json(errorResponse);
  }
}