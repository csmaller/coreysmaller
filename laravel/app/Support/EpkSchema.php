<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class EpkSchema
{
    public static function ensure(): void
    {
        if (!Schema::hasTable('epk_profiles')) {
            Schema::create('epk_profiles', function (Blueprint $table) {
                $table->id();
                $table->text('bio')->nullable();
                $table->string('contactEmail')->nullable();
                $table->string('contactPhone')->nullable();
                $table->string('location')->nullable();
                $table->text('contactNote')->nullable();
                $table->timestamp('createdAt')->nullable();
                $table->timestamp('updatedAt')->nullable();
            });
        }

        if (Schema::hasTable('epk_profiles') && !Schema::hasColumn('epk_profiles', 'gear')) {
            Schema::table('epk_profiles', function (Blueprint $table) {
                $table->text('gear')->nullable();
            });
        }

        if (!Schema::hasTable('epk_images')) {
            Schema::create('epk_images', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('filename');
                $table->string('alt')->nullable();
                $table->boolean('isMain')->default(false);
                $table->unsignedInteger('sortOrder')->default(0);
                $table->timestamp('createdAt')->nullable();
                $table->timestamp('updatedAt')->nullable();
            });
        }

        if (!Schema::hasTable('epk_songs')) {
            Schema::create('epk_songs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('title', 200);
                $table->string('artist', 200)->nullable();
                $table->unsignedInteger('sortOrder')->default(0);
                $table->timestamp('createdAt')->nullable();
                $table->timestamp('updatedAt')->nullable();
            });
        }

        if (Schema::hasTable('epk_songs') && !Schema::hasColumn('epk_songs', 'artist')) {
            Schema::table('epk_songs', function (Blueprint $table) {
                $table->string('artist', 200)->nullable();
            });
        }

        foreach (['video', 'audio'] as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'includeInEpk')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->boolean('includeInEpk')->default(false);
                });
            }
        }
    }
}
