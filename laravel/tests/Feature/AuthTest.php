<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Registration is not a public endpoint. A caller cannot create an account or choose a role.
     */
    public function test_guest_cannot_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'test@example.com',
            'password' => 'password123456',
            'role' => 'admin',
        ]);

        $response->assertNotFound();

        $this->assertDatabaseMissing('users', [
            'email' => 'test@example.com',
        ]);
    }

    /**
     * Test user login with valid credentials
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        // Create a user
        $user = User::create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'access_token',
                    'session_id',
                    'user' => [
                        'id',
                        'email',
                        'role',
                    ],
                ],
                'statusCode',
                'timestamp',
            ]);
    }

    /**
     * Test user login with invalid credentials
     */
    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'statusCode' => 401,
                'message' => 'Invalid credentials',
            ]);
    }

    /**
     * Test authenticated user can access profile
     */
    public function test_authenticated_user_can_access_profile(): void
    {
        // Create a user
        $user = User::create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // Login to get token
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('data.access_token');

        // Access profile with token
        $response = $this->getJson('/api/auth/profile', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'email',
                    'role',
                    'createdAt',
                    'updatedAt',
                ],
                'statusCode',
                'timestamp',
            ]);
    }

    /**
     * Test unauthenticated user cannot access profile
     */
    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/auth/profile');

        $response->assertStatus(401);
    }

    /**
     * Test user can logout
     */
    public function test_user_can_logout(): void
    {
        // Create a user
        $user = User::create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // Login to get token
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('data.access_token');

        // Logout
        $response = $this->postJson('/api/auth/logout', [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'message' => 'Logged out successfully',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test user can logout from all sessions
     */
    public function test_user_can_logout_from_all_sessions(): void
    {
        // Create a user
        $user = User::create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // Login to get token
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('data.access_token');

        // Logout all
        $response = $this->postJson('/api/auth/logout-all', [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'message' => 'All sessions logged out successfully',
                ],
                'statusCode' => 200,
            ]);
    }
}
