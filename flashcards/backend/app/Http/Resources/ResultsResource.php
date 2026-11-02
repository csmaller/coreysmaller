<?php

namespace App\Http\Resources;

use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Final results of a completed game. Expects questions.answer to be loaded.
 *
 * @mixin Game
 */
class ResultsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'source_type' => $this->source_type->value,
            'url' => $this->url,
            'document_id' => $this->document_id,
            'source_name' => $this->source_name,
            'source_title' => $this->source_title,
            'score' => $this->score,
            'correct_count' => $this->correct_count,
            'length' => $this->length,
            'accuracy_pct' => (int) round($this->correct_count / max(1, $this->length) * 100),
            'best_streak' => $this->best_streak,
            'review' => $this->questions->map(fn ($question) => [
                'position' => $question->position,
                'prompt' => $question->prompt,
                'your_answer' => $question->answer ? $question->options[$question->answer->choice_index] : null,
                'correct_answer' => $question->options[$question->correct_index],
                'correct' => (bool) $question->answer?->is_correct,
                'source_sentence' => $question->source_sentence,
            ])->values(),
        ];
    }
}
