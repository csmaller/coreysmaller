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
        'volume',
        'volumeDescription',
        'chapterOrder',
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
        return self::plainWordCount($this->content);
    }

    /**
     * Words in the visible post body. Tags and extra whitespace do not count.
     */
    public static function plainWordCount(?string $html): int
    {
        $withBreaks = preg_replace('/<(br|\/p|\/div|\/li|\/h[1-6]|\/blockquote)\b[^>]*>/i', ' ', (string) $html) ?? (string) $html;
        $text = html_entity_decode(strip_tags($withBreaks), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = str_replace("\xc2\xa0", ' ', $text);
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
        $text = trim($text);
        if ($text === '') {
            return 0;
        }

        $words = preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY);

        return is_array($words) ? count($words) : 0;
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
        static::ensureVolumeColumns();

        $ready = true;
    }

    /**
     * Group related posts under a volume title and remember their reading order.
     */
    public static function ensureVolumeColumns(): void
    {
        if (!Schema::hasColumn('blog', 'volume')) {
            Schema::table('blog', function (Blueprint $table) {
                $table->string('volume', 160)->nullable();
            });
        }

        if (!Schema::hasColumn('blog', 'chapterOrder')) {
            Schema::table('blog', function (Blueprint $table) {
                $table->unsignedInteger('chapterOrder')->default(0);
            });
        }

        if (!Schema::hasColumn('blog', 'volumeDescription')) {
            Schema::table('blog', function (Blueprint $table) {
                $table->text('volumeDescription')->nullable();
            });
        }
    }

    /**
     * Turn a tag field into one trimmed name per entry.
     * Commas separate tags. A leading # is display-only and is not stored.
     *
     * @return array<int, string>
     */
    public static function parseTags(mixed $tags): array
    {
        if (is_string($tags)) {
            $decoded = json_decode($tags, true);
            $tags = is_array($decoded) ? $decoded : explode(',', $tags);
        }

        if (!is_array($tags)) {
            return [];
        }

        $clean = [];
        foreach ($tags as $tag) {
            foreach (explode(',', (string) $tag) as $piece) {
                $piece = trim(ltrim(trim($piece), '#'));
                if ($piece === '') {
                    continue;
                }
                $piece = mb_substr($piece, 0, 255);
                if (!in_array($piece, $clean, true)) {
                    $clean[] = $piece;
                }
            }
        }

        return $clean;
    }

    /**
     * The original column is TEXT, about 64KB. MEDIUMTEXT is the next size
     * and holds more than twice that.
     */
    public static function ensureContentCapacity(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

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
