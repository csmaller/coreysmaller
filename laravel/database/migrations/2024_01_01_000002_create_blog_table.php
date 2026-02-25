<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the blog table matching the NestJS/TypeORM schema.
     * Requirements: 3.3, 18.2
     */
    public function up(): void
    {
        Schema::create('blog', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('content');
            $table->string('excerpt', 500)->nullable();
            $table->string('featuredImage', 2048)->nullable();
            $table->text('tags')->nullable();
            $table->string('status', 20)->default('published');
            $table->string('slug', 100)->nullable()->unique();
            $table->timestamp('createdAt', 6)->useCurrent();
            $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('publishedAt')->nullable();
            
            // Composite index on status and publishedAt
            $table->index(['status', 'publishedAt']);
            // Index on slug (unique constraint already creates an index)
        });

        // Add CHECK constraints (MySQL 8.0.16+)
        DB::statement('ALTER TABLE blog ADD CONSTRAINT blog_title_not_empty CHECK (title != \'\')');
        DB::statement('ALTER TABLE blog ADD CONSTRAINT blog_content_not_empty CHECK (content != \'\')');
        DB::statement('ALTER TABLE blog ADD CONSTRAINT blog_status_valid CHECK (status IN (\'draft\', \'published\', \'archived\'))');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blog');
    }
};
