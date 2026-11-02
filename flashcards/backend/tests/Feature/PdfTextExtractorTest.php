<?php

namespace Tests\Feature;

use App\Exceptions\UnreadablePdfException;
use App\Exceptions\UnsupportedContentException;
use App\Services\Pdf\PdfTextExtractor;
use Tests\Support\ArticleFixture;
use Tests\Support\PdfFixture;
use Tests\TestCase;

class PdfTextExtractorTest extends TestCase
{
    private function extractor(): PdfTextExtractor
    {
        return $this->app->make(PdfTextExtractor::class);
    }

    public function test_rejoins_wrapped_lines_into_sentences(): void
    {
        $result = $this->extractor()->extract(PdfFixture::report(40), 'report.pdf');

        $this->assertSame('History of Computing Report', $result['title']);
        $this->assertSame(5, $result['pages']);
        $this->assertSame(ArticleFixture::sentences(40), $result['sentences']);
    }

    public function test_drops_running_headers_and_page_numbers(): void
    {
        $result = $this->extractor()->extract(PdfFixture::report(40), 'report.pdf');

        $this->assertStringNotContainsString('Annual Report', $result['text']);
        $this->assertDoesNotMatchRegularExpression('/^Page \d+$/m', $result['text']);
    }

    public function test_rejoins_hyphenated_words_and_sentences_across_pages(): void
    {
        $pdf = PdfFixture::make([
            ['Plants capture light energy through a process called photo-', 'synthesis and they store that energy as'],
            ['sugar molecules inside their leaves for later use.'],
        ]);

        $result = $this->extractor()->extract($pdf, 'leaf.pdf');

        $this->assertSame([
            'Plants capture light energy through a process called photosynthesis and they store that energy as sugar molecules inside their leaves for later use.',
        ], $result['sentences']);
    }

    public function test_keeps_headings_out_of_sentences(): void
    {
        $pdf = PdfFixture::make([[
            'Chapter Two',
            'The Calvin cycle uses energy from ATP to build sugars from carbon dioxide.',
        ]]);

        $result = $this->extractor()->extract($pdf, 'notes.pdf');

        $this->assertSame(['The Calvin cycle uses energy from ATP to build sugars from carbon dioxide.'], $result['sentences']);
    }

    public function test_keeps_real_hyphens_at_line_breaks(): void
    {
        $pdf = PdfFixture::make([[
            'The model uses an attention-based encoder and its decoder is also attention-',
            'based, which makes training on large datasets much faster than before.',
        ]]);

        $this->assertSame(
            ['The model uses an attention-based encoder and its decoder is also attention-based, which makes training on large datasets much faster than before.'],
            $this->extractor()->extract($pdf, 'paper.pdf')['sentences'],
        );
    }

    public function test_skips_the_reference_list_until_an_appendix(): void
    {
        $pdf = PdfFixture::make([
            ['The transformer architecture replaced recurrence with attention in sequence models.', 'References'],
            [
                '[1] Smith J. Neural networks for translation tasks in modern systems. arXiv preprint arXiv:1234.5678, 2014.',
                'Another reference entry about learning systems and their many varied applications.',
                'Appendix A',
                'The appendix describes how attention heads specialise in different syntactic roles.',
            ],
        ]);

        $this->assertSame([
            'The transformer architecture replaced recurrence with attention in sequence models.',
            'The appendix describes how attention heads specialise in different syntactic roles.',
        ], $this->extractor()->extract($pdf, 'paper.pdf')['sentences']);
    }

    public function test_keeps_equations_and_citations_out_of_sentences(): void
    {
        $pdf = PdfFixture::make([[
            'FFN(x) = max(0, xW1 + b1)W2 + b2 (2)',
            'While the linear transformations are the same across positions, they use different parameters.',
            'Dropout prevents neural networks from overfitting.Journal of Machine Learning Research, 15(1):1929-1958, 2014.',
        ]]);

        $this->assertSame(
            ['While the linear transformations are the same across positions, they use different parameters.'],
            $this->extractor()->extract($pdf, 'paper.pdf')['sentences'],
        );
    }

    public function test_drops_sentences_with_glued_math_but_keeps_camel_case_names(): void
    {
        $pdf = PdfFixture::make([[
            'The keys and values are also packed together into matricesKandV for speed.',
            'The encoder is composed of a stack ofN= 6identical layers in this design.',
            'Earlier systems such as ConvS2S and ByteNet relied on convolution instead of attention.',
        ]]);

        $this->assertSame(
            ['Earlier systems such as ConvS2S and ByteNet relied on convolution instead of attention.'],
            $this->extractor()->extract($pdf, 'paper.pdf')['sentences'],
        );
    }

    public function test_repairs_ligatures_the_font_cannot_decode(): void
    {
        $text = 'Registered and licensed dietitians and nutritionists are authorized to provide nutrition counseling.';

        $result = $this->extractor()->extract(PdfFixture::withUnmappedLigature($text), 'study-guide.pdf');

        $this->assertSame([$text], $result['sentences']);
    }

    public function test_falls_back_to_the_filename_for_the_title(): void
    {
        $pdf = PdfFixture::make([['Short text only.']], 'Microsoft Word - draft.docx');

        $this->assertSame('Lecture notes week 3', $this->extractor()->extract($pdf, 'Lecture notes week 3.pdf')['title']);
        $this->assertSame('Lecture notes week 3', $this->extractor()->extract(PdfFixture::make([[]]), 'Lecture notes week 3.pdf')['title']);
    }

    public function test_rejects_files_that_are_not_pdfs(): void
    {
        $this->expectException(UnsupportedContentException::class);

        $this->extractor()->extract("PK\x03\x04 this is a zip file", 'fake.pdf');
    }

    public function test_reports_broken_pdfs_as_unreadable(): void
    {
        $this->expectException(UnreadablePdfException::class);

        $this->extractor()->extract("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 9 0 R", 'broken.pdf');
    }

    public function test_only_reads_the_first_pages(): void
    {
        config(['pdf.max_pages' => 2]);

        $result = $this->extractor()->extract(PdfFixture::report(40), 'report.pdf');

        $this->assertSame(2, $result['pages']);
        $this->assertCount(16, $result['sentences']);
    }
}
