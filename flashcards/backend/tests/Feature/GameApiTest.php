<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Question;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\ArticleFixture;
use Tests\TestCase;

class GameApiTest extends TestCase
{
    use RefreshDatabase;

    private const URL = 'https://example.com/history';

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            'example.com/history' => Http::response(ArticleFixture::html(80), 200, ['Content-Type' => 'text/html; charset=utf-8']),
            'example.com/tiny' => Http::response(ArticleFixture::html(20), 200, ['Content-Type' => 'text/html']),
            'example.com/empty' => Http::response('<html><body><p>Hi.</p></body></html>', 200, ['Content-Type' => 'text/html']),
            'example.com/report.pdf' => Http::response('%PDF-1.4', 200, ['Content-Type' => 'application/pdf']),
        ]);
    }

    private function createGame(int $length = 15, string $url = self::URL): TestResponse
    {
        return $this->postJson('/api/games', ['url' => $url, 'length' => $length]);
    }

    /**
     * Answer every question of a game, correctly or not, in order.
     *
     * @return list<TestResponse>
     */
    private function answerAll(string $gameId, bool $correctly = true): array
    {
        $responses = [];
        foreach (Question::where('game_id', $gameId)->orderBy('position')->get() as $question) {
            $choice = $correctly ? $question->correct_index : ($question->correct_index + 1) % 4;
            $responses[] = $this->postJson("/api/games/{$gameId}/answers", [
                'question_id' => $question->id,
                'choice_index' => $choice,
            ])->assertOk();
        }

        return $responses;
    }

    /**
     * @return array<string, array{int}>
     */
    public static function lengths(): array
    {
        return ['15' => [15], '30' => [30], '50' => [50]];
    }

    #[DataProvider('lengths')]
    public function test_creates_a_game_with_exactly_the_requested_length(int $length): void
    {
        $response = $this->createGame($length)
            ->assertCreated()
            ->assertJsonPath('length', $length)
            ->assertJsonPath('source_title', 'A Short History of Computing')
            ->assertJsonPath('status', 'in_progress')
            ->assertJsonCount($length, 'questions')
            ->assertJsonStructure(['id', 'source_title', 'length', 'questions' => [['id', 'position', 'prompt', 'options']]]);

        $this->assertSame(range(1, $length), array_column($response->json('questions'), 'position'));
        foreach ($response->json('questions') as $question) {
            $this->assertCount(4, $question['options']);
            $this->assertStringContainsString('_____', $question['prompt']);
        }

        $game = Game::findOrFail($response->json('id'));
        $this->assertSame($length, $game->questions()->count());
        $this->assertSame(hash('sha256', self::URL), $game->url_hash);
    }

    public function test_create_response_never_contains_correct_index(): void
    {
        $response = $this->createGame(50)->assertCreated();

        $this->assertStringNotContainsString('correct_index', $response->getContent());
        $this->assertStringNotContainsString('source_sentence', $response->getContent());
        foreach ($response->json('questions') as $question) {
            $this->assertNull($question['answer']);
        }
    }

    public function test_answering_correctly_and_wrongly(): void
    {
        $gameId = $this->createGame()->json('id');
        [$first, $second] = Question::where('game_id', $gameId)->orderBy('position')->take(2)->get();

        $this->postJson("/api/games/{$gameId}/answers", ['question_id' => $first->id, 'choice_index' => $first->correct_index])
            ->assertOk()
            ->assertJson([
                'correct' => true,
                'correct_index' => $first->correct_index,
                'source_sentence' => $first->source_sentence,
                'score' => 10,
                'current_streak' => 1,
                'answered' => 1,
                'remaining' => 14,
            ]);

        $wrong = ($second->correct_index + 1) % 4;
        $this->postJson("/api/games/{$gameId}/answers", ['question_id' => $second->id, 'choice_index' => $wrong])
            ->assertOk()
            ->assertJson([
                'correct' => false,
                'correct_index' => $second->correct_index,
                'score' => 10,
                'current_streak' => 0,
                'answered' => 2,
                'remaining' => 13,
            ]);
    }

    public function test_streak_bonus_follows_the_scoring_rules(): void
    {
        $gameId = $this->createGame()->json('id');
        $questions = Question::where('game_id', $gameId)->orderBy('position')->take(5)->get();
        $scores = [];

        foreach ([true, true, true, false, true] as $i => $correct) {
            $question = $questions[$i];
            $choice = $correct ? $question->correct_index : ($question->correct_index + 1) % 4;
            $scores[] = $this->postJson("/api/games/{$gameId}/answers", ['question_id' => $question->id, 'choice_index' => $choice])
                ->json('score');
        }

        $this->assertSame([10, 20, 35, 35, 45], $scores);
    }

    public function test_duplicate_answer_returns_409(): void
    {
        $gameId = $this->createGame()->json('id');
        $question = Question::where('game_id', $gameId)->firstOrFail();
        $payload = ['question_id' => $question->id, 'choice_index' => 0];

        $this->postJson("/api/games/{$gameId}/answers", $payload)->assertOk();
        $this->postJson("/api/games/{$gameId}/answers", $payload)
            ->assertStatus(409)
            ->assertJsonStructure(['message']);

        $this->assertSame(1, Game::findOrFail($gameId)->answers()->count());
    }

    public function test_question_from_another_game_returns_404(): void
    {
        $gameId = $this->createGame()->json('id');
        $otherQuestion = Question::factory()->for(Game::factory())->create();

        $this->postJson("/api/games/{$gameId}/answers", ['question_id' => $otherQuestion->id, 'choice_index' => 0])
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    }

    public function test_answer_payload_is_validated(): void
    {
        $gameId = $this->createGame()->json('id');
        $question = Question::where('game_id', $gameId)->firstOrFail();

        $this->postJson("/api/games/{$gameId}/answers", ['question_id' => $question->id, 'choice_index' => 4])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('choice_index');
    }

    public function test_results_return_409_before_completion_and_200_after(): void
    {
        $gameId = $this->createGame()->json('id');

        $this->getJson("/api/games/{$gameId}/results")->assertStatus(409)->assertJsonStructure(['message']);

        $responses = $this->answerAll($gameId);
        $last = end($responses);
        $last->assertJson(['remaining' => 0, 'status' => 'completed']);

        // 10 + 10 + 13 × 15 for 15 correct answers in a row.
        $this->getJson("/api/games/{$gameId}/results")
            ->assertOk()
            ->assertJson([
                'score' => 215,
                'correct_count' => 15,
                'length' => 15,
                'accuracy_pct' => 100,
                'best_streak' => 15,
            ])
            ->assertJsonCount(15, 'review')
            ->assertJsonStructure(['review' => [['prompt', 'your_answer', 'correct_answer', 'correct']]]);

        $this->assertSame($last->json('score'), $this->getJson("/api/games/{$gameId}/results")->json('score'));
    }

    public function test_results_review_shows_wrong_answers(): void
    {
        $gameId = $this->createGame()->json('id');
        $this->answerAll($gameId, correctly: false);

        $results = $this->getJson("/api/games/{$gameId}/results")
            ->assertOk()
            ->assertJson(['score' => 0, 'correct_count' => 0, 'accuracy_pct' => 0, 'best_streak' => 0]);

        foreach ($results->json('review') as $item) {
            $this->assertFalse($item['correct']);
            $this->assertNotSame($item['your_answer'], $item['correct_answer']);
        }
    }

    public function test_show_returns_resumable_state(): void
    {
        $gameId = $this->createGame()->json('id');
        $first = Question::where('game_id', $gameId)->orderBy('position')->firstOrFail();
        $this->postJson("/api/games/{$gameId}/answers", ['question_id' => $first->id, 'choice_index' => $first->correct_index]);

        $this->getJson("/api/games/{$gameId}")
            ->assertOk()
            ->assertJson([
                'id' => $gameId,
                'url' => self::URL,
                'score' => 10,
                'current_streak' => 1,
                'answered' => 1,
                'status' => 'in_progress',
            ])
            ->assertJsonPath('questions.0.answer.correct', true)
            ->assertJsonPath('questions.0.answer.correct_index', $first->correct_index)
            ->assertJsonPath('questions.1.answer', null)
            ->assertJsonMissingPath('questions.1.answer.correct_index');
    }

    public function test_unknown_game_returns_404(): void
    {
        $this->getJson('/api/games/00000000-0000-0000-0000-000000000000')
            ->assertNotFound()
            ->assertJson(['message' => 'Game not found.']);
        $this->getJson('/api/games/not-a-uuid')->assertNotFound();
    }

    /**
     * @return array<string, array{array<string, mixed>, string}>
     */
    public static function invalidPayloads(): array
    {
        return [
            'length 20' => [['url' => self::URL, 'length' => 20], 'length'],
            'length missing' => [['url' => self::URL], 'length'],
            'length text' => [['url' => self::URL, 'length' => 'fifteen'], 'length'],
            'url missing' => [['length' => 15], 'url'],
            'url not a url' => [['url' => 'not a url', 'length' => 15], 'url'],
            'ftp url' => [['url' => 'ftp://example.com/file', 'length' => 15], 'url'],
            'file url' => [['url' => 'file:///etc/passwd', 'length' => 15], 'url'],
            'url too long' => [['url' => 'https://example.com/'.str_repeat('a', 2048), 'length' => 15], 'url'],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    #[DataProvider('invalidPayloads')]
    public function test_invalid_input_returns_422(array $payload, string $field): void
    {
        $this->postJson('/api/games', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors($field)
            ->assertJsonStructure(['message']);

        Http::assertNothingSent();
    }

    public function test_non_html_content_returns_415(): void
    {
        $this->createGame(15, 'https://example.com/report.pdf')
            ->assertStatus(415)
            ->assertJsonStructure(['message']);
    }

    public function test_blocked_urls_return_422_without_any_request(): void
    {
        foreach (['http://127.0.0.1', 'http://169.254.169.254/latest/meta-data/', 'http://internal.example/'] as $url) {
            $this->createGame(15, $url)
                ->assertUnprocessable()
                ->assertJsonStructure(['message'])
                ->assertJsonMissingPath('max_available');
        }

        Http::assertNothingSent();
        $this->assertSame(0, Game::count());
    }

    public function test_unreachable_page_returns_502(): void
    {
        Http::fake(['example.com/broken' => Http::response('Server error', 500, ['Content-Type' => 'text/html'])]);

        $this->createGame(15, 'https://example.com/broken')
            ->assertStatus(502)
            ->assertJsonStructure(['message']);
    }

    public function test_too_little_content_returns_422_with_max_available(): void
    {
        $this->createGame(30, 'https://example.com/tiny')
            ->assertUnprocessable()
            ->assertJson(['max_available' => 20])
            ->assertJsonStructure(['message', 'max_available']);

        $this->createGame(15, 'https://example.com/empty')
            ->assertUnprocessable()
            ->assertJson(['max_available' => 0]);

        $this->assertSame(0, Game::count());
    }

    public function test_creating_games_is_rate_limited_per_ip(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->createGame()->assertCreated();
        }

        $this->createGame()->assertStatus(429)->assertJsonStructure(['message']);
        $this->getJson('/api/games/'.Game::firstOrFail()->id)->assertOk();
    }

    public function test_cors_allows_the_frontend_origin(): void
    {
        config(['cors.allowed_origins' => ['http://localhost:5173']]);

        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'POST',
        ])->options('/api/games')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }
}
