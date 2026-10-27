<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $existing = DB::selectOne("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'video' AND CONSTRAINT_NAME = 'video_youtube_url_format'");
        if ($existing) {
            DB::statement('ALTER TABLE video DROP CONSTRAINT video_youtube_url_format');
        }

        DB::statement("ALTER TABLE video ADD CONSTRAINT video_youtube_url_format CHECK (youtubeUrl LIKE 'https://www.youtube.com/%' OR youtubeUrl LIKE 'https://youtu.be/%' OR youtubeUrl LIKE 'https://www.instagram.com/%' OR youtubeUrl LIKE 'https://instagram.com/%')");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE video DROP CONSTRAINT video_youtube_url_format');
        DB::statement("ALTER TABLE video ADD CONSTRAINT video_youtube_url_format CHECK (youtubeUrl LIKE 'https://www.youtube.com/%' OR youtubeUrl LIKE 'https://youtu.be/%')");
    }
};
