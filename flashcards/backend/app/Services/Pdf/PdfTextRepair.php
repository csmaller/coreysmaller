<?php

namespace App\Services\Pdf;

use App\Services\Text\EnglishWords;

/**
 * Repairs text damage that PDF extraction commonly produces:
 *
 * - invalid UTF-8 from glyphs the font gives no text for;
 * - ligature glyphs without a text mapping ("Nutri�on" for "Nutrition"),
 *   typical of Word documents set in Calibri;
 * - stray separator glyphs and bullets that glue headings onto sentences;
 * - spaces inserted inside words ("Registe red", "t ype").
 *
 * Guesses are checked against an English word list and the document's own
 * vocabulary, so a repair is only made when it produces a real word.
 */
class PdfTextRepair
{
    /**
     * Characters that stand for a glyph the parser couldn't decode:
     * U+FFFD, control characters (except tab, newline, carriage return and
     * form feed) and private-use code points.
     */
    private const BROKEN = '\x{FFFD}\x{0000}-\x{0008}\x{000B}\x{000E}-\x{001F}\x{007F}\p{Co}';

    /**
     * Ligatures a missing glyph may stand for (Calibri, Cambria and common
     * text fonts), with roughly how common each letter sequence is in
     * English prose relative to "ti".
     */
    private const LIGATURE_FREQUENCY = [
        'ti' => 1.0, 'fi' => 0.3, 'tt' => 0.25, 'ff' => 0.2, 'ft' => 0.2, 'tti' => 0.1, 'fl' => 0.1,
        'tf' => 0.05, 'ffi' => 0.05, 'fft' => 0.01, 'ffl' => 0.01,
    ];

    /** Never produced by a guess, even when the word list allows it. */
    private const OFFENSIVE = '/^(?:shit|tit|fuck|cunt|twat|fag)/';

    /** Unicode ligature characters, which extract fine but rarely match. */
    private const LIGATURE_CHARACTERS = ['ﬀ' => 'ff', 'ﬁ' => 'fi', 'ﬂ' => 'fl', 'ﬃ' => 'ffi', 'ﬄ' => 'ffl', 'ﬅ' => 'st', 'ﬆ' => 'st'];

    /** Bullets and list markers, which start a new line. */
    private const BULLETS = '/[•●○◦▪▫■□►▶➢➤✓✔❖◆◇‣⁃]/u';

    /**
     * Real one- and two-letter English words. The word list is a Scrabble
     * list with entries like "er", "ut" and "bo", which would make
     * fragments ("pow er", "Witho ut") look like two words.
     */
    private const SHORT_WORDS = [
        'a', 'i', 'am', 'an', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'hi', 'if', 'in', 'is', 'it', 'me', 'my',
        'no', 'of', 'oh', 'ok', 'on', 'or', 'ox', 'so', 'to', 'up', 'us', 'we',
    ];

    /** Words with more broken runs than this just get the default ligature. */
    private const MAX_RUNS_PER_WORD = 3;

    /** @var array<string, int> Intact words of the document, with counts. */
    private array $vocabulary = [];

    public function __construct(private readonly EnglishWords $english) {}

    /**
     * Repair every page together, since the fixes rely on the vocabulary of
     * the whole document.
     *
     * @param  list<string>  $pages
     * @return list<string>
     */
    public function repair(array $pages): array
    {
        $pages = array_map(fn (string $page) => $this->normalize($page), $pages);

        $this->vocabulary = $this->vocabulary($pages);
        $pages = $this->repairMissingGlyphs($pages);

        $this->vocabulary = $this->vocabulary($pages);

        return $this->joinSplitWords($pages);
    }

    /**
     * Whether text still contains an undecodable glyph.
     */
    public static function isBroken(string $text): bool
    {
        return (bool) preg_match('/['.self::BROKEN.']/u', $text);
    }

    private function normalize(string $text): string
    {
        // Undecodable bytes become U+FFFD, so the /u regexes below work.
        $previous = mb_substitute_character();
        mb_substitute_character(0xFFFD);
        $text = mb_scrub($text, 'UTF-8');
        mb_substitute_character($previous);

        $text = strtr($text, self::LIGATURE_CHARACTERS);
        // Soft hyphens and zero-width characters.
        $text = preg_replace('/[\x{00AD}\x{200B}-\x{200D}\x{FEFF}]/u', '', $text);

        return preg_replace(self::BULLETS, "\n", $text);
    }

    /**
     * A real word: in the English list, or used intact in this document.
     */
    private function isWord(string $word): bool
    {
        $word = mb_strtolower($word);

        return isset($this->vocabulary[$word]) || $this->english->contains($word);
    }

    /**
     * Looser than isWord(), for words rebuilt around a missing glyph: also
     * accepts compounds of two listed words of 4+ letters ("kettle" + "bell";
     * not "bet" + "tier") and a listed
     * word plus a common suffix ("impact" + "ful"), since the word list
     * lacks many newer and technical words.
     */
    private function looksLikeWord(string $word): bool
    {
        $word = mb_strtolower($word);
        if ($this->isWord($word)) {
            return true;
        }

        if (preg_match('/^(.{3,})(?:ful|fully|ness|less|ment|ments|ly)$/u', $word, $m) && $this->english->contains($m[1])) {
            return true;
        }

        for ($i = 4, $n = mb_strlen($word); $i <= $n - 4; $i++) {
            if ($this->english->contains(mb_substr($word, 0, $i)) && $this->english->contains(mb_substr($word, $i))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Fill in glyphs the parser couldn't decode. A broken run touching a
     * letter is a ligature; any other broken run is a separator glyph and
     * becomes a line break.
     *
     * Two passes: words with exactly one ligature that makes a real word
     * show which ligatures the document lost ("a?er" can only be "after"),
     * and that evidence settles the ambiguous ones ("li?er": "lifter" or
     * "litter").
     *
     * @param  list<string>  $pages
     * @return list<string>
     */
    private function repairMissingGlyphs(array $pages): array
    {
        if (! self::isBroken(implode('', $pages))) {
            return $pages;
        }

        $broken = self::BROKEN;
        $pattern = "/\\p{L}*(?:[{$broken}]+\\p{L}*)+/u";

        $candidates = [];
        $evidence = array_fill_keys(array_keys(self::LIGATURE_FREQUENCY), 0);
        preg_match_all($pattern, implode("\n", $pages), $m);
        foreach (array_unique($m[0]) as $word) {
            if (preg_match('/\p{L}/u', $word)) {
                $candidates[$word] = $this->candidates($word);
                $strict = array_values(array_filter($candidates[$word], fn (array $c) => $c['strict']));
                if (count($strict) === 1) {
                    foreach ($strict[0]['ligatures'] as $ligature) {
                        $evidence[$ligature]++;
                    }
                }
            }
        }

        $default = max($evidence) > 0 ? array_search(max($evidence), $evidence, true) : $this->missingLigature();

        // Also capture the pieces either side, in case a stray space split
        // the word too ("circu la?ng" is "circulating").
        $withNeighbours = "/(?:(?<![\\p{L}\\p{N}'’])(\\p{L}+) )?(\\p{L}*(?:[{$broken}]+\\p{L}*)+)(?: (\\p{Ll}+)(?![\\p{L}{$broken}]))?/u";

        return array_map(fn (string $page) => preg_replace_callback(
            $withNeighbours,
            function (array $m) use ($candidates, $evidence, $default) {
                $before = ($m[1] ?? '') !== '' ? $m[1].' ' : '';
                $word = $m[2];
                $after = ($m[3] ?? '') !== '' ? ' '.$m[3] : '';

                if (! isset($candidates[$word])) {
                    return $before."\n".$after;
                }

                return $this->joinNeighbours($m[1] ?? '', $word, $m[3] ?? '', $evidence)
                    ?? $before.$this->choose($word, $candidates[$word], $evidence, $default).$after;
            },
            $page,
        ), $pages);
    }

    /**
     * Repair a broken word together with a neighbouring piece when that
     * makes a real word and the piece isn't a word on its own, or null.
     *
     * @param  array<string, int>  $evidence
     */
    private function joinNeighbours(string $before, string $word, string $after, array $evidence): ?string
    {
        // One side at a time first, the following piece before the one in
        // front: in "befo re repea?n g" the "re" belongs to "before".
        $options = [];
        if ($after !== '' && ! $this->isPart($after)) {
            $options[] = [$word.$after, $before, ''];
        }
        if ($before !== '' && ! $this->isPart($before)) {
            $options[] = [$before.$word, '', $after];
        }
        if ($before !== '' && $after !== '' && ! $this->isPart($before) && ! $this->isPart($after)) {
            $options[] = [$before.$word.$after, '', ''];
        }

        foreach ($options as [$joined, $keptBefore, $keptAfter]) {
            $strict = array_values(array_filter($this->candidates($joined), fn (array $c) => $c['strict']));
            if ($strict !== []) {
                return ($keptBefore !== '' ? $keptBefore.' ' : '')
                    .$this->choose($joined, $strict, $evidence, '')
                    .($keptAfter !== '' ? ' '.$keptAfter : '');
            }
        }

        return null;
    }

    /**
     * Every way of filling a word's broken runs with ligatures that gives a
     * real word ("strict") or a plausible compound or suffixed word. Words
     * with many runs aren't searched.
     *
     * @return list<array{word: string, ligatures: list<string>, strict: bool}>
     */
    private function candidates(string $word): array
    {
        $broken = self::BROKEN;
        $pieces = preg_split("/([{$broken}]+)/u", $word, -1, PREG_SPLIT_DELIM_CAPTURE);
        $runs = intdiv(count($pieces), 2);
        if ($runs > self::MAX_RUNS_PER_WORD) {
            return [];
        }

        $choices = [[]];
        for ($r = 0; $r < $runs; $r++) {
            $next = [];
            foreach ($choices as $choice) {
                foreach (array_keys(self::LIGATURE_FREQUENCY) as $ligature) {
                    $next[] = [...$choice, $ligature];
                }
            }
            $choices = $next;
        }

        $found = [];
        foreach ($choices as $choice) {
            $candidate = $this->fill($pieces, $choice);
            if (preg_match(self::OFFENSIVE, mb_strtolower($candidate))) {
                continue;
            }
            if ($this->isWord($candidate)) {
                $found[] = ['word' => $candidate, 'ligatures' => $choice, 'strict' => true];
            } elseif ($this->looksLikeWord($candidate)) {
                $found[] = ['word' => $candidate, 'ligatures' => $choice, 'strict' => false];
            }
        }

        return $found;
    }

    /**
     * @param  list<array{word: string, ligatures: list<string>, strict: bool}>  $candidates
     * @param  array<string, int>  $evidence
     */
    private function choose(string $word, array $candidates, array $evidence, string $default): string
    {
        if ($candidates === []) {
            $broken = self::BROKEN;
            $pieces = preg_split("/([{$broken}]+)/u", $word, -1, PREG_SPLIT_DELIM_CAPTURE);

            return $this->fill($pieces, array_fill(0, intdiv(count($pieces), 2), $default));
        }

        // A real word beats a compound guess ("better", not "bet"+"tier");
        // then a word the document also uses intact, then the ligatures
        // with the most evidence.
        usort($candidates, fn (array $a, array $b) => [
            $b['strict'],
            isset($this->vocabulary[mb_strtolower($b['word'])]),
            array_sum(array_map(fn ($l) => $evidence[$l], $b['ligatures'])),
        ] <=> [
            $a['strict'],
            isset($this->vocabulary[mb_strtolower($a['word'])]),
            array_sum(array_map(fn ($l) => $evidence[$l], $a['ligatures'])),
        ]);

        return $candidates[0]['word'];
    }

    /**
     * @param  list<string>  $pieces  From preg_split with the broken runs captured.
     * @param  list<string>  $ligatures  One per broken run.
     */
    private function fill(array $pieces, array $ligatures): string
    {
        $word = $pieces[0];
        foreach ($ligatures as $r => $ligature) {
            $word .= str_repeat($ligature, $this->glyphCount($pieces[2 * $r + 1])).$pieces[2 * $r + 2];
        }

        return $word;
    }

    /**
     * How many glyphs a broken run stands for. Some fonts give one U+FFFD
     * per glyph, others a fixed byte pattern (e.g. "\x01\x{FFFD}"), so the
     * run is split into its shortest repeating unit.
     */
    private function glyphCount(string $run): int
    {
        $chars = mb_str_split($run);
        $length = count($chars);

        for ($unit = 1; $unit <= $length; $unit++) {
            if ($length % $unit === 0
                && str_repeat(implode('', array_slice($chars, 0, $unit)), intdiv($length, $unit)) === $run) {
                return intdiv($length, $unit);
            }
        }

        return 1;
    }

    /**
     * The ligature a document is missing shows up as a letter pair that is
     * far rarer in its intact words than in normal prose. For a Word file
     * set in Calibri, "ti" is almost absent because every "ti" became an
     * undecodable ligature glyph.
     */
    private function missingLigature(): string
    {
        $scores = [];
        foreach (self::LIGATURE_FREQUENCY as $ligature => $frequency) {
            $seen = 0;
            foreach ($this->vocabulary as $word => $count) {
                $seen += $count * substr_count($word, $ligature);
            }
            $scores[$ligature] = ($seen + 1) / $frequency;
        }
        asort($scores);

        return (string) array_key_first($scores);
    }

    /**
     * A known word on its own. Capital letters ("vitamins B and C") count;
     * other one- and two-letter pieces must be real short words.
     */
    private function isPart(string $part): bool
    {
        if (preg_match('/^\p{Lu}$/u', $part)) {
            return true;
        }

        return mb_strlen($part) <= 2
            ? in_array(mb_strtolower($part), self::SHORT_WORDS, true)
            : $this->english->contains($part);
    }

    /**
     * Whether two pieces are one word split by a stray space: joined they
     * make a real word, and they aren't both words already ("break down",
     * "a part" stay apart).
     */
    private function isSplit(string $first, string $second): bool
    {
        return $this->isWord($first.$second) && ! ($this->isPart($first) && $this->isPart($second));
    }

    /**
     * Rejoin words split by a stray space ("ligame nts", "Registe red").
     *
     * @param  list<string>  $pages
     * @return list<string>
     */
    private function joinSplitWords(array $pages): array
    {
        return array_map(function (string $page) {
            // Offset of a piece just glued onto the one before it; it must
            // not start a new pair ("ris e to" is "rise to", not "riseto").
            $joinedAt = -1;

            return preg_replace_callback(
                // The lookahead leaves the second piece for the next match,
                // so "With t ype" can join "t" and "ype"; the third piece
                // tells which way a lone letter belongs. Letters after an
                // apostrophe or digit ("body’s", "ConvS2S") are never a piece.
                '/(?<![\p{L}\p{N}\'’])(\p{L}+) (?=(\p{Ll}+)(?![\p{L}\d]|\.\p{L})(?: (\p{Ll}+))?)/u',
                function (array $m) use (&$joinedAt) {
                    [[$match], [$first, $firstAt], [$second, $secondAt]] = $m;
                    $third = $m[3][0] ?? '';

                    if ($firstAt === $joinedAt || ! $this->isSplit($first, $second)) {
                        return $match;
                    }
                    // "and s mooth": the "s" belongs to "mooth", not "and".
                    if (mb_strlen($second) === 1 && $third !== '' && $this->isSplit($second, $third)) {
                        return $match;
                    }

                    $joinedAt = $secondAt;

                    return $first;
                },
                $page,
                flags: PREG_OFFSET_CAPTURE,
            );
        }, $pages);
    }

    /**
     * Lowercase intact words in the document, with how often each appears.
     *
     * @param  list<string>  $pages
     * @return array<string, int>
     */
    private function vocabulary(array $pages): array
    {
        $broken = self::BROKEN;
        preg_match_all("/(?<![\\p{L}{$broken}])\\p{L}+(?![\\p{L}{$broken}])/u", mb_strtolower(implode("\n", $pages)), $m);

        return array_count_values($m[0]);
    }
}
