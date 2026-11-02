<?php

namespace App\Services\Questions;

use App\Exceptions\InsufficientContentException;
use Random\Randomizer;

/**
 * Fill-in-the-blank questions: blank one key term out of a sentence and
 * offer three other key terms from the same page as distractors.
 */
class ClozeQuestionGenerator implements QuestionGenerator
{
    public const BLANK = '_____';

    private const NUMBER = 'number';

    private const PROPER = 'proper';

    private const WORD = 'word';

    /** Lowercase connectors allowed inside a capitalized phrase. */
    private const CONNECTORS = 'of|the|de|del|da|di|du|van|von|der|la|le|and|&';

    /** Suffixes that mark likely verbs, adjectives or adverbs. */
    private const NON_NOUN_SUFFIXES = '/(?:ly|ed|ing|ous|ful|ive|able|ible|ic|ical|est)$/u';

    /** A word right after one of these is almost always a verb. */
    private const VERB_MARKERS = [
        'to', 'will', 'would', 'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'cannot', 'not',
        'do', 'does', 'did', "don't", "doesn't", "didn't",
    ];

    /** How much more often names and numbers become answers than nouns. */
    private const TYPE_WEIGHTS = [self::NUMBER => 3, self::PROPER => 3, self::WORD => 1];

    /** Letters, marks and digits: a term must not touch one of these. */
    private const EDGE = '[\p{L}\p{M}\d]';

    /**
     * Openings that lean on the text before the sentence ("The last
     * progression…", "This means…", "However, …"), which a lone flashcard
     * can't show.
     */
    private const NEEDS_CONTEXT_START = '/^["“(]?(?:'
        .'(?:This|These|That|Those|It|Its|They|Them|Their|He|She|His|Her|Such|Both|Here|Then|Next|Also|Thus|Hence|'
        .'However|Therefore|Additionally|Furthermore|Moreover|Similarly|Likewise|Consequently|Instead|Otherwise|'
        .'Finally|Lastly|Meanwhile|Nevertheless|Nonetheless|Accordingly|Again)\b'
        .'|In (?:addition|contrast|comparison|turn|this|these|that|other words|summary|short)\b'
        .'|As (?:a result|such|mentioned|noted|shown|described|discussed|stated|seen)\b'
        .'|For (?:example|instance)\b|On the other hand\b|At this\b|After (?:this|that)\b'
        .'|The (?:first|second|third|fourth|fifth|last|final|next|previous|following|above|same|latter|former|remaining|aforementioned)\b'
        .')/u';

    /**
     * A sentence opener after a lowercase word or number, mid-sentence: a
     * heading or fragment glued onto the real sentence ("…progression 3 The
     * last progression…"), so the start is unreliable.
     */
    private const GLUED_OPENER = '/(?<=[\p{Ll}\d)] )(?:The|This|These|Those|It|They|However)\s\p{Ll}/u';

    /** References to surrounding text anywhere in the sentence. */
    private const NEEDS_CONTEXT_ANYWHERE = '/\b(?:the following|(?:shown|listed|described|mentioned|discussed|noted|outlined) '
        .'(?:above|below|earlier|previously)|(?:in|see) (?:this|the previous|the next|the following) (?:section|chapter|table|figure)'
        .'|see (?:figure|fig\.|table)|(?:figure|fig\.|table) \d)/iu';

    private readonly Randomizer $random;

    /** @var array<string, true> */
    private readonly array $stopwords;

    public function __construct(?Randomizer $random = null)
    {
        $this->random = $random ?? new Randomizer;
        $this->stopwords = array_fill_keys(require __DIR__.'/../../../resources/stopwords.php', true);
    }

    public function generate(array $sentences, int $count): array
    {
        if ($count <= 0) {
            return [];
        }

        $sentences = $this->uniqueSentences($sentences);
        $termsBySentence = array_map(fn (string $s) => $this->extractTerms($s), $sentences);
        $pool = $this->buildPool($termsBySentence);

        $questions = [];
        $seen = [];

        // Each sentence is tried once, in random order, so none is reused.
        // Sentences that make sense alone go first; ones that depend on
        // earlier text are only used if a game needs more cards.
        $standalone = [];
        $dependent = [];
        foreach ($sentences as $i => $sentence) {
            if ($this->needsContext($sentence)) {
                $dependent[] = $i;
            } else {
                $standalone[] = $i;
            }
        }
        $order = [
            ...($standalone === [] ? [] : $this->random->shuffleArray($standalone)),
            ...($dependent === [] ? [] : $this->random->shuffleArray($dependent)),
        ];

        foreach ($order as $i) {
            $question = $this->buildQuestion($sentences[$i], $termsBySentence[$i], $pool);
            if ($question === null) {
                continue;
            }

            $key = mb_strtolower($question['answer']).'|'.$question['prompt'];
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $questions[] = $question;

            if (count($questions) === $count) {
                return $questions;
            }
        }

        // Every usable sentence was tried, so this is the true maximum.
        throw new InsufficientContentException(count($questions), $count);
    }

    /**
     * Whether a sentence only makes sense with the text around it.
     */
    public function needsContext(string $sentence): bool
    {
        return preg_match(self::NEEDS_CONTEXT_START, $sentence)
            || preg_match(self::NEEDS_CONTEXT_ANYWHERE, $sentence)
            || preg_match(self::GLUED_OPENER, $sentence);
    }

    /**
     * @param  list<string>  $sentences
     * @return list<string>
     */
    private function uniqueSentences(array $sentences): array
    {
        $unique = [];
        foreach ($sentences as $sentence) {
            $sentence = trim(preg_replace('/\s+/u', ' ', (string) $sentence));
            if ($sentence !== '') {
                $unique[mb_strtolower($sentence)] ??= $sentence;
            }
        }

        return array_values($unique);
    }

    /**
     * Key terms in one sentence: numbers/years, capitalized phrases, and
     * non-stopword lowercase words of 5+ letters (treated as nouns).
     *
     * @return list<array{text: string, type: string}>
     */
    private function extractTerms(string $sentence): array
    {
        $terms = [];
        $edge = self::EDGE;

        // Numbers with 2+ digits: years, counts, decimals, "1,000".
        preg_match_all("/(?<![\\p{L}\\p{M}\\d.,])\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?(?!{$edge})|(?<![\\p{L}\\p{M}\\d.,])\\d+(?:\\.\\d+)?(?!{$edge})/u", $sentence, $m);
        foreach ($m[0] as $number) {
            if (preg_match_all('/\d/', $number) >= 2) {
                $terms[] = ['text' => rtrim($number, '.'), 'type' => self::NUMBER];
            }
        }

        // Capitalized phrases such as "Calvin cycle"'s "Calvin", "Bank of England".
        $word = "\\p{Lu}[\\p{L}\\p{M}'’-]*(?![\\p{L}\\p{M}\\d'’-])";
        $connectors = self::CONNECTORS;
        preg_match_all("/(?<![\\p{L}\\p{M}\\d'’-]){$word}(?:\\s+(?:(?:{$connectors})\\s+)?{$word})*/u", $sentence, $m, PREG_OFFSET_CAPTURE);
        foreach ($m[0] as [$phrase, $offset]) {
            $phrase = $this->trimPhrase($phrase, $offset);
            if ($phrase !== null) {
                $terms[] = ['text' => $phrase, 'type' => self::PROPER];
            }
        }

        // Lowercase words of 5+ letters that are not stopwords and don't
        // look like verbs or adjectives.
        preg_match_all("/(?<![\\p{L}\\p{M}\\d'’-])\\p{Ll}{5,}(?![\\p{L}\\p{M}\\d'’-])/u", $sentence, $m, PREG_OFFSET_CAPTURE);
        foreach ($m[0] as [$candidate, $offset]) {
            if (isset($this->stopwords[$candidate]) || preg_match(self::NON_NOUN_SUFFIXES, $candidate)) {
                continue;
            }
            $previous = preg_match("/([\\p{L}'’]+)\\W*$/u", substr($sentence, 0, $offset), $p) ? mb_strtolower($p[1]) : '';
            if (! in_array(str_replace('’', "'", $previous), self::VERB_MARKERS, true)) {
                $terms[] = ['text' => $candidate, 'type' => self::WORD];
            }
        }

        // One entry per term, case-insensitively.
        $unique = [];
        foreach ($terms as $term) {
            $unique[mb_strtolower($term['text'])] ??= $term;
        }

        return array_values($unique);
    }

    /**
     * Strip leading stopwords ("The", "In") and a trailing possessive, and
     * drop a lone capitalized word that starts the sentence, since the
     * capital there doesn't mark a name.
     */
    private function trimPhrase(string $phrase, int $offset): ?string
    {
        $words = preg_split('/\s+/u', $phrase);
        $startsSentence = $offset === 0;

        while ($words !== [] && isset($this->stopwords[mb_strtolower($words[0])])) {
            array_shift($words);
            $startsSentence = false;
        }
        while ($words !== [] && preg_match('/^(?:'.self::CONNECTORS.')$/u', end($words))) {
            array_pop($words);
        }

        if ($words === [] || ($startsSentence && count($words) === 1)) {
            return null;
        }

        $phrase = preg_replace("/['’]s?$/u", '', implode(' ', $words));

        if (mb_strlen($phrase) < 2 || isset($this->stopwords[mb_strtolower($phrase)])) {
            return null;
        }

        return $phrase;
    }

    /**
     * Every key term on the page, keyed by lowercase text, with the number
     * of sentences it appears in.
     *
     * @param  list<list<array{text: string, type: string}>>  $termsBySentence
     * @return array<string, array{text: string, type: string, sentences: int}>
     */
    private function buildPool(array $termsBySentence): array
    {
        $pool = [];
        foreach ($termsBySentence as $terms) {
            foreach ($terms as $term) {
                $key = mb_strtolower($term['text']);
                $pool[$key] ??= $term + ['sentences' => 0];
                $pool[$key]['sentences']++;
            }
        }

        return $pool;
    }

    /**
     * @param  list<array{text: string, type: string}>  $terms
     * @param  array<string, array{text: string, type: string}>  $pool
     * @return array{prompt: string, options: list<string>, correct_index: int, answer: string, source_sentence: string}|null
     */
    private function buildQuestion(string $sentence, array $terms, array $pool): ?array
    {
        // Prefer terms with three same-type distractors; fall back to mixing
        // names and nouns. Numbers only ever compete with other numbers.
        $preferred = [];
        $fallback = [];
        foreach ($terms as $term) {
            [$sameType, $otherType] = $this->distractorCandidates($term, $sentence, $pool);
            if (count($sameType) >= 3) {
                $preferred[] = [$term, $sameType, []];
            } elseif ($term['type'] !== self::NUMBER && count($sameType) + count($otherType) >= 3) {
                $fallback[] = [$term, $sameType, $otherType];
            }
        }

        $choices = $preferred !== [] ? $preferred : $fallback;
        if ($choices === []) {
            return null;
        }

        [$term, $sameType, $otherType] = $this->weightedChoice($choices, $pool);

        $answer = $term['text'];
        $distractors = $this->closest($answer, $sameType, 3);
        if (count($distractors) < 3) {
            $distractors = [...$distractors, ...$this->closest($answer, $otherType, 3 - count($distractors))];
        }
        $options = $this->random->shuffleArray([$answer, ...$distractors]);

        return [
            'prompt' => $this->blank($sentence, $answer),
            'options' => $options,
            'correct_index' => array_search($answer, $options, true),
            'answer' => $answer,
            'source_sentence' => $sentence,
        ];
    }

    /**
     * Possible distractors for a term: other page terms that don't overlap
     * the answer and don't already appear in the sentence (which would give
     * them away as wrong).
     *
     * @param  array{text: string, type: string}  $term
     * @param  array<string, array{text: string, type: string}>  $pool
     * @return array{0: list<string>, 1: list<string>} [same type, other name/noun types]
     */
    private function distractorCandidates(array $term, string $sentence, array $pool): array
    {
        $answer = mb_strtolower($term['text']);
        $lowerSentence = mb_strtolower($sentence);
        $sameType = [];
        $otherType = [];

        foreach ($pool as $key => $candidate) {
            if ($key === $answer || str_contains($key, $answer) || str_contains($answer, $key)
                || str_contains($lowerSentence, $key)) {
                continue;
            }

            if ($candidate['type'] === $term['type']) {
                $sameType[] = $candidate['text'];
            } elseif ($candidate['type'] !== self::NUMBER) {
                $otherType[] = $candidate['text'];
            }
        }

        return [$sameType, $otherType];
    }

    /**
     * Pick a term to blank. Names and numbers are favoured, as are nouns
     * that recur on the page, since those tend to be what the page is about.
     *
     * @template T of array{0: array{text: string, type: string}, 1: list<string>, 2: list<string>}
     *
     * @param  list<T>  $choices
     * @param  array<string, array{text: string, type: string, sentences: int}>  $pool
     * @return T
     */
    private function weightedChoice(array $choices, array $pool): array
    {
        $weights = array_map(function (array $choice) use ($pool) {
            $term = $choice[0];
            $recurring = $pool[mb_strtolower($term['text'])]['sentences'] > 1;

            return self::TYPE_WEIGHTS[$term['type']] * ($recurring ? 2 : 1);
        }, $choices);

        $roll = $this->random->getInt(1, array_sum($weights));
        foreach ($choices as $i => $choice) {
            $roll -= $weights[$i];
            if ($roll <= 0) {
                return $choice;
            }
        }

        return $choices[array_key_last($choices)];
    }

    /**
     * Pick the candidates that look most like the answer (same plural form,
     * word count, digit count, similar length), so the right option doesn't
     * stand out. Ties are broken randomly.
     *
     * @param  list<string>  $candidates
     * @return list<string>
     */
    private function closest(string $answer, array $candidates, int $count): array
    {
        if ($count <= 0 || $candidates === []) {
            return [];
        }

        $scored = [];
        foreach ($this->random->shuffleArray($candidates) as $candidate) {
            $scored[] = [$candidate, $this->resemblance($answer, $candidate)];
        }
        usort($scored, fn (array $a, array $b) => $b[1] <=> $a[1]);

        return array_column(array_slice($scored, 0, $count), 0);
    }

    private function resemblance(string $answer, string $candidate): int
    {
        $score = 0;

        if (preg_match('/^\d/', $answer)) {
            $score += preg_match_all('/\d/', $answer) === preg_match_all('/\d/', $candidate) ? 2 : 0;
            $score += str_contains($answer, '.') === str_contains($candidate, '.') ? 1 : 0;

            return $score;
        }

        $plural = fn (string $s) => (bool) preg_match('/[^s]s$/u', $s);
        $score += $plural($answer) === $plural($candidate) ? 2 : 0;
        $score += substr_count($answer, ' ') === substr_count($candidate, ' ') ? 2 : 0;
        $score += abs(mb_strlen($answer) - mb_strlen($candidate)) <= 3 ? 1 : 0;

        return $score;
    }

    /**
     * Replace every whole-word occurrence of the term, so the answer can't
     * still be read elsewhere in the prompt.
     */
    private function blank(string $sentence, string $term): string
    {
        $edge = self::EDGE;

        return preg_replace("/(?<!{$edge})".preg_quote($term, '/')."(?!{$edge})/iu", self::BLANK, $sentence);
    }
}
