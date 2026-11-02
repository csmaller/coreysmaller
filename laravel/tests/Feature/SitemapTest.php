<?php

namespace Tests\Feature;

use App\Models\Audio;
use App\Models\BlogPost;
use App\Models\Music;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_lists_public_content_and_security_headers(): void
    {
        $post = BlogPost::factory()->published()->create([
            'visibility' => 'public',
            'title' => 'Public post',
        ]);
        $private = BlogPost::factory()->published()->create([
            'visibility' => 'private',
            'title' => 'Private post',
        ]);
        $draft = BlogPost::factory()->draft()->create([
            'visibility' => 'public',
            'title' => 'Draft post',
        ]);

        $track = Music::create([
            'title' => 'A song',
            'audioUrl' => 'https://example.com/song.mp3',
        ]);
        $video = Video::create([
            'title' => 'A video',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'youtubeId' => 'dQw4w9WgXcQ',
        ]);
        $audio = Audio::create([
            'title' => 'A clip',
            'soundcloudUrl' => 'https://soundcloud.com/artist/track',
            'soundcloudId' => 'artist/track',
        ]);

        $baseUrl = config('app.url');

        $response = $this->get('/api/sitemap.xml');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');

        $body = $response->getContent();
        $this->assertStringContainsString('<loc>' . $baseUrl . '/contact</loc>', $body);
        $this->assertStringContainsString('<loc>' . $baseUrl . '/blog</loc>', $body);
        $this->assertStringContainsString('<loc>' . $baseUrl . '/blog/' . $post->id . '</loc>', $body);
        $this->assertStringContainsString('<loc>' . $baseUrl . '/music/' . $track->id . '</loc>', $body);
        $this->assertStringContainsString('<loc>' . $baseUrl . '/video/' . $video->id . '</loc>', $body);
        $this->assertStringContainsString('<loc>' . $baseUrl . '/audio/' . $audio->id . '</loc>', $body);
        $this->assertStringNotContainsString('/blog/' . $private->id, $body);
        $this->assertStringNotContainsString('/blog/' . $draft->id, $body);
    }

    public function test_robots_allows_the_site_and_points_at_the_sitemap(): void
    {
        $response = $this->get('/api/robots.txt');

        $response->assertOk();
        $this->assertStringStartsWith('text/plain', (string) $response->headers->get('Content-Type'));

        $body = $response->getContent();
        $this->assertStringContainsString('User-agent: *', $body);
        $this->assertStringContainsString('Disallow: /admin', $body);
        $this->assertStringContainsString('Disallow: /api', $body);
        $this->assertStringContainsString('Sitemap: ' . config('app.url') . '/sitemap.xml', $body);
    }
}
