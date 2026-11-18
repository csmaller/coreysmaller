<?php

use App\Support\EpkSchema;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        EpkSchema::ensure();
    }

    public function down(): void
    {
        Schema::dropIfExists('epk_songs');
        Schema::dropIfExists('epk_images');
        Schema::dropIfExists('epk_profiles');

        foreach (['video', 'audio'] as $table) {
            if (Schema::hasColumn($table, 'includeInEpk')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropColumn('includeInEpk');
                });
            }
        }
    }
};
