import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';

interface ClientErrorDto {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  context?: Record<string, any>;
  level?: 'error' | 'warning' | 'info';
}

@Controller('logs')
export class LoggingController {
  private readonly logger = new Logger('ClientLogger');

  @Post('client-error')
  @HttpCode(HttpStatus.OK)
  async logClientError(@Body() errorData: ClientErrorDto) {
    const { level = 'error', message, context, ...metadata } = errorData;

    // Log client-side errors with appropriate level
    switch (level) {
      case 'warning':
        this.logger.warn(`Client Warning: ${message}`, {
          source: 'client',
          ...metadata,
          context,
        });
        break;
      case 'info':
        this.logger.log(`Client Info: ${message}`, {
          source: 'client',
          ...metadata,
          context,
        });
        break;
      default:
        this.logger.error(`Client Error: ${message}`, {
          source: 'client',
          ...metadata,
          context,
        });
    }

    return { success: true };
  }
}