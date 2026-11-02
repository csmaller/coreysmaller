<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Game;
use App\Services\Pdf\PdfTextExtractor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\PdfFixture;
use Tests\TestCase;

class PdfGameApiTest extends TestCase
{
    use RefreshDatabase;

    private function upload(string $bytes, int $length = 15, string $name = 'report.pdf', string $mime = 'application/pdf'): TestResponse
    {
        return $this->post('/api/games/pdf', [
            'file' => UploadedFile::fake()->createWithContent($name, $bytes)->mimeType($mime),
            'length' => $length,
        ], ['Accept' => 'application/json']);
    }

    /**
     * @return array<string, array{int}>
     */
    public static function lengths(): array
    {
        return ['15' => [15], '30' => [30], '50' => [50]];
    }

    #[DataProvider('lengths')]
    public function test_creates_a_game_from_a_pdf(int $length): void
    {
        $response = $this->upload(PdfFixture::report(80), $length)
            ->assertCreated()
            ->assertJsonPath('source_type', 'pdf')
            ->assertJsonPath('source_title', 'History of Computing Report')
            ->assertJsonPath('source_name', 'report.pdf')
            ->assertJsonPath('url', null)
            ->assertJsonPath('length', $length)
            ->assertJsonCount($length, 'questions');

        $this->assertStringNotContainsString('correct_index', $response->getContent());
        $this->assertNotNull($response->json('document_id'));
        Http::assertNothingSent();
    }

    public function test_the_document_is_stored_once_and_can_be_replayed_without_uploading(): void
    {
        $pdf = PdfFixture::report(80);
        $first = $this->upload($pdf)->assertCreated();
        $second = $this->upload($pdf, 30, 'renamed.pdf')->assertCreated();

        $this->assertSame(1, Document::count());
        $this->assertSame($first->json('document_id'), $second->json('document_id'));

        $this->postJson('/api/games', ['document_id' => $first->json('document_id'), 'length' => 50])
            ->assertCreated()
            ->assertJsonPath('source_type', 'pdf')
            ->assertJsonPath('document_id', $first->json('document_id'))
            ->assertJsonCount(50, 'questions');

        $this->assertSame(3, Game::count());
    }

    public function test_a_pdf_game_plays_through_to_results(): void
    {
        $gameId = $this->upload(PdfFixture::report(80))->json('id');

        foreach (Game::findOrFail($gameId)->questions as $question) {
            $this->postJson("/api/games/{$gameId}/answers", [
                'question_id' => $question->id,
                'choice_index' => $question->correct_index,
            ])->assertOk();
        }

        $this->getJson("/api/games/{$gameId}/results")
            ->assertOk()
            ->assertJson(['score' => 215, 'source_type' => 'pdf', 'source_name' => 'report.pdf']);
    }

    public function test_documents_from_an_older_extractor_are_read_again(): void
    {
        $pdf = PdfFixture::report(80);
        $documentId = $this->upload($pdf)->json('document_id');
        Document::whereKey($documentId)->update(['extractor_version' => 1, 'sentences' => '[]']);

        $this->upload($pdf)->assertCreated()->assertJsonPath('document_id', $documentId);

        $document = Document::findOrFail($documentId);
        $this->assertSame(PdfTextExtractor::VERSION, $document->extractor_version);
        $this->assertCount(80, $document->sentences);
    }

    public function test_too_little_content_returns_max_available_and_the_document_id(): void
    {
        $response = $this->upload(PdfFixture::report(20), 30)
            ->assertUnprocessable()
            ->assertJson(['max_available' => 20])
            ->assertJsonStructure(['message', 'max_available', 'document_id']);

        $this->assertStringContainsString('This PDF only has enough content for 20', $response->json('message'));
        $this->assertSame(0, Game::count());

        // Retry with a shorter game, without uploading again.
        $this->postJson('/api/games', ['document_id' => $response->json('document_id'), 'length' => 15])
            ->assertCreated()
            ->assertJsonCount(15, 'questions');
    }

    public function test_a_pdf_without_text_is_explained(): void
    {
        $this->upload(PdfFixture::make([[], []]), 15, 'scan.pdf')
            ->assertUnprocessable()
            ->assertJson(['max_available' => 0])
            ->assertJsonPath('message', 'No readable text was found in this PDF. It may be a scanned image.');
    }

    public function test_a_file_that_is_not_a_pdf_returns_415(): void
    {
        $this->upload('<html><body>Not a PDF</body></html>', 15, 'page.pdf')
            ->assertStatus(415)
            ->assertJsonPath('message', 'That file is not a PDF.');

        $this->assertSame(0, Document::count());
    }

    public function test_a_broken_pdf_returns_422(): void
    {
        $this->upload("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 9 0 R", 15, 'broken.pdf')
            ->assertUnprocessable()
            ->assertJsonStructure(['message'])
            ->assertJsonMissingPath('max_available');
    }

    public function test_upload_is_validated(): void
    {
        $this->post('/api/games/pdf', ['length' => 15], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');

        $this->upload(PdfFixture::report(80), 20)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('length');

        config(['pdf.max_kb' => 1]);
        $this->upload(PdfFixture::report(80))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file' => 'PDFs can be at most']);
    }

    public function test_bodies_over_the_php_post_limit_return_413(): void
    {
        $this->call('POST', '/api/games/pdf', [], [], [], [
            'HTTP_ACCEPT' => 'application/json',
            'CONTENT_LENGTH' => (string) (1024 ** 4),
        ])->assertStatus(413)->assertJsonStructure(['message']);
    }

    public function test_create_game_needs_exactly_one_source(): void
    {
        $document = $this->upload(PdfFixture::report(80))->json('document_id');

        $this->postJson('/api/games', ['url' => 'https://example.com/', 'document_id' => $document, 'length' => 15])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('url');

        $this->postJson('/api/games', ['document_id' => '00000000-0000-0000-0000-000000000000', 'length' => 15])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document_id' => 'no longer available']);
    }

    public function test_the_filename_is_sanitized(): void
    {
        $this->upload(PdfFixture::report(80), 15, "../../etc/\x07notes.pdf")
            ->assertCreated()
            ->assertJsonPath('source_name', 'notes.pdf');
    }

    public function test_pdf_uploads_share_the_create_rate_limit(): void
    {
        $pdf = PdfFixture::report(80);
        for ($i = 0; $i < 10; $i++) {
            $this->upload($pdf)->assertCreated();
        }

        $this->upload($pdf)->assertStatus(429);
    }
}
