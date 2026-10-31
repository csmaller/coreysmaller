<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\Music;
use App\Models\Video;
use App\Models\Audio;
use Illuminate\Http\Response;

/**
 * SitemapController
 * 
 * Generates XML sitemap for SEO
 */
class SitemapController extends Controller
{
    /**
     * Generate and return sitemap XML
     */
    public function index(): Response
    {
        $baseUrl = config('app.url');
        
        // Static pages
        $urls = [
            [
                'loc' => $baseUrl,
                'changefreq' => 'weekly',
                'priority' => '1.0',
                'lastmod' => now()->toIso8601String(),
            ],
            [
                'loc' => $baseUrl . '/blog',
                'changefreq' => 'daily',
                'priority' => '0.9',
                'lastmod' => now()->toIso8601String(),
            ],
            [
                'loc' => $baseUrl . '/music',
                'changefreq' => 'weekly',
                'priority' => '0.8',
                'lastmod' => now()->toIso8601String(),
            ],
            [
                'loc' => $baseUrl . '/video',
                'changefreq' => 'weekly',
                'priority' => '0.8',
                'lastmod' => now()->toIso8601String(),
            ],
            [
                'loc' => $baseUrl . '/audio',
                'changefreq' => 'weekly',
                'priority' => '0.8',
                'lastmod' => now()->toIso8601String(),
            ],
        ];

        // Blog posts
        BlogPost::ensureVisibilityColumn();
        $posts = BlogPost::where('status', 'published')
            ->where(function ($query) {
                $query->where('visibility', 'public')->orWhereNull('visibility');
            })
            ->orderBy('updatedAt', 'desc')
            ->get();

        foreach ($posts as $post) {
            $urls[] = [
                'loc' => $baseUrl . '/blog/' . $post->id,
                'changefreq' => 'monthly',
                'priority' => '0.7',
                'lastmod' => $post->updatedAt->toIso8601String(),
            ];
        }

        // Music tracks
        $music = Music::orderBy('updatedAt', 'desc')->get();
        foreach ($music as $track) {
            $urls[] = [
                'loc' => $baseUrl . '/music/' . $track->id,
                'changefreq' => 'monthly',
                'priority' => '0.6',
                'lastmod' => $track->updatedAt->toIso8601String(),
            ];
        }

        // Videos
        $videos = Video::orderBy('updatedAt', 'desc')->get();
        foreach ($videos as $video) {
            $urls[] = [
                'loc' => $baseUrl . '/video/' . $video->id,
                'changefreq' => 'monthly',
                'priority' => '0.6',
                'lastmod' => $video->updatedAt->toIso8601String(),
            ];
        }

        // Audio
        $audio = Audio::orderBy('updatedAt', 'desc')->get();
        foreach ($audio as $item) {
            $urls[] = [
                'loc' => $baseUrl . '/audio/' . $item->id,
                'changefreq' => 'monthly',
                'priority' => '0.6',
                'lastmod' => $item->updatedAt->toIso8601String(),
            ];
        }

        $xml = $this->generateXml($urls);

        return response($xml, 200)
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Generate XML from URLs array
     */
    private function generateXml(array $urls): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;

        foreach ($urls as $url) {
            $xml .= '  <url>' . PHP_EOL;
            $xml .= '    <loc>' . htmlspecialchars($url['loc']) . '</loc>' . PHP_EOL;
            $xml .= '    <lastmod>' . $url['lastmod'] . '</lastmod>' . PHP_EOL;
            $xml .= '    <changefreq>' . $url['changefreq'] . '</changefreq>' . PHP_EOL;
            $xml .= '    <priority>' . $url['priority'] . '</priority>' . PHP_EOL;
            $xml .= '  </url>' . PHP_EOL;
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Generate robots.txt
     */
    public function robots(): Response
    {
        $baseUrl = config('app.url');
        
        $content = "User-agent: *\n";
        $content .= "Allow: /\n";
        $content .= "Disallow: /admin\n";
        $content .= "Disallow: /api\n";
        $content .= "\n";
        $content .= "Sitemap: {$baseUrl}/sitemap.xml\n";

        return response($content, 200)
            ->header('Content-Type', 'text/plain');
    }
}
