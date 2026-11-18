<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class HomeFeatureSchema
{
    public static function ensure(): void
    {
        if (!Schema::hasTable('home_features')) {
            Schema::create('home_features', function (Blueprint $table) {
                $table->id();
                $table->string('kind', 20);
                $table->string('subject', 200);
                $table->unsignedTinyInteger('sortOrder');
                $table->timestamp('createdAt')->nullable();
                $table->timestamp('updatedAt')->nullable();
                $table->unique(['kind', 'subject']);
            });
        }
    }
}
