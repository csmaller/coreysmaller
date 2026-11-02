<?php

namespace App\Services\Scoring;

/**
 * Scoring rules: a correct answer is worth 10 points, plus a flat 5-point
 * bonus from the 3rd consecutive correct answer on (10, 10, 15, 15, ...).
 * A wrong answer scores 0 and resets the streak. Scores never go negative.
 */
class ScoreCalculator
{
    public const CORRECT_POINTS = 10;

    public const STREAK_BONUS = 5;

    /** The bonus starts with this many correct answers in a row. */
    public const BONUS_FROM_STREAK = 3;

    public function score(bool $correct, int $currentStreak): ScoreOutcome
    {
        if (! $correct) {
            return new ScoreOutcome(points: 0, streak: 0);
        }

        $streak = $currentStreak + 1;
        $bonus = $streak >= self::BONUS_FROM_STREAK ? self::STREAK_BONUS : 0;

        return new ScoreOutcome(points: self::CORRECT_POINTS + $bonus, streak: $streak);
    }

    /**
     * Total for a sequence of answers, in order.
     *
     * @param  list<bool>  $answers
     */
    public function total(array $answers): int
    {
        $total = 0;
        $streak = 0;

        foreach ($answers as $correct) {
            $outcome = $this->score($correct, $streak);
            $total += $outcome->points;
            $streak = $outcome->streak;
        }

        return $total;
    }
}
