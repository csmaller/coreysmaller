<?php

namespace App\Services\Scraper;

use App\Exceptions\PageTooLargeException;
use App\Exceptions\UnreachableUrlException;
use App\Exceptions\UnsupportedContentException;
use App\Services\Text\SentenceExtractor;
use DOMElement;
use DOMNode;
use DOMText;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;

class PageScraper
{
    /**
     * Elements that never hold the page's main prose. The first line is the
     * required list; the rest trims common boilerplate such as citation
     * markers, reference lists and navigation boxes.
     */
    private const REMOVE_SELECTOR = 'script, style, nav, header, footer, aside, form, noscript, iframe, '
        .'template, svg, button, select, dialog, sup, table, [role="navigation"], [aria-hidden="true"], '
        .'.mw-editsection, .reference, .references, .reflist, .navbox, .noprint';

    private const BLOCK_TAGS = [
        'address', 'article', 'blockquote', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'h1', 'h2',
        'h3', 'h4', 'h5', 'h6', 'hr', 'li', 'main', 'ol', 'p', 'pre', 'section', 'td', 'th', 'tr', 'ul',
    ];

    public function __construct(
        private readonly UrlGuard $guard,
        private readonly SentenceExtractor $sentences,
    ) {}

    /**
     * Fetch a public page and extract its readable sentences. Results are
     * cached for 24h per normalized URL.
     *
     * @return array{title: string, text: string, sentences: list<string>}
     */
    public function scrape(string $url): array
    {
        $url = UrlNormalizer::normalize($url);

        // Check before the cache so a blocked URL fails fast every time.
        $this->guard->check($url);

        return Cache::remember(
            'scrape:'.hash('sha256', $url),
            config('scraper.cache_ttl'),
            fn () => $this->extract(...$this->fetch($url)),
        );
    }

    /**
     * @return array{0: string, 1: string, 2: string} [html, charset, final URL]
     */
    private function fetch(string $url): array
    {
        $maxBytes = config('scraper.max_bytes');
        $maxRedirects = config('scraper.max_redirects');

        for ($hop = 0; ; $hop++) {
            // Re-checked on every hop so a redirect can't reach a private host.
            $guarded = $this->guard->check($url);
            $response = $this->request($guarded, $maxBytes);

            if (! $response->redirect()) {
                break;
            }

            $location = $response->header('Location');
            if ($location === '') {
                throw new UnreachableUrlException('The page redirected without saying where to.');
            }
            if ($hop >= $maxRedirects) {
                throw new UnreachableUrlException("The page redirected more than {$maxRedirects} times.");
            }

            $url = UrlNormalizer::resolve($url, $location);
        }

        if (! $response->successful()) {
            throw new UnreachableUrlException("The page responded with HTTP {$response->status()}.");
        }

        $contentType = strtolower(trim(explode(';', $response->header('Content-Type'))[0]));
        if ($contentType !== 'text/html') {
            $shown = $contentType === '' ? 'an unknown type' : $contentType;
            throw new UnsupportedContentException("That link is {$shown}, not an HTML page.");
        }

        if ((int) $response->header('Content-Length') > $maxBytes) {
            throw $this->tooLarge();
        }

        $html = $this->readBody($response, $maxBytes);

        return [$html, $this->charset($response->header('Content-Type'), $html), $url];
    }

    private function request(GuardedUrl $guarded, int $maxBytes): Response
    {
        $curl = [CURLOPT_MAXFILESIZE_LARGE => $maxBytes + 1];
        if (($pin = $guarded->curlResolveEntry()) !== null) {
            // Connect only to the IP UrlGuard approved.
            $curl[CURLOPT_RESOLVE] = [$pin];
        }

        try {
            return Http::withUserAgent(config('scraper.user_agent'))
                ->accept('text/html,application/xhtml+xml;q=0.9,*/*;q=0.1')
                ->timeout(config('scraper.timeout'))
                ->connectTimeout(config('scraper.timeout'))
                ->withOptions([
                    'allow_redirects' => false,
                    'stream' => true,
                    'curl' => $curl,
                ])
                ->get($guarded->url);
        } catch (ConnectionException $e) {
            throw new UnreachableUrlException(
                str_contains(strtolower($e->getMessage()), 'timed out')
                    ? 'The page took too long to respond.'
                    : 'The page could not be reached.',
                previous: $e,
            );
        } catch (RequestException $e) {
            if (str_contains(strtolower($e->getMessage()), 'maximum file size')) {
                throw $this->tooLarge();
            }

            throw new UnreachableUrlException('The page could not be reached.', previous: $e);
        }
    }

    private function readBody(Response $response, int $maxBytes): string
    {
        $stream = $response->toPsrResponse()->getBody();
        $html = '';

        while (! $stream->eof()) {
            $html .= $stream->read(65536);
            if (strlen($html) > $maxBytes) {
                $stream->close();
                throw $this->tooLarge();
            }
        }

        return $html;
    }

    private function charset(string $contentType, string $html): string
    {
        if (preg_match('/charset=["\']?([\w-]+)/i', $contentType, $m)
            || preg_match('/<meta[^>]+charset=["\']?([\w-]+)/i', substr($html, 0, 4096), $m)) {
            return strtoupper($m[1]);
        }

        return 'UTF-8';
    }

    /**
     * @return array{title: string, text: string, sentences: list<string>}
     */
    private function extract(string $html, string $charset, string $url): array
    {
        $crawler = new Crawler(null, $url);
        $crawler->addHtmlContent($html, $charset);

        $title = $this->title($crawler, $url);

        // Collect first: removing nodes while iterating a live list skips some.
        $doomed = iterator_to_array($crawler->filter(self::REMOVE_SELECTOR));
        foreach ($doomed as $node) {
            $node->parentNode?->removeChild($node);
        }

        $root = $this->contentRoot($crawler);
        if ($root === null) {
            return ['title' => $title, 'text' => '', 'sentences' => []];
        }

        $lines = $this->sentences->lines($this->blockText($root));

        // Pages that use <p> for prose give cleaner sentences from <p> alone.
        $paragraphs = (new Crawler($root))->filter('p, blockquote');
        if ($paragraphs->count() >= 3) {
            $lines = $this->sentences->lines(implode("\n", $paragraphs->each(fn (Crawler $p) => $p->text('', false))));
        }

        return [
            'title' => $title,
            'text' => mb_substr(implode("\n", $lines), 0, 200_000),
            'sentences' => $this->sentences->sentences($lines),
        ];
    }

    private function title(Crawler $crawler, string $url): string
    {
        foreach (['title', 'meta[property="og:title"]', 'h1'] as $selector) {
            $node = $crawler->filter($selector)->first();
            if ($node->count() === 0) {
                continue;
            }
            $text = $selector === 'title' || $selector === 'h1' ? $node->text('') : (string) $node->attr('content');
            $text = trim(preg_replace('/\s+/u', ' ', $text));
            if ($text !== '') {
                return mb_substr($text, 0, 255);
            }
        }

        return (string) parse_url($url, PHP_URL_HOST);
    }

    private function contentRoot(Crawler $crawler): ?DOMNode
    {
        $articles = $crawler->filter('article');
        if ($articles->count() > 0) {
            // Listing pages have many small <article> cards; take the biggest.
            $best = null;
            foreach ($articles as $article) {
                if ($best === null || mb_strlen($article->textContent) > mb_strlen($best->textContent)) {
                    $best = $article;
                }
            }

            return $best;
        }

        foreach (['main', 'body'] as $selector) {
            $node = $crawler->filter($selector)->getNode(0);
            if ($node !== null) {
                return $node;
            }
        }

        return null;
    }

    /**
     * Text of a subtree with a line break around every block element, so
     * adjacent paragraphs never run together.
     */
    private function blockText(DOMNode $node): string
    {
        $text = '';
        foreach ($node->childNodes as $child) {
            if ($child instanceof DOMText) {
                $text .= $child->nodeValue;
            } elseif ($child instanceof DOMElement) {
                $tag = strtolower($child->nodeName);
                if ($tag === 'br') {
                    $text .= "\n";

                    continue;
                }
                $block = in_array($tag, self::BLOCK_TAGS, true);
                $text .= ($block ? "\n" : '').$this->blockText($child).($block ? "\n" : '');
            }
        }

        return $text;
    }

    private function tooLarge(): PageTooLargeException
    {
        $mb = intdiv(config('scraper.max_bytes'), 1024 * 1024);

        return new PageTooLargeException("That page is larger than {$mb} MB.");
    }
}
