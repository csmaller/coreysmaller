<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the music table matching the NestJS/TypeORM schema.
     * Requirements: 3.4, 18.3
     */
    public function up(): void
    {
        Schema::create('music', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('audioUrl', 2048)->nullable();
            $table->string('coverArt', 2048)->nullable();
            $table->string('genre', 50)->nullable();
            $table->unsignedInteger('duration')->nullable();
            $table->unsignedInteger('playCount')->default(0);
            $table->timestamp('createdAt', 6)->useCurrent();
            $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('releaseDate')->nullable();
            
            // Composite index on genre and releaseDate
            $table->index(['genre', 'releaseDate']);
            // Index on playCount
            $table->index('playCount');
        });

        // Add CHECK constraints (MySQL 8.0.16+)
        DB::statement('ALTER TABLE music ADD CONSTRAINT music_title_not_empty CHECK (title != \'\')');
        DB::statement('ALTER TABLE music ADD CONSTRAINT music_duration_positive CHECK (duration IS NULL OR duration > 0)');
        DB::statement('ALTER TABLE music ADD CONSTRAINT music_playcount_nonnegative CHECK (playCount >= 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('music');
    }
};
