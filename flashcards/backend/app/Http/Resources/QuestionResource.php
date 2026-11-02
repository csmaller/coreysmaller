<?php

namespace App\Http\Resources;

use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A card as the player sees it. The correct answer is only included once
 * the question has been answered.
 *
 * @mixin Question
 */
class QuestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'position' => $this->position,
            'prompt' => $this->prompt,
            'options' => $this->options,
            'answer' => $this->whenLoaded('answer', fn () => $this->answer === null ? null : [
                'choice_index' => $this->answer->choice_index,
                'correct' => $this->answer->is_correct,
                'correct_index' => $this->correct_index,
                'source_sentence' => $this->source_sentence,
            ]),
        ];
    }
}
