<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Stop new rows from becoming administrators when role is omitted.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY role VARCHAR(255) NOT NULL DEFAULT 'user'");
    }

    /**
     * Reverse the default role change.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY role VARCHAR(255) NOT NULL DEFAULT 'admin'");
    }
};
