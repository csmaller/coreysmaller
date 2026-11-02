<?php

namespace Tests\Feature;

use App\Exceptions\BlockedUrlException;
use App\Exceptions\PageTooLargeException;
use App\Exceptions\UnreachableUrlException;
use App\Exceptions\UnsupportedContentException;
use App\Services\Scraper\PageScraper;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\Support\ArticleFixture;
use Tests\TestCase;

class PageScraperTest extends TestCase
{
    private function scraper(): PageScraper
    {
        return $this->app->make(PageScraper::class);
    }

    private function html(string $body): PromiseInterface
    {
        return Http::response($body, 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }

    public function test_extracts_title_and_article_sentences(): void
    {
        Http::fake(['example.com/*' => $this->html(ArticleFixture::html(20))]);

        $page = $this->scraper()->scrape('https://example.com/history');

        $this->assertSame('A Short History of Computing', $page['title']);
        $this->assertSame(ArticleFixture::sentences(20), $page['sentences']);
        $this->assertStringContainsString('Ada Lovelace travelled to London', $page['text']);

        foreach (['script', 'style', 'header', 'navigation', 'aside', 'footer'] as $part) {
            $this->assertStringNotContainsString("This {$part} sentence", $page['text']);
        }
        $this->assertStringNotContainsString('outside the article', $page['text']);
        $this->assertStringNotContainsString('[1]', $page['text']);

        Http::assertSent(fn ($request) => str_contains($request->header('User-Agent')[0], 'LinkFlashcardsBot'));
    }

    public function test_keeps_only_sentences_of_8_to_40_words(): void
    {
        $html = '<html><body><main>'
            .'Seven words are not quite enough here. '
            .'<br>and this fragment starts in the middle of some other sentence.<br>'
            .'Eight words are exactly enough for the scraper. '
            .'Dr. Watson met Holmes at Baker Street in 1881 and they worked together. '
            .'Word '.str_repeat('word ', 40).'end.'
            .'</main></body></html>';
        Http::fake(['example.com/*' => $this->html($html)]);

        $page = $this->scraper()->scrape('https://example.com/');

        $this->assertSame([
            'Eight words are exactly enough for the scraper.',
            'Dr. Watson met Holmes at Baker Street in 1881 and they worked together.',
        ], $page['sentences']);
    }

    public function test_follows_redirects_and_rechecks_each_hop(): void
    {
        Http::fake([
            'example.com/old' => Http::response('', 301, ['Location' => '/new']),
            'example.com/new' => $this->html(ArticleFixture::html(10)),
        ]);

        $page = $this->scraper()->scrape('https://example.com/old');

        $this->assertCount(10, $page['sentences']);
        Http::assertSentCount(2);
    }

    public function test_redirect_to_private_address_is_blocked_before_the_request(): void
    {
        Http::fake(['example.com/*' => Http::response('', 302, ['Location' => 'http://169.254.169.254/latest/meta-data/'])]);

        try {
            $this->scraper()->scrape('https://example.com/go');
            $this->fail('Expected the redirect to be blocked.');
        } catch (BlockedUrlException) {
            Http::assertSentCount(1);
            Http::assertNotSent(fn ($request) => str_contains($request->url(), '169.254'));
        }
    }

    public function test_stops_after_three_redirects(): void
    {
        Http::fake(['example.com/*' => Http::response('', 302, ['Location' => '/loop'])]);

        $this->expectException(UnreachableUrlException::class);

        try {
            $this->scraper()->scrape('https://example.com/start');
        } finally {
            Http::assertSentCount(4);
        }
    }

    public function test_rejects_non_html_content(): void
    {
        Http::fake(['example.com/*' => Http::response('%PDF-1.4', 200, ['Content-Type' => 'application/pdf'])]);

        $this->expectException(UnsupportedContentException::class);
        $this->scraper()->scrape('https://example.com/file.pdf');
    }

    public function test_rejects_pages_over_5_mb(): void
    {
        Http::fake(['example.com/*' => $this->html(str_repeat('a', 5 * 1024 * 1024 + 1))]);

        $this->expectException(PageTooLargeException::class);
        $this->scraper()->scrape('https://example.com/huge');
    }

    public function test_connection_failures_and_error_statuses_are_unreachable(): void
    {
        Http::fake(['example.com/down' => fn () => throw new ConnectionException('cURL error 28: Operation timed out')]);

        try {
            $this->scraper()->scrape('https://example.com/down');
            $this->fail('Expected an unreachable error.');
        } catch (UnreachableUrlException $e) {
            $this->assertSame('The page took too long to respond.', $e->getMessage());
        }

        Http::fake(['example.com/missing' => Http::response('nope', 404, ['Content-Type' => 'text/html'])]);

        $this->expectException(UnreachableUrlException::class);
        $this->scraper()->scrape('https://example.com/missing');
    }

    public function test_results_are_cached_per_normalized_url(): void
    {
        Http::fake(['example.com/*' => $this->html(ArticleFixture::html(10))]);

        $this->scraper()->scrape('https://example.com/page#intro');
        $this->scraper()->scrape('HTTPS://EXAMPLE.COM:443/page');

        Http::assertSentCount(1);
    }
}
