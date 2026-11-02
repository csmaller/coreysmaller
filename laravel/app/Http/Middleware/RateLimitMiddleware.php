<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * RateLimitMiddleware
 * 
 * Custom rate limiting middleware for API endpoints.
 * Prevents brute force attacks and API abuse.
 */
class RateLimitMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $limiterName
     */
    public function handle(Request $request, Closure $next, string $limiterName = 'api'): Response
    {
        $key = $this->resolveRequestSignature($request, $limiterName);
        
        $maxAttempts = $this->getMaxAttempts($limiterName);
        $decayMinutes = $this->getDecayMinutes($limiterName);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            
            return response()->json([
                'statusCode' => 429,
                'message' => 'Too many requests. Please try again later.',
                'retryAfter' => $seconds,
                'timestamp' => now()->toIso8601String(),
            ], 429)->header('Retry-After', $seconds);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        return $this->addRateLimitHeaders($response, $maxAttempts, $key);
    }

    /**
     * Resolve the request signature for rate limiting
     */
    protected function resolveRequestSignature(Request $request, string $limiterName): string
    {
        $user = $request->user();
        
        if ($user) {
            return sprintf('%s:%s:%s', $limiterName, $user->id, $request->ip());
        }

        return sprintf('%s:%s', $limiterName, $request->ip());
    }

    /**
     * Get max attempts for the limiter
     */
    protected function getMaxAttempts(string $limiterName): int
    {
        return match($limiterName) {
            'auth' => 5,      // 5 login attempts
            'contact' => 5,   // 5 contact form submissions
            'api' => 60,      // 60 API requests
            'write' => 30,    // 30 write operations
            default => 60,
        };
    }

    /**
     * Get decay minutes for the limiter
     */
    protected function getDecayMinutes(string $limiterName): int
    {
        return match($limiterName) {
            'auth' => 15,     // 15 minute lockout
            'contact' => 15,  // 15 minute window
            'api' => 1,       // 1 minute window
            'write' => 1,     // 1 minute window
            default => 1,
        };
    }

    /**
     * Add rate limit headers to response
     */
    protected function addRateLimitHeaders(Response $response, int $maxAttempts, string $key): Response
    {
        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', max(0, $maxAttempts - RateLimiter::attempts($key)));

        return $response;
    }
}
