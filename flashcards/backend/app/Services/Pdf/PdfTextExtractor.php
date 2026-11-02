<?php

namespace App\Services\Pdf;

use App\Exceptions\UnreadablePdfException;
use App\Exceptions\UnsupportedContentException;
use App\Services\Text\SentenceExtractor;
use Smalot\PdfParser\Config;
use Smalot\PdfParser\Parser;
use Throwable;

/**
 * Reads the text of an uploaded PDF and rebuilds its paragraphs, which PDFs
 * store as separate, often hyphenated, lines.
 */
class PdfTextExtractor
{
    /**
     * Bump when extraction changes, so stored documents are re-read the next
     * time the same file is uploaded.
     */
    public const VERSION = 5;

    /** How many lines at the top and bottom of a page may be headers/footers. */
    private const EDGE_LINES = 3;

    /** A heading that starts the reference list, which is skipped. */
    private const REFERENCES_HEADING = '/^(?:\d+\.?\s*)?(?:references|bibliography|works cited|literature cited|citations)$/iu';

    /** A heading after which normal text resumes. */
    private const RESUME_HEADING = '/^(?:[A-Z]\.?\s+)?(?:appendix|appendices|supplementary)\b/iu';

    /** Sentences that are really citations. */
    private const CITATION = '/\barXiv\b|\bdoi:|\bProceedings of\b|\bIn Proc\.|\bpp\.\s*\d|\b\d+\(\d+\):\d+/u';

    /**
     * Math the parser glued into the prose: "=", Greek letters, a variable
     * stuck to a word ("matrixQ", "ofN", "6identical"). Names such as
     * ConvS2S or iPhone don't match.
     */
    private const GLUED_MATH = '/=|[\x{0370}-\x{03FF}]|\p{Ll}\p{Lu}\b|\b(?:of|by|is|to|an?|with)\p{Lu}\b|\d\p{Ll}{3,}/u';

    public function __construct(
        private readonly SentenceExtractor $sentences,
        private readonly PdfTextRepair $repair,
    ) {}

    /**
     * @return array{title: string, text: string, sentences: list<string>, pages: int}
     *
     * @throws UnsupportedContentException when the bytes are not a PDF
     * @throws UnreadablePdfException when the PDF is encrypted or broken
     */
    public function extract(string $bytes, string $filename): array
    {
        // The PDF header must appear within the first 1024 bytes.
        if (! str_contains(substr($bytes, 0, 1024), '%PDF-')) {
            throw new UnsupportedContentException('That file is not a PDF.');
        }

        $config = new Config;
        $config->setRetainImageContent(false);
        $config->setDecodeMemoryLimit(config('pdf.decode_memory_limit'));

        try {
            $pdf = (new Parser([], $config))->parseContent($bytes);
            $pages = array_slice($pdf->getPages(), 0, config('pdf.max_pages'));
            $details = $pdf->getDetails();
        } catch (Throwable $e) {
            throw new UnreadablePdfException(
                str_contains(strtolower($e->getMessage()), 'secured')
                    ? 'This PDF is password-protected. Remove the protection and upload it again.'
                    : 'This PDF could not be read. It may be damaged.',
                previous: $e,
            );
        }

        $pageTexts = [];
        foreach ($pages as $page) {
            try {
                $pageTexts[] = $page->getText();
            } catch (Throwable) {
                // Skip a page the parser can't decode rather than the whole file.
            }
        }
        $pageLines = array_map(fn (string $text) => $this->pageLines($text), $this->repair->repair($pageTexts));

        $lines = $this->withoutReferences($this->withoutRunningLines($pageLines));
        $paragraphs = $this->paragraphs($lines, $this->hyphenatedWords($lines));
        $lines = $this->sentences->lines(implode("\n", $paragraphs));

        $sentences = array_values(array_filter(
            $this->sentences->sentences($lines),
            fn (string $sentence) => ! preg_match(self::CITATION, $sentence)
                && ! preg_match(self::GLUED_MATH, $sentence)
                && ! PdfTextRepair::isBroken($sentence),
        ));

        return [
            'title' => $this->title($details, $filename),
            'text' => mb_substr(implode("\n", $lines), 0, 200_000),
            'sentences' => $sentences,
            'pages' => count($pages),
        ];
    }

    /**
     * Normalized lines of one page; an empty string marks a blank line.
     *
     * @return list<string>
     */
    private function pageLines(string $text): array
    {
        // Text runs are sometimes glued together: "overfitting.Journal".
        $text = preg_replace('/(\p{Ll}{2,})\.(\p{Lu}\p{Ll})/u', '$1. $2', $text) ?? '';

        return array_map(
            fn (string $line) => trim(preg_replace('/\s+/u', ' ', $line)),
            preg_split('/\R/u', $text),
        );
    }

    /**
     * Drop page numbers and running headers/footers. A running line sits
     * among the first or last few lines of a page and repeats there on at
     * least half the pages (digits ignored, so "Page 3" matches "Page 4").
     *
     * @param  list<list<string>>  $pageLines
     * @return list<string>
     */
    private function withoutRunningLines(array $pageLines): array
    {
        $key = fn (string $line) => preg_replace('/\d+/', '#', mb_strtolower($line));

        // Indexes of the first and last few non-empty lines on each page.
        $edges = array_map(function (array $lines) {
            $filled = array_keys(array_filter($lines, fn (string $line) => $line !== ''));

            return array_flip([...array_slice($filled, 0, self::EDGE_LINES), ...array_slice($filled, -self::EDGE_LINES)]);
        }, $pageLines);

        $pagesWith = [];
        foreach ($pageLines as $p => $lines) {
            $keys = array_unique(array_map(fn (int $i) => $key($lines[$i]), array_keys($edges[$p])));
            foreach ($keys as $k) {
                $pagesWith[$k] = ($pagesWith[$k] ?? 0) + 1;
            }
        }
        $threshold = max(3, (int) ceil(count($pageLines) / 2));

        $kept = [];
        foreach ($pageLines as $p => $lines) {
            foreach ($lines as $i => $line) {
                if ($line !== '' && isset($edges[$p][$i])) {
                    $isPageNumber = preg_match('/^(?:page\s*)?[-–—\s]*\d+(?:\s*(?:of|\/)\s*\d+)?[-–—\s]*$/iu', $line);
                    if ($isPageNumber || $pagesWith[$key($line)] >= $threshold) {
                        continue;
                    }
                }
                $kept[] = $line;
            }
            // A page break also ends a paragraph unless the text flows on.
            $kept[] = "\f";
        }

        return $kept;
    }

    /**
     * Skip a reference list: everything after a "References" heading, up to
     * an appendix heading if there is one.
     *
     * @param  list<string>  $lines
     * @return list<string>
     */
    private function withoutReferences(array $lines): array
    {
        $kept = [];
        $skipping = false;

        foreach ($lines as $line) {
            if (preg_match(self::REFERENCES_HEADING, $line)) {
                $skipping = true;
            } elseif ($skipping && preg_match(self::RESUME_HEADING, $line)) {
                $skipping = false;
            }

            if (! $skipping) {
                $kept[] = $line;
            }
        }

        return $kept;
    }

    /**
     * Lowercase hyphenated words found inside lines, such as
     * "attention-based". Used to tell a real hyphen at a line break from
     * one that only splits a word.
     *
     * @param  list<string>  $lines
     * @return array<string, true>
     */
    private function hyphenatedWords(array $lines): array
    {
        preg_match_all('/\p{L}+-\p{L}+/u', mb_strtolower(implode("\n", $lines)), $m);

        return array_fill_keys($m[0], true);
    }

    /**
     * Equations and other symbol-heavy lines, which should never be glued
     * onto a sentence.
     */
    private function looksLikeFormula(string $line): bool
    {
        $chars = preg_replace('/\s+/u', '', $line);
        $letters = preg_match_all('/\p{L}/u', $chars);

        return str_contains($line, '=') || $letters < mb_strlen($chars) * 0.6;
    }

    /**
     * Join wrapped lines back into paragraphs. Blank lines and finished
     * sentences end a paragraph, a short line with no closing punctuation is
     * kept as a heading, and a word hyphenated across a line break is
     * rejoined.
     *
     * @param  list<string>  $lines
     * @param  array<string, true>  $hyphenated  From hyphenatedWords().
     * @return list<string>
     */
    private function paragraphs(array $lines, array $hyphenated): array
    {
        $paragraphs = [];
        $current = '';

        $flush = function () use (&$paragraphs, &$current) {
            if ($current !== '') {
                $paragraphs[] = $current;
            }
            $current = '';
        };

        foreach ($lines as $line) {
            if ($line === '') {
                $flush();

                continue;
            }
            if ($line === "\f") {
                // Text that stops mid-sentence at the bottom of a page
                // continues on the next one.
                if (preg_match('/[.!?:]["”’)\]]?$/u', $current)) {
                    $flush();
                }

                continue;
            }
            if ($this->looksLikeFormula($line)) {
                $flush();
                $paragraphs[] = $line;

                continue;
            }
            // A finished sentence can end the paragraph without splitting
            // anything, and keeps a following heading on its own line.
            if (preg_match('/[.!?]["”’)\]]?$/u', $current)) {
                $flush();
            }
            if ($current === '') {
                $current = $line;

                continue;
            }

            $looksLikeHeading = str_word_count($current) < 8
                && ! preg_match('/[.!?,;:]["”’)\]]?$/u', $current)
                && preg_match('/^[\p{Lu}\d"“]/u', $line);

            if ($looksLikeHeading) {
                $flush();
                $current = $line;
            } elseif (preg_match('/(\p{L}+)-$/u', $current, $before) && preg_match('/^(\p{Ll}+)/u', $line, $after)) {
                // Keep the hyphen if the document spells the word with one.
                $word = mb_strtolower($before[1].'-'.$after[1]);
                $current = isset($hyphenated[$word]) ? $current.$line : mb_substr($current, 0, -1).$line;
            } else {
                $current .= ' '.$line;
            }
        }
        $flush();

        return $paragraphs;
    }

    /**
     * @param  array<string, mixed>  $details
     */
    private function title(array $details, string $filename): string
    {
        $title = $details['Title'] ?? '';
        $title = is_array($title) ? implode(' ', $title) : (string) $title;
        $title = trim(preg_replace('/\s+/u', ' ', $title));

        // Ignore placeholder titles that editors and converters leave behind.
        if ($title === '' || preg_match('/^(untitled|microsoft (word|powerpoint) - |document\d*$)|\.(docx?|pptx?|pdf)$/i', $title)) {
            $title = pathinfo($filename, PATHINFO_FILENAME);
        }

        return mb_substr($title, 0, 255);
    }
}
