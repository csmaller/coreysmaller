<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Sentences extracted from an uploaded PDF, kept so a player can replay the
 * document or pick a shorter game without uploading it again.
 */
class Document extends Model
{
    use HasUuids;

    protected $fillable = [
        'sha256',
        'filename',
        'title',
        'page_count',
        'sentences',
        'extractor_version',
    ];

    protected function casts(): array
    {
        return [
            'page_count' => 'integer',
            'sentences' => 'array',
            'extractor_version' => 'integer',
        ];
    }

    /**
     * @return HasMany<Game, $this>
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }
}
