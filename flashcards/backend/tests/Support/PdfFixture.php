<?php

namespace Tests\Support;

/**
 * Writes small but valid PDFs (Helvetica text, one line per row) so tests
 * don't need binary fixture files.
 */
final class PdfFixture
{
    /**
     * @param  list<list<string>>  $pages  Lines of text per page.
     */
    public static function make(array $pages, ?string $title = null): string
    {
        $objects = [];
        $pageRefs = [];
        $nextId = 4; // 1 catalog, 2 page tree, 3 font

        foreach ($pages as $lines) {
            $content = "BT\n/F1 11 Tf\n14 TL\n72 760 Td\n";
            foreach ($lines as $line) {
                $escaped = strtr($line, ['\\' => '\\\\', '(' => '\\(', ')' => '\\)']);
                $content .= "({$escaped}) Tj T*\n";
            }
            $content .= 'ET';

            $pageId = $nextId++;
            $contentId = $nextId++;
            $pageRefs[] = "{$pageId} 0 R";
            $objects[$pageId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {$contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>";
            $objects[$contentId] = '<< /Length '.strlen($content)." >>\nstream\n{$content}\nendstream";
        }

        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $pageRefs).'] /Count '.count($pageRefs).' >>';
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';

        $infoId = null;
        if ($title !== null) {
            $infoId = $nextId++;
            $objects[$infoId] = '<< /Title ('.strtr($title, ['(' => '\\(', ')' => '\\)']).') >>';
        }

        return self::assemble($objects, $infoId);
    }

    /**
     * A multi-page report: each fixture sentence is wrapped over two lines,
     * every page has a running header and a page number.
     */
    public static function report(int $sentenceCount = 80, ?string $title = 'History of Computing Report'): string
    {
        $pages = [];
        foreach (array_chunk(ArticleFixture::sentences($sentenceCount), 8) as $i => $chunk) {
            $lines = ['Computing History Annual Report', ''];
            foreach ($chunk as $sentence) {
                // Wrap mid-sentence, as PDF text does.
                $words = explode(' ', $sentence);
                $half = intdiv(count($words), 2);
                $lines[] = implode(' ', array_slice($words, 0, $half));
                $lines[] = implode(' ', array_slice($words, $half));
            }
            $lines[] = '';
            $lines[] = 'Page '.($i + 1);
            $pages[] = $lines;
        }

        return self::make($pages, $title);
    }

    /**
     * A one-page PDF built like Word's Calibri output: a two-byte font
     * (Type0, Identity-H) whose ToUnicode map has no entry for the glyph
     * that draws "ti", so parsers can't decode that ligature.
     */
    public static function withUnmappedLigature(string $text): string
    {
        $ligature = 0x01F0;
        $codes = [];
        $map = [];
        $next = 3;
        for ($i = 0; $i < strlen($text); $i++) {
            if (substr($text, $i, 2) === 'ti') {
                $codes[] = $ligature;
                $i++;

                continue;
            }
            $map[$text[$i]] ??= $next++;
            $codes[] = $map[$text[$i]];
        }

        $bfchar = '';
        foreach ($map as $char => $code) {
            $bfchar .= sprintf("<%04X> <%04X>\n", $code, ord((string) $char));
        }
        $cmap = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CMapName /Test def\n"
            ."1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n"
            .count($map)." beginbfchar\n{$bfchar}endbfchar\nendcmap\n"
            ."CMapName currentdict /CMap defineresource pop\nend\nend";
        $content = 'BT /F1 11 Tf 72 700 Td <'.implode('', array_map(fn ($c) => sprintf('%04X', $c), $codes)).'> Tj ET';

        return self::assemble([
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            2 => '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            3 => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            4 => '<< /Length '.strlen($content)." >>\nstream\n{$content}\nendstream",
            5 => '<< /Type /Font /Subtype /Type0 /BaseFont /Calibri /Encoding /Identity-H /DescendantFonts [6 0 R] /ToUnicode 7 0 R >>',
            6 => '<< /Type /Font /Subtype /CIDFontType2 /BaseFont /Calibri /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /DW 500 >>',
            7 => '<< /Length '.strlen($cmap)." >>\nstream\n{$cmap}\nendstream",
        ]);
    }

    /**
     * @param  array<int, string>  $objects  Object bodies by id, 1 being the catalog.
     */
    private static function assemble(array $objects, ?int $infoId = null): string
    {
        ksort($objects);
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $id => $body) {
            $offsets[$id] = strlen($pdf);
            $pdf .= "{$id} 0 obj\n{$body}\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        $pdf .= "trailer\n<< /Size ".(count($objects) + 1).' /Root 1 0 R'.($infoId ? " /Info {$infoId} 0 R" : '').' >>';

        return $pdf."\nstartxref\n{$xref}\n%%EOF\n";
    }
}
