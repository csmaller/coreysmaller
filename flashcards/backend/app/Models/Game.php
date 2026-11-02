<?php

namespace App\Models;

use App\Enums\GameSource;
use App\Enums\GameStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Game extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'source_type',
        'document_id',
        'source_name',
        'url',
        'url_hash',
        'source_title',
        'length',
        'score',
        'correct_count',
        'current_streak',
        'best_streak',
        'status',
    ];

    protected $attributes = [
        'source_type' => 'url',
        'score' => 0,
        'correct_count' => 0,
        'current_streak' => 0,
        'best_streak' => 0,
        'status' => 'in_progress',
    ];

    protected function casts(): array
    {
        return [
            'length' => 'integer',
            'score' => 'integer',
            'correct_count' => 'integer',
            'current_streak' => 'integer',
            'best_streak' => 'integer',
            'status' => GameStatus::class,
            'source_type' => GameSource::class,
        ];
    }

    /**
     * @return HasMany<Question, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('position');
    }

    /**
     * @return BelongsTo<Document, $this>
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * @return HasManyThrough<Answer, Question, $this>
     */
    public function answers(): HasManyThrough
    {
        return $this->hasManyThrough(Answer::class, Question::class);
    }

    public function isCompleted(): bool
    {
        return $this->status === GameStatus::Completed;
    }
}
