<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'position',
        'prompt',
        'options',
        'correct_index',
        'source_sentence',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'options' => 'array',
            'correct_index' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Game, $this>
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * @return HasOne<Answer, $this>
     */
    public function answer(): HasOne
    {
        return $this->hasOne(Answer::class);
    }
}
