<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Illuminate\Support\Facades\Log;

/**
 * JwtAuthenticateMiddleware
 * 
 * Middleware for JWT token validation. Extracts JWT from Authorization Bearer header,
 * validates token signature and expiration, loads user from database, and attaches to request.
 * Returns 401 Unauthorized on validation failure.
 * 
 * Requirements: 2.3, 19.1
 */
class JwtAuthenticateMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            // Extract token from Authorization header
            $token = $this->extractToken($request);

            if (!$token) {
                return $this->unauthorizedResponse('Token not provided');
            }

            // Set the token for JWTAuth
            JWTAuth::setToken($token);

            // Authenticate and get the user
            $user = JWTAuth::authenticate();

            if (!$user) {
                return $this->unauthorizedResponse('User not found');
            }

            // Attach user to request
            $request->setUserResolver(function () use ($user) {
                return $user;
            });

            return $next($request);

        } catch (TokenExpiredException $e) {
            Log::channel('security')->warning('JWT token expired', [
                'ipAddress' => $request->ip(),
                'userAgent' => $request->header('User-Agent'),
                'timestamp' => now()->toIso8601String(),
            ]);

            return $this->unauthorizedResponse('Token has expired');

        } catch (TokenInvalidException $e) {
            Log::channel('security')->warning('JWT token invalid', [
                'ipAddress' => $request->ip(),
                'userAgent' => $request->header('User-Agent'),
                'timestamp' => now()->toIso8601String(),
            ]);

            return $this->unauthorizedResponse('Token is invalid');

        } catch (JWTException $e) {
            Log::channel('security')->warning('JWT authentication failed', [
                'error' => $e->getMessage(),
                'ipAddress' => $request->ip(),
                'userAgent' => $request->header('User-Agent'),
                'timestamp' => now()->toIso8601String(),
            ]);

            return $this->unauthorizedResponse('Token authentication failed');

        } catch (\Exception $e) {
            Log::channel('security')->error('Unexpected error during JWT authentication', [
                'error' => $e->getMessage(),
                'ipAddress' => $request->ip(),
                'userAgent' => $request->header('User-Agent'),
                'timestamp' => now()->toIso8601String(),
            ]);

            return $this->unauthorizedResponse('Authentication error');
        }
    }

    /**
     * Extract JWT token from Authorization Bearer header
     *
     * @param Request $request
     * @return string|null
     */
    protected function extractToken(Request $request): ?string
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader) {
            return null;
        }

        // Check if it's a Bearer token
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Return unauthorized response
     *
     * @param string $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function unauthorizedResponse(string $message)
    {
        return response()->json([
            'statusCode' => 401,
            'message' => $message,
            'timestamp' => now()->toIso8601String(),
        ], 401);
    }
}
