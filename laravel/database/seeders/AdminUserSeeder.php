<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    /**
     * Create the first administrator from environment variables.
     * Set ADMIN_EMAIL and ADMIN_PASSWORD locally. Do not commit them.
     */
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if (!is_string($email) || $email === '' || !is_string($password) || strlen($password) < 12) {
            $this->command->warn('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters to seed an admin user.');
            return;
        }

        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            $this->command->info('Admin user already exists. Skipping...');
            return;
        }

        User::create([
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
        ]);

        $this->command->info('Admin user created successfully!');
    }
}
