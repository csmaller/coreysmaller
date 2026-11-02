<?php

namespace App\Http\Resources;

use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The game state used both when a game is created and when it is resumed.
 * Expects questions.answer to be loaded.
 *
 * @mixin Game
 */
class GameResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $answered = $this->questions->filter(fn ($question) => $question->answer !== null)->count();

        return [
            'id' => $this->id,
            'source_type' => $this->source_type->value,
            'url' => $this->url,
            'document_id' => $this->document_id,
            'source_name' => $this->source_name,
            'source_title' => $this->source_title,
            'length' => $this->length,
            'status' => $this->status->value,
            'score' => $this->score,
            'correct_count' => $this->correct_count,
            'current_streak' => $this->current_streak,
            'best_streak' => $this->best_streak,
            'answered' => $answered,
            'questions' => QuestionResource::collection($this->questions),
        ];
    }
}
