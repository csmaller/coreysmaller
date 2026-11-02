<?php

namespace App\Services\Text;

/**
 * Turns extracted document text into clean, quiz-sized sentences. Shared by
 * the web page scraper and the PDF reader so both follow the same rules.
 */
class SentenceExtractor
{
    private const ABBREVIATIONS = '(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Mt|vs|etc|e\.g|i\.e|Inc|Ltd|Co|Corp|No|Nos|Fig|Figs|Vol|'
        .'approx|ca|Gen|Col|Lt|Sgt|Rev|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|U\.S|U\.K|[A-Z])';

    /**
     * Split text into trimmed, non-empty lines with citation markers such as
     * [1], [a] or [citation needed] removed.
     *
     * @return list<string>
     */
    public function lines(string $text): array
    {
        $lines = [];
        foreach (preg_split('/\R/u', $text) as $line) {
            $line = preg_replace('/\[(?:\d+|[a-z]|note \d+|citation needed|clarification needed|edit|when\?|who\?)\]/iu', '', $line);
            $line = trim(preg_replace('/\s+/u', ' ', $line));
            if ($line !== '') {
                $lines[] = $line;
            }
        }

        return $lines;
    }

    /**
     * Sentences that start with a capital letter or digit, end in terminal
     * punctuation and have between the
     * configured minimum and maximum number of words, without duplicates.
     * A sentence never spans two lines.
     *
     * @param  list<string>  $lines
     * @return list<string>
     */
    public function sentences(array $lines): array
    {
        $min = config('scraper.min_sentence_words');
        $max = config('scraper.max_sentence_words');
        $sentences = [];

        foreach ($lines as $line) {
            $pieces = preg_split('/(?<=[.!?]|[.!?]["”’)\]])\s+(?=["“‘(\[]?[\p{Lu}\d])/u', $line);

            // Re-join pieces that were split after an abbreviation or initial.
            $merged = [];
            foreach ($pieces as $piece) {
                $last = array_key_last($merged);
                if ($last !== null && preg_match('/(?:^|\s|\()'.self::ABBREVIATIONS.'\.$/u', $merged[$last])) {
                    $merged[$last] .= ' '.$piece;
                } else {
                    $merged[] = $piece;
                }
            }

            foreach ($merged as $sentence) {
                // Must start and end like a sentence; anything else is a
                // fragment cut from the middle of one.
                if (! preg_match('/^["“‘(\[]?[\p{Lu}\d]/u', $sentence) || ! preg_match('/[.!?]["”’)\]]?$/u', $sentence)) {
                    continue;
                }
                $words = count(preg_split('/\s+/u', $sentence));
                if ($words >= $min && $words <= $max) {
                    $sentences[mb_strtolower($sentence)] ??= $sentence;
                }
            }
        }

        return array_values($sentences);
    }
}
