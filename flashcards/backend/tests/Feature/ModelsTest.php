<?php

namespace Tests\Feature;

use App\Enums\GameStatus;
use App\Models\Answer;
use App\Models\Game;
use App\Models\Question;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_game_uses_uuid_and_defaults(): void
    {
        $game = Game::factory()->create()->fresh();

        $this->assertTrue(Str::isUuid($game->id));
        $this->assertSame(0, $game->score);
        $this->assertSame(0, $game->correct_count);
        $this->assertSame(GameStatus::InProgress, $game->status);
    }

    public function test_relationships_and_casts(): void
    {
        $game = Game::factory()->create();
        $second = Question::factory()->for($game)->create(['position' => 2]);
        $first = Question::factory()->for($game)->create(['position' => 1]);
        Answer::create([
            'question_id' => $first->id,
            'choice_index' => 0,
            'is_correct' => true,
            'answered_at' => now(),
        ]);

        $game->refresh();

        $this->assertSame([$first->id, $second->id], $game->questions->pluck('id')->all());
        $this->assertSame(['Paris', 'Lyon', 'Marseille', 'Toulouse'], $first->fresh()->options);
        $this->assertTrue($first->answer->is_correct);
        $this->assertCount(1, $game->answers);
        $this->assertTrue($first->answer->question->game->is($game));
    }

    public function test_question_position_is_unique_per_game(): void
    {
        $game = Game::factory()->create();
        Question::factory()->for($game)->create(['position' => 1]);

        $this->expectException(UniqueConstraintViolationException::class);
        Question::factory()->for($game)->create(['position' => 1]);
    }

    public function test_question_can_only_be_answered_once(): void
    {
        $question = Question::factory()->for(Game::factory())->create();
        $row = ['question_id' => $question->id, 'choice_index' => 1, 'is_correct' => false, 'answered_at' => now()];
        Answer::create($row);

        $this->expectException(UniqueConstraintViolationException::class);
        Answer::create($row);
    }

    public function test_deleting_a_game_cascades(): void
    {
        $question = Question::factory()->for(Game::factory())->create();
        Answer::create(['question_id' => $question->id, 'choice_index' => 0, 'is_correct' => true, 'answered_at' => now()]);

        $question->game->delete();

        $this->assertSame(0, Question::count());
        $this->assertSame(0, Answer::count());
    }
}
