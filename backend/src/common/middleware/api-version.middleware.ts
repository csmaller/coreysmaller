import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiVersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Add start time for response time calculation
    req.startTime = Date.now();

    // Set default API version if not provided
    if (!req.headers['api-version']) {
      req.headers['api-version'] = '1.0';
    }

    // Validate API version format
    const apiVersion = req.headers['api-version'] as string;
    const versionPattern = /^\d+\.\d+$/;
    
    if (!versionPattern.test(apiVersion)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API version format. Expected format: x.y (e.g., 1.0)',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if version is supported
    const supportedVersions = ['1.0'];
    if (!supportedVersions.includes(apiVersion)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported API version: ${apiVersion}. Supported versions: ${supportedVersions.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}