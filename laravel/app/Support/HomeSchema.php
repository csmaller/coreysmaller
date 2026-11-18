<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class HomeSchema
{
    public const ABOUT = 'Corey Smaller plays music, skis, and writes about both. He grew up in Massachusetts, lived in Utah from 2006, and moved to Edwards, Colorado in 2026.';

    public const WRITING = 'The essays on this site are the outlet. He writes them the same way he writes lyrics: to find out what he actually thinks. The subjects are the music, the mountains, and a life spent between the two.';

    public static function ensure(): void
    {
        if (!Schema::hasTable('home_pages')) {
            Schema::create('home_pages', function (Blueprint $table) {
                $table->id();
                $table->text('about')->nullable();
                $table->text('writing')->nullable();
                $table->timestamp('createdAt')->nullable();
                $table->timestamp('updatedAt')->nullable();
            });
        }
    }
}
