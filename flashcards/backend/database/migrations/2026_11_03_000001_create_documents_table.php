<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Text extracted from uploaded PDFs. The file itself is not kept.
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->char('sha256', 64)->unique();
            $table->string('filename');
            $table->string('title')->nullable();
            $table->unsignedInteger('page_count');
            $table->json('sentences');
            // PdfTextExtractor::VERSION that produced the sentences.
            $table->unsignedSmallInteger('extractor_version');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
