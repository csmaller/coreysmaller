<?php

namespace App\Services\Text;

/**
 * Lookup of common English words (the public-domain ENABLE list in
 * resources/wordlists). Loaded once per process, on first use.
 */
class EnglishWords
{
    /** @var array<string, true>|null */
    private static ?array $words = null;

    /**
     * Whether a word (any case) is in the list.
     */
    public function contains(string $word): bool
    {
        self::$words ??= self::load();

        return isset(self::$words[mb_strtolower($word)]);
    }

    /**
     * @return array<string, true>
     */
    private static function load(): array
    {
        $list = gzdecode((string) file_get_contents(__DIR__.'/../../../resources/wordlists/english.txt.gz'));

        return array_fill_keys(explode("\n", trim((string) $list)), true);
    }
}
