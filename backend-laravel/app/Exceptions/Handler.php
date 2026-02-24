<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Custom error logging with context
            $this->logErrorWithContext($e);
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $e
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function render($request, Throwable $e)
    {
        // Only customize JSON responses for API routes
        if ($request->is('api/*') || $request->expectsJson()) {
            return $this->renderJsonException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Render exception as JSON response matching NestJS format.
     */
    protected function renderJsonException(Request $request, Throwable $e): JsonResponse
    {
        $statusCode = $this->getStatusCode($e);
        $message = $this->getMessage($e, $statusCode);
        $details = $this->getDetails($e);

        $response = [
            'statusCode' => $statusCode,
            'timestamp' => now()->toIso8601String(),
            'path' => $request->path(),
            'message' => $message,
        ];

        // Add validation errors if present
        if ($e instanceof ValidationException) {
            $response['errors'] = $this->formatValidationErrors($e);
        }

        // Add details if present
        if ($details !== null) {
            $response['details'] = $details;
        }

        // Add exception name in development
        if (config('app.debug')) {
            $response['exception'] = get_class($e);
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Get HTTP status code from exception.
     */
    protected function getStatusCode(Throwable $e): int
    {
        if ($e instanceof ValidationException) {
            return 400;
        }

        if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
            return 404;
        }

        if ($e instanceof AuthenticationException) {
            return 401;
        }

        if ($e instanceof AuthorizationException) {
            return 403;
        }

        if ($e instanceof QueryException) {
            return 400;
        }

        if ($e instanceof HttpException) {
            return $e->getStatusCode();
        }

        if (method_exists($e, 'getStatusCode')) {
            return $e->getStatusCode();
        }

        return 500;
    }

    /**
     * Get error message from exception.
     */
    protected function getMessage(Throwable $e, int $statusCode): string
    {
        // Validation exceptions
        if ($e instanceof ValidationException) {
            return 'Validation failed';
        }

        // Not found exceptions
        if ($e instanceof ModelNotFoundException) {
            return 'Resource not found';
        }

        if ($e instanceof NotFoundHttpException) {
            return 'Not found';
        }

        // Authentication exceptions
        if ($e instanceof AuthenticationException) {
            return $e->getMessage() ?: 'Unauthenticated';
        }

        // Authorization exceptions
        if ($e instanceof AuthorizationException) {
            return 'Forbidden';
        }

        // Database exceptions
        if ($e instanceof QueryException) {
            return config('app.debug') 
                ? 'Database operation failed: ' . $e->getMessage()
                : 'Database operation failed';
        }

        // HTTP exceptions
        if ($e instanceof HttpException) {
            return $e->getMessage() ?: 'An error occurred';
        }

        // Generic exceptions - sanitize in production
        if ($statusCode >= 500) {
            return config('app.debug') 
                ? $e->getMessage() 
                : 'Internal server error';
        }

        return $e->getMessage() ?: 'An error occurred';
    }

    /**
     * Get additional details from exception.
     */
    protected function getDetails(Throwable $e): ?string
    {
        // Only include stack traces in development
        if (config('app.debug') && $e instanceof \Exception) {
            return $e->getTraceAsString();
        }

        // Include database error details in development
        if (config('app.debug') && $e instanceof QueryException) {
            return $e->getMessage();
        }

        return null;
    }

    /**
     * Format validation errors to match NestJS format.
     */
    protected function formatValidationErrors(ValidationException $e): array
    {
        $errors = [];
        
        foreach ($e->errors() as $field => $messages) {
            foreach ($messages as $message) {
                $errors[] = $message;
            }
        }

        return $errors;
    }

    /**
     * Log error with context information.
     */
    protected function logErrorWithContext(Throwable $e): void
    {
        $request = request();
        
        if (!$request) {
            return;
        }

        $statusCode = $this->getStatusCode($e);
        $logLevel = $statusCode >= 500 ? 'error' : 'warning';

        $context = [
            'statusCode' => $statusCode,
            'timestamp' => now()->toIso8601String(),
            'path' => $request->path(),
            'method' => $request->method(),
            'userAgent' => $request->userAgent(),
            'ip' => $request->ip(),
            'userId' => $request->user()?->id ?? null,
            'exception' => get_class($e),
        ];

        // Add stack trace in development
        if (config('app.debug')) {
            $context['stack'] = $e->getTraceAsString();
        }

        // Add query details for database errors
        if ($e instanceof QueryException && config('app.debug')) {
            $context['query'] = $e->getSql();
            $context['bindings'] = $e->getBindings();
        }

        $message = sprintf(
            '%s %s - %d - %s',
            $request->method(),
            $request->path(),
            $statusCode,
            $e->getMessage()
        );

        \Log::$logLevel($message, $context);
    }
}
