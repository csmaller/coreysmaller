<?php

use App\Support\HomeFeatureSchema;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        HomeFeatureSchema::ensure();
    }

    public function down(): void
    {
        Schema::dropIfExists('home_features');
    }
};
