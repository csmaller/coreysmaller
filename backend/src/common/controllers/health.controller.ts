import { Controller, Get, Logger } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: any[];
  metrics: any;
}

interface MetricsResponse {
  current: any;
  history: any[];
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private monitoringService: MonitoringService) {}

  @Get()
  async getHealth(): Promise<HealthResponse> {
    return await this.monitoringService.getSystemHealth();
  }

  @Get('metrics')
  getMetrics(): MetricsResponse {
    return {
      current: this.monitoringService.getCurrentMetrics(),
      history: this.monitoringService.getMetricsHistory(50),
    };
  }

  @Get('ping')
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}