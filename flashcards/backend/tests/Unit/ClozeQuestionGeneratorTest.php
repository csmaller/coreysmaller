<?php

namespace Tests\Unit;

use App\Exceptions\InsufficientContentException;
use App\Services\Questions\ClozeQuestionGenerator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Random\Engine\Mt19937;
use Random\Randomizer;
use Tests\Support\ArticleFixture;

class ClozeQuestionGeneratorTest extends TestCase
{
    private function generator(int $seed = 1): ClozeQuestionGenerator
    {
        return new ClozeQuestionGenerator(new Randomizer(new Mt19937($seed)));
    }

    /**
     * @return array<string, array{int}>
     */
    public static function lengths(): array
    {
        return ['15 cards' => [15], '30 cards' => [30], '50 cards' => [50]];
    }

    #[DataProvider('lengths')]
    public function test_produces_exactly_n_questions(int $count): void
    {
        $questions = $this->generator()->generate(ArticleFixture::sentences(80), $count);

        $this->assertCount($count, $questions);
    }

    public function test_each_question_has_four_unique_options(): void
    {
        foreach (range(1, 20) as $seed) {
            foreach ($this->generator($seed)->generate(ArticleFixture::sentences(60), 50) as $question) {
                $this->assertCount(4, $question['options']);
                $this->assertCount(4, array_unique(array_map('mb_strtolower', $question['options'])));
            }
        }
    }

    public function test_correct_index_points_to_the_blanked_term(): void
    {
        foreach (range(1, 20) as $seed) {
            foreach ($this->generator($seed)->generate(ArticleFixture::sentences(60), 30) as $question) {
                $answer = $question['options'][$question['correct_index']];

                $this->assertSame($question['answer'], $answer);
                $this->assertStringContainsString(ClozeQuestionGenerator::BLANK, $question['prompt']);
                $this->assertStringNotContainsString($answer, $question['prompt']);
                $this->assertSame(
                    $question['source_sentence'],
                    str_replace(ClozeQuestionGenerator::BLANK, $answer, $question['prompt']),
                );
            }
        }
    }

    public function test_no_sentence_is_reused_and_no_question_repeats(): void
    {
        $sentences = [...ArticleFixture::sentences(50), ...ArticleFixture::sentences(50)];

        $questions = $this->generator()->generate($sentences, 50);

        $sources = array_column($questions, 'source_sentence');
        $this->assertCount(50, array_unique($sources));

        $keys = array_map(fn ($q) => mb_strtolower($q['answer']).'|'.$q['prompt'], $questions);
        $this->assertCount(50, array_unique($keys));
    }

    public function test_reports_max_available_when_content_is_insufficient(): void
    {
        // Duplicates count once, so only 10 distinct sentences are usable.
        $sentences = [...ArticleFixture::sentences(10), ...ArticleFixture::sentences(10), 'Too short.'];

        try {
            $this->generator()->generate($sentences, 15);
            $this->fail('Expected InsufficientContentException.');
        } catch (InsufficientContentException $e) {
            $this->assertSame(10, $e->maxAvailable);
            $this->assertSame(422, $e->status());
            $this->assertSame(['max_available' => 10], $e->context());
        }
    }

    public function test_reports_zero_when_nothing_is_usable(): void
    {
        $this->expectException(InsufficientContentException::class);

        $this->generator()->generate(['it was what it was and there was nothing more to it.'], 15);
    }

    public function test_numbers_are_only_mixed_with_numbers(): void
    {
        foreach (range(1, 10) as $seed) {
            foreach ($this->generator($seed)->generate(ArticleFixture::sentences(60), 50) as $question) {
                $numeric = array_filter($question['options'], fn ($o) => preg_match('/^\d[\d,.]*$/', $o));
                $this->assertContains(count($numeric), [0, 4], implode(' / ', $question['options']));
            }
        }
    }

    public function test_extracts_names_years_and_nouns_but_not_stopwords(): void
    {
        $sentences = [
            'The Bank of England was founded in 1694 to act as the government banker.',
            'However, the Federal Reserve was created in 1913 after a financial panic.',
            'Isaac Newton served as Master of the Mint from 1699 until his death.',
            'In 1971, President Nixon ended the direct convertibility of dollars into gold.',
            'The European Central Bank sets interest rates for countries in the eurozone.',
        ];

        $answers = [];
        foreach (range(1, 200) as $seed) {
            foreach ($this->generator($seed)->generate($sentences, 5) as $question) {
                $answers[$question['answer']] = true;
            }
        }

        foreach (['Bank of England', '1694', 'Federal Reserve', 'Isaac Newton', '1971', 'European Central Bank', 'government'] as $expected) {
            $this->assertArrayHasKey($expected, $answers);
        }
        foreach (['The', 'However', 'In', 'after', 'until', 'founded', 'directly'] as $unexpected) {
            $this->assertArrayNotHasKey($unexpected, $answers);
        }
    }

    /**
     * @return array<string, array{string, bool}>
     */
    public static function contextCases(): array
    {
        return [
            'ordinal reference' => ['The last progression includes exercises designed to improve movement efficiency of the core.', true],
            'demonstrative' => ['This process converts glucose into usable energy for working muscles.', true],
            'pronoun' => ['They are responsible for most of the force produced during a squat.', true],
            'connective' => ['However, the pancreas does not make enough insulin in type 1 diabetes.', true],
            'two-word connective' => ['In addition, regular exercise improves blood glucose management.', true],
            'example' => ['For example, two spotters stand on opposite sides of the barbell.', true],
            'figure reference' => ['The muscles shown in Figure 3 stabilize the lumbar spine during lifts.', true],
            'following' => ['Clients should complete the following assessments before training begins.', true],
            'heading glued on' => ['Plyometric training progression 3 The last progression includes explosive movements.', true],
            'standalone' => ['Registered dietitians are authorized to provide medical nutrition therapy.', false],
            'definite article' => ['The pancreas releases insulin to move glucose into cells.', false],
            'there are' => ['There are three types of muscle in the human body.', false],
            'thesis not this' => ['Thermoregulation keeps the core temperature of the body stable.', false],
            'title in a sentence' => ['Many students listened to The Beatles while studying anatomy at night.', false],
        ];
    }

    #[DataProvider('contextCases')]
    public function test_detects_sentences_that_need_surrounding_context(string $sentence, bool $expected): void
    {
        $this->assertSame($expected, $this->generator()->needsContext($sentence));
    }

    public function test_prefers_sentences_that_make_sense_alone(): void
    {
        $standalone = ArticleFixture::sentences(30);
        $dependent = array_map(fn (string $s) => 'However, '.lcfirst($s), ArticleFixture::sentences(60, 30));

        foreach (range(1, 10) as $seed) {
            $questions = $this->generator($seed)->generate([...$dependent, ...$standalone], 30);

            $this->assertSame([], array_filter(
                array_column($questions, 'source_sentence'),
                fn (string $s) => str_starts_with($s, 'However'),
            ));
        }
    }

    public function test_still_uses_dependent_sentences_when_a_game_needs_them(): void
    {
        $standalone = ArticleFixture::sentences(20);
        $dependent = array_map(fn (string $s) => 'However, '.lcfirst($s), ArticleFixture::sentences(60, 20));

        $questions = $this->generator()->generate([...$standalone, ...$dependent], 50);

        $this->assertCount(50, $questions);
        $this->assertCount(30, array_filter(
            array_column($questions, 'source_sentence'),
            fn (string $s) => str_starts_with($s, 'However'),
        ));
    }
}
