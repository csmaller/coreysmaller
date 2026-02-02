interface ErrorLogData {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  context?: Record<string, any>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isProduction = process.env.NODE_ENV === 'production';

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private constructor() {
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { type: 'unhandledrejection', reason: event.reason }
      );
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(
        new Error(event.message),
        {
          type: 'javascript',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });
  }

  logError(error: Error, context?: Record<string, any>): void {
    const errorData: ErrorLogData = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      context,
    };

    // Add user ID if available (from auth context)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        errorData.userId = user.id;
      } catch {
        // Ignore parsing errors
      }
    }

    // Always log to console
    console.error('Error logged:', errorData);

    // In production, send to logging service
    if (this.isProduction) {
      this.sendToLoggingService(errorData);
    }
  }

  logWarning(message: string, context?: Record<string, any>): void {
    const warningData = {
      level: 'warning',
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      context,
    };

    console.warn('Warning logged:', warningData);

    if (this.isProduction) {
      this.sendToLoggingService(warningData);
    }
  }

  logInfo(message: string, context?: Record<string, any>): void {
    const infoData = {
      level: 'info',
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      context,
    };

    console.info('Info logged:', infoData);

    if (this.isProduction) {
      this.sendToLoggingService(infoData);
    }
  }

  private async sendToLoggingService(data: any): Promise<void> {
    try {
      // In a real application, you would send this to a logging service
      // like Sentry, LogRocket, DataDog, etc.
      
      // For now, we'll send it to our backend API
      await fetch('/api/logs/client-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (err) {
      // Don't throw errors from the error logger
      console.error('Failed to send error to logging service:', err);
    }
  }

  // Method to manually log API errors
  logApiError(
    endpoint: string,
    method: string,
    status: number,
    message: string,
    context?: Record<string, any>
  ): void {
    this.logError(
      new Error(`API Error: ${method} ${endpoint} - ${status} ${message}`),
      {
        type: 'api',
        endpoint,
        method,
        status,
        ...context,
      }
    );
  }

  // Method to log user actions for debugging
  logUserAction(action: string, context?: Record<string, any>): void {
    this.logInfo(`User Action: ${action}`, {
      type: 'user_action',
      action,
      ...context,
    });
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();