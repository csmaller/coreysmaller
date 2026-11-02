<?php

namespace Tests\Unit;

use App\Services\Scoring\ScoreCalculator;
use PHPUnit\Framework\TestCase;

class ScoreCalculatorTest extends TestCase
{
    public function test_streak_math_for_c_c_c_w_c(): void
    {
        $calculator = new ScoreCalculator;
        $streak = 0;
        $points = [];

        foreach ([true, true, true, false, true] as $correct) {
            $outcome = $calculator->score($correct, $streak);
            $points[] = $outcome->points;
            $streak = $outcome->streak;
        }

        $this->assertSame([10, 10, 15, 0, 10], $points);
        $this->assertSame(45, array_sum($points));
        $this->assertSame(45, $calculator->total([true, true, true, false, true]));
    }

    public function test_bonus_is_flat_for_long_streaks(): void
    {
        $this->assertSame(10 + 10 + 15 + 15 + 15, (new ScoreCalculator)->total(array_fill(0, 5, true)));
    }

    public function test_wrong_answers_score_zero_and_reset_the_streak(): void
    {
        $outcome = (new ScoreCalculator)->score(false, 7);

        $this->assertSame(0, $outcome->points);
        $this->assertSame(0, $outcome->streak);
        $this->assertSame(0, (new ScoreCalculator)->total([false, false, false]));
    }
}
