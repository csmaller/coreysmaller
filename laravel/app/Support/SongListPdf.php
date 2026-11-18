<?php

namespace App\Support;

class SongListPdf
{
    /**
     * @param array{email?: ?string, phone?: ?string, location?: ?string, note?: ?string} $contact
     * @param array<int, array{title: string, artist?: ?string}> $songs
     */
    public static function render(array $contact, array $songs): string
    {
        $pages = self::pages($contact, $songs);
        $objects = [];
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
        $objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

        $kids = [];
        $next = 5;
        foreach ($pages as $stream) {
            $pageId = $next++;
            $contentId = $next++;
            $kids[] = $pageId.' 0 R';
            $objects[$pageId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {$contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>";
            $objects[$contentId] = "<< /Length ".strlen($stream)." >>\nstream\n".$stream."endstream";
        }
        $objects[2] = '<< /Type /Pages /Count '.count($pages).' /Kids ['.implode(' ', $kids).'] >>';

        ksort($objects);
        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $id => $body) {
            $offsets[$id] = strlen($pdf);
            $pdf .= $id." 0 obj\n".$body."\nendobj\n";
        }
        $xref = strlen($pdf);
        $count = count($objects) + 1;
        $pdf .= "xref\n0 {$count}\n";
        $pdf .= "0000000000 65535 f \n";
        for ($id = 1; $id < $count; $id++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
        }
        $pdf .= "trailer\n<< /Size {$count} /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";

        return $pdf;
    }

    /**
     * @param array{email?: ?string, phone?: ?string, location?: ?string, note?: ?string} $contact
     * @param array<int, array{title: string, artist?: ?string}> $songs
     * @return array<int, string>
     */
    private static function pages(array $contact, array $songs): array
    {
        $entries = [];
        foreach (array_values($songs) as $index => $song) {
            $title = trim((string) ($song['title'] ?? ''));
            if ($title === '') {
                continue;
            }
            $artist = trim((string) ($song['artist'] ?? ''));
            $entries[] = ($index + 1).'. '.$title.($artist !== '' ? ' - '.$artist : '');
        }
        if ($entries === []) {
            $entries[] = 'No songs listed yet.';
        }

        $pages = [];
        $commands = [];
        $y = 738.0;
        $commands[] = self::line(54, $y, 'Corey Smaller', 22, true);
        $y -= 28;
        $commands[] = self::line(54, $y, 'Song list', 14, true);
        $y -= 24;

        foreach (self::contactLines($contact) as $line) {
            $commands[] = self::line(54, $y, $line, 11, false);
            $y -= 16;
        }
        $y -= 12;

        $columns = [54.0, 318.0];
        $column = 0;
        $songTop = $y;
        foreach ($entries as $entry) {
            $wrapped = self::wrap($entry, 42);
            $needed = count($wrapped) * 13;
            if ($y - $needed < 54) {
                if ($column === 0) {
                    $column = 1;
                    $y = $songTop;
                } else {
                    $pages[] = implode('', $commands);
                    $commands = [self::line(54, 738, 'Corey Smaller  ·  Song list', 12, true)];
                    $column = 0;
                    $songTop = 708;
                    $y = $songTop;
                }
            }
            foreach ($wrapped as $part) {
                $commands[] = self::line($columns[$column], $y, $part, 10, false);
                $y -= 13;
            }
        }
        $pages[] = implode('', $commands);

        return $pages;
    }

    /**
     * @param array{email?: ?string, phone?: ?string, location?: ?string, note?: ?string} $contact
     * @return array<int, string>
     */
    private static function contactLines(array $contact): array
    {
        $lines = [];
        foreach ([
            'Email' => $contact['email'] ?? '',
            'Phone' => $contact['phone'] ?? '',
            'Location' => $contact['location'] ?? '',
        ] as $label => $value) {
            $value = trim((string) $value);
            if ($value !== '') {
                $lines[] = $label.': '.$value;
            }
        }
        $note = trim((string) ($contact['note'] ?? ''));
        if ($note !== '') {
            $lines[] = $note;
        }

        return $lines;
    }

    /**
     * @return array<int, string>
     */
    private static function wrap(string $text, int $width): array
    {
        $words = preg_split('/\s+/', trim($text)) ?: [];
        $lines = [];
        $current = '';
        foreach ($words as $word) {
            $candidate = $current === '' ? $word : $current.' '.$word;
            if (strlen($candidate) <= $width) {
                $current = $candidate;
                continue;
            }
            if ($current !== '') {
                $lines[] = $current;
            }
            $current = $word;
        }
        if ($current !== '') {
            $lines[] = $current;
        }

        return $lines === [] ? [''] : $lines;
    }

    private static function line(float $x, float $y, string $text, float $size, bool $bold): string
    {
        $font = $bold ? '/F2' : '/F1';

        return sprintf(
            "BT %s %.2F Tf 1 0 0 1 %.2F %.2F Tm (%s) Tj ET\n",
            $font,
            $size,
            $x,
            $y,
            self::escape($text)
        );
    }

    private static function escape(string $text): string
    {
        $text = str_replace(["\r", "\n"], ' ', $text);
        $encoded = iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $text);
        if (!is_string($encoded) || $encoded === '') {
            $encoded = preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';
        }

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $encoded);
    }
}
