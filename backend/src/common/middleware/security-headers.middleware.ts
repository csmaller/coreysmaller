import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // HSTS (HTTP Strict Transport Security) - only in production with HTTPS
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: http:",
      "media-src 'self' https:",
      "connect-src 'self' https://api.soundcloud.com https://www.youtube.com",
      "frame-src 'self' https://www.youtube.com https://w.soundcloud.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', csp);

    // Log security-relevant requests
    if (this.isSecurityRelevant(req)) {
      this.logger.log(`Security-relevant request: ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        origin: req.get('Origin'),
      });
    }

    next();
  }

  private isSecurityRelevant(req: Request): boolean {
    const securityPaths = ['/auth/', '/admin/', '/api/'];
    return securityPaths.some(path => req.url.includes(path));
  }
}