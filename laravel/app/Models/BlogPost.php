<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * BlogPost Model
 * 
 * Eloquent model for the blog table matching the NestJS/TypeORM schema.
 * Includes computed attributes for reading time, word count, and published status.
 * Automatically sets publishedAt when status changes to published.
 * 
 * Requirements: 3.3, 7.11
 */
class BlogPost extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'blog';

    /**
     * The primary key type.
     *
     * @var string
     */
    protected $keyType = 'int';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * The name of the "created at" column.
     *
     * @var string
     */
    const CREATED_AT = 'createdAt';

    /**
     * The name of the "updated at" column.
     *
     * @var string
     */
    const UPDATED_AT = 'updatedAt';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'content',
        'excerpt',
        'featuredImage',
        'tags',
        'status',
        'visibility',
        'slug',
        'publishedAt',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tags' => 'array',
        'publishedAt' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'readingTimeMinutes',
        'wordCount',
        'isPublished',
    ];

    /**
     * Get the reading time in minutes (computed attribute).
     * Assumes average reading speed of 200 words per minute.
     *
     * @return int
     */
    public function getReadingTimeMinutesAttribute(): int
    {
        $wordCount = str_word_count($this->content ?? '');
        return (int) ceil($wordCount / 200);
    }

    /**
     * Get the word count (computed attribute).
     *
     * @return int
     */
    public function getWordCountAttribute(): int
    {
        return str_word_count($this->content ?? '');
    }

    /**
     * Check if the blog post is published (computed attribute).
     *
     * @return bool
     */
    public function getIsPublishedAttribute(): bool
    {
        return $this->status === 'published';
    }

    /**
     * Add the visibility column on hosts where the migration has not been run.
     */
    public static function ensureVisibilityColumn(): void
    {
        static $ready = false;
        if ($ready) {
            return;
        }

        if (!Schema::hasColumn('blog', 'visibility')) {
            Schema::table('blog', function (Blueprint $table) {
                $table->string('visibility', 20)->default('public');
            });
        }

        static::ensureContentCapacity();

        $ready = true;
    }

    /**
     * The original column is TEXT, about 64KB. MEDIUMTEXT is the next size
     * and holds more than twice that.
     */
    public static function ensureContentCapacity(): void
    {
        $column = DB::selectOne(
            'SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            ['blog', 'content']
        );

        if ($column && strtolower((string) $column->DATA_TYPE) === 'text') {
            DB::statement('ALTER TABLE blog MODIFY content MEDIUMTEXT NOT NULL');
        }
    }

    /**
     * Public readers see published public posts.
     * Guests see published public and private posts.
     * Admins see every post, including drafts.
     */
    public function isVisibleTo(string $audience): bool
    {
        if ($audience === 'admin') {
            return true;
        }

        if ($this->status !== 'published') {
            return false;
        }

        if ($audience === 'member') {
            return true;
        }

        return ($this->visibility ?? 'public') === 'public';
    }

    /**
     * Boot the model and set up event listeners.
     */
    protected static function boot()
    {
        parent::boot();

        // Automatically set publishedAt when status changes to published
        static::saving(function ($blogPost) {
            if (!$blogPost->visibility) {
                $blogPost->visibility = 'public';
            }

            if ($blogPost->isDirty('status') && $blogPost->status === 'published' && !$blogPost->publishedAt) {
                $blogPost->publishedAt = now();
            }
        });
    }
}
