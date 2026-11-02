<?php

namespace App\Services\Scoring;

final readonly class ScoreOutcome
{
    public function __construct(
        public int $points,
        public int $streak,
    ) {}
}
