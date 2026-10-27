<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('blog', 'visibility')) {
            return;
        }

        Schema::table('blog', function (Blueprint $table) {
            $table->string('visibility', 20)->default('public');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('blog', 'visibility')) {
            return;
        }

        Schema::table('blog', function (Blueprint $table) {
            $table->dropColumn('visibility');
        });
    }
};
