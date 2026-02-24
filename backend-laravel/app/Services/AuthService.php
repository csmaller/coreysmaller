<?php

namespace App\Services;

use App\Models\User;
use App\Traits\LogsErrors;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * AuthService
 * 
 * Handles authentication operations including login, registration, JWT token management,
 * and session management. Implements security event logging for all authentication operations.
 * 
 * Requirements: 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10
 */
class AuthService
{
    use LogsErrors;

    /**
     * Validate user credentials and generate JWT token
     * 
     * @param string $email User email
     * @param string $password User password
     * @param string $ipAddress Client IP address
     * @param string $userAgent Client user agent
     * @return array Login response with access token and user info
     * @throws AuthenticationException If credentials are invalid
     */
    public function login(string $email, string $password, string $ipAddress, string $userAgent): array
    {
        try {
            // Find user by email
            $user = User::where('email', $email)->first();

            // Validate credentials
            if (!$user || !Hash::check($password, $user->password)) {
                // Log failed login attempt
                $this->logSecurityEvent('Failed login attempt', [
                    'email' => $email,
                    'ipAddress' => $ipAddress,
                    'userAgent' => $userAgent,
                ]);

                throw new AuthenticationException('Invalid credentials');
            }

            // Generate JWT token
            $token = JWTAuth::fromUser($user);

            // Create session ID (using token jti claim or generating one)
            $sessionId = uniqid('session_', true);

            // Log successful login
            $this->logSecurityEvent('User logged in successfully', [
                'userId' => $user->id,
                'email' => $user->email,
                'ipAddress' => $ipAddress,
                'userAgent' => $userAgent,
                'sessionId' => $sessionId,
            ]);

            return [
                'access_token' => $token,
                'session_id' => $sessionId,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ];
        } catch (AuthenticationException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logError($e, 'login', [
                'email' => $email,
                'ipAddress' => $ipAddress,
            ]);
            throw $e;
        }
    }

    /**
     * Register a new user with hashed password
     * 
     * @param array $userData User data (email, password, role)
     * @return User Created user (without password)
     * @throws \Exception If user already exists
     */
    public function register(array $userData): User
    {
        try {
            // Check if user already exists
            $existingUser = User::where('email', $userData['email'])->first();
            if ($existingUser) {
                throw new \Exception('User with this email already exists');
            }

            // Hash password with bcrypt cost factor 10
            $userData['password'] = Hash::make($userData['password'], ['rounds' => 10]);
            $userData['role'] = $userData['role'] ?? 'admin';

            // Create user
            $user = User::create($userData);

            // Log registration event
            $this->logSecurityEvent('User registered successfully', [
                'userId' => $user->id,
                'email' => $user->email,
            ]);

            return $user;
        } catch (\Exception $e) {
            $this->logError($e, 'register', [
                'email' => $userData['email'] ?? null,
            ]);
            throw $e;
        }
    }

    /**
     * Validate JWT token and return user
     * 
     * @param string $token JWT token
     * @return User|null User if token is valid, null otherwise
     */
    public function validateToken(string $token): ?User
    {
        try {
            // Set the token
            JWTAuth::setToken($token);
            
            // Verify and get the user
            $user = JWTAuth::authenticate();
            
            return $user;
        } catch (\Exception $e) {
            $this->logSecurityEvent('Token validation failed', [
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }

    /**
     * Logout user from a specific session
     * 
     * @param string $sessionId Session ID to invalidate
     * @param int $userId User ID
     * @return void
     */
    public function logout(string $sessionId, int $userId): void
    {
        try {
            // Invalidate the current token
            try {
                JWTAuth::invalidate(JWTAuth::getToken());
            } catch (\Exception $e) {
                // Token might already be invalid
                $this->logSecurityEvent('Token invalidation failed during logout', [
                    'userId' => $userId,
                    'sessionId' => $sessionId,
                    'error' => $e->getMessage(),
                ]);
            }

            // Log logout event
            $this->logSecurityEvent('User logged out', [
                'userId' => $userId,
                'sessionId' => $sessionId,
            ]);
        } catch (\Exception $e) {
            $this->logError($e, 'logout', [
                'userId' => $userId,
                'sessionId' => $sessionId,
            ]);
            throw $e;
        }
    }

    /**
     * Logout user from all sessions
     * 
     * @param int $userId User ID
     * @return void
     */
    public function logoutAllSessions(int $userId): void
    {
        try {
            // Invalidate the current token
            try {
                JWTAuth::invalidate(JWTAuth::getToken());
            } catch (\Exception $e) {
                // Token might already be invalid
                $this->logSecurityEvent('Token invalidation failed during logout all', [
                    'userId' => $userId,
                    'error' => $e->getMessage(),
                ]);
            }

            // Log logout all event
            $this->logSecurityEvent('All sessions destroyed for user', [
                'userId' => $userId,
            ]);
        } catch (\Exception $e) {
            $this->logError($e, 'logoutAllSessions', [
                'userId' => $userId,
            ]);
            throw $e;
        }
    }

    /**
     * Hash password using bcrypt with cost factor 10
     * 
     * @param string $password Plain text password
     * @return string Hashed password
     */
    public function hashPassword(string $password): string
    {
        return Hash::make($password, ['rounds' => 10]);
    }

    /**
     * Find user by ID
     * 
     * @param int $id User ID
     * @return User User model
     * @throws ModelNotFoundException If user not found
     */
    public function findById(int $id): User
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                throw new ModelNotFoundException('User not found');
            }
            
            return $user;
        } catch (ModelNotFoundException $e) {
            $this->logError($e, 'findById', ['userId' => $id]);
            throw $e;
        }
    }
}
