<?php

namespace App\Http\Resources;

use App\Services\Games\AnswerResult;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property AnswerResult $resource
 */
class AnswerResultResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $result = $this->resource;

        return [
            'correct' => $result->correct,
            'correct_index' => $result->question->correct_index,
            'source_sentence' => $result->question->source_sentence,
            'points' => $result->points,
            'score' => $result->game->score,
            'current_streak' => $result->game->current_streak,
            'best_streak' => $result->game->best_streak,
            'answered' => $result->answered,
            'remaining' => max(0, $result->game->length - $result->answered),
            'status' => $result->game->status->value,
        ];
    }
}
