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
     * Creates the video table matching the NestJS/TypeORM schema.
     * Requirements: 3.5, 18.4
     */
    public function up(): void
    {
        Schema::create('video', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('youtubeUrl', 2048);
            $table->string('youtubeId', 20)->nullable()->unique();
            $table->string('thumbnail', 2048)->nullable();
            $table->unsignedInteger('duration')->nullable();
            $table->unsignedInteger('viewCount')->default(0);
            $table->timestamp('createdAt', 6)->useCurrent();
            $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();
            
            // Index on viewCount
            $table->index('viewCount');
            // Unique index on youtubeId (unique constraint already creates an index)
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE video ADD CONSTRAINT video_title_not_empty CHECK (title != \'\')');
            DB::statement('ALTER TABLE video ADD CONSTRAINT video_youtube_url_format CHECK (youtubeUrl LIKE \'https://www.youtube.com/%\' OR youtubeUrl LIKE \'https://youtu.be/%\')');
            DB::statement('ALTER TABLE video ADD CONSTRAINT video_duration_positive CHECK (duration IS NULL OR duration > 0)');
            DB::statement('ALTER TABLE video ADD CONSTRAINT video_viewcount_nonnegative CHECK (viewCount >= 0)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('video');
    }
};
