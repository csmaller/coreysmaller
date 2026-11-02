<?php

namespace App\Services\Games;

use App\Enums\GameSource;
use App\Enums\GameStatus;
use App\Exceptions\AlreadyAnsweredException;
use App\Exceptions\InsufficientContentException;
use App\Exceptions\QuestionNotInGameException;
use App\Models\Answer;
use App\Models\Document;
use App\Models\Game;
use App\Services\Pdf\PdfTextExtractor;
use App\Services\Questions\QuestionGenerator;
use App\Services\Scoring\ScoreCalculator;
use App\Services\Scraper\PageScraper;
use App\Services\Scraper\UrlNormalizer;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function __construct(
        private readonly PageScraper $scraper,
        private readonly PdfTextExtractor $pdfs,
        private readonly QuestionGenerator $generator,
        private readonly ScoreCalculator $calculator,
    ) {}

    /**
     * Scrape the page, generate exactly $length questions and store the game.
     * Nothing is stored if the page can't supply enough questions.
     */
    public function create(string $url, int $length): Game
    {
        $url = UrlNormalizer::normalize($url);
        $page = $this->scraper->scrape($url);
        $questions = $this->generator->generate($page['sentences'], $length);

        return $this->store([
            'source_type' => GameSource::Url,
            'url' => $url,
            'url_hash' => hash('sha256', $url),
            'source_title' => $page['title'] !== '' ? $page['title'] : null,
            'length' => $length,
        ], $questions);
    }

    /**
     * Read an uploaded PDF and start a game from it. The extracted text is
     * saved as a Document (one per distinct file) even when it is too short
     * for this game, so a shorter game can be started without re-uploading.
     */
    public function createFromPdf(UploadedFile $file, int $length): Game
    {
        return $this->createFromDocument($this->document($file), $length);
    }

    public function createFromDocument(Document $document, int $length): Game
    {
        try {
            $questions = $this->generator->generate($document->sentences, $length);
        } catch (InsufficientContentException $e) {
            throw $e->with(
                $document->sentences === []
                    ? 'No readable text was found in this PDF. It may be a scanned image.'
                    : sprintf(
                        'This PDF only has enough content for %d question%s, but %d were requested.',
                        $e->maxAvailable,
                        $e->maxAvailable === 1 ? '' : 's',
                        $length,
                    ),
                ['document_id' => $document->id],
            );
        }

        return $this->store([
            'source_type' => GameSource::Pdf,
            'document_id' => $document->id,
            'source_name' => $document->filename,
            'source_title' => $document->title,
            'length' => $length,
        ], $questions);
    }

    private function document(UploadedFile $file): Document
    {
        $bytes = (string) file_get_contents($file->getRealPath());
        $hash = hash('sha256', $bytes);

        $existing = Document::firstWhere('sha256', $hash);
        if ($existing?->extractor_version === PdfTextExtractor::VERSION) {
            return $existing;
        }

        $filename = $this->safeFilename($file->getClientOriginalName());
        $pdf = $this->pdfs->extract($bytes, $filename);
        $attributes = [
            'filename' => $filename,
            'title' => $pdf['title'] !== '' ? $pdf['title'] : null,
            'page_count' => $pdf['pages'],
            'sentences' => $pdf['sentences'],
            'extractor_version' => PdfTextExtractor::VERSION,
        ];

        if ($existing !== null) {
            // Read with an older extractor; refresh it.
            $existing->update($attributes);

            return $existing;
        }

        try {
            return Document::create(['sha256' => $hash] + $attributes);
        } catch (UniqueConstraintViolationException) {
            // The same file was uploaded concurrently; use that copy.
            return Document::where('sha256', $hash)->firstOrFail();
        }
    }

    private function safeFilename(string $name): string
    {
        $name = preg_replace('/[\x00-\x1F\x7F]/u', '', basename(str_replace('\\', '/', $name))) ?? '';
        $name = trim($name);

        return mb_substr($name !== '' ? $name : 'document.pdf', 0, 255);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<array{prompt: string, options: list<string>, correct_index: int, source_sentence: string}>  $questions
     */
    private function store(array $attributes, array $questions): Game
    {
        return DB::transaction(function () use ($attributes, $questions) {
            $game = Game::create($attributes);

            $game->questions()->createMany(array_map(fn (array $question, int $i) => [
                'position' => $i + 1,
                'prompt' => $question['prompt'],
                'options' => $question['options'],
                'correct_index' => $question['correct_index'],
                'source_sentence' => $question['source_sentence'],
            ], $questions, array_keys($questions)));

            return $game->load('questions.answer');
        });
    }

    /**
     * Grade one answer and update the game's score and streaks.
     */
    public function answer(Game $game, int $questionId, int $choiceIndex): AnswerResult
    {
        try {
            return DB::transaction(function () use ($game, $questionId, $choiceIndex) {
                // Lock the game row so two quick answers can't both read the
                // same streak.
                $game = Game::query()->whereKey($game->getKey())->lockForUpdate()->firstOrFail();

                $question = $game->questions()->whereKey($questionId)->first()
                    ?? throw new QuestionNotInGameException('That question is not part of this game.');

                if ($question->answer()->exists()) {
                    throw new AlreadyAnsweredException('That question has already been answered.');
                }

                $correct = $choiceIndex === $question->correct_index;
                $outcome = $this->calculator->score($correct, $game->current_streak);

                $question->setRelation('answer', Answer::create([
                    'question_id' => $question->id,
                    'choice_index' => $choiceIndex,
                    'is_correct' => $correct,
                    'answered_at' => now(),
                ]));

                $answered = $game->answers()->count();

                $game->score += $outcome->points;
                $game->correct_count += $correct ? 1 : 0;
                $game->current_streak = $outcome->streak;
                $game->best_streak = max($game->best_streak, $outcome->streak);
                if ($answered >= $game->length) {
                    $game->status = GameStatus::Completed;
                }
                $game->save();

                return new AnswerResult($game, $question, $correct, $outcome->points, $answered);
            });
        } catch (UniqueConstraintViolationException) {
            // Another request recorded an answer between our check and insert.
            throw new AlreadyAnsweredException('That question has already been answered.');
        }
    }
}
