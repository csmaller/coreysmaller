import { SetMetadata } from '@nestjs/common';

export const LOG_SECURITY_KEY = 'logSecurity';
export const LogSecurity = (event: string) => SetMetadata(LOG_SECURITY_KEY, event);