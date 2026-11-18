<?php

use App\Support\HomeSchema;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        HomeSchema::ensure();
    }

    public function down(): void
    {
        Schema::dropIfExists('home_pages');
    }
};
