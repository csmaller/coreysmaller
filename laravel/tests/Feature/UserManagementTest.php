<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(string $role, string $email = 'owner@example.com'): string
    {
        $user = User::create([
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => $role,
        ]);

        return auth('api')->login($user);
    }

    public function test_admin_can_list_users(): void
    {
        User::create([
            'email' => 'guest@example.com',
            'password' => Hash::make('password123'),
            'role' => 'guest',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenFor('admin'),
        ])->getJson('/api/auth/users');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $emails = collect($response->json('data'))->pluck('email')->all();
        $this->assertEqualsCanonicalizing(
            ['owner@example.com', 'guest@example.com'],
            $emails
        );
        $this->assertArrayNotHasKey('password', $response->json('data.0'));
    }

    public function test_guest_and_anonymous_callers_cannot_list_users(): void
    {
        $this->getJson('/api/auth/users')->assertUnauthorized();

        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenFor('guest'),
        ])->getJson('/api/auth/users')
            ->assertForbidden()
            ->assertJsonPath('message', 'Only an admin can do that.');
    }

    public function test_admin_can_create_a_guest_account(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenFor('admin'),
        ])->postJson('/api/auth/users', [
            'email' => 'new-guest@example.com',
            'password' => 'long-password-1',
            'role' => 'guest',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'new-guest@example.com')
            ->assertJsonPath('data.role', 'guest');

        $this->assertDatabaseHas('users', [
            'email' => 'new-guest@example.com',
            'role' => 'guest',
        ]);
    }

    public function test_create_user_rejects_short_passwords_and_duplicate_emails(): void
    {
        $headers = [
            'Authorization' => 'Bearer ' . $this->tokenFor('admin'),
        ];

        $this->withHeaders($headers)->postJson('/api/auth/users', [
            'email' => 'new-guest@example.com',
            'password' => 'short',
            'role' => 'guest',
        ])->assertStatus(400)
            ->assertJsonPath('message', 'The password must be at least 12 characters.');

        $this->withHeaders($headers)->postJson('/api/auth/users', [
            'email' => 'owner@example.com',
            'password' => 'long-password-1',
            'role' => 'admin',
        ])->assertStatus(400)
            ->assertJsonPath('message', 'The email has already been taken.');
    }
}
