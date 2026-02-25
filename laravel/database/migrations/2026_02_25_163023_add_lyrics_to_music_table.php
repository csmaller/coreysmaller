<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('music', function (Blueprint $table) {
            // Add lyrics column as TEXT (can store large content)
            $table->text('lyrics')->nullable()->after('description');
            
            // Make audioUrl nullable
            $table->string('audioUrl', 2048)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('music', function (Blueprint $table) {
            $table->dropColumn('lyrics');
            
            // Revert audioUrl to NOT NULL
            $table->string('audioUrl', 2048)->nullable(false)->change();
        });
    }
};
