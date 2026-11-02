<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('contact_submissions')) {
            return;
        }

        Schema::create('contact_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('email', 255);
            $table->text('message');
            $table->timestamp('createdAt', 6)->useCurrent();
            $table->index('createdAt');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_submissions');
    }
};
