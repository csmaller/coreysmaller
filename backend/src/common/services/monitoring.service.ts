import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

interface SystemMetrics {
  timestamp: Date;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  activeConnections: number;
  errorRate: number;
  responseTime: number;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly metrics: SystemMetrics[] = [];
  private readonly maxMetricsHistory = 1000; // Keep last 1000 metrics
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;

  // Track request metrics
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.totalResponseTime += responseTime;
    
    if (isError) {
      this.errorCount++;
    }
  }

  // Get current system metrics
  getCurrentMetrics(): SystemMetrics {
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      activeConnections: this.requestCount, // Simplified - in real app, track active connections
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      responseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
    };

    // Store metrics
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    return metrics;
  }

  // Get metrics history
  getMetricsHistory(limit: number = 100): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  // Perform health checks
  async performHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Database health check
    checks.push(await this.checkDatabase());
    
    // Memory health check
    checks.push(this.checkMemory());
    
    // Disk space check (simplified)
    checks.push(this.checkDiskSpace());

    return checks;
  }

  // Get overall system health
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheck[];
    metrics: SystemMetrics;
  }> {
    const checks = await this.performHealthChecks();
    const metrics = this.getCurrentMetrics();
    
    const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
    const degradedChecks = checks.filter(check => check.status === 'degraded');
    
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (unhealthyChecks.length > 0) {
      status = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      status = 'degraded';
    }

    return { status, checks, metrics };
  }

  // Scheduled health check (every 5 minutes)
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledHealthCheck(): Promise<void> {
    try {
      const health = await this.getSystemHealth();
      
      if (health.status !== 'healthy') {
        this.logger.warn(`System health check: ${health.status}`, {
          checks: health.checks.filter(c => c.status !== 'healthy'),
          metrics: health.metrics,
        });
      } else {
        this.logger.log('System health check: healthy');
      }

      // Log metrics for monitoring
      this.logMetrics(health.metrics);
      
    } catch (error) {
      this.logger.error('Failed to perform scheduled health check', error);
    }
  }

  // Reset counters (called periodically)
  @Cron(CronExpression.EVERY_HOUR)
  resetCounters(): void {
    this.logger.log('Resetting monitoring counters', {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      avgResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
    });

    this.requestCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Simple database connectivity check
      // In a real app, you'd inject the DataSource and perform a simple query
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB check
      
      return {
        service: 'database',
        status: 'healthy',
        responseTime: Date.now() - start,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  private checkMemory(): HealthCheck {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (usagePercent > 90) {
      status = 'unhealthy';
    } else if (usagePercent > 75) {
      status = 'degraded';
    }

    return {
      service: 'memory',
      status,
      responseTime: 0,
      timestamp: new Date(),
      error: status !== 'healthy' ? `Memory usage: ${usagePercent.toFixed(1)}%` : undefined,
    };
  }

  private checkDiskSpace(): HealthCheck {
    // Simplified disk space check
    // In a real app, you'd use a library like 'node-disk-info' to check actual disk space
    return {
      service: 'disk',
      status: 'healthy',
      responseTime: 0,
      timestamp: new Date(),
    };
  }

  private logMetrics(metrics: SystemMetrics): void {
    const memUsageMB = {
      rss: Math.round(metrics.memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(metrics.memoryUsage.external / 1024 / 1024),
    };

    this.logger.log('System metrics', {
      uptime: Math.round(metrics.uptime),
      memoryMB: memUsageMB,
      errorRate: Math.round(metrics.errorRate * 100) / 100,
      avgResponseTime: Math.round(metrics.responseTime * 100) / 100,
    });
  }
}