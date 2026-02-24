<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin user already exists
        $existingUser = User::where('email', 'coreysmaller@gmail.com')->first();
        
        if ($existingUser) {
            $this->command->info('Admin user already exists. Skipping...');
            return;
        }

        // Create admin user
        User::create([
            'email' => 'coreysmaller@gmail.com',
            'password' => Hash::make('Vi$ions1'),
            'role' => 'admin',
        ]);

        $this->command->info('Admin user created successfully!');
    }
}
