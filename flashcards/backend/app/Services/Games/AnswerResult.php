<?php

namespace App\Services\Games;

use App\Models\Game;
use App\Models\Question;

final readonly class AnswerResult
{
    public function __construct(
        public Game $game,
        public Question $question,
        public bool $correct,
        public int $points,
        public int $answered,
    ) {}
}
