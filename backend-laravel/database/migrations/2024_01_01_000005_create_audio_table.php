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
     * Creates the audio table matching the NestJS/TypeORM schema.
     * Requirements: 3.6, 18.5
     */
    public function up(): void
    {
        Schema::create('audio', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('soundcloudUrl', 2048);
            $table->string('soundcloudId', 100)->nullable()->unique();
            $table->string('artwork', 2048)->nullable();
            $table->unsignedInteger('duration')->nullable();
            $table->unsignedInteger('playCount')->default(0);
            $table->timestamp('createdAt', 6)->useCurrent();
            $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();
            
            // Index on playCount
            $table->index('playCount');
            // Unique index on soundcloudId (unique constraint already creates an index)
        });

        // Add CHECK constraints (MySQL 8.0.16+)
        DB::statement('ALTER TABLE audio ADD CONSTRAINT audio_title_not_empty CHECK (title != \'\')');
        DB::statement('ALTER TABLE audio ADD CONSTRAINT audio_soundcloud_url_format CHECK (soundcloudUrl LIKE \'https://soundcloud.com/%\')');
        DB::statement('ALTER TABLE audio ADD CONSTRAINT audio_duration_positive CHECK (duration IS NULL OR duration > 0)');
        DB::statement('ALTER TABLE audio ADD CONSTRAINT audio_playcount_nonnegative CHECK (playCount >= 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audio');
    }
};
