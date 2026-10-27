<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->string('path', 255);
            $table->timestamp('createdAt', 6)->useCurrent();
            $table->index('createdAt');
            $table->index('path');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
