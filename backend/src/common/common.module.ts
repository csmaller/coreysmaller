import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggingController } from './controllers/logging.controller';
import { HealthController } from './controllers/health.controller';
import { CacheService } from './cache.service';
import { QueryOptimizationService } from './query-optimization.service';
import { MonitoringService } from './services/monitoring.service';
import { SanitizationService } from './services/sanitization.service';
import { ValidationService } from './services/validation.service';
import { DatabaseIntegrityService } from './services/database-integrity.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule.register({
      ttl: 300, // 5 minutes default TTL
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [LoggingController, HealthController],
  providers: [
    CacheService, 
    QueryOptimizationService, 
    MonitoringService,
    SanitizationService,
    ValidationService,
    DatabaseIntegrityService,
  ],
  exports: [
    CacheService, 
    QueryOptimizationService, 
    MonitoringService,
    SanitizationService,
    ValidationService,
    DatabaseIntegrityService,
  ],
})
export class CommonModule {}