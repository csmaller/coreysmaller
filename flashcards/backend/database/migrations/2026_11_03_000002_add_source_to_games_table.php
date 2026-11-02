<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->enum('source_type', ['url', 'pdf'])->default('url');
            $table->foreignUuid('document_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source_name')->nullable();
            $table->string('url', 2048)->nullable()->change();
            $table->char('url_hash', 64)->nullable()->change();
        });
    }

    public function down(): void
    {
        // url and url_hash stay nullable: PDF games have no URL.
        Schema::table('games', function (Blueprint $table) {
            $table->dropConstrainedForeignId('document_id');
            $table->dropColumn(['source_type', 'source_name']);
        });
    }
};
