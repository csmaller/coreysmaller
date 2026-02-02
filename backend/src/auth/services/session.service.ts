import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface SessionData {
  userId: string;
  email: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions = new Map<string, SessionData>();
  private readonly sessionTimeout: number;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Default session timeout: 24 hours
    this.sessionTimeout = this.configService.get<number>('SESSION_TIMEOUT_MS') || 24 * 60 * 60 * 1000;
    
    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  createSession(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string,
  ): string {
    const sessionId = this.generateSessionId();
    const now = new Date();

    const sessionData: SessionData = {
      userId,
      email,
      loginTime: now,
      lastActivity: now,
      ipAddress,
      userAgent,
    };

    this.sessions.set(sessionId, sessionData);

    this.logger.log(`Session created for user ${email}`, {
      userId,
      email,
      sessionId,
      ipAddress,
      userAgent,
    });

    return sessionId;
  }

  validateSession(sessionId: string, ipAddress: string, userAgent: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    const now = new Date();
    const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

    // Check if session has expired
    if (timeSinceLastActivity > this.sessionTimeout) {
      this.destroySession(sessionId);
      this.logger.warn(`Session expired for user ${session.email}`, {
        userId: session.userId,
        email: session.email,
        sessionId,
        timeSinceLastActivity,
      });
      return null;
    }

    // Security check: IP address should match (optional, can be disabled for mobile users)
    const strictIpCheck = this.configService.get<boolean>('STRICT_IP_CHECK') || false;
    if (strictIpCheck && session.ipAddress !== ipAddress) {
      this.destroySession(sessionId);
      this.logger.error(`IP address mismatch for session ${sessionId}`, {
        userId: session.userId,
        email: session.email,
        originalIp: session.ipAddress,
        currentIp: ipAddress,
      });
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    this.sessions.set(sessionId, session);

    return session;
  }

  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.logger.log(`Session destroyed for user ${session.email}`, {
        userId: session.userId,
        email: session.email,
        sessionId,
      });
    }
  }

  destroyAllUserSessions(userId: string): void {
    let destroyedCount = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        destroyedCount++;
      }
    }

    if (destroyedCount > 0) {
      this.logger.log(`Destroyed ${destroyedCount} sessions for user ${userId}`);
    }
  }

  getActiveSessions(userId: string): SessionData[] {
    const userSessions: SessionData[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }

  getSessionStats(): {
    totalSessions: number;
    activeUsers: number;
    averageSessionDuration: number;
  } {
    const now = new Date();
    const sessions = Array.from(this.sessions.values());
    const uniqueUsers = new Set(sessions.map(s => s.userId));
    
    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (now.getTime() - session.loginTime.getTime());
    }, 0);

    return {
      totalSessions: sessions.length,
      activeUsers: uniqueUsers.size,
      averageSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
    };
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity > this.sessionTimeout) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }
}