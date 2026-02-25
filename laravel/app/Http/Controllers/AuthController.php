<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * AuthController
 * 
 * Handles authentication endpoints including login, register, profile, logout, and logout-all.
 * All endpoints return responses matching the NestJS backend format.
 * 
 * Requirements: 1.1, 2.2, 2.5, 2.6, 2.7, 2.8, 2.9
 */
class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Login endpoint
     * 
     * POST /api/auth/login
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }

        try {
            // Get client information
            $ipAddress = $request->ip() ?? 'unknown';
            $userAgent = $request->header('User-Agent') ?? 'unknown';

            // Attempt login
            $result = $this->authService->login(
                $request->input('email'),
                $request->input('password'),
                $ipAddress,
                $userAgent
            );

            return response()->json([
                'data' => $result,
                'success' => true,
            'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ], 200);
        } catch (AuthenticationException $e) {
            return response()->json([
                'statusCode' => 401,
                'message' => 'Invalid credentials',
                'timestamp' => now()->toIso8601String(),
            ], 401);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 500,
                'message' => 'Internal server error',
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }
    }

    /**
     * Register endpoint
     * 
     * POST /api/auth/register
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }

        try {
            $user = $this->authService->register($request->only(['email', 'password', 'role']));

            return response()->json([
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'createdAt' => $user->createdAt->toIso8601String(),
                    'updatedAt' => $user->updatedAt->toIso8601String(),
                ],
                'success' => true,
            'statusCode' => 201,
                'timestamp' => now()->toIso8601String(),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 409,
                'message' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 409);
        }
    }

    /**
     * Get authenticated user profile
     * 
     * GET /api/auth/profile
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function profile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'statusCode' => 401,
                    'message' => 'Unauthorized',
                    'timestamp' => now()->toIso8601String(),
                ], 401);
            }

            return response()->json([
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'createdAt' => $user->createdAt->toIso8601String(),
                    'updatedAt' => $user->updatedAt->toIso8601String(),
                ],
                'success' => true,
            'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 500,
                'message' => 'Internal server error',
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }
    }

    /**
     * Logout from current session
     * 
     * POST /api/auth/logout
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'statusCode' => 401,
                    'message' => 'Unauthorized',
                    'timestamp' => now()->toIso8601String(),
                ], 401);
            }

            $sessionId = $request->input('sessionId', 'default');
            $this->authService->logout($sessionId, $user->id);

            return response()->json([
                'data' => [
                    'message' => 'Logged out successfully',
                ],
                'success' => true,
            'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 500,
                'message' => 'Internal server error',
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }
    }

    /**
     * Logout from all sessions
     * 
     * POST /api/auth/logout-all
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logoutAll(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'statusCode' => 401,
                    'message' => 'Unauthorized',
                    'timestamp' => now()->toIso8601String(),
                ], 401);
            }

            $this->authService->logoutAllSessions($user->id);

            return response()->json([
                'data' => [
                    'message' => 'All sessions logged out successfully',
                ],
                'success' => true,
            'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 500,
                'message' => 'Internal server error',
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }
    }
}
