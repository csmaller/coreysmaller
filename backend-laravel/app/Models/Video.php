<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Video Model
 * 
 * Eloquent model for the video table matching the NestJS/TypeORM schema.
 * Uses UUID as primary key with automatic generation on creation.
 * Manages YouTube video information including URL, video ID, and view count.
 * 
 * Requirements: 3.5, 3.9, 9.1
 */
class Video extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'video';

    /**
     * The primary key type.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

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
        'description',
        'youtubeUrl',
        'youtubeId',
        'thumbnail',
        'duration',
        'viewCount',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'duration' => 'integer',
        'viewCount' => 'integer',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['thumbnail'];

    /**
     * Get the thumbnail URL for the video.
     * Generates YouTube thumbnail URL from youtubeId if not explicitly set.
     *
     * @return string|null
     */
    public function getThumbnailAttribute($value)
    {
        // Return explicit thumbnail if set
        if ($value) {
            return $value;
        }

        // Generate YouTube thumbnail URL from youtubeId
        if ($this->youtubeId) {
            return "https://img.youtube.com/vi/{$this->youtubeId}/maxresdefault.jpg";
        }

        return null;
    }

    /**
     * Boot the model and set up event listeners.
     */
    protected static function boot()
    {
        parent::boot();

        // Automatically generate UUID on creation
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
