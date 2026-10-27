<?php

use App\Models\BlogPost;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        BlogPost::ensureContentCapacity();
    }

    public function down(): void
    {
        // Shrinking the column would cut off posts that already use the extra room.
    }
};
