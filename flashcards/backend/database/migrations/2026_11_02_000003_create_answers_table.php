<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            // Unique, so each question can be answered only once.
            $table->foreignId('question_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('choice_index');
            $table->boolean('is_correct');
            $table->timestamp('answered_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answers');
    }
};
