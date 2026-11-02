<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Games are created from live pages through the API, so there is no
     * seed data. The seeder exists so `php artisan migrate --seed` works.
     */
    public function run(): void
    {
        //
    }
}
