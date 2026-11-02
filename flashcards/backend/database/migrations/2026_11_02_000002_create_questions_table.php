<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('game_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->text('prompt');
            $table->json('options');
            $table->unsignedTinyInteger('correct_index');
            $table->text('source_sentence');
            $table->timestamps();

            $table->unique(['game_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
