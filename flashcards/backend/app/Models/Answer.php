<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Answer extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'question_id',
        'choice_index',
        'is_correct',
        'answered_at',
    ];

    protected function casts(): array
    {
        return [
            'choice_index' => 'integer',
            'is_correct' => 'boolean',
            'answered_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Question, $this>
     */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
