<?php

namespace Tests\Unit;

use App\Services\Pdf\PdfTextRepair;
use App\Services\Text\EnglishWords;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PdfTextRepairTest extends TestCase
{
    private const BLANK = "\u{FFFD}";

    private function repair(string ...$pages): string
    {
        return implode("\n", (new PdfTextRepair(new EnglishWords))->repair($pages));
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function missingLigatures(): array
    {
        $b = self::BLANK;

        return [
            'ti' => ["Nutri{$b}on counseling", 'Nutrition counseling'],
            'two in a row' => ["licensed die{$b}{$b}ans", 'licensed dietitians'],
            'at the start' => ["the plantar fascia {$b}ssue", 'the plantar fascia tissue'],
            'tt' => ["provides be{$b}er support", 'provides better support'],
            'tti' => ["while se{$b}ng goals", 'while setting goals'],
            'compound' => ["the ke{$b}lebell swing", 'the kettlebell swing'],
            'suffix' => ["make them impac{$b}ul", 'make them impactful'],
            'split as well' => ["(e.g., circu la{$b}ng blood)", '(e.g., circulating blood)'],
            'split on both sides' => ["on the ground befo re repea{$b}n g the drill", 'on the ground before repeating the drill'],
            'raw bytes' => ["licensed die\x01\xF0\x01\xF0ans", 'licensed dietitians'],
        ];
    }

    #[DataProvider('missingLigatures')]
    public function test_fills_in_missing_ligatures(string $broken, string $expected): void
    {
        $this->assertSame($expected, $this->repair($broken));
    }

    public function test_settles_ambiguous_ligatures_with_evidence_from_the_document(): void
    {
        $b = self::BLANK;

        // "a?er" can only be "after", so this document drops "ft":
        // "li?er" is "lifter" and "shi?ing" is "shifting", not "tt" words.
        $text = $this->repair("Right a{$b}er the set, spot the li{$b}er. The weight keeps shi{$b}ing.");

        $this->assertSame('Right after the set, spot the lifter. The weight keeps shifting.', $text);
    }

    public function test_never_guesses_an_offensive_word(): void
    {
        $this->assertStringNotContainsString('shit', $this->repair('The sand keeps shi'.self::BLANK.'ing.'));
    }

    public function test_turns_separator_glyphs_and_bullets_into_line_breaks(): void
    {
        $text = $this->repair("Nutrition Summary \x1F Registered dietitians plan meals. ● Protein ● Fat");

        $this->assertSame(['Nutrition Summary', 'Registered dietitians plan meals.', 'Protein', 'Fat'],
            array_values(array_filter(array_map('trim', explode("\n", $text)))));
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function splitWords(): array
    {
        return [
            'second half not a word' => ['Registe red dietitians', 'Registered dietitians'],
            'lone letter first' => ['With t ype 1 diabetes', 'With type 1 diabetes'],
            'lone letter second' => ['blood sugar can ris e to dangerous levels', 'blood sugar can rise to dangerous levels'],
            'lone letter goes forward' => ['skeletal, cardiac, and s mooth', 'skeletal, cardiac, and smooth'],
            'before a bracket' => ['a moderate (repea ting) tempo', 'a moderate (repeating) tempo'],
            'move ment' => ['improve move ment efficiency', 'improve movement efficiency'],
            'scrabble-only half' => ['adaptation of muscular pow er and Witho ut rest', 'adaptation of muscular power and Without rest'],
        ];
    }

    #[DataProvider('splitWords')]
    public function test_rejoins_words_split_by_a_stray_space(string $broken, string $expected): void
    {
        $this->assertSame($expected, $this->repair($broken));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function realPhrases(): array
    {
        return [
            'two real words' => ['the break down of glycogen'],
            'a part' => ['muscles play a part in posture'],
            'in to' => ['log in to the portal'],
            'capital letter' => ['vitamins B and C support T cells'],
            'possessive' => ['The body’s ability to sense position'],
            'after a digit' => ['models such as ConvS2S and ByteNet'],
            'abbreviation' => ['e.g. the knee'],
            'list marker' => ['see part b of the form'],
        ];
    }

    #[DataProvider('realPhrases')]
    public function test_leaves_real_phrases_alone(string $text): void
    {
        $this->assertSame($text, $this->repair($text));
    }

    public function test_invalid_utf8_does_not_lose_the_page(): void
    {
        $text = $this->repair("Registered and licensed die\x01\xF0\x01\xF0ans provide nutri\x01\xF0on counseling.");

        $this->assertSame('Registered and licensed dietitians provide nutrition counseling.', $text);
        $this->assertFalse(PdfTextRepair::isBroken($text));
    }

    public function test_unicode_ligature_characters_are_expanded(): void
    {
        $this->assertSame('efficient flow', $this->repair('eﬃcient ﬂow'));
    }
}
