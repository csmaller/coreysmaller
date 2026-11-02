<?php

namespace App\Services\Questions;

use App\Exceptions\InsufficientContentException;

interface QuestionGenerator
{
    /**
     * Build multiple-choice questions from a page's sentences.
     *
     * @param  list<string>  $sentences
     * @return list<array{
     *     prompt: string,
     *     options: list<string>,
     *     correct_index: int,
     *     answer: string,
     *     source_sentence: string,
     * }> Exactly $count questions, each with 4 options.
     *
     * @throws InsufficientContentException when fewer than $count questions
     *                                      can be built; its maxAvailable
     *                                      says how many could.
     */
    public function generate(array $sentences, int $count): array;
}
