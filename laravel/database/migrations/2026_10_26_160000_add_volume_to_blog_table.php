<?php

use App\Models\BlogPost;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        BlogPost::ensureVolumeColumns();
    }

    public function down(): void
    {
        // Leave the columns in place so existing chapter order is not discarded.
    }
};
