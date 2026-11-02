<?php

namespace Tests\Support;

/**
 * Builds deterministic article pages and sentence lists for tests.
 */
final class ArticleFixture
{
    private const PEOPLE = [
        'Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Charles Babbage', 'Claude Shannon',
        'Barbara Liskov', 'Donald Knuth', 'Edsger Dijkstra', 'Margaret Hamilton', 'John Backus',
        'Frances Allen', 'Tim Berners-Lee',
    ];

    private const PLACES = [
        'London', 'Cambridge', 'Princeton', 'Boston', 'Paris', 'Berlin', 'Vienna', 'Geneva',
        'Toronto', 'Sydney', 'Madrid', 'Oslo', 'Dublin',
    ];

    private const NOUNS = [
        'algorithm', 'compiler', 'processor', 'network', 'database', 'protocol', 'keyboard',
        'circuit', 'satellite', 'telescope', 'engine', 'library', 'theorem', 'machine',
    ];

    /**
     * @param  int  $offset  Skip this many, for a second set that doesn't
     *                       overlap the first.
     * @return list<string> Unique sentences of 8-40 words, each with a
     *                      capitalized phrase, a year and a long noun.
     */
    public static function sentences(int $count, int $offset = 0): array
    {
        $sentences = [];
        for ($i = $offset; $i < $offset + $count; $i++) {
            $person = self::PEOPLE[$i % count(self::PEOPLE)];
            $place = self::PLACES[$i % count(self::PLACES)];
            $noun = self::NOUNS[$i % count(self::NOUNS)];
            $year = 1840 + $i * 3;
            $sentences[] = "In {$year}, {$person} travelled to {$place} to present a new {$noun} that impressed many careful observers.";
        }

        return $sentences;
    }

    public static function html(int $sentenceCount = 80, string $title = 'A Short History of Computing'): string
    {
        $paragraphs = array_map(
            fn (array $chunk) => '<p>'.implode(' ', $chunk).'<sup class="reference">[1]</sup></p>',
            array_chunk(self::sentences($sentenceCount), 4),
        );

        $body = implode("\n", $paragraphs);

        return <<<HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>{$title}</title>
          <script>var s = "This script sentence must never appear in any extracted output at all.";</script>
          <style>.x { content: "This style sentence must never appear in any extracted output at all."; }</style>
        </head>
        <body>
          <header><p>This header sentence must never appear in any extracted output at all.</p></header>
          <nav><p>This navigation sentence must never appear in any extracted output at all.</p></nav>
          <p>This body text sits outside the article and should be ignored by the scraper here.</p>
          <article>
            <h1>{$title}</h1>
            {$body}
            <p>Too short to keep.</p>
            <p>This deliberately long sentence keeps going and going with many extra words so that it ends up well beyond the forty word limit that the scraper applies to every candidate sentence it extracts from the page before generating any questions at all today.</p>
            <aside><p>This aside sentence must never appear in any extracted output at all.</p></aside>
          </article>
          <footer><p>This footer sentence must never appear in any extracted output at all.</p></footer>
        </body>
        </html>
        HTML;
    }
}
