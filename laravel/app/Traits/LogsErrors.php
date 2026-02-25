<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * LogsErrors Trait
 * 
 * Provides consistent error logging functionality for services.
 * Logs errors with appropriate severity levels and context information.
 * 
 * Requirements: 13.10
 */
trait LogsErrors
{
    /**
     * Log an error with context information
     * 
     * @param Throwable $exception The exception to log
     * @param string $operation The operation that failed
     * @param array $context Additional context information
     * @return void
     */
    protected function logError(Throwable $exception, string $operation, array $context = []): void
    {
        $request = request();
        
        $logContext = array_merge([
            'operation' => $operation,
            'exception' => get_class($exception),
            'message' => $exception->getMessage(),
            'timestamp' => now()->toIso8601String(),
        ], $context);

        // Add request context if available
        if ($request) {
            $logContext['path'] = $request->path();
            $logContext['method'] = $request->method();
            $logContext['ip'] = $request->ip();
            $logContext['userAgent'] = $request->userAgent();
            $logContext['userId'] = $request->user()?->id ?? null;
        }

        // Add stack trace in development
        if (config('app.debug')) {
            $logContext['stack'] = $exception->getTraceAsString();
        }

        // Determine log level based on exception type
        $statusCode = $this->getExceptionStatusCode($exception);
        $logLevel = $statusCode >= 500 ? 'error' : 'warning';

        Log::$logLevel("Service error: {$operation}", $logContext);
    }

    /**
     * Log a security event
     * 
     * @param string $event The security event description
     * @param array $context Additional context information
     * @return void
     */
    protected function logSecurityEvent(string $event, array $context = []): void
    {
        $request = request();
        
        $logContext = array_merge([
            'event' => $event,
            'timestamp' => now()->toIso8601String(),
        ], $context);

        // Add request context if available
        if ($request) {
            $logContext['ip'] = $request->ip();
            $logContext['userAgent'] = $request->userAgent();
            $logContext['userId'] = $request->user()?->id ?? null;
        }

        Log::channel('security')->info($event, $logContext);
    }

    /**
     * Get HTTP status code from exception
     * 
     * @param Throwable $exception
     * @return int
     */
    protected function getExceptionStatusCode(Throwable $exception): int
    {
        if (method_exists($exception, 'getStatusCode')) {
            return $exception->getStatusCode();
        }

        if ($exception instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
            return 404;
        }

        if ($exception instanceof \Illuminate\Auth\AuthenticationException) {
            return 401;
        }

        if ($exception instanceof \Illuminate\Auth\Access\AuthorizationException) {
            return 403;
        }

        if ($exception instanceof \Illuminate\Validation\ValidationException) {
            return 400;
        }

        if ($exception instanceof \Illuminate\Database\QueryException) {
            return 400;
        }

        return 500;
    }
}
