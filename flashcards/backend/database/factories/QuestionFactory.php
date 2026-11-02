<?php

namespace Database\Factories;

use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'position' => 1,
            'prompt' => 'The capital of France is _____ and it sits on the Seine.',
            'options' => ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
            'correct_index' => 0,
            'source_sentence' => 'The capital of France is Paris and it sits on the Seine.',
        ];
    }
}
